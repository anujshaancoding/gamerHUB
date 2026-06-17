/**
 * Shared upload policy (SERVER ONLY): which extensions/types are allowed, the
 * per-surface size caps, and path ownership. Used by both the multipart upload
 * route (/api/upload) and the presigned-URL route (/api/upload/presign) so the
 * two paths can never drift on what's permitted.
 */

import { extname } from "path";

// Max size of a raw upload we accept. Keep in sync with the MAX_VIDEO_MB guard
// in profile-media-gallery.tsx and Nginx's client_max_body_size.
export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
export const MB = 1024 * 1024;

// Allowed file extensions and their permitted MIME types.
// SVG intentionally excluded — can contain JavaScript and execute in browser context.
export const ALLOWED_TYPES: Record<string, string[]> = {
  ".jpg":  ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png":  ["image/png"],
  ".gif":  ["image/gif"],
  ".webp": ["image/webp"],
  ".avif": ["image/avif"],
  ".mp4":  ["video/mp4"],
  ".webm": ["video/webm"],
};

export const ALLOWED_EXTENSIONS = new Set(Object.keys(ALLOWED_TYPES));
export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
export const VIDEO_EXTENSIONS = new Set([".mp4", ".webm"]);
export const ALL_MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export interface UploadPreset {
  /** Hard size ceiling for this surface. */
  maxBytes: number;
  /** Extensions this surface accepts. */
  allow: Set<string>;
  /** Human label for error messages. */
  kind: string;
}

/**
 * Per-surface upload policy. Caps and accepted types are derived server-side
 * from the destination path prefix (so a user can't store a 200 MB "avatar").
 */
export function presetForPath(path: string): UploadPreset {
  const p = path.toLowerCase();
  // Avatars & banners: small images only.
  if (p.startsWith("avatars/") || p.startsWith("banners/")) {
    return { maxBytes: 10 * MB, allow: IMAGE_EXTENSIONS, kind: "image" };
  }
  // Feedback screenshots: images only, modest cap.
  if (p.startsWith("media/feedback/")) {
    return { maxBytes: 16 * MB, allow: IMAGE_EXTENSIONS, kind: "image" };
  }
  // Profile media gallery: clips + screenshots.
  if (p.startsWith("media/")) {
    return { maxBytes: MAX_FILE_SIZE, allow: ALL_MEDIA_EXTENSIONS, kind: "image or video" };
  }
  // Admin lineup clips: short mp4/webm (or image), modest cap.
  if (p.startsWith("lineups/")) {
    return { maxBytes: 64 * MB, allow: ALL_MEDIA_EXTENSIONS, kind: "image or video" };
  }
  // Editorial/content surfaces (blog, news, guides, etc.) and anything else:
  // images only, moderate cap.
  return { maxBytes: 16 * MB, allow: IMAGE_EXTENSIONS, kind: "image" };
}

export function isAllowedFile(filename: string, mimeType: string): boolean {
  const ext = extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  return ALLOWED_TYPES[ext].includes(mimeType);
}

export function isVideoExt(ext: string): boolean {
  return VIDEO_EXTENSIONS.has(ext.toLowerCase());
}

/**
 * Ownership: upload paths follow patterns like "avatars/{userId}/...". A user
 * may write to a path that contains their own ID as a segment. Admin override
 * is handled by the routes (this stays a pure check).
 */
export function userOwnsPath(userId: string, path: string): boolean {
  return path.split("/").includes(userId);
}
