/**
 * CS2 stat shape — modeled on Steam's GetUserStatsForGame appid 730 totals
 * plus a few computed fields for the analyzer.
 */
import type { InsightFinding, PlayerInsights, WeaponStat } from "./types";

export interface RawCs2Stats {
  steamId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Hours played in CS2 (best estimate from Steam) */
  hoursPlayed: number;
  // Lifetime totals (from Steam stats)
  totalKills: number;
  totalDeaths: number;
  totalKillsHeadshot: number;
  totalShotsFired: number;
  totalShotsHit: number;
  totalMatchesWon: number;
  totalMatchesPlayed: number;
  totalRoundsPlayed: number;
  totalMvps: number;
  totalPlantedBombs: number;
  totalDefusedBombs: number;
  // Top weapons (top 3 by kill count from individual weapon stats)
  topWeapons: WeaponStat[];
  // Map win rates (top 3)
  topMaps: Array<{ map: string; winRate: number; matches: number }>;
}

export interface Cs2Insights extends Omit<PlayerInsights, "rank" | "level" | "mainAgentId" | "mainAgentName" | "game"> {
  game: "cs2";
  /** CS2 doesn't expose Premier rating to public API — left empty unless user supplies */
  rank: string;
  hoursPlayed: number;
  avatarUrl: string | null;
  displayName: string;
  steamId: string;
  findings: InsightFinding[];
}
