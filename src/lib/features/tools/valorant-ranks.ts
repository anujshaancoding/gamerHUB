// Shared Valorant rank-tier metadata. Single source of truth for the rank-card
// OG image, the /rank-card share page, and the rank-percentile India explorer.
//
// `tierGroup` maps a full tier (e.g. "Gold 2") to its color family so we can
// reuse the carousel rank themes (lib/carousel/rank-themes.ts) for accent color.

import { RANK_THEMES, type RankTier } from "@/lib/features/carousel/rank-themes";

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

// --- Official rank emblems (valorant-api.com competitive tiers) ---------------
// Current competitive-tiers set UUID. `tierNumber` is Riot's index: 0 = Unranked,
// 3..26 = Iron 1 … Immortal 3 (matching VALORANT_TIERS order), 27 = Radiant.
const COMPETITIVE_TIERS_UUID = "03621f52-342b-cf4e-4f86-9350a49c6d04";

/** Riot tier number for a tier label, or null if it isn't a ranked tier. */
export function rankTierNumber(tier: string): number | null {
  const t = normaliseTier(tier);
  if (!t) return null;
  if (t === "Radiant") return 27;
  const idx = VALORANT_TIERS.indexOf(t); // 0 = Iron 1
  return idx >= 0 ? idx + 3 : null;
}

/** URL-safe slug for a tier, e.g. "Gold 2" → "gold-2". */
export function rankSlug(tier: string): string {
  return tier.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Official large rank-emblem PNG URL for a tier (256×256, transparent bg), or
 * null for Unranked/unknown. Consumed server-side (OG image) and via the
 * `/api/tracker/asset/rank/<slug>` proxy on the client.
 */
export function rankIconUrl(tier: string): string | null {
  const n = rankTierNumber(tier);
  if (n == null) return null;
  return `https://media.valorant-api.com/competitivetiers/${COMPETITIVE_TIERS_UUID}/${n}/largeicon.png`;
}
