"use client";

import { getCsrfToken } from "@/lib/hooks/useCsrfToken";

/**
 * Patches the global `fetch` on the client side to automatically include
 * the CSRF token header on same-origin state-changing requests (POST/PATCH/PUT/DELETE).
 *
 * Call this once at app initialization (e.g., in a provider or layout effect).
 */
let patched = false;

export function installCsrfFetchInterceptor() {
  if (typeof window === "undefined" || patched) return;
  patched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function csrfFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Only intercept same-origin /api/ requests with mutating methods
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

    const isMutating = ["POST", "PATCH", "PUT", "DELETE"].includes(method);
    const isApiRoute = url.startsWith("/api/") || url.includes("/api/");

    if (isMutating && isApiRoute) {
      const token = getCsrfToken();
      if (token) {
        const headers = new Headers(init?.headers);
        if (!headers.has("x-csrf-token")) {
          headers.set("x-csrf-token", token);
        }
        init = { ...init, headers };
      }
    }

    return originalFetch(input, init);
  };
}
