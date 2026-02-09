import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define routes
  // Guest-allowed routes: community section is open to non-logged-in users
  const guestAllowedRoutes = ["/community"];
  // Strictly protected routes: require authentication (redirect to login)
  const strictlyProtectedRoutes = ["/profile", "/matches", "/messages", "/challenges", "/media", "/clans", "/find-gamers", "/dashboard", "/notifications", "/settings", "/premium"];
  const authRoutes = ["/login", "/register"];

  const path = request.nextUrl.pathname;
  const isGuestAllowedRoute = guestAllowedRoutes.some((route) => path.startsWith(route));
  const isStrictlyProtectedRoute = strictlyProtectedRoutes.some((route) => path.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isLandingPage = path === "/";

  // Allow guest access to community - no redirect needed
  // The AuthGate popup will show on the client side for other protected routes

  // For strictly protected routes without authentication, let the client handle it
  // The AuthGate modal will appear instead of redirecting to login
  // This provides a better UX than a hard redirect

  // Redirect authenticated users from auth routes to community
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/community";
    return NextResponse.redirect(url);
  }

  // Redirect all users from landing page to community immediately (server-side).
  // This avoids the client-side auth wait + loading spinner on first load.
  if (isLandingPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/community";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
