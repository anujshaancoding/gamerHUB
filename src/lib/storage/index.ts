/**
 * Storage abstraction (SERVER ONLY).
 *
 * Every server-side upload read/write/delete goes through a StorageDriver so
 * the backing store can change without touching the routes. Selected by the
 * STORAGE_DRIVER env var; defaults to "local" (the VPS filesystem), so behavior
 * is unchanged until R2 is explicitly switched on.
 *
 *   STORAGE_DRIVER=local   (default) — UPLOAD_DIR on disk, served at /uploads/
 *   STORAGE_DRIVER=r2      (next)    — Cloudflare R2, served from the CDN edge
 *
 * Do NOT import this from client components — the local driver pulls in `fs`.
 * For client-safe URL helpers use "@/lib/services/storage" instead.
 */

import { LocalStorageDriver } from "./local";
import { R2StorageDriver } from "./r2";

export { normalizeStoragePath, isPathSafe } from "./paths";

export interface StorageDriver {
  /** Which backend this is — lets routes special-case (e.g. presign vs POST). */
  readonly kind: "local" | "r2";
  /** Write bytes to a storage-relative path. Throws on an invalid path. */
  writeFile(relPath: string, data: Buffer): Promise<void>;
  /** Read bytes back, or null if missing / invalid path. */
  readFile(relPath: string): Promise<Buffer | null>;
  /** Best-effort delete — never throws, no-ops on missing / invalid path. */
  deleteFile(relPath: string): Promise<void>;
  /** Public URL for a stored path (optionally cache-busted). */
  publicUrl(relPath: string, opts?: { versioned?: boolean }): string;
}

let _storage: StorageDriver | null = null;

/** Get the configured storage driver (singleton). */
export function getStorage(): StorageDriver {
  if (_storage) return _storage;

  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  switch (driver) {
    case "r2":
      _storage = new R2StorageDriver();
      break;
    case "local":
    default:
      _storage = new LocalStorageDriver();
  }
  return _storage;
}
