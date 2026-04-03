import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth.config";
import { validateCsrfToken, setCsrfCookie } from "@/lib/security/csrf";
import { createRateLimiter, getClientIdentifier } from "@/lib/security/rate-limit";

// Global rate limiter for public API mutations: 60 requests per minute
const apiRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

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
  const method = request.method;

  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isAdminRoute = path.startsWith("/admin");
  const isAdminApi = path.startsWith("/api/admin/");
  const isUserApi = path.startsWith("/api/") && !isAdminApi;
  const isVerifyPinRoute = path === "/api/admin/verify-pin";
  const isCheckPinRoute = path === "/api/admin/check-pin";
  const isLandingPage = path === "/";

  // Rate limit all state-changing API requests (POST/PATCH/PUT/DELETE)
  if (path.startsWith("/api/") && ["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const clientId = getClientIdentifier(request);
    const result = apiRateLimiter(clientId);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        }
      );
    }
  }

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

    // CSRF protection for state-changing admin requests
    if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
      if (!validateCsrfToken(request)) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
      }
    }
  }

  // CSRF protection for state-changing user API requests
  if (isUserApi && ["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    // Skip CSRF for auth endpoints (login/register need to work without a prior page visit)
    // and for upload (multipart forms don't easily carry the CSRF header)
    const csrfExemptPrefixes = ["/api/auth/", "/api/upload", "/api/analytics/", "/api/stripe/webhook", "/api/cron/"];
    const isExempt = csrfExemptPrefixes.some((p) => path.startsWith(p));

    if (!isExempt && !validateCsrfToken(request)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
  }

  // Set CSRF cookie for page visits (not API routes) so client can read it for subsequent requests
  if (!path.startsWith("/api/") && request.method === "GET") {
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

  // Authenticated users go straight to community; everyone else (including
  // crawlers) sees the SEO-friendly overview landing page via a rewrite so
  // the URL stays "/" while rendering /overview content.
  if (isLandingPage) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/community";
      return NextResponse.redirect(url);
    }
    // Rewrite (not redirect) so crawlers index "/" with real landing content
    const url = request.nextUrl.clone();
    url.pathname = "/overview";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
