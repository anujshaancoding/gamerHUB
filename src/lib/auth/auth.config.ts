/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Providers:
 *   - Google OAuth
 *   - Credentials (email/password)
 *
 * Session strategy: JWT stored in httpOnly cookie.
 * User IDs: preserves existing UUIDs for migrated users.
 */

import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { compare } from "bcryptjs";
import { getPool } from "@/lib/db/index";
import { createRateLimiter, getClientIp } from "@/lib/security/rate-limit";
import { trackEvent } from "@/lib/analytics/track-event";
import { FUNNEL_EVENTS, SIGNUP_SOURCES } from "@/lib/analytics/sources";
import { recordConsent } from "@/lib/features/legal/record-consent";

// Brute-force throttle for credentials login. The edge middleware that was
// meant to rate-limit /api/auth/* is dormant under the custom server, so we
// enforce it in-route: 10 password attempts per IP per 15 minutes.
const loginRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

/**
 * Client-safe credentials error for an unverified email. Because it extends
 * CredentialsSignin, Auth.js treats it as client-safe and forwards a stable
 * `code` ("email_not_verified") to the client instead of wrapping a plain
 * Error as CallbackRouteError and leaking the generic "Configuration" code.
 * The `code` carries no sensitive information.
 */
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

/** Client-safe error surfaced when an IP exceeds the login attempt budget. */
class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Throttle by client IP before doing any DB work / bcrypt compare.
        // Fail open only if the request headers are somehow unavailable — never
        // block a legitimate login because the limiter couldn't read an IP.
        try {
          const ip = getClientIp(await headers());
          if (!loginRateLimiter(ip).allowed) {
            throw new TooManyAttemptsError();
          }
        } catch (e) {
          if (e instanceof TooManyAttemptsError) throw e;
          // headers() unavailable in this context — skip the limiter, don't block login.
        }

        const sql = getPool();
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Look up user by email
        const users = await sql`
          SELECT u.id, u.email, u.password_hash, u.email_confirmed_at,
                 p.username, p.display_name, p.avatar_url, p.is_admin
          FROM users u
          LEFT JOIN profiles p ON p.id = u.id
          WHERE u.email = ${email}
        `;

        if (users.length === 0) return null;
        const user = users[0];

        // Verify password
        if (!user.password_hash) return null;
        const valid = await compare(password, user.password_hash as string);
        if (!valid) return null;

        // Block sign-in for accounts that have not confirmed their email.
        // Throw a CredentialsSignin subclass so Auth.js surfaces a stable,
        // client-safe `code` ("email_not_verified") to the login form — which
        // prompts the user to verify / resend — instead of wrapping a plain
        // Error as CallbackRouteError and leaking the generic "Configuration".
        if (!user.email_confirmed_at) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id as string,
          email: user.email as string,
          name: (user.display_name || user.username) as string,
          image: user.avatar_url as string | null,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },

  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const sql = getPool();
        const email = user.email!;

        try {
          // Check if user exists
          const existing = await sql`
            SELECT id FROM users WHERE email = ${email}
          `;

          if (existing.length === 0) {
            // New Google user — create user + profile
            const userId = crypto.randomUUID();

            await sql`
              INSERT INTO users (id, email, email_confirmed_at, provider, provider_id)
              VALUES (${userId}, ${email}, NOW(), 'google', ${account.providerAccountId})
              ON CONFLICT (email) DO NOTHING
            `;

            // Re-fetch to get the actual ID (handles race conditions)
            const inserted = await sql`
              SELECT id FROM users WHERE email = ${email}
            `;
            const finalUserId = (inserted[0]?.id as string) || userId;

            const username = "user_" + finalUserId.substring(0, 8);
            await sql`
              INSERT INTO profiles (id, username, display_name, avatar_url)
              VALUES (
                ${finalUserId},
                ${username},
                ${(profile as Record<string, unknown>)?.name as string || null},
                ${(profile as Record<string, unknown>)?.picture as string || user.image || null}
              )
              ON CONFLICT (id) DO NOTHING
            `;

            // Override the user.id so JWT gets the correct ID
            user.id = finalUserId;

            // Funnel event: signup (google). Fire-and-forget — errors must be
            // fully swallowed (we are inside NextAuth's signIn callback).
            // TODO(attribution): session_id + ref are lost across the OAuth
            // redirect (sessionStorage is destroyed). To recover them, write a
            // short-lived (~30 min) cookie in auth-form.tsx before signInWithOAuth
            // and read it from cookies() here. Accepted MVP gap: google signups
            // carry null session_id and are excluded from Metric 3.
            void trackEvent(finalUserId, FUNNEL_EVENTS.signup, SIGNUP_SOURCES.google, {
              session_id: null,
              ref: null,
            });

            // DPDP consent audit trail. The signup form shows a "by continuing
            // with Google you agree to our Terms & Privacy Policy" affirmation,
            // so reaching this new-user branch means consent was given. Defensive
            // helper — never blocks the OAuth sign-in callback.
            void recordConsent(finalUserId, "google_oauth");
          } else {
            // Existing user — update avatar/name if needed
            user.id = existing[0].id as string;

            if (profile) {
              const name = (profile as Record<string, unknown>).name as string | undefined;
              const picture = (profile as Record<string, unknown>).picture as string | undefined;
              if (name || picture) {
                await sql`
                  UPDATE profiles SET
                    display_name = COALESCE(display_name, ${name || null}),
                    avatar_url = COALESCE(${picture || null}, avatar_url)
                  WHERE id = ${user.id}
                `;
              }
            }

            // Ensure profile exists (in case previous attempt created user but not profile)
            await sql`
              INSERT INTO profiles (id, username, display_name, avatar_url)
              VALUES (
                ${user.id},
                ${"user_" + (user.id as string).substring(0, 8)},
                ${(profile as Record<string, unknown>)?.name as string || null},
                ${(profile as Record<string, unknown>)?.picture as string || user.image || null}
              )
              ON CONFLICT (id) DO NOTHING
            `;
          }
        } catch (error) {
          console.error("[Auth] Google sign-in error:", error);
          // Fallback: try to find the user by email so login still works
          try {
            const fallback = await sql`
              SELECT id FROM users WHERE email = ${email}
            `;
            if (fallback.length > 0) {
              user.id = fallback[0].id as string;
              return true;
            }
          } catch {
            // ignore fallback error
          }
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
