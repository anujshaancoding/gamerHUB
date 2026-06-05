// Approximate rank distributions for ranked queues. These are estimates based
// on publicly-shared dev / data-mining figures and are good enough for a
// "what % am I above" feel-good calculator. Each row's `pct` is the share of
// the ranked population currently at that rank tier; ordered from lowest
// to highest. The percentile shown to the user is the cumulative share of
// players *strictly below* their selected tier.

export type RankRow = { tier: string; pct: number };

export type RegionKey = "global" | "india";

export interface RankProfile {
  game: "valorant";
  label: string;
  /** Region-keyed distributions. "global" is required; others optional. */
  byRegion: Record<RegionKey, RankRow[]>;
}

// Global distribution (publicly-shared dev / data-mining figures).
const VALORANT_GLOBAL: RankRow[] = [
  { tier: "Iron 1", pct: 1.2 },
  { tier: "Iron 2", pct: 1.6 },
  { tier: "Iron 3", pct: 2.0 },
  { tier: "Bronze 1", pct: 3.1 },
  { tier: "Bronze 2", pct: 4.0 },
  { tier: "Bronze 3", pct: 4.7 },
  { tier: "Silver 1", pct: 5.4 },
  { tier: "Silver 2", pct: 6.0 },
  { tier: "Silver 3", pct: 6.4 },
  { tier: "Gold 1", pct: 6.6 },
  { tier: "Gold 2", pct: 6.7 },
  { tier: "Gold 3", pct: 6.4 },
  { tier: "Platinum 1", pct: 6.0 },
  { tier: "Platinum 2", pct: 5.3 },
  { tier: "Platinum 3", pct: 4.5 },
  { tier: "Diamond 1", pct: 3.6 },
  { tier: "Diamond 2", pct: 2.7 },
  { tier: "Diamond 3", pct: 1.9 },
  { tier: "Ascendant 1", pct: 1.3 },
  { tier: "Ascendant 2", pct: 0.85 },
  { tier: "Ascendant 3", pct: 0.55 },
  { tier: "Immortal 1", pct: 0.35 },
  { tier: "Immortal 2", pct: 0.22 },
  { tier: "Immortal 3", pct: 0.14 },
  { tier: "Radiant", pct: 0.03 },
];

// ── INDIA distribution (ESTIMATE — NOT AUTHORITATIVE) ────────────────────────
// TODO(data): replace these with measured figures. These are *clearly-labeled
// estimates* skewed slightly toward the lower-mid tiers vs. global, reflecting
// a younger, mobile-first, fast-growing player base on the India (Mumbai)
// server. Do NOT present these as authoritative — the UI surfaces an "estimate"
// disclaimer next to them. Source candidates for the real layer: VLR.gg India
// match data, community ranked surveys, ggLobby's own user_games once N is large.
const VALORANT_INDIA_ESTIMATE: RankRow[] = [
  { tier: "Iron 1", pct: 1.6 },
  { tier: "Iron 2", pct: 2.1 },
  { tier: "Iron 3", pct: 2.6 },
  { tier: "Bronze 1", pct: 3.8 },
  { tier: "Bronze 2", pct: 4.8 },
  { tier: "Bronze 3", pct: 5.4 },
  { tier: "Silver 1", pct: 6.0 },
  { tier: "Silver 2", pct: 6.4 },
  { tier: "Silver 3", pct: 6.6 },
  { tier: "Gold 1", pct: 6.6 },
  { tier: "Gold 2", pct: 6.4 },
  { tier: "Gold 3", pct: 6.0 },
  { tier: "Platinum 1", pct: 5.4 },
  { tier: "Platinum 2", pct: 4.6 },
  { tier: "Platinum 3", pct: 3.8 },
  { tier: "Diamond 1", pct: 3.0 },
  { tier: "Diamond 2", pct: 2.2 },
  { tier: "Diamond 3", pct: 1.5 },
  { tier: "Ascendant 1", pct: 1.0 },
  { tier: "Ascendant 2", pct: 0.65 },
  { tier: "Ascendant 3", pct: 0.42 },
  { tier: "Immortal 1", pct: 0.26 },
  { tier: "Immortal 2", pct: 0.16 },
  { tier: "Immortal 3", pct: 0.1 },
  { tier: "Radiant", pct: 0.02 },
];

export const RANK_PROFILES: RankProfile[] = [
  {
    game: "valorant",
    label: "Valorant",
    byRegion: {
      global: VALORANT_GLOBAL,
      india: VALORANT_INDIA_ESTIMATE,
    },
  },
];

/** Region display metadata for the toggle + disclaimers. */
export const REGION_META: Record<RegionKey, { label: string; estimate: boolean; note: string }> = {
  global: {
    label: "Global",
    estimate: true,
    note: "Pooled from publicly-shared dev data and community samples — treat as a rough percentile.",
  },
  india: {
    label: "India",
    estimate: true,
    note: "India-server estimate (NOT yet authoritative). Replace-with-real-data pending — use as a rough guide only.",
  },
};

export function rowsFor(profile: RankProfile, region: RegionKey): RankRow[] {
  return profile.byRegion[region] ?? profile.byRegion.global;
}

export function percentileFor(
  rows: RankRow[],
  tier: string,
): { below: number; at: number; above: number } {
  const idx = rows.findIndex((r) => r.tier === tier);
  if (idx === -1) return { below: 0, at: 0, above: 0 };
  const totalPct = rows.reduce((s, r) => s + r.pct, 0);
  const below = rows.slice(0, idx).reduce((s, r) => s + r.pct, 0);
  const at = rows[idx].pct;
  const above = totalPct - below - at;
  // Normalise to 100 % in case the data doesn't sum perfectly.
  const scale = 100 / totalPct;
  return {
    below: below * scale,
    at: at * scale,
    above: above * scale,
  };
}
