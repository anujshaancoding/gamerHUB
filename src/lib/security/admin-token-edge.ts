/**
 * Admin token validation for the Edge Runtime (middleware).
 *
 * Performs FULL HMAC-SHA256 signature verification using the Web Crypto API
 * (available in the Edge Runtime), matching `createAdminToken()` in
 * admin-token.ts (Node) which signs `base64url(payload)` with AUTH_SECRET and
 * appends a hex digest. A forged cookie can no longer pass the PIN gate.
 *
 * Token format: `base64url(payloadJSON).hmacHexDigest`
 */

interface AdminTokenPayload {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function verifyAdminTokenLight(token: string, userId: string): Promise<boolean> {
  try {
    const dotIdx = token.indexOf(".");
    if (dotIdx <= 0 || dotIdx === token.length - 1) return false;

    const payloadB64 = token.slice(0, dotIdx);
    const signatureHex = token.slice(dotIdx + 1);

    const secret = process.env.AUTH_SECRET;
    if (!secret) return false;

    const sigBytes = hexToBytes(signatureHex);
    if (!sigBytes) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as BufferSource,
      enc.encode(payloadB64)
    );
    if (!valid) return false;

    // base64url → base64 for atob
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const payload: AdminTokenPayload = JSON.parse(atob(base64));

    if (!payload.userId || !payload.expiresAt || !payload.issuedAt) return false;

    return payload.userId === userId && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}
