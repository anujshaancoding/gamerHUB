import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth.config";
import { validateCsrfToken, setCsrfCookie } from "@/lib/security/csrf";

export async function middleware(request: NextRequest) {
  // Redirect www → non-www (canonical domain is gglobby.in)
  const host = request.headers.get("host") || "";
  if (host.startsWith("www.")) {
    const nonWwwHost = host.replace("www.", "");
    const { pathname, search } = request.nextUrl;
    return NextResponse.redirect(`https://${nonWwwHost}${pathname}${search}`, 301);
  }

  const session = await auth();
  const user = session?.user;

  const path = request.nextUrl.pathname;

  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isAdminRoute = path.startsWith("/admin");
  const isAdminApi = path.startsWith("/api/admin/");
  const isVerifyPinRoute = path === "/api/admin/verify-pin";
  const isCheckPinRoute = path === "/api/admin/check-pin";
  const isLandingPage = path === "/";

  // Admin routes require authentication — redirect to login if not signed in
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin API routes (except verify-pin) require the PIN cookie server-side
  if (isAdminApi && !isVerifyPinRoute && !isCheckPinRoute) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const pinCookie = request.cookies.get("admin_pin_verified");
    if (pinCookie?.value !== "true") {
      return NextResponse.json({ error: "Admin PIN verification required" }, { status: 403 });
    }

    // CSRF protection for state-changing requests
    const method = request.method;
    if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
      if (!validateCsrfToken(request)) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
      }
    }
  }

  // Set CSRF cookie for admin page visits (not API routes)
  if (isAdminRoute && !isAdminApi && user && request.method === "GET") {
    const existingCsrf = request.cookies.get("csrf_token");
    if (!existingCsrf) {
      const response = NextResponse.next();
      setCsrfCookie(response);
      return response;
    }
  }

  // Redirect authenticated users from auth routes to community
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/community";
    return NextResponse.redirect(url);
  }

  // Redirect all users from landing page to community
  if (isLandingPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/community";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
