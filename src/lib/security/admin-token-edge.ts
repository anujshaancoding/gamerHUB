/**
 * Lightweight admin token validation for Edge Runtime (middleware).
 * Does NOT verify the HMAC signature — Edge Runtime lacks Node.js crypto.createHmac.
 * Checks structure, JSON validity, userId match, and expiry.
 * Full HMAC verification happens in API routes via verifyAdminToken() from admin-token.ts.
 */

interface AdminTokenPayload {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

export function verifyAdminTokenLight(token: string, userId: string): boolean {
  try {
    const dotIdx = token.indexOf(".");
    if (dotIdx === -1 || dotIdx === 0 || dotIdx === token.length - 1) return false;

    const payloadB64 = token.slice(0, dotIdx);

    // base64url → base64 for atob compatibility
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const payload: AdminTokenPayload = JSON.parse(atob(base64));

    if (!payload.userId || !payload.expiresAt || !payload.issuedAt) return false;

    return payload.userId === userId && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}
