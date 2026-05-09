/**
 * Thresholds that decide whether a metric is strong / decent / weak.
 * Tuned for Valorant ranked midcore audience. Adjust freely without
 * touching analyzer logic.
 */
import type { Verdict } from "./types";

export interface Threshold {
  strongAtOrAbove: number;
  weakAtOrBelow: number;   // strictly below = weak
  // Anything between = "decent"
}

export const VALORANT_THRESHOLDS: Record<string, Threshold> = {
  headshotPct:        { strongAtOrAbove: 25, weakAtOrBelow: 15 },
  adr:                { strongAtOrAbove: 150, weakAtOrBelow: 110 },
  firstBloodPct:      { strongAtOrAbove: 18, weakAtOrBelow: 10 },
  kast:               { strongAtOrAbove: 70, weakAtOrBelow: 55 },
  clutchPct:          { strongAtOrAbove: 25, weakAtOrBelow: 10 },
  multiKillsPerMatch: { strongAtOrAbove: 3, weakAtOrBelow: 1 },
  tradeKillPct:       { strongAtOrAbove: 22, weakAtOrBelow: 14 },
  ecoImpact:          { strongAtOrAbove: 60, weakAtOrBelow: 35 },
  rolePerformancePct: { strongAtOrAbove: 65, weakAtOrBelow: 40 },
  flashAssistsPerMatch: { strongAtOrAbove: 4, weakAtOrBelow: 1.5 },
  utilDamagePerMatch:   { strongAtOrAbove: 250, weakAtOrBelow: 100 },
  mapWinRate:         { strongAtOrAbove: 55, weakAtOrBelow: 42 },
};

export function judge(value: number, t: Threshold): Verdict {
  if (value >= t.strongAtOrAbove) return "strong";
  if (value < t.weakAtOrBelow) return "weak";
  return "decent";
}
