import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/db/client";
import crypto from "crypto";
import { createRateLimiter, getClientIdentifier } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/services/email/send-email";
import { validateBody } from "@/lib/security/validate-body";

// 5 requests per 15 minutes per IP (botnets can rotate IPs — keeps single
// attacker honest but doesn't block distributed enumeration on its own).
const ipRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });

// 2 resets per 24h per email address. This is the real defense against
// mail-bombing a single inbox even if the attacker rotates IPs.
const emailRateLimiter = createRateLimiter({ windowMs: 24 * 60 * 60 * 1000, maxRequests: 2 });

const ResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email").max(254),
});

// POST - Send password reset email
export async function POST(request: NextRequest) {
  try {
    // Rate limit check (IP)
    const ip = getClientIdentifier(request);
    const ipCheck = ipRateLimiter(ip);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil(ipCheck.retryAfterSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    const parsed = await validateBody(request, ResetSchema);
    if (!parsed.ok) return parsed.response;
    const { email } = parsed.data;

    // Per-email rate limit (mail-bomb defense). Check BEFORE the DB lookup so
    // we don't leak existence by varying response time. Still always return
    // { success: true } regardless to prevent enumeration.
    const emailCheck = emailRateLimiter(`email:${email}`);
    if (!emailCheck.allowed) {
      logger.warn("Password reset rate-limited by email", { email, ip });
      return NextResponse.json({ success: true });
    }

    const db = createClient();

    // Find user by email
    const { data: user } = await db
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store reset token
    await db.from("password_reset_tokens").upsert(
      {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      } as never,
      { onConflict: "user_id" }
    );

    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/update-password?token=${token}`;

    // Send the email. NEVER log the token/URL. If sending fails (e.g. provider
    // not configured) we still return success to prevent email enumeration —
    // the failure is surfaced server-side for ops, not to the client.
    try {
      await sendEmail({
        to: user.email as string,
        subject: "Reset your ggLobby password",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
            <h2>Reset your password</h2>
            <p>We received a request to reset your ggLobby password. This link expires in 1 hour.</p>
            <p><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">Reset password</a></p>
            <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
        text: `Reset your ggLobby password (expires in 1 hour): ${resetUrl}`,
      });
    } catch (mailError) {
      logger.error("Failed to send password reset email", mailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Reset password error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
