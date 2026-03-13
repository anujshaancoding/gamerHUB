"use client";

const CSRF_COOKIE_NAME = "csrf_token";

/**
 * Hook that reads the CSRF token from the csrf_token cookie.
 * Returns a getter function so it always reads the latest value.
 */
export function useCsrfToken(): string | null {
  return getCsrfToken();
}

/**
 * Standalone function to read the CSRF token from cookies.
 * Can be used outside of React components.
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));

  return match ? match.split("=")[1] : null;
}

/**
 * Returns headers object with the CSRF token included.
 * Merges with any existing headers you pass in.
 */
export function csrfHeaders(
  existing?: Record<string, string>
): Record<string, string> {
  const token = getCsrfToken();
  return {
    ...existing,
    ...(token ? { "x-csrf-token": token } : {}),
  };
}
