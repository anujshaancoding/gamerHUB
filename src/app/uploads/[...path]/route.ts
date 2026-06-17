/**
 * Serve uploaded files via the storage driver.
 *
 * Next.js dev server (Turbopack) doesn't reliably serve files added
 * dynamically to public/. This catch-all route reads through the storage
 * driver (local disk today; R2 next) so images in messages, avatars, and
 * banners always load. In production, Nginx also serves UPLOAD_DIR directly
 * for static performance on the local driver.
 */

import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

// Only these extensions are served inline with an image/video content-type.
// SVG is deliberately absent: an SVG can carry inline <script> and, served
// same-origin as image/svg+xml, becomes a stored-XSS vector. Anything not in
// this map is served as an opaque download (octet-stream + attachment).
const MIME: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = segments.join("/");

  // The driver normalizes + guards the path and returns null on traversal or
  // a missing file.
  const buffer = await getStorage().readFile(filePath);
  if (!buffer) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const known = MIME[ext];
  const contentType = known || "application/octet-stream";

  // Defense-in-depth against stored XSS from user-uploaded content:
  //  - nosniff stops the browser from re-interpreting an octet-stream as HTML/SVG
  //  - a locked-down CSP neutralises any markup that does get rendered
  //  - unknown / non-allowlisted types are forced to download, never rendered inline
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
  if (!known) {
    headers["Content-Disposition"] = "attachment";
  }

  return new NextResponse(new Uint8Array(buffer), { headers });
}
