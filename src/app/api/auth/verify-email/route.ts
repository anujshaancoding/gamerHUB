/**
 * Consumes a verification token from the magic link the user clicked.
 *
 * The plaintext token only ever lives in the URL (and the email). We
 * compare its sha256 hash against the stored hash and, in a single
 * statement, mark the token used AND flip the user's email_confirmed_at
 * — so concurrent clicks can't both succeed.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db/index";
import { consumeEmailVerificationToken } from "@/lib/auth/email-verification";
import { createRateLimiter, getClientIdentifier } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

// 30 attempts per 15 minutes — generous enough that a clumsy user clicking
// the link multiple times won't get locked out, tight enough that brute-
// forcing the 256-bit token space is hopeless.
const rateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 30 });

const TokenSchema = z.string().regex(/^[a-f0-9]{64}$/i, "invalid token");

// GET — used by the link in the email itself
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  return handle(token, request);
}

// POST — used by the client when the verification page does it via fetch
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return handle(body?.token, request);
}

async function handle(token: unknown, request: NextRequest) {
  const ip = getClientIdentifier(request);
  const { allowed, retryAfterSeconds } = rateLimiter(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  const parsed = TokenSchema.safeParse(token);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
  }

  try {
    const sql = getPool();
    const result = await consumeEmailVerificationToken(sql, parsed.data);
    if (!result.ok) {
      const message =
        result.reason === "expired"
          ? "This verification link has expired. Please request a new one."
          : result.reason === "used"
            ? "This verification link has already been used."
            : "This verification link is invalid.";
      return NextResponse.json({ error: message, reason: result.reason }, { status: 400 });
    }
    return NextResponse.json({ success: true, userId: result.userId });
  } catch (err) {
    logger.error("Email verification error", err);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
