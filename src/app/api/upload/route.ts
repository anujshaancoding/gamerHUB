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
import { getUser } from "@/lib/auth/get-user";

// Store uploads outside public/ — served by the catch-all route at /uploads/[...path].
// In production, Nginx also serves from UPLOAD_DIR for static performance.
const UPLOAD_DIR = resolve(
  process.env.UPLOAD_DIR || "./uploads"
);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Allowed file extensions and MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  ".jpg":  ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png":  ["image/png"],
  ".gif":  ["image/gif"],
  ".webp": ["image/webp"],
  ".avif": ["image/avif"],
  ".svg":  ["image/svg+xml"],
  ".mp4":  ["video/mp4"],
  ".webm": ["video/webm"],
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(ALLOWED_TYPES));

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
        { error: "File too large (max 10MB)" },
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

    // Ensure directory exists
    await mkdir(dirname(fullPath), { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
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
