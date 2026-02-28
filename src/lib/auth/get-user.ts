/**
 * Server-side helper to get the current authenticated user.
 *
 * Returns the current authenticated user from the Auth.js session.
 *
 * Usage:
 *   import { getUser } from "@/lib/auth/get-user";
 *   const user = await getUser();
 *   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */

import { auth } from "./auth.config";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Get the current authenticated user from the Auth.js session.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    image: session.user.image,
  };
}

/**
 * Get the full Auth.js session (user + token metadata).
 * Useful when you need access_token or session expiry info.
 */
export async function getSession() {
  return await auth();
}
