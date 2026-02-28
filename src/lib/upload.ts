import imageCompression from "browser-image-compression";
import { storagePathFromUrl } from "@/lib/storage";

// ── Size & quality presets ──────────────────────────────────────────
export type ImagePreset = "avatar" | "banner" | "clan-avatar" | "clan-banner" | "media" | "thumbnail";

const PRESETS: Record<ImagePreset, { maxWidthOrHeight: number; maxSizeMB: number; quality: number }> = {
  avatar:        { maxWidthOrHeight: 400,  maxSizeMB: 0.15, quality: 0.8 },
  banner:        { maxWidthOrHeight: 1920, maxSizeMB: 0.5,  quality: 0.8 },
  "clan-avatar": { maxWidthOrHeight: 400,  maxSizeMB: 0.15, quality: 0.8 },
  "clan-banner": { maxWidthOrHeight: 1280, maxSizeMB: 0.8,  quality: 0.8 },
  media:         { maxWidthOrHeight: 1920, maxSizeMB: 1,    quality: 0.85 },
  thumbnail:     { maxWidthOrHeight: 400,  maxSizeMB: 0.1,  quality: 0.7 },
};

const MAX_INPUT_SIZE: Record<ImagePreset, number> = {
  avatar:        2 * 1024 * 1024,   // 2 MB
  banner:        5 * 1024 * 1024,   // 5 MB
  "clan-avatar": 2 * 1024 * 1024,   // 2 MB
  "clan-banner": 5 * 1024 * 1024,   // 5 MB
  media:         10 * 1024 * 1024,   // 10 MB
  thumbnail:     10 * 1024 * 1024,   // 10 MB (internal use only)
};

// ── Helpers ─────────────────────────────────────────────────────────

/** Race a promise against a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/** Compress and convert an image to WebP via browser-image-compression + canvas. */
async function compressImage(file: File, preset: ImagePreset): Promise<File> {
  const { maxWidthOrHeight, maxSizeMB, quality } = PRESETS[preset];

  // Fast path: skip heavy compression when the file is already small enough.
  // We still convert to WebP via canvas for consistency, but avoid the iterative
  // compression loop that browser-image-compression uses to hit the size target.
  if (file.size <= maxSizeMB * 1024 * 1024) {
    try {
      const bitmap = await createImageBitmap(file);
      const needsResize = bitmap.width > maxWidthOrHeight || bitmap.height > maxWidthOrHeight;
      if (!needsResize) {
        // Already within size + dimension limits — just convert to WebP
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const blob = await canvas.convertToBlob({ type: "image/webp", quality });
        return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
      }
      bitmap.close();
    } catch {
      // OffscreenCanvas not supported or failed — fall through to full compression
    }
  }

  // Try web worker first for non-blocking compression; fall back to main thread
  // if the worker hangs (e.g. strict CSP or HMR in dev).
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    fileType: "image/webp" as const,
    initialQuality: quality,
  };

  let compressed: File;
  try {
    compressed = await withTimeout(
      imageCompression(file, { ...options, useWebWorker: true }),
      15_000,
      "Image compression (worker)",
    );
  } catch {
    // Worker failed or timed out — retry on main thread with a generous timeout
    compressed = await withTimeout(
      imageCompression(file, { ...options, useWebWorker: false }),
      30_000,
      "Image compression (main thread)",
    );
  }

  // Ensure the output has a .webp extension for storage content-type detection
  return new File([compressed], compressed.name.replace(/\.[^.]+$/, ".webp"), {
    type: "image/webp",
  });
}

// storagePathFromUrl is imported from @/lib/storage

/** Build the stable storage path for a given upload type. */
function buildStoragePath(
  preset: ImagePreset,
  ownerId: string,
): string {
  switch (preset) {
    case "avatar":
      return `avatars/${ownerId}/avatar.webp`;
    case "banner":
      return `banners/${ownerId}/banner.webp`;
    case "clan-avatar":
      return `clan-avatars/${ownerId}-avatar.webp`;
    case "clan-banner":
      return `clan-banners/${ownerId}-banner.webp`;
    case "media":
      // Media posts are unique; use timestamp to avoid collisions
      return `${ownerId}/${Date.now()}.webp`;
    case "thumbnail":
      return `${ownerId}/${Date.now()}_thumb.webp`;
    default:
      return `${ownerId}/${Date.now()}.webp`;
  }
}

// ── Public API ──────────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
  /** Compressed file size in bytes */
  fileSize: number;
}

/**
 * Compress, convert to WebP, delete old file if path changed, upload, and return public URL.
 *
 * @param file        The raw file from the <input>
 * @param preset      One of the image presets (avatar, banner, etc.)
 * @param ownerId     The user ID or clan ID that "owns" this upload
 * @param oldUrl      (optional) The current URL to clean up if it differs from the new stable path
 */
export async function optimizedUpload(
  file: File,
  preset: ImagePreset,
  ownerId: string,
  oldUrl?: string | null,
): Promise<UploadResult> {
  // 1. Validate input file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file (PNG, JPG, GIF, WebP)");
  }

  // 2. Validate input file size (before compression)
  const maxInput = MAX_INPUT_SIZE[preset];
  if (file.size > maxInput) {
    const maxMB = Math.round(maxInput / 1024 / 1024);
    throw new Error(`Image must be less than ${maxMB}MB`);
  }

  // 3. Compress + convert to WebP
  const compressed = await compressImage(file, preset);

  // 4. Build stable storage path
  const storagePath = buildStoragePath(preset, ownerId);

  // 5. Get old path for cleanup
  const oldPath = oldUrl ? storagePathFromUrl(oldUrl) : null;

  // 6. Upload via our API endpoint
  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("path", storagePath);
  if (oldPath && oldPath !== storagePath) {
    formData.append("oldPath", oldPath);
  }

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  const { publicUrl, fileSize } = await res.json();
  return { publicUrl, fileSize: fileSize || compressed.size };
}

/**
 * Upload a media image and also generate + upload a thumbnail.
 * Returns both URLs and file sizes.
 */
export async function optimizedMediaUpload(
  file: File,
  ownerId: string,
): Promise<{ image: UploadResult; thumbnail: UploadResult }> {
  const image = await optimizedUpload(file, "media", ownerId);

  // Generate a small thumbnail from the original file
  const thumbnail = await optimizedUpload(file, "thumbnail", ownerId);

  return { image, thumbnail };
}

/**
 * Create a preview data-URL from a File (for instant UI feedback before upload completes).
 */
export function createPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
