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

export type ValorantRole = "duelist" | "controller" | "sentinel" | "initiator";

export interface PlayerCard {
  small?: string;
  large?: string;
  wide?: string;
}

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

export interface PerAgentStat {
  agentId: string;
  agentName: string;
  matches: number;
  wins: number;
  winRate: number;         // 0-100
  kd: number;
  adr: number;
  acs: number;
  bestMap: string | null;
  bestMapWinRate: number;
}

export interface RoleStat {
  role: ValorantRole;
  matches: number;
  winRate: number;         // 0-100
  kda: number;             // (kills + assists) / deaths
}

export interface RecentMatch {
  matchId: string;
  map: string;
  agentId: string;
  agentName: string;
  mode: string;
  won: boolean;
  myRoundsWon: number;
  enemyRoundsWon: number;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  kd: number;
  hsPct: number;
  startedAt: string;       // ISO date
  durationMinutes: number;
  act: string;             // patched act label (e.g. "Episode 9: Act II")
}

export interface AccuracyBreakdown {
  headPct: number;
  bodyPct: number;
  legsPct: number;
  headHits: number;
  bodyHits: number;
  legsHits: number;
}

export interface RawValorantStats {
  riotId: string;          // e.g. "PlayerName#TAG"
  region: string;          // "na" | "eu" | "ap" | "kr" | "latam" | "br"
  rank: string;            // e.g. "Diamond 2"
  peakRank: string | null; // e.g. "Ascendant 3"
  level: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;         // 0-100
  /** main agent id, lowercase — matches keys in valorant-assets.ts AGENTS */
  mainAgentId: string;
  mainAgentName: string;
  /** Riot player card art (the user's selected card — small/large/wide URLs) */
  playerCard: PlayerCard | null;
  /** top 3 weapons by kills, sorted desc */
  favoriteWeapons: WeaponStat[];
  // Headline aggregates
  kd: number;
  acs: number;             // avg combat score per round
  accuracy: AccuracyBreakdown;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  playtimeMinutes: number;
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
  agentPickedRole: ValorantRole;
  rolePerformancePct: number; // 0-100 vs role baseline
  rolePerformance: RoleStat[];
  // Maps - top played
  topMaps: Array<{ map: string; winRate: number; matches: number }>;
  // Utility
  flashAssistsPerMatch: number;
  utilDamagePerMatch: number;
  // Per-agent breakdown across the sampled matches
  perAgent: PerAgentStat[];
  // Recent matches (most recent first, up to 10)
  recentMatches: RecentMatch[];
  // Acts seen in the sampled matches (most recent first)
  availableActs: string[];
  currentAct: string;      // the act these stats are filtered to (empty = all)
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
  region: string;
  rank: string;
  peakRank: string | null;
  level: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  /** main agent ID — used for the avatar via the asset proxy */
  mainAgentId: string;
  mainAgentName: string;
  /** Riot player card art (preferred for the profile avatar) */
  playerCard: PlayerCard | null;
  favoriteWeapons: WeaponStat[];
  kd: number;
  acs: number;
  adr: number;
  kast: number;
  headshotPct: number;
  accuracy: AccuracyBreakdown;
  playtimeMinutes: number;
  perAgent: PerAgentStat[];
  recentMatches: RecentMatch[];
  rolePerformance: RoleStat[];
  availableActs: string[];
  currentAct: string;
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
  act?: string;
}

export interface TrackerLookupResponse {
  ok: boolean;
  insights?: PlayerInsights;
  /** Structured error so the UI can branch (not-found vs rate-limit vs etc) */
  error?: LookupError;
}
