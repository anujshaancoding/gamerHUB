import crypto from "crypto";

interface AdminTokenPayload {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Create an HMAC-signed admin token (Node.js runtime only — use in API routes).
 * Format: `base64url(payload).hmacHexDigest`
 */
export function createAdminToken(userId: string): string {
  const payload: AdminTokenPayload = {
    userId,
    issuedAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.AUTH_SECRET || "")
    .update(payloadB64)
    .digest("hex");
  return `${payloadB64}.${signature}`;
}

/**
 * Verify an admin token's HMAC signature, expiry, and userId (Node.js runtime).
 * Use this in API route handlers for full cryptographic verification.
 */
export function verifyAdminToken(token: string, userId: string): boolean {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;

    const expectedSig = crypto
      .createHmac("sha256", process.env.AUTH_SECRET || "")
      .update(payloadB64)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    const payload: AdminTokenPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    );

    return payload.userId === userId && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}
