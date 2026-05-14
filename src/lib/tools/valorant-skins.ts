// Average VP prices for popular Valorant skin tiers (per skin, base level).
// Indian VP pack pricing as of late 2025 (≈ ₹0.85 per VP at the ₹2,200/2,800 VP pack).
// Bundles are typically priced at "1× ultimate skin + N other skins" → easier to
// estimate by counting skins per tier.
//
// Editions per tier (the marker that shows up in the buddy / animation column):
// - Select       : 875 VP
// - Deluxe       : 1,275 VP
// - Premium      : 1,775 VP
// - Exclusive    : 2,175 VP
// - Ultra / Edge : 2,475 VP
// Knives / melees:
// - Select       : 1,750 VP (rare)
// - Deluxe       : 2,550 VP
// - Premium      : 3,550 VP
// - Exclusive    : 4,350 VP
// - Ultra / Edge : 4,950 VP

export type SkinTier =
  | "select"
  | "deluxe"
  | "premium"
  | "exclusive"
  | "ultra";

export const SKIN_VP: Record<SkinTier, { gun: number; knife: number; label: string }> = {
  select:    { gun:  875, knife: 1_750, label: "Select" },
  deluxe:    { gun: 1_275, knife: 2_550, label: "Deluxe" },
  premium:   { gun: 1_775, knife: 3_550, label: "Premium" },
  exclusive: { gun: 2_175, knife: 4_350, label: "Exclusive" },
  ultra:     { gun: 2_475, knife: 4_950, label: "Ultra / Edge" },
};

// Approx VP → INR (best 2,800 VP pack ≈ ₹2,400)
export const VP_TO_INR = 2_400 / 2_800;
// Approx VP → USD ($20 = 2,050 VP)
export const VP_TO_USD = 20 / 2_050;

export interface SkinLineItem {
  tier: SkinTier;
  isKnife: boolean;
  count: number;
}

export function totalVP(items: SkinLineItem[]): number {
  return items.reduce((sum, it) => {
    const per = it.isKnife ? SKIN_VP[it.tier].knife : SKIN_VP[it.tier].gun;
    return sum + per * it.count;
  }, 0);
}
