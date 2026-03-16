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
 * Normalize an image URL — rewrites any old Supabase storage URLs
 * to the self-hosted /uploads/ path.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/object/public/media/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return "/uploads/" + url.substring(idx + marker.length);
  }
  return url;
}

/** Extract the storage path from a public URL. */
export function storagePathFromUrl(publicUrl: string): string | null {
  // Normalize first to handle any old URLs
  const normalized = normalizeImageUrl(publicUrl) ?? publicUrl;

  const uploadsMarker = "/uploads/";
  const uploadsIdx = normalized.indexOf(uploadsMarker);
  if (uploadsIdx !== -1) {
    return decodeURIComponent(normalized.substring(uploadsIdx + uploadsMarker.length).split("?")[0]);
  }

  return null;
}
