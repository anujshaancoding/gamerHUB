/**
 * Custom registration endpoint for email/password signups.
 * Creates a user record + profile, then the client calls signIn("credentials").
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { getPool } from "@/lib/db/index";
import { createRateLimiter, getClientIdentifier } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";
import { validateBody } from "@/lib/security/validate-body";
import { issueEmailVerificationToken } from "@/lib/auth/email-verification";
import { sendEmail, EmailNotConfiguredError } from "@/lib/services/email/send-email";
import { trackEvent } from "@/lib/analytics/track-event";
import { FUNNEL_EVENTS, SIGNUP_SOURCES } from "@/lib/analytics/sources";
import { recordConsent } from "@/lib/features/legal/record-consent";
import { POLICY_VERSION } from "@/lib/features/legal/policy-version";

// 10 requests per 15 minutes
const rateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email").max(254),
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(200, "password too long")
    .refine((p) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p), {
      message: "password must contain at least one letter and one number",
    }),
  username: z
    .string()
    .trim()
    .min(3, "username must be at least 3 characters")
    .max(24, "username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "username may only contain letters, numbers and underscores"),
  // Attribution fields (optional) — captured by the client for funnel analytics.
  // sessionId ties this signup to the visitor's pageview session (Metric 3).
  // ref carries first-touch ?ref= share-link attribution.
  sessionId: z.string().max(128).optional(),
  ref: z.string().max(128).optional(),
  // DPDP consent — the signup form requires an affirmative checkbox before it
  // calls this endpoint. Optional here for backward-compat; when true we record
  // the consent (policy version + timestamp) against the new account.
  agreedToTerms: z.boolean().optional(),
  policyVersion: z.string().max(32).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = getClientIdentifier(request);
    const { allowed, retryAfterSeconds } = rateLimiter(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    const parsed = await validateBody(request, RegisterSchema);
    if (!parsed.ok) return parsed.response;
    const { email, password, username, sessionId, ref, agreedToTerms, policyVersion } = parsed.data;

    const sql = getPool();

    // Check if email already exists
    const existingEmail = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await sql`
      SELECT id FROM profiles WHERE username = ${username}
    `;
    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user + profile in a transaction. email_confirmed_at is NULL —
    // the user must click the verification link before being marked active.
    const userId = crypto.randomUUID();

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
        VALUES (${userId}, ${email}, ${passwordHash}, NULL, 'email')
      `;

      await tx`
        INSERT INTO profiles (id, username, display_name)
        VALUES (${userId}, ${username}, ${username})
      `;
    });

    // Funnel event: signup (email). Fire-and-forget — never block/break the
    // request. session_id closes visitor→signup attribution (Metric 3); ref is
    // first-touch share-link attribution.
    void trackEvent(userId, FUNNEL_EVENTS.signup, SIGNUP_SOURCES.email, {
      referrer: request.headers.get("referer") ?? null,
      username,
      session_id: sessionId ?? null,
      ref: ref ?? null,
    });

    // DPDP consent audit trail. Only when the client affirmed the Terms/Privacy
    // checkbox. recordConsent is defensive — it never blocks/breaks signup.
    if (agreedToTerms) {
      void recordConsent(userId, "email_signup", policyVersion ?? POLICY_VERSION);
    }

    // Issue + send the verification email. Failure to email is logged but
    // does NOT roll back registration — the user can request a resend.
    try {
      const { rawToken } = await issueEmailVerificationToken(sql, userId, email);
      const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://gglobby.in";
      const verifyUrl = `${base}/verify-email?token=${rawToken}`;
      await sendEmail({
        to: email,
        subject: "Verify your ggLobby email",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
            <h2>Welcome to ggLobby</h2>
            <p>Confirm your email to finish setting up your account. This link expires in 24 hours.</p>
            <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">Verify email</a></p>
            <p style="color:#888;font-size:13px">If you didn't sign up, you can safely ignore this email.</p>
          </div>
        `,
        text: `Verify your ggLobby email (expires in 24 hours): ${verifyUrl}`,
      });
    } catch (mailErr) {
      if (mailErr instanceof EmailNotConfiguredError) {
        logger.error("Email provider not configured — user created but verification email not sent");
      } else {
        logger.error("Failed to send verification email", mailErr);
      }
    }

    return NextResponse.json(
      {
        message: "Account created. Please check your email to verify your address.",
        userId,
        emailVerificationRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
