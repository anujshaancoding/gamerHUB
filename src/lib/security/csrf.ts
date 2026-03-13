import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a random CSRF token using crypto.randomUUID().
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Validate CSRF token using the double-submit cookie pattern.
 * Compares the `x-csrf-token` header against the `csrf_token` cookie.
 * Both must exist and match for validation to pass.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  return headerToken === cookieToken;
}

/**
 * Set the CSRF token cookie on a response.
 * The cookie is NOT httpOnly so the client can read it and send it as a header.
 */
export function setCsrfCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Client needs to read this to send as header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
