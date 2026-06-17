/**
 * Server-side cleanup for uploaded files.
 *
 * Files are referenced by public URLs like /uploads/{path}?v={ts}. When a DB
 * record pointing at a file is removed, the file itself must be deleted too —
 * otherwise orphaned files accumulate. Deletion goes through the storage driver
 * (local disk today; R2 next), so this works regardless of backing store.
 */

import { storagePathFromUrl } from "@/lib/services/storage";
import { getStorage } from "@/lib/storage";

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

  await getStorage().deleteFile(path);
}
