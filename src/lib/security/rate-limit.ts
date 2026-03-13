import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * Creates an in-memory rate limiter with automatic cleanup.
 *
 * @param options.windowMs  - Time window in milliseconds
 * @param options.maxRequests - Max requests allowed within the window
 * @returns A `checkRateLimit(identifier)` function
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests } = options;
  const map = new Map<string, RateLimitEntry>();

  // Clean up expired entries every 30 minutes to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of map) {
      if (now > val.resetAt) map.delete(key);
    }
  }, 30 * 60 * 1000).unref?.(); // .unref() so the timer doesn't keep the process alive

  return function checkRateLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = map.get(identifier);

    if (!entry || now > entry.resetAt) {
      map.set(identifier, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
    }

    if (entry.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      retryAfterSeconds: 0,
    };
  };
}

/**
 * Extracts the client IP address from the request headers.
 * Checks common proxy headers in order of priority.
 */
export function getClientIdentifier(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
