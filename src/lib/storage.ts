/**
 * Storage helpers for the self-hosted file upload system.
 *
 * Public URLs: https://gglobby.in/uploads/{path}?v={timestamp}
 * Files stored at: /var/www/gglobby/uploads/ on VPS
 */

/** Get the public URL for an uploaded file path */
export function getPublicUrl(storagePath: string): string {
  return `/uploads/${storagePath}`;
}

/** Get the public URL with cache-busting */
export function getPublicUrlVersioned(storagePath: string): string {
  return `/uploads/${storagePath}?v=${Date.now()}`;
}

/**
 * Extract the storage path from a public URL.
 * Handles both legacy storage URLs and new self-hosted URLs.
 */
export function storagePathFromUrl(publicUrl: string): string | null {
  // Legacy format: .../object/public/media/{path}?v=...
  const legacyMarker = "/object/public/media/";
  const legacyIdx = publicUrl.indexOf(legacyMarker);
  if (legacyIdx !== -1) {
    return decodeURIComponent(publicUrl.substring(legacyIdx + legacyMarker.length).split("?")[0]);
  }

  // New format: /uploads/{path}?v=...
  const uploadsMarker = "/uploads/";
  const uploadsIdx = publicUrl.indexOf(uploadsMarker);
  if (uploadsIdx !== -1) {
    return decodeURIComponent(publicUrl.substring(uploadsIdx + uploadsMarker.length).split("?")[0]);
  }

  return null;
}
