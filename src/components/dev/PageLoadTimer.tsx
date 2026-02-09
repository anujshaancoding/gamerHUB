"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageLoadTimer() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const measure = () => {
      const [navigation] = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];

      if (navigation) {
        // Total page load: from navigation start to load event end
        const total = Math.round(navigation.loadEventEnd - navigation.startTime);
        if (total > 0) {
          setLoadTime(total);
          return;
        }
      }

      // Fallback: measure from navigationStart via performance.timing
      const t = performance.timing;
      if (t.loadEventEnd > 0) {
        setLoadTime(t.loadEventEnd - t.navigationStart);
        return;
      }

      // If load event hasn't fired yet, retry
      requestAnimationFrame(measure);
    };

    if (document.readyState === "complete") {
      measure();
    } else {
      window.addEventListener("load", () => setTimeout(measure, 0), {
        once: true,
      });
    }
  }, []);

  // Track client-side navigations
  useEffect(() => {
    const start = performance.now();
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLoadTime(Math.round(performance.now() - start));
      });
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible || loadTime === null) return null;

  const color =
    loadTime < 500
      ? "bg-green-600"
      : loadTime < 1500
        ? "bg-yellow-600"
        : "bg-red-600";

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-lg ${color} px-3 py-1.5 font-mono text-xs text-white shadow-lg`}
    >
      <span>⏱ {loadTime}ms</span>
      <span className="text-white/60">({pathname})</span>
      <button
        onClick={() => setVisible(false)}
        className="ml-1 text-white/60 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
