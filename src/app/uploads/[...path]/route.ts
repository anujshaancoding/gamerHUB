/**
 * Serve uploaded files from the filesystem.
 *
 * Next.js dev server (Turbopack) doesn't reliably serve files added
 * dynamically to public/. This catch-all route reads from UPLOAD_DIR
 * directly so images in messages, avatars, and banners always load.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { resolve } from "path";

const UPLOAD_DIR = resolve(
  process.env.NODE_ENV === "production"
    ? (process.env.UPLOAD_DIR || "/var/www/gglobby/uploads")
    : "./public/uploads"
);

const MIME: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = segments.join("/").replace(/\.\./g, "");
  const fullPath = resolve(UPLOAD_DIR, filePath);

  if (!fullPath.startsWith(UPLOAD_DIR)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(fullPath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
