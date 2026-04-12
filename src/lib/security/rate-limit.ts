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
  /** Maximum number of entries before oldest are pruned (default: 10000) */
  maxEntries?: number;
}

/** Prune the oldest entries from a map by resetAt timestamp */
function pruneOldestEntries(map: Map<string, RateLimitEntry>, maxEntries: number) {
  if (map.size <= maxEntries) return;

  // Sort entries by resetAt ascending (oldest first) and remove excess
  const sorted = [...map.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  const toRemove = sorted.length - maxEntries;
  for (let i = 0; i < toRemove; i++) {
    map.delete(sorted[i][0]);
  }
}

/**
 * Creates an in-memory rate limiter with automatic cleanup.
 *
 * @param options.windowMs    - Time window in milliseconds
 * @param options.maxRequests - Max requests allowed within the window
 * @param options.maxEntries  - Max map size before oldest entries are pruned (default: 10000)
 * @returns A `checkRateLimit(identifier)` function
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, maxEntries = 10_000 } = options;
  const map = new Map<string, RateLimitEntry>();

  // Clean up expired entries every 60 seconds to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of map) {
      if (now > val.resetAt) map.delete(key);
    }
    // Enforce max size even after cleanup
    pruneOldestEntries(map, maxEntries);
  }, 60 * 1000).unref?.(); // .unref() so the timer doesn't keep the process alive

  return function checkRateLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = map.get(identifier);

    if (!entry || now > entry.resetAt) {
      // Enforce max entries before inserting new ones
      if (map.size >= maxEntries) {
        pruneOldestEntries(map, Math.floor(maxEntries * 0.9));
      }
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

// ── Stricter rate limiter for admin PIN verification ─────────────────────────

interface PinRateLimitEntry {
  count: number;
  resetAt: number;
  /** Escalated lockout: after 10 failures, lock for 1 hour */
  lockedUntil: number;
}

const PIN_WINDOW_MS = 15 * 60 * 1000;       // 15 minutes
const PIN_MAX_ATTEMPTS = 5;                   // 5 attempts per window
const PIN_LOCKOUT_THRESHOLD = 10;             // 10 total failures triggers hard lockout
const PIN_LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour lockout
const PIN_MAX_ENTRIES = 5_000;

const pinRateLimitMap = new Map<string, PinRateLimitEntry>();

// Cleanup every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pinRateLimitMap) {
    if (now > val.resetAt && now > val.lockedUntil) {
      pinRateLimitMap.delete(key);
    }
  }
  if (pinRateLimitMap.size > PIN_MAX_ENTRIES) {
    const sorted = [...pinRateLimitMap.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toRemove = sorted.length - PIN_MAX_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
      pinRateLimitMap.delete(sorted[i][0]);
    }
  }
}, 60 * 1000).unref?.();

/**
 * Stricter rate limiter for admin PIN verification.
 * - 5 attempts per 15-minute window
 * - After 10 cumulative failures, 1-hour lockout
 * - Logs failed attempts with timestamp and IP
 */
export function checkPinRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const entry = pinRateLimitMap.get(ip);

  // Check hard lockout first
  if (entry && now < entry.lockedUntil) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  if (!entry || now > entry.resetAt) {
    // Preserve cumulative count for lockout detection if entry exists
    const prevCount = entry ? entry.count : 0;
    // Reset window but keep cumulative count if still within lockout tracking
    pinRateLimitMap.set(ip, { count: 1, resetAt: now + PIN_WINDOW_MS, lockedUntil: 0 });
    // If previous cumulative count was high but window expired, keep tracking
    if (prevCount >= PIN_LOCKOUT_THRESHOLD) {
      pinRateLimitMap.set(ip, { count: 1, resetAt: now + PIN_WINDOW_MS, lockedUntil: 0 });
    }
    return { allowed: true, remaining: PIN_MAX_ATTEMPTS - 1, retryAfterSeconds: 0 };
  }

  entry.count++;

  // Check for hard lockout threshold
  if (entry.count >= PIN_LOCKOUT_THRESHOLD) {
    entry.lockedUntil = now + PIN_LOCKOUT_DURATION_MS;
    entry.resetAt = now + PIN_LOCKOUT_DURATION_MS;
    console.warn(
      `[PIN-SECURITY] IP ${ip} locked out for 1 hour after ${entry.count} failed PIN attempts at ${new Date().toISOString()}`,
    );
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil(PIN_LOCKOUT_DURATION_MS / 1000) };
  }

  // Check normal window limit
  if (entry.count > PIN_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return {
    allowed: true,
    remaining: PIN_MAX_ATTEMPTS - entry.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Log a failed PIN attempt (call after confirming the PIN was wrong).
 */
export function logFailedPinAttempt(ip: string): void {
  console.warn(
    `[PIN-SECURITY] Failed PIN attempt from IP ${ip} at ${new Date().toISOString()}`,
  );
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
