/**
 * Server-side cleanup for uploaded files on the VPS filesystem.
 *
 * Files live at UPLOAD_DIR and are referenced by public URLs like
 * /uploads/{path}?v={ts}. When a DB record pointing at a file is removed, the
 * file itself must be deleted too — otherwise orphaned files accumulate and
 * fill the disk.
 */

import { unlink } from "fs/promises";
import { resolve } from "path";
import { storagePathFromUrl } from "@/lib/storage";

// Must match UPLOAD_DIR in src/app/api/upload/route.ts.
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./uploads");

/**
 * Best-effort delete of an uploaded file given its public URL. Accepts
 * null/undefined, never throws — file cleanup should not fail the request.
 */
export async function deleteUploadedFileByUrl(
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;

  const path = storagePathFromUrl(url);
  if (!path) return;

  // Strip traversal and ensure the resolved path stays inside UPLOAD_DIR.
  const normalized = path.replace(/\.\./g, "").replace(/^\//, "");
  const fullPath = resolve(UPLOAD_DIR, normalized);
  if (!fullPath.startsWith(UPLOAD_DIR)) return;

  await unlink(fullPath).catch(() => {});
}
