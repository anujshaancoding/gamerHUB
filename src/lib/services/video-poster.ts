"use client";

/**
 * Generate a poster/thumbnail frame from a video File entirely in the browser
 * (canvas) — used when clips upload directly to R2, where there's no server
 * ffmpeg to extract a frame. Returns a small WebP File, or null if a frame
 * couldn't be captured (caller treats the thumbnail as optional).
 */
export async function generateVideoPoster(file: File): Promise<File | null> {
  if (typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    let settled = false;
    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(result);
    };

    // A stuck decode must never hang the upload.
    const timer = setTimeout(() => finish(null), 10_000);

    video.onloadedmetadata = () => {
      const dur = Number.isFinite(video.duration) ? video.duration : 1;
      try {
        video.currentTime = Math.min(1, dur / 2);
      } catch {
        // Some browsers seek lazily; onseeked or the timeout will resolve us.
      }
    };

    video.onseeked = () => {
      try {
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const scale = Math.min(1, 1280 / w);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => finish(blob ? new File([blob], "poster.webp", { type: "image/webp" }) : null),
          "image/webp",
          0.8,
        );
      } catch {
        finish(null);
      }
    };

    video.onerror = () => finish(null);
    video.src = url;
  });
}
