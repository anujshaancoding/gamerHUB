/**
 * File upload API route.
 *
 * Accepts multipart/form-data with:
 *   - file: the file to upload
 *   - path: the storage path (e.g., "avatars/{userId}/avatar.webp")
 *   - oldPath: (optional) previous file path to delete
 *
 * Files are stored at UPLOAD_DIR on the VPS filesystem.
 * Nginx serves them as static files at /uploads/{path}.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { resolve, dirname, extname } from "path";
import { spawn } from "child_process";
import { getUser } from "@/lib/auth/get-user";

// Store uploads outside public/ — served by the catch-all route at /uploads/[...path].
// In production, Nginx also serves from UPLOAD_DIR for static performance.
const UPLOAD_DIR = resolve(
  process.env.UPLOAD_DIR || "./uploads"
);
// Max size of the RAW upload we accept. Users upload clips straight from
// ShadowPlay/OBS/Medal/Game Bar, which are large — we accept them and then
// compress server-side (see transcodeVideo). Keep this value, the MAX_VIDEO_MB
// guard in profile-media-gallery.tsx, and Nginx's client_max_body_size in sync.
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

// Video transcoding runs through ffmpeg on the VPS (override path via env).
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm"]);

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

// Allowed file extensions and MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  ".jpg":  ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png":  ["image/png"],
  ".gif":  ["image/gif"],
  ".webp": ["image/webp"],
  ".avif": ["image/avif"],
  ".mp4":  ["video/mp4"],
  ".webm": ["video/webm"],
  // SVG intentionally excluded — can contain JavaScript and execute in browser context.
  // If SVG support is needed, serve with Content-Disposition: attachment and sanitize.
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(ALLOWED_TYPES));

// Magic byte signatures for file content validation
const MAGIC_BYTES: Record<string, number[][]> = {
  ".jpg":  [[0xFF, 0xD8, 0xFF]],
  ".jpeg": [[0xFF, 0xD8, 0xFF]],
  ".png":  [[0x89, 0x50, 0x4E, 0x47]],
  ".gif":  [[0x47, 0x49, 0x46, 0x38]],           // GIF8
  ".webp": [[0x52, 0x49, 0x46, 0x46]],            // RIFF (WebP container)
  ".mp4":  [],                                      // MP4 has variable header; rely on MIME
  ".webm": [[0x1A, 0x45, 0xDF, 0xA3]],            // EBML header
};

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures || signatures.length === 0) return true; // No signature to check
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

function isAllowedFile(filename: string, mimeType: string): boolean {
  const ext = extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  const allowedMimes = ALLOWED_TYPES[ext];
  return allowedMimes.includes(mimeType);
}

// Paths that contain the user's ID, used for ownership enforcement
function userOwnsPath(userId: string, path: string): boolean {
  // Upload paths follow patterns like "avatars/{userId}/...", "banners/{userId}/...", etc.
  // Allow if the path contains the user's ID as a path segment
  const segments = path.split("/");
  return segments.includes(userId);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const storagePath = formData.get("path") as string | null;
    const oldPath = formData.get("oldPath") as string | null;

    if (!file || !storagePath) {
      return NextResponse.json(
        { error: "File and path are required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 200MB)" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFile(file.name, file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Accepted: images (jpg, png, gif, webp, avif, svg) and videos (mp4, webm)" },
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

    // Ownership: users can only upload to paths containing their own ID
    // Paths like "news/..." or "blog/..." without a userId segment are admin-only (checked below)
    if (!userOwnsPath(user.id, normalizedPath)) {
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
    const ext = extname(file.name).toLowerCase();
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { error: "File content does not match file type" },
        { status: 400 }
      );
    }

    await mkdir(dirname(fullPath), { recursive: true });

    // Videos: write the raw upload to a temp file, compress it with ffmpeg, and
    // return the small .mp4 plus an auto-generated poster. The user uploads a
    // big raw clip; we never make them shrink it themselves.
    if (VIDEO_EXTENSIONS.has(ext)) {
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

    // Images and other files: write as-is.
    await writeFile(fullPath, buffer);

    // Delete old file if provided and different
    if (oldPath && oldPath !== normalizedPath) {
      const oldFullPath = resolve(UPLOAD_DIR, oldPath.replace(/\.\./g, "").replace(/^\//, ""));
      if (oldFullPath.startsWith(UPLOAD_DIR)) {
        await unlink(oldFullPath).catch(() => {});
      }
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

    await unlink(fullPath).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
