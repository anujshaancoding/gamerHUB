import { NextResponse } from "next/server";

/**
 * Legacy OAuth callback route.
 * Auth.js now handles OAuth callbacks at /api/auth/callback/google.
 * This route redirects any stale links to the community page.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/community`);
}
