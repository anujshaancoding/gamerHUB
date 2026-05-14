// =============================================================================
// Premium is currently disabled site-wide: all logged-in users get every
// feature for free. The /premium section is hidden from navigation while
// the team decides on the long-term monetization shape.
// =============================================================================

// Kept as a future cutover date for when the unlocked period should end.
// `isPromoPeriodActive` currently returns true unconditionally regardless.
export const PROMO_END_DATE = new Date("2099-01-01T00:00:00Z");

export function isPromoPeriodActive(): boolean {
  return true;
}

/**
 * Human-readable label for the promo end date (e.g., "May 20, 2026")
 */
export const PROMO_END_LABEL = PROMO_END_DATE.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
