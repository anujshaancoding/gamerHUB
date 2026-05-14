// Approximate rank distributions for ranked queues. These are estimates based
// on publicly-shared dev / data-mining figures and are good enough for a
// "what % am I above" feel-good calculator. Each row's `pct` is the share of
// the ranked population currently at that rank tier; ordered from lowest
// to highest. The percentile shown to the user is the cumulative share of
// players *strictly below* their selected tier.

export type RankRow = { tier: string; pct: number };

export interface RankProfile {
  game: "valorant" | "bgmi" | "freefire";
  label: string;
  rows: RankRow[];
}

export const RANK_PROFILES: RankProfile[] = [
  {
    game: "valorant",
    label: "Valorant",
    rows: [
      { tier: "Iron 1",        pct: 1.2 },
      { tier: "Iron 2",        pct: 1.6 },
      { tier: "Iron 3",        pct: 2.0 },
      { tier: "Bronze 1",      pct: 3.1 },
      { tier: "Bronze 2",      pct: 4.0 },
      { tier: "Bronze 3",      pct: 4.7 },
      { tier: "Silver 1",      pct: 5.4 },
      { tier: "Silver 2",      pct: 6.0 },
      { tier: "Silver 3",      pct: 6.4 },
      { tier: "Gold 1",        pct: 6.6 },
      { tier: "Gold 2",        pct: 6.7 },
      { tier: "Gold 3",        pct: 6.4 },
      { tier: "Platinum 1",    pct: 6.0 },
      { tier: "Platinum 2",    pct: 5.3 },
      { tier: "Platinum 3",    pct: 4.5 },
      { tier: "Diamond 1",     pct: 3.6 },
      { tier: "Diamond 2",     pct: 2.7 },
      { tier: "Diamond 3",     pct: 1.9 },
      { tier: "Ascendant 1",   pct: 1.3 },
      { tier: "Ascendant 2",   pct: 0.85 },
      { tier: "Ascendant 3",   pct: 0.55 },
      { tier: "Immortal 1",    pct: 0.35 },
      { tier: "Immortal 2",    pct: 0.22 },
      { tier: "Immortal 3",    pct: 0.14 },
      { tier: "Radiant",       pct: 0.03 },
    ],
  },
  {
    game: "bgmi",
    label: "BGMI",
    rows: [
      { tier: "Bronze",      pct: 6.0 },
      { tier: "Silver",      pct: 9.0 },
      { tier: "Gold",        pct: 14.0 },
      { tier: "Platinum",    pct: 19.0 },
      { tier: "Diamond",     pct: 22.0 },
      { tier: "Crown",       pct: 17.0 },
      { tier: "Ace",         pct: 8.0 },
      { tier: "Ace Master",  pct: 3.0 },
      { tier: "Ace Dominator", pct: 1.2 },
      { tier: "Conqueror",   pct: 0.8 },
    ],
  },
  {
    game: "freefire",
    label: "Free Fire",
    rows: [
      { tier: "Bronze",      pct: 4.0 },
      { tier: "Silver",      pct: 7.0 },
      { tier: "Gold",        pct: 13.0 },
      { tier: "Platinum",    pct: 19.0 },
      { tier: "Diamond",     pct: 24.0 },
      { tier: "Heroic",      pct: 18.0 },
      { tier: "Master",      pct: 10.0 },
      { tier: "Grandmaster", pct: 5.0 },
    ],
  },
];

export function percentileFor(profile: RankProfile, tier: string): { below: number; at: number; above: number } {
  const idx = profile.rows.findIndex((r) => r.tier === tier);
  if (idx === -1) return { below: 0, at: 0, above: 0 };
  const totalPct = profile.rows.reduce((s, r) => s + r.pct, 0);
  const below = profile.rows.slice(0, idx).reduce((s, r) => s + r.pct, 0);
  const at = profile.rows[idx].pct;
  const above = totalPct - below - at;
  // Normalise to 100 % in case the data doesn't sum perfectly.
  const scale = 100 / totalPct;
  return {
    below: below * scale,
    at: at * scale,
    above: above * scale,
  };
}
