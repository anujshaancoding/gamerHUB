"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { ServerCrash, RotateCcw } from "lucide-react";

const CHECK_INTERVAL = 20_000;
const FAILURE_THRESHOLD = 2;
const FETCH_TIMEOUT = 8_000;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export function SupabaseHealthProvider({ children }: { children: ReactNode }) {
  const [isServerDown, setIsServerDown] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(CHECK_INTERVAL / 1000);
  const consecutiveFailuresRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const performCheck = useCallback(async () => {
    const healthy = await checkSupabaseHealth();
    if (healthy) {
      consecutiveFailuresRef.current = 0;
      setIsServerDown(false);
      setRetryCountdown(CHECK_INTERVAL / 1000);
    } else {
      consecutiveFailuresRef.current += 1;
      if (consecutiveFailuresRef.current >= FAILURE_THRESHOLD) {
        setIsServerDown(true);
      }
    }
  }, []);

  // Initial check + periodic interval
  useEffect(() => {
    performCheck();
    intervalRef.current = setInterval(performCheck, CHECK_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [performCheck]);

  // Countdown timer when server is down
  useEffect(() => {
    if (!isServerDown) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    setRetryCountdown(CHECK_INTERVAL / 1000);
    countdownRef.current = setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? CHECK_INTERVAL / 1000 : prev - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isServerDown]);

  // Browser online/offline events
  useEffect(() => {
    const handleOnline = () => performCheck();
    const handleOffline = () => {
      consecutiveFailuresRef.current = FAILURE_THRESHOLD;
      setIsServerDown(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [performCheck]);

  const handleRetryNow = useCallback(() => {
    setRetryCountdown(CHECK_INTERVAL / 1000);
    performCheck();
  }, [performCheck]);

  return (
    <>
      {children}
      {isServerDown && (
        <ServerDownOverlay
          retryCountdown={retryCountdown}
          onRetryNow={handleRetryNow}
        />
      )}
    </>
  );
}

function ServerDownOverlay({
  retryCountdown,
  onRetryNow,
}: {
  retryCountdown: number;
  onRetryNow: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-background/98 backdrop-blur-sm flex items-center justify-center px-4"
      style={{ pointerEvents: "all" }}
    >
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto animate-[fadeSlideDown_400ms_ease-out]">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-purple-500/10 border border-purple-500/20 animate-[pulse-glow_2s_ease-in-out_infinite]">
            <ServerCrash className="w-16 h-16 text-purple-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
          Server Maintenance
        </h1>

        {/* Message */}
        <p className="text-text-muted mb-2 leading-relaxed">
          We&apos;re currently performing updates to give you a better experience.
          Please hang tight &mdash; we&apos;ll be back shortly!
        </p>
        <p className="text-sm text-text-muted/60 mb-8">
          Auto-retrying in {retryCountdown}s&hellip;
        </p>

        {/* Retry button */}
        <button
          onClick={onRetryNow}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all duration-200 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Retry Now
        </button>

        {/* Loading dots */}
        <div className="mt-8 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
