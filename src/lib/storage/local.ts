/**
 * Local filesystem storage driver — the default, and exactly how ggLobby has
 * always stored uploads on the VPS (UPLOAD_DIR, served at /uploads/{path}).
 *
 * This is the behavior-preserving baseline. The R2 driver (added next) will
 * implement the same StorageDriver interface so the routes never change again.
 */

import { resolve, dirname } from "path";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { getPublicUrl, getPublicUrlVersioned } from "@/lib/services/storage";
import { normalizeStoragePath } from "./paths";
import type { StorageDriver } from "./index";

const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./uploads");

/** Resolve a storage-relative path to an absolute path inside UPLOAD_DIR, or
 *  null if it would escape the root (defense-in-depth alongside isPathSafe). */
function safeFullPath(relPath: string): string | null {
  const full = resolve(UPLOAD_DIR, normalizeStoragePath(relPath));
  return full.startsWith(UPLOAD_DIR) ? full : null;
}

export class LocalStorageDriver implements StorageDriver {
  readonly kind = "local" as const;

  async writeFile(relPath: string, data: Buffer): Promise<void> {
    const full = safeFullPath(relPath);
    if (!full) throw new Error("Invalid storage path");
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async readFile(relPath: string): Promise<Buffer | null> {
    const full = safeFullPath(relPath);
    if (!full) return null;
    try {
      return await readFile(full);
    } catch {
      return null;
    }
  }

  async deleteFile(relPath: string): Promise<void> {
    const full = safeFullPath(relPath);
    if (!full) return;
    await unlink(full).catch(() => {});
  }

  publicUrl(relPath: string, opts?: { versioned?: boolean }): string {
    return opts?.versioned ? getPublicUrlVersioned(relPath) : getPublicUrl(relPath);
  }

  /** Local disk uploads go through the normal POST route — no presign. */
  async presignUpload(): Promise<string | null> {
    return null;
  }
}
