/**
 * Lets a user request another verification email if the first one was
 * lost / expired. Always returns `{ success: true }` regardless of whether
 * the email exists or is already confirmed — same anti-enumeration
 * posture as /reset-password.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db/index";
import { issueEmailVerificationToken } from "@/lib/auth/email-verification";
import { sendEmail } from "@/lib/services/email/send-email";
import { createRateLimiter, getClientIdentifier } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";
import { validateBody } from "@/lib/security/validate-body";

// 3 resends per 15 minutes per IP — keeps abuse low without locking out
// people who actually need a fresh link.
const rateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 3 });

const ResendSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function POST(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const { allowed, retryAfterSeconds } = rateLimiter(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` },
      { status: 429 }
    );
  }

  const parsed = await validateBody(request, ResendSchema);
  if (!parsed.ok) return parsed.response;
  const { email } = parsed.data;

  try {
    const sql = getPool();
    const rows = await sql`
      SELECT id, email, email_confirmed_at FROM users WHERE email = ${email}
    `;
    // Anti-enumeration: same response regardless.
    if (rows.length === 0 || rows[0].email_confirmed_at) {
      return NextResponse.json({ success: true });
    }

    const userId = rows[0].id as string;
    const { rawToken } = await issueEmailVerificationToken(sql, userId, email);
    const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://gglobby.in";
    const verifyUrl = `${base}/verify-email?token=${rawToken}`;
    try {
      await sendEmail({
        to: email,
        subject: "Verify your ggLobby email",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
            <h2>Verify your email</h2>
            <p>We sent you a new verification link. It expires in 24 hours.</p>
            <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">Verify email</a></p>
            <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
        text: `Verify your ggLobby email (expires in 24 hours): ${verifyUrl}`,
      });
    } catch (mailErr) {
      logger.error("Failed to send resend verification email", mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Resend verification error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
