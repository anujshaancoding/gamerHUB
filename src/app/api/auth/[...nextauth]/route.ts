/**
 * Auth.js (NextAuth v5) API route handler.
 * Handles: /api/auth/signin, /api/auth/signout, /api/auth/callback/google, etc.
 */

import { handlers } from "@/lib/auth/auth.config";

export const { GET, POST } = handlers;
