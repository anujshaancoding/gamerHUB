import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth.config";

/**
 * Root page — the middleware already rewrites "/" → "/overview" for
 * unauthenticated visitors (including crawlers), so this server component
 * only fires for edge-cases where middleware is bypassed.
 */
export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/community");
  }

  // Fallback: redirect to overview (middleware normally handles this)
  redirect("/overview");
}
