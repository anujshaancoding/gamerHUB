// ggLobby Rating — our own 40–99 player score for the rank card.
//
// Shown ONLY on career cards (real lookup data), never on self-reported manual
// cards, so the number always reflects something close to real performance.
// Single source of truth shared by the card maker (client) and the OG image
// route (server) so both always agree.

import { rankTierNumber, VALORANT_TIERS } from "@/lib/features/tools/valorant-ranks";

/** Raw performance inputs from a career lookup; all optional. */
export type GGRatingStats = {
  kd?: number | null;
  acs?: number | null;
  winRate?: number | null; // percentage, 0–100
  headshotPct?: number | null; // percentage, 0–100
  kast?: number | null; // percentage, 0–100
};

export type GGRatingInput = GGRatingStats & {
  rank: string;
  peak?: string | null;
};

/** 0–100 ladder position for a single tier; null if not a ranked tier. */
function tierLadder(rank: string): number | null {
  const n = rankTierNumber(rank);
  if (n == null) return null;
  const idx = n === 27 ? VALORANT_TIERS.length - 1 : n - 3; // 0 = Iron 1
  return Math.round((idx / (VALORANT_TIERS.length - 1)) * 100);
}

function clamp01to100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Map a metric onto 0–100 between a floor (→0) and a ceiling (→100). */
function band(value: number, floor: number, ceil: number): number {
  return clamp01to100(((value - floor) / (ceil - floor)) * 100);
}

/**
 * Rank component (0–100): 70% current tier + 30% peak, so the number rewards
 * a proven ceiling without letting an old peak carry it.
 */
function rankComponent(rank: string, peak?: string | null): number | null {
  const current = tierLadder(rank);
  if (current == null) return null;
  const peakLadder = peak ? tierLadder(peak) : null;
  return current * 0.7 + Math.max(current, peakLadder ?? current) * 0.3;
}

/**
 * Performance component (0–100): average of whatever metrics we have, each
 * normalised against realistic Valorant anchors. Returns null when no metric
 * is present so callers can fall back to the rank-only score.
 */
function performanceComponent(stats: GGRatingStats): number | null {
  const parts: number[] = [];
  if (stats.kd != null && stats.kd > 0) parts.push(band(stats.kd, 0.6, 1.6));
  if (stats.acs != null && stats.acs > 0) parts.push(band(stats.acs, 150, 350));
  if (stats.headshotPct != null && stats.headshotPct > 0) parts.push(band(stats.headshotPct, 10, 35));
  if (stats.kast != null && stats.kast > 0) parts.push(band(stats.kast, 60, 85));
  if (stats.winRate != null && stats.winRate > 0) parts.push(band(stats.winRate, 40, 65));
  if (!parts.length) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

/**
 * The ggLobby Rating, 40–99. Blends rank standing with real performance when
 * stats are available (55% rank / 45% performance); falls back to a rank-only
 * score when only rank/peak are known. Returns null if the rank isn't a known
 * ranked tier (Unranked).
 */
export function computeGGRating(input: GGRatingInput): number | null {
  const rank = rankComponent(input.rank, input.peak);
  if (rank == null) return null;
  const perf = performanceComponent(input);
  const blended = perf == null ? rank : rank * 0.55 + perf * 0.45;
  return Math.round(40 + (clamp01to100(blended) / 100) * 59); // 40–99
}
