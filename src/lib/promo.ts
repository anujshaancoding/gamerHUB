// =============================================================================
// Launch Promotion: Premium free for all users for the first 3 months
// =============================================================================

// Promo runs from launch until May 20, 2026
export const PROMO_END_DATE = new Date("2026-05-20T23:59:59Z");

/**
 * Returns true if the current date is within the launch promo period.
 * During this period, all users get premium features for free.
 */
export function isPromoPeriodActive(): boolean {
  return new Date() < PROMO_END_DATE;
}

/**
 * Human-readable label for the promo end date (e.g., "May 20, 2026")
 */
export const PROMO_END_LABEL = PROMO_END_DATE.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
