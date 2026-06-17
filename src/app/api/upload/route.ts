/**
 * File upload API route (multipart/form-data).
 *
 *   - file: the file to upload
 *   - path: the storage path (e.g., "avatars/{userId}/avatar.webp")
 *   - oldPath: (optional) previous file path to delete
 *
 * Images are written through the storage driver (local disk or R2). Videos are
 * transcoded with ffmpeg on the LOCAL driver only; on R2/serverless there's no
 * ffmpeg and the body is too large for a function, so video must go through the
 * presigned-upload route (/api/upload/presign) instead.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { resolve, dirname, extname } from "path";
import { spawn } from "child_process";
import { getUser } from "@/lib/auth/get-user";
import { getStorage } from "@/lib/storage";
import {
  presetForPath,
  isAllowedFile,
  userOwnsPath,
  VIDEO_EXTENSIONS,
  MB,
} from "@/lib/services/upload-policy";

// Store uploads outside public/ — served by the catch-all route at /uploads/[...path].
// In production, Nginx also serves from UPLOAD_DIR for static performance.
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./uploads");

// Video transcoding runs through ffmpeg on the VPS (override path via env).
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

/** Run ffmpeg with the given args, rejecting on a non-zero exit. */
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      // Keep only the tail — ffmpeg is very chatty.
      stderr = (stderr + d.toString()).slice(-2000);
    });
    proc.on("error", reject); // e.g. ENOENT when ffmpeg isn't installed
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-400)}`));
    });
  });
}

interface TranscodeResult {
  /** storage-relative path of the compressed .mp4 */
  videoRel: string;
  /** storage-relative path of the .jpg poster/thumbnail */
  thumbRel: string;
}

/**
 * Compress an uploaded clip to a web-friendly H.264 MP4 and extract a poster
 * frame. The raw upload (`inputFull`) is left in place for the caller to clean
 * up. Output is always .mp4 regardless of input container for broad playback.
 */
async function transcodeVideo(
  inputFull: string,
  normalizedPath: string,
): Promise<TranscodeResult> {
  const videoRel = normalizedPath.replace(/\.[^.]+$/, ".mp4");
  const thumbRel = normalizedPath.replace(/\.[^.]+$/, "_thumb.jpg");
  const videoFull = resolve(UPLOAD_DIR, videoRel);
  const thumbFull = resolve(UPLOAD_DIR, thumbRel);

  // Downscale to <=1080p, re-encode H.264/AAC, faststart for instant playback.
  // CRF 26 + veryfast is a good size/quality/CPU balance for short clips.
  await runFfmpeg([
    "-y",
    "-i", inputFull,
    "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "26",
    "-c:a", "aac",
    "-b:a", "128k",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    videoFull,
  ]);

  // Poster frame ~1s in; fall back to the very first frame for sub-second clips.
  try {
    await runFfmpeg([
      "-y", "-ss", "1", "-i", inputFull,
      "-vframes", "1", "-vf", "scale='min(1280,iw)':-2", thumbFull,
    ]);
  } catch {
    await runFfmpeg([
      "-y", "-i", inputFull,
      "-vframes", "1", "-vf", "scale='min(1280,iw)':-2", thumbFull,
    ]);
  }

  return { videoRel, thumbRel };
}

/** Read `len` bytes at `start` as an ASCII/latin1 string (for container tags). */
function tag(buffer: Buffer, start: number, len: number): string {
  return buffer.subarray(start, start + len).toString("latin1");
}

/**
 * Validate that the file's real content matches its claimed extension via
 * magic bytes. Fails CLOSED: anything not positively recognised is rejected.
 */
function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  // Every real image/video header we accept is well past 12 bytes.
  if (buffer.length < 12) return false;

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case ".png":
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    case ".gif":
      return tag(buffer, 0, 4) === "GIF8";
    case ".webp":
      // RIFF....WEBP — verify BOTH the RIFF container and the WEBP fourCC.
      return tag(buffer, 0, 4) === "RIFF" && tag(buffer, 8, 4) === "WEBP";
    case ".avif": {
      // ISO-BMFF: "ftyp" box at offset 4, then a brand. Accept AVIF brands.
      if (tag(buffer, 4, 4) !== "ftyp") return false;
      const brands = tag(buffer, 8, 24).toLowerCase();
      return ["avif", "avis", "mif1", "miaf"].some((b) => brands.includes(b));
    }
    case ".mp4":
      // ISO-BMFF container: "ftyp" box at offset 4 (brand varies: isom/mp42/…).
      return tag(buffer, 4, 4) === "ftyp";
    case ".webm":
      return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    default:
      return false; // unknown extension — fail closed
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      // The body couldn't be parsed — almost always because it was truncated
      // for exceeding a body-size limit (middleware / proxy). Surface a clear,
      // actionable message instead of a generic 500.
      return NextResponse.json(
        { error: "File too large to upload (max 200MB)." },
        { status: 413 }
      );
    }
    const file = formData.get("file") as File | null;
    const storagePath = formData.get("path") as string | null;
    const oldPath = formData.get("oldPath") as string | null;

    if (!file || !storagePath) {
      return NextResponse.json(
        { error: "File and path are required" },
        { status: 400 }
      );
    }

    // Security: ensure path doesn't escape the upload directory
    const normalizedPath = storagePath.replace(/\.\./g, "").replace(/^\//, "");
    const fullPath = resolve(UPLOAD_DIR, normalizedPath);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    // Per-surface policy: what this destination accepts and how big it may be.
    const preset = presetForPath(normalizedPath);
    const ext = extname(file.name).toLowerCase();

    // Validate file type — must be a globally allowed type AND permitted on
    // this surface (e.g. videos only land in the media gallery, not avatars).
    if (!isAllowedFile(file.name, file.type) || !preset.allow.has(ext)) {
      return NextResponse.json(
        { error: `File type not allowed here. This location accepts: ${preset.kind}.` },
        { status: 400 }
      );
    }

    if (file.size > preset.maxBytes) {
      const limitMb = Math.round(preset.maxBytes / MB);
      return NextResponse.json(
        { error: `File too large (max ${limitMb}MB for ${preset.kind} here)` },
        { status: 400 }
      );
    }

    // Feedback screenshots are an intentionally shared, authenticated dropbox
    // (no per-user segment), so any signed-in user may write under media/feedback/.
    const isSharedFeedbackUpload = normalizedPath.toLowerCase().startsWith("media/feedback/");

    // Ownership: users can only upload to paths containing their own ID.
    // Paths like "news/..." or "blog/..." without a userId segment are admin-only.
    if (!isSharedFeedbackUpload && !userOwnsPath(user.id, normalizedPath)) {
      // Allow admins to upload to any path (e.g., news thumbnails)
      const { createAdminClient } = await import("@/lib/db/admin");
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: "You can only upload files to your own directory" },
          { status: 403 }
        );
      }
    }

    // Read file into buffer and validate content matches claimed type
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { error: "File content does not match file type" },
        { status: 400 }
      );
    }

    await mkdir(dirname(fullPath), { recursive: true });

    // Videos: transcode with ffmpeg on the LOCAL driver. On R2/serverless there
    // is no ffmpeg and the 200MB body won't fit through a function — clients
    // must upload video directly via /api/upload/presign instead.
    if (VIDEO_EXTENSIONS.has(ext)) {
      if (getStorage().kind !== "local") {
        return NextResponse.json(
          { error: "Upload video directly via a presigned URL (/api/upload/presign)." },
          { status: 409 }
        );
      }

      const tmpInput = `${fullPath}.upload`;
      await writeFile(tmpInput, buffer);
      try {
        const { videoRel, thumbRel } = await transcodeVideo(tmpInput, normalizedPath);
        const v = Date.now();
        return NextResponse.json({
          publicUrl: `/uploads/${videoRel}?v=${v}`,
          thumbnailUrl: `/uploads/${thumbRel}?v=${v}`,
          fileSize: file.size,
        });
      } catch (e) {
        console.error("Video transcode failed:", e);
        return NextResponse.json(
          { error: "We couldn't process that video. Please try a different clip." },
          { status: 422 }
        );
      } finally {
        await unlink(tmpInput).catch(() => {});
      }
    }

    // Images and other files: write as-is through the storage driver.
    await getStorage().writeFile(normalizedPath, buffer);

    // Delete old file if provided and different
    if (oldPath && oldPath !== normalizedPath) {
      await getStorage().deleteFile(oldPath.replace(/\.\./g, "").replace(/^\//, ""));
    }

    // Return public URL
    const publicUrl = `/uploads/${normalizedPath}?v=${Date.now()}`;

    return NextResponse.json({ publicUrl, fileSize: file.size });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path: filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const normalizedPath = filePath.replace(/\.\./g, "").replace(/^\//, "");
    const fullPath = resolve(UPLOAD_DIR, normalizedPath);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Ownership: users can only delete their own files
    if (!userOwnsPath(user.id, normalizedPath)) {
      const { createAdminClient } = await import("@/lib/db/admin");
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json(
          { error: "You can only delete your own files" },
          { status: 403 }
        );
      }
    }

    await getStorage().deleteFile(normalizedPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
