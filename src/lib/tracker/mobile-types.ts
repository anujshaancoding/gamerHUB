/**
 * Shared types for screenshot-uploaded games (BGMI, Free Fire).
 * No public API exists for these in India — users self-report numbers from their stats screen.
 */
import type { InsightFinding } from "./types";

export interface BgmiManualStats {
  inGameName: string;
  tier: string;            // "Bronze" .. "Conqueror"
  matchesPlayed: number;
  wins: number;
  kills: number;
  deaths: number;          // optional but useful for K/D
  damageDealt: number;     // total
  headshotPct: number;     // 0-100
  longestKill: number;     // in meters
  topWeapon: string;       // e.g. "M416", "AKM", "Mini14"
  favoriteMap: string;
  survivalTimeMin: number; // average survival time
}

export interface FreeFireManualStats {
  inGameName: string;
  rank: string;            // "Gold I" .. "Grandmaster"
  matchesPlayed: number;
  wins: number;
  kills: number;
  headshotPct: number;     // 0-100
  damageDealt: number;     // total
  topWeapon: string;       // e.g. "M4A1", "AWM", "MP40"
  favoriteCharacter: string; // e.g. "Alok", "K", "Chrono"
  favoriteMap: string;
  survivalTimeMin: number;
}

export interface MobileInsights {
  game: "bgmi" | "freefire";
  inGameName: string;
  rank: string;
  matchesPlayed: number;
  winRate: number;
  generatedAt: string;
  fromMock: boolean;
  summary: {
    strongCount: number;
    decentCount: number;
    weakCount: number;
    headline: string;
  };
  findings: InsightFinding[];
  rawStats: BgmiManualStats | FreeFireManualStats;
  screenshotUrl?: string | null;
}
