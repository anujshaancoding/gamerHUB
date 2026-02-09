import { NextResponse } from "next/server";

// Cache durations in seconds
export const CACHE_DURATIONS = {
  // Static data that rarely changes
  STATIC: 60 * 60 * 24, // 24 hours
  GAMES: 60 * 60 * 24, // 24 hours
  BADGES: 60 * 60 * 24, // 24 hours

  // Semi-static data
  SEASON: 60 * 30, // 30 minutes
  QUEST_DEFINITIONS: 60 * 30, // 30 minutes

  // Dynamic but not real-time
  LEADERBOARD: 60 * 5, // 5 minutes
  TOURNAMENTS: 60 * 5, // 5 minutes
  CLANS: 60 * 5, // 5 minutes
  PROFILES: 60 * 5, // 5 minutes

  // User-specific data (shorter cache)
  USER_DATA: 60, // 1 minute
  DASHBOARD: 60, // 1 minute

  // No cache for real-time or user-specific mutable data
  NO_CACHE: 0,
} as const;

/**
 * Add cache headers to a NextResponse
 * Uses stale-while-revalidate pattern for better UX
 */
export function withCacheHeaders<T>(
  data: T,
  maxAge: number,
  options?: {
    status?: number;
    staleWhileRevalidate?: number;
    isPrivate?: boolean;
  }
): NextResponse<T> {
  const {
    status = 200,
    staleWhileRevalidate = maxAge, // Default SWR to same as maxAge
    isPrivate = false,
  } = options || {};

  const response = NextResponse.json(data, { status });

  if (maxAge === 0) {
    // No caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
  } else {
    // Cache with stale-while-revalidate
    const cacheControl = isPrivate
      ? `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      : `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

    response.headers.set("Cache-Control", cacheControl);
  }

  return response;
}

/**
 * Create a cached JSON response for public data
 */
export function cachedResponse<T>(
  data: T,
  maxAge: number = CACHE_DURATIONS.USER_DATA
): NextResponse<T> {
  return withCacheHeaders(data, maxAge, {
    staleWhileRevalidate: maxAge * 2,
    isPrivate: false,
  });
}

/**
 * Create a cached JSON response for user-specific data
 */
export function privateCachedResponse<T>(
  data: T,
  maxAge: number = CACHE_DURATIONS.USER_DATA
): NextResponse<T> {
  return withCacheHeaders(data, maxAge, {
    staleWhileRevalidate: maxAge,
    isPrivate: true,
  });
}

/**
 * Create a non-cached JSON response
 */
export function noCacheResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return withCacheHeaders(data, 0, { status });
}
