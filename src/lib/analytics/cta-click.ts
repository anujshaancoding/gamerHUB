"use client";

import type { CtaSource } from "@/lib/analytics/sources";
import { FUNNEL_EVENTS } from "@/lib/analytics/sources";

/**
 * Fire a `cta_click` analytics event for a logged-out signup CTA.
 *
 * Reads the existing pageview session id (`pv_sid`) and first-touch referral
 * (`gg_ref`) from sessionStorage so the click can be joined to the visitor's
 * session and attributed to a discovery surface. Fully fire-and-forget — never
 * throws, never blocks navigation.
 *
 * @param source  the discovery/CTA surface (see lib/analytics/sources.ts)
 */
export function trackCtaClick(source: CtaSource): void {
  if (typeof window === "undefined") return;
  try {
    let sessionId: string | null = null;
    let ref: string | null = null;
    try {
      sessionId = window.sessionStorage.getItem("pv_sid");
      ref = window.sessionStorage.getItem("gg_ref");
    } catch {
      // sessionStorage may be unavailable (privacy mode) — proceed without it.
    }

    const body = JSON.stringify({
      event: FUNNEL_EVENTS.cta_click,
      source,
      page: window.location.pathname,
      sessionId,
      ref,
    });

    // Use sendBeacon so the event survives the imminent navigation to /register.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/event",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never break a user action.
  }
}
