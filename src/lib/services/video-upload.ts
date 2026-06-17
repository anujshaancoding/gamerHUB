"use client";

import { generateVideoPoster } from "./video-poster";

export interface VideoUploadResult {
  publicUrl: string;
  thumbnailUrl: string | null;
}

function contentTypeFor(file: File): string {
  if (file.type === "video/webm" || file.type === "video/mp4") return file.type;
  return file.name.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4";
}

/** PUT a file to a URL with upload progress via XHR (fetch can't report it). */
function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}).`));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

async function uploadPosterImage(poster: File, path: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", poster);
  fd.append("path", path);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.publicUrl ?? null;
}

/**
 * Upload a video clip directly to R2 via a presigned URL (the serverless path,
 * since functions can't accept a 200MB body and there's no ffmpeg). Generates a
 * poster frame in the browser and uploads it too.
 *
 * Returns null when the backend has no presign support (local driver) so the
 * caller can fall back to the legacy server-transcode POST to /api/upload.
 */
export async function uploadVideoViaPresign(
  file: File,
  storagePath: string,
  onProgress: (pct: number) => void,
): Promise<VideoUploadResult | null> {
  const contentType = contentTypeFor(file);

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: storagePath, contentType, size: file.size }),
  });

  if (presignRes.status === 409) return null; // local driver — caller falls back
  if (!presignRes.ok) {
    const e = await presignRes.json().catch(() => ({}));
    throw new Error(e.error || "Could not start the upload.");
  }

  const { uploadUrl, publicUrl } = await presignRes.json();
  await putWithProgress(uploadUrl, file, contentType, onProgress);

  // Poster is best-effort — a clip without a thumbnail still works.
  let thumbnailUrl: string | null = null;
  try {
    const poster = await generateVideoPoster(file);
    if (poster) {
      const thumbPath = storagePath.replace(/\.[^.]+$/, "_thumb.webp");
      thumbnailUrl = await uploadPosterImage(poster, thumbPath);
    }
  } catch {
    // ignore — thumbnail is optional
  }

  return { publicUrl, thumbnailUrl };
}
