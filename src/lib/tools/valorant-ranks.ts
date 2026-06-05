// Shared Valorant rank-tier metadata. Single source of truth for the rank-card
// OG image, the /rank-card share page, and the rank-percentile India explorer.
//
// `tierGroup` maps a full tier (e.g. "Gold 2") to its color family so we can
// reuse the carousel rank themes (lib/carousel/rank-themes.ts) for accent color.

import { RANK_THEMES, type RankTier } from "@/lib/carousel/rank-themes";

/** Every full Valorant tier, lowest → highest. */
export const VALORANT_TIERS = [
  "Iron 1", "Iron 2", "Iron 3",
  "Bronze 1", "Bronze 2", "Bronze 3",
  "Silver 1", "Silver 2", "Silver 3",
  "Gold 1", "Gold 2", "Gold 3",
  "Platinum 1", "Platinum 2", "Platinum 3",
  "Diamond 1", "Diamond 2", "Diamond 3",
  "Ascendant 1", "Ascendant 2", "Ascendant 3",
  "Immortal 1", "Immortal 2", "Immortal 3",
  "Radiant",
] as const;

export type ValorantTier = (typeof VALORANT_TIERS)[number];

/** Map a full tier label to its color-family key. */
export function tierGroup(tier: string): RankTier {
  const lower = tier.toLowerCase();
  const groups: RankTier[] = [
    "iron", "bronze", "silver", "gold", "platinum",
    "diamond", "ascendant", "immortal", "radiant",
  ];
  for (const g of groups) {
    if (lower.startsWith(g)) return g;
  }
  return "all";
}

/** Accent hex color for a full tier (falls back to ggLobby red). */
export function tierColor(tier: string): string {
  return RANK_THEMES[tierGroup(tier)].accent;
}

/**
 * Normalise a free-form rank string (from `user_games.rank`) onto a known tier
 * where possible. Returns null if it doesn't match a Valorant tier — callers
 * then render the raw string instead.
 */
export function normaliseTier(raw: string | null | undefined): ValorantTier | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const hit = VALORANT_TIERS.find((t) => t.toLowerCase() === cleaned);
  if (hit) return hit;
  // Match a bare group name ("gold", "immortal") → its middle division.
  const group = tierGroup(cleaned);
  if (group === "all") return null;
  if (group === "radiant") return "Radiant";
  const mid = VALORANT_TIERS.find((t) => t.toLowerCase().startsWith(group + " 2"));
  return (mid as ValorantTier) ?? null;
}
