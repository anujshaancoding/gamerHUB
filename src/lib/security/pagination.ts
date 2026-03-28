/**
 * Safe pagination parameter parsing.
 *
 * Prevents DoS via unbounded limit/offset values by clamping them
 * to sensible maximums.
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_OFFSET = 10_000;

interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Parse and clamp `limit` and `offset` query parameters.
 *
 * @param searchParams - URLSearchParams from the request
 * @param defaults     - Override the default and max limits per-route
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults?: { defaultLimit?: number; maxLimit?: number; maxOffset?: number }
): PaginationParams {
  const maxLimit = defaults?.maxLimit ?? MAX_LIMIT;
  const maxOffset = defaults?.maxOffset ?? MAX_OFFSET;
  const defaultLimit = defaults?.defaultLimit ?? DEFAULT_LIMIT;

  const rawLimit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  const rawOffset = parseInt(searchParams.get("offset") || "0", 10);

  return {
    limit: Math.max(1, Math.min(isNaN(rawLimit) ? defaultLimit : rawLimit, maxLimit)),
    offset: Math.max(0, Math.min(isNaN(rawOffset) ? 0 : rawOffset, maxOffset)),
  };
}
