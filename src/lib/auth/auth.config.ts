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

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getPool } from "@/lib/db/index";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
          `;

          const username = "user_" + userId.substring(0, 8);
          await sql`
            INSERT INTO profiles (id, username, display_name, avatar_url)
            VALUES (
              ${userId},
              ${username},
              ${(profile as Record<string, unknown>)?.name as string || null},
              ${(profile as Record<string, unknown>)?.picture as string || user.image || null}
            )
          `;

          // Override the user.id so JWT gets the correct ID
          user.id = userId;
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
