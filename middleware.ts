import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth.config";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const user = session?.user;

  const path = request.nextUrl.pathname;

  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isAdminRoute = path.startsWith("/admin");
  const isLandingPage = path === "/";

  // Admin routes require authentication — redirect to login if not signed in
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
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
