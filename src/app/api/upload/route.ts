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
import { join, dirname } from "path";
import { getUser } from "@/lib/auth/get-user";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/gglobby/uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

    // Security: ensure path doesn't escape the upload directory
    const normalizedPath = storagePath.replace(/\.\./g, "").replace(/^\//, "");
    const fullPath = join(UPLOAD_DIR, normalizedPath);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    // Ensure directory exists
    await mkdir(dirname(fullPath), { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buffer);

    // Delete old file if provided and different
    if (oldPath && oldPath !== normalizedPath) {
      const oldFullPath = join(UPLOAD_DIR, oldPath.replace(/\.\./g, "").replace(/^\//, ""));
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
    const fullPath = join(UPLOAD_DIR, normalizedPath);

    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
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
