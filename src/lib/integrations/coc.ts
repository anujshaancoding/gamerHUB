// Clash of Clans API Integration
// Uses server-side API key + player tag lookup (no OAuth)
// API Docs: https://developer.clashofclans.com

const COC_API_BASE = "https://api.clashofclans.com/v1";

// --- TypeScript Interfaces ---

export interface CocPlayer {
  tag: string;
  name: string;
  townHallLevel: number;
  townHallWeaponLevel?: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  builderHallLevel?: number;
  builderBaseTrophies?: number;
  donations: number;
  donationsReceived: number;
  clan?: CocPlayerClan;
  league?: CocLeague;
  achievements: CocAchievement[];
  heroes: CocHeroItem[];
  troops: CocTroopItem[];
  spells: CocSpellItem[];
  labels: CocLabel[];
  legendStatistics?: CocLegendStats;
  role?: string;
  warPreference?: string;
}

export interface CocPlayerClan {
  tag: string;
  name: string;
  clanLevel: number;
  badgeUrls: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface CocLeague {
  id: number;
  name: string;
  iconUrls: {
    small: string;
    medium?: string;
    tiny: string;
  };
}

export interface CocAchievement {
  name: string;
  stars: number;
  value: number;
  target: number;
  info: string;
  completionInfo: string;
  village: string;
}

export interface CocHeroItem {
  name: string;
  level: number;
  maxLevel: number;
  village: string;
}

export interface CocTroopItem {
  name: string;
  level: number;
  maxLevel: number;
  village: string;
}

export interface CocSpellItem {
  name: string;
  level: number;
  maxLevel: number;
  village: string;
}

export interface CocLabel {
  id: number;
  name: string;
  iconUrls: {
    small: string;
    medium: string;
  };
}

export interface CocLegendStats {
  currentSeason?: { trophies: number; id: string; rank?: number };
  previousSeason?: { trophies: number; id: string; rank?: number };
  bestSeason?: { trophies: number; id: string; rank?: number };
  legendTrophies?: number;
}

export interface CocWarLogEntry {
  result: "win" | "lose" | "tie";
  endTime: string;
  teamSize: number;
  attacksPerMember?: number;
  clan: {
    tag: string;
    name: string;
    clanLevel: number;
    attacks: number;
    stars: number;
    destructionPercentage: number;
    badgeUrls: { small: string; medium: string; large: string };
  };
  opponent: {
    tag: string;
    name: string;
    clanLevel: number;
    stars: number;
    destructionPercentage: number;
    badgeUrls: { small: string; medium: string; large: string };
  };
}

export interface CocVerifyTokenResponse {
  tag: string;
  token: string;
  status: "ok" | "invalid";
}

// --- Helper Functions ---

/**
 * URL-encode a CoC player/clan tag.
 * Tags start with # which must be encoded as %23.
 */
export function encodeTag(tag: string): string {
  const normalized = tag.startsWith("#") ? tag : `#${tag}`;
  return encodeURIComponent(normalized);
}

/**
 * Validate a CoC player tag format.
 * Valid characters after # are: 0 2 8 9 P Y L Q G R J C U V
 */
export function validatePlayerTag(tag: string): boolean {
  const normalized = tag.startsWith("#") ? tag : `#${tag}`;
  return /^#[0289PYLQGRJCUV]+$/i.test(normalized);
}

/**
 * Normalize a player tag to always have the # prefix in uppercase.
 */
export function normalizePlayerTag(tag: string): string {
  const normalized = tag.startsWith("#") ? tag : `#${tag}`;
  return normalized.toUpperCase();
}

// --- API Functions ---

async function cocFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const apiKey = process.env.COC_API_KEY;
  if (!apiKey) {
    throw new Error("COC_API_KEY environment variable is not set");
  }

  const response = await fetch(`${COC_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...options?.headers,
    },
  });

  if (response.status === 404) {
    throw new CocApiError("Not found", 404);
  }

  if (response.status === 403) {
    throw new CocApiError("Access denied (war log may be private)", 403);
  }

  if (response.status === 429) {
    throw new CocApiError("Rate limit exceeded", 429);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new CocApiError(`CoC API error ${response.status}: ${text}`, response.status);
  }

  return response.json();
}

export class CocApiError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CocApiError";
    this.status = status;
  }
}

/**
 * Get a player's full profile by tag.
 */
export async function getPlayer(playerTag: string): Promise<CocPlayer> {
  return cocFetch<CocPlayer>(`/players/${encodeTag(playerTag)}`);
}

/**
 * Verify a player's API token for ownership proof.
 * The player generates this token in-game: Settings > More Settings > API Token.
 */
export async function verifyPlayerToken(
  playerTag: string,
  token: string
): Promise<boolean> {
  try {
    const result = await cocFetch<CocVerifyTokenResponse>(
      `/players/${encodeTag(playerTag)}/verifytoken`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }
    );
    return result.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Get a clan's war log. May fail with 403 if the clan has set war log to private.
 */
export async function getClanWarLog(
  clanTag: string
): Promise<CocWarLogEntry[]> {
  const data = await cocFetch<{ items: CocWarLogEntry[] }>(
    `/clans/${encodeTag(clanTag)}/warlog?limit=20`
  );
  return data.items || [];
}

// --- Stats Calculation ---

/**
 * Extract display stats from a CoC player profile.
 */
export function calculateCocStats(
  player: CocPlayer
): Record<string, string | number> {
  return {
    trophies: player.trophies,
    best_trophies: player.bestTrophies,
    war_stars: player.warStars,
    attack_wins: player.attackWins,
    defense_wins: player.defenseWins,
    donations: player.donations,
    donations_received: player.donationsReceived,
    town_hall_level: player.townHallLevel,
    exp_level: player.expLevel,
    builder_hall_level: player.builderHallLevel || 0,
    builder_base_trophies: player.builderBaseTrophies || 0,
    hero_count: player.heroes?.length || 0,
    max_heroes: player.heroes?.filter((h) => h.level === h.maxLevel).length || 0,
    achievement_stars:
      player.achievements?.reduce((sum, a) => sum + a.stars, 0) || 0,
    total_achievements: player.achievements?.length || 0,
  };
}

/**
 * Get the player's current league name.
 */
export function getCocLeagueName(player: CocPlayer): string {
  return player.league?.name || "Unranked";
}

/**
 * Convert clan war log entries to the game_match_history format.
 */
export function mapWarLogToMatches(
  warLog: CocWarLogEntry[],
  clanTag: string
): Array<{
  external_match_id: string;
  game_mode: string;
  result: "win" | "loss" | "draw";
  score: Record<string, unknown>;
  stats: Record<string, unknown>;
  played_at: string;
}> {
  return warLog.map((war) => ({
    external_match_id: `war_${war.endTime}_${clanTag}`,
    game_mode: "clan_wars",
    result: war.result === "win" ? "win" : war.result === "lose" ? "loss" : "draw",
    score: {
      team_stars: war.clan.stars,
      enemy_stars: war.opponent.stars,
      team_destruction: war.clan.destructionPercentage,
      enemy_destruction: war.opponent.destructionPercentage,
      team_attacks: war.clan.attacks,
    },
    stats: {
      team_size: war.teamSize,
      attacks_per_member: war.attacksPerMember || 2,
      opponent_name: war.opponent.name,
      opponent_tag: war.opponent.tag,
    },
    played_at: war.endTime,
  }));
}
