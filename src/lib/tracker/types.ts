/**
 * ggLobby Player Insights - Tracker Types
 *
 * Self-contained type definitions for the player tracker module.
 * Designed to support multiple games (Valorant first, CS2/Apex later).
 */

export type SupportedGame = "valorant" | "cs2";

export type Verdict = "strong" | "decent" | "weak";

export type StatCategory =
  | "aim"
  | "gamesense"
  | "economy"
  | "role"
  | "map"
  | "utility";

export interface WeaponStat {
  /** weapon id, lowercase — matches keys in valorant-assets.ts WEAPONS */
  weaponId: string;
  /** human-readable name */
  weaponName: string;
  kills: number;
  headshotPct: number;     // 0-100
  accuracy: number;        // 0-100 (body+head shots / total shots fired)
  matches: number;         // matches where this was a primary weapon
}

export interface RawValorantStats {
  riotId: string;          // e.g. "PlayerName#TAG"
  rank: string;            // e.g. "Diamond 2"
  level: number;
  matchesPlayed: number;
  winRate: number;         // 0-100
  /** main agent id, lowercase — matches keys in valorant-assets.ts AGENTS */
  mainAgentId: string;
  mainAgentName: string;
  /** top 3 weapons by kills, sorted desc */
  favoriteWeapons: WeaponStat[];
  // Aim
  headshotPct: number;     // 0-100
  adr: number;             // Avg damage / round
  firstBloodPct: number;   // 0-100 (round opener kill %)
  kast: number;            // 0-100 (% rounds with K/A/S/T contribution)
  // Game sense
  clutchPct: number;       // 0-100 (1vX win %)
  multiKillsPerMatch: number;
  tradeKillPct: number;    // 0-100
  // Economy
  ecoImpact: number;       // 0-100 (custom: kills + plants on eco/save)
  // Role
  agentPickedRole: "duelist" | "controller" | "sentinel" | "initiator";
  rolePerformancePct: number; // 0-100 vs role baseline
  // Maps - top played
  topMaps: Array<{ map: string; winRate: number; matches: number }>;
  // Utility
  flashAssistsPerMatch: number;
  utilDamagePerMatch: number;
}

export interface InsightFinding {
  metric: string;          // human label, e.g. "Headshot Rate"
  value: string;           // formatted, e.g. "38%"
  verdict: Verdict;
  category: StatCategory;
  message: string;         // plain-English explainer
  suggestion?: string;     // drill / action — only for "weak"
  drillLink?: {
    label: string;
    href: string;          // e.g. /aim?mode=peek
  };
}

export interface PlayerInsights {
  riotId: string;
  game: SupportedGame;
  rank: string;
  level: number;
  matchesPlayed: number;
  winRate: number;
  /** main agent ID — used for the avatar via the asset proxy */
  mainAgentId: string;
  mainAgentName: string;
  favoriteWeapons: WeaponStat[];
  generatedAt: string;     // ISO date
  fromMock: boolean;       // true while Riot API isn't wired
  summary: {
    strongCount: number;
    decentCount: number;
    weakCount: number;
    headline: string;      // 1-line takeaway
  };
  findings: InsightFinding[];
}

export type LookupErrorCode =
  | "INVALID_FORMAT"
  | "NOT_FOUND"
  | "PRIVATE_PROFILE"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR";

export interface LookupError {
  code: LookupErrorCode;
  message: string;
}

export interface TrackerLookupRequest {
  game: SupportedGame;
  riotId: string;
}

export interface TrackerLookupResponse {
  ok: boolean;
  insights?: PlayerInsights;
  /** Structured error so the UI can branch (not-found vs rate-limit vs etc) */
  error?: LookupError;
}
