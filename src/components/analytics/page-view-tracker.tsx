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

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string>("");
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    if (window.location.hostname !== "gglobby.in") return;
    lastPath.current = pathname;

    // Debounce to avoid double-counting rapid navigations
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const body = JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId: getSessionId(),
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
