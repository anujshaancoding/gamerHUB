"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("pv_sid");
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("pv_sid", id);
  }
  return id;
}

/**
 * First-touch ?ref= capture. Reads ?ref= from the current URL and stores it in
 * sessionStorage under `gg_ref` — but only if not already set (first-touch
 * attribution; a later page without ?ref= must not clobber the original).
 * Returns the stored ref (or null).
 *
 * NOTE (known caveat): sessionStorage is destroyed across the Google OAuth
 * redirect, so ref captured here is lost for Google signups. Email signups
 * preserve it (no cross-origin redirect). See discovery-signup-experiment-spec
 * §1B / §3A — recovering it for OAuth requires a short-lived cookie; deferred.
 */
function captureRef(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const incoming = new URLSearchParams(window.location.search).get("ref");
    const existing = sessionStorage.getItem("gg_ref");
    if (incoming && !existing) {
      sessionStorage.setItem("gg_ref", incoming);
      return incoming;
    }
    return existing;
  } catch {
    return null;
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string>("");
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    const host = window.location.hostname;
    if (host !== "gglobby.in" && host !== "www.gglobby.in") return;
    lastPath.current = pathname;

    // First-touch referral capture (must run before the POST is built).
    const ref = captureRef();

    // Debounce to avoid double-counting rapid navigations
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const body = JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId: getSessionId(),
        ref: ref || null,
      });

      // Use sendBeacon for non-blocking fire-and-forget
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/pageview", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/analytics/pageview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    }, 300);

    return () => clearTimeout(timeout.current);
  }, [pathname]);

  return null;
}
