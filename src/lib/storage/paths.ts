/**
 * Pure path helpers for the storage layer — no fs, no driver deps, so they're
 * safe to import anywhere (including from path-validation guards in routes).
 */

/** Strip directory traversal and any leading slash from a storage-relative path. */
export function normalizeStoragePath(relPath: string): string {
  return relPath.replace(/\.\./g, "").replace(/^\/+/, "");
}

/**
 * True if `relPath` is a safe storage-relative path (non-empty, no traversal,
 * not absolute). Mirrors the guard the upload routes used inline, so the 400
 * "Invalid file path" behavior is preserved across drivers.
 */
export function isPathSafe(relPath: string): boolean {
  if (!relPath) return false;
  const n = normalizeStoragePath(relPath);
  return n.length > 0 && !n.includes("..") && !n.startsWith("/");
}
