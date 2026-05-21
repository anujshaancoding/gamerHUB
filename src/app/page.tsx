import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth.config";

/**
 * Root page — middleware normally handles "/" (authed → /agents, anon →
 * rewrite /overview), so this server component only fires on the bypass
 * path (e.g. first visit before the CSRF cookie is set).
 *
 * Authed users must land INSIDE the app shell (/agents has nav + account
 * menu). Do NOT send them to /overview (logged-out marketing page, no way
 * to sign out) or /community (frozen → 307 loop).
 */
export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/agents");
  }
  redirect("/overview");
}
