/**
 * Short-lived signed handshake tokens for Socket.IO authentication.
 *
 * The browser cannot send the NextAuth session cookie reliably to the
 * Socket.IO server during the WebSocket upgrade (cookies + cross-origin +
 * cookie-prefixed names are flaky), so we mint a small HMAC-signed token
 * server-side after verifying the session, and the client sends THAT token
 * in the `handshake.auth.token` field.
 *
 * Token format:  base64url({ uid, iat, exp }) + "." + base64url(hmacSha256)
 *
 * Both `src/lib/security/socket-token.ts` (Node/Next API route) and
 * `server.mjs` (the standalone Socket.IO server) share the same AUTH_SECRET
 * and the same verify logic — see `verifySocketToken` below.
 */

import { createHmac, timingSafeEqual } from "crypto";

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour — refresh on reconnect

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) is required to sign socket tokens");
  }
  return secret;
}

export interface SocketTokenPayload {
  uid: string;
  iat: number; // seconds since epoch
  exp: number; // seconds since epoch
}

export function signSocketToken(userId: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SocketTokenPayload = { uid: userId, iat: now, exp: now + ttlSeconds };
  const payloadStr = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = createHmac("sha256", getSecret()).update(payloadStr).digest();
  return `${payloadStr}.${base64UrlEncode(sig)}`;
}

export interface VerifyResult {
  ok: boolean;
  userId?: string;
  reason?: "malformed" | "bad_signature" | "expired";
}

export function verifySocketToken(token: unknown): VerifyResult {
  if (typeof token !== "string" || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadStr, sigStr] = token.split(".");
  if (!payloadStr || !sigStr) return { ok: false, reason: "malformed" };

  const expected = createHmac("sha256", getSecret()).update(payloadStr).digest();
  let received: Buffer;
  try {
    received = base64UrlDecode(sigStr);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: SocketTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadStr).toString("utf8")) as SocketTokenPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (!payload?.uid || typeof payload.uid !== "string") return { ok: false, reason: "malformed" };
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, userId: payload.uid };
}
