// Steam API Integration
// Supports CS2 via Steam OpenID + Web API

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_API_BASE = "https://api.steampowered.com";

// Steam App IDs for supported games
export const STEAM_APPS = {
  cs2: 730, // Counter-Strike 2 (same as CS:GO)
} as const;

export interface SteamUser {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  profilestate?: number;
  lastlogoff?: number;
  commentpermission?: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  gameid?: string;
  gameextrainfo?: string;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number; // In minutes
  playtime_2weeks?: number;
  img_icon_url: string;
  img_logo_url?: string;
}

export interface SteamPlayerStats {
  steamID: string;
  gameName: string;
  stats: { name: string; value: number }[];
  achievements?: { name: string; achieved: number }[];
}

export interface CS2Stats {
  total_kills: number;
  total_deaths: number;
  total_time_played: number;
  total_planted_bombs: number;
  total_defused_bombs: number;
  total_wins: number;
  total_matches_played: number;
  total_mvps: number;
  total_damage_done: number;
  total_money_earned: number;
  total_kills_headshot: number;
  total_shots_hit: number;
  total_shots_fired: number;
  last_match_kills: number;
  last_match_deaths: number;
  last_match_mvps: number;
  last_match_damage: number;
  last_match_rounds: number;
  last_match_wins: number;
}

export interface Dota2Stats {
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  last_hits: number;
  denies: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
}

export interface Dota2Match {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  game_mode: number;
  lobby_type: number;
  hero_id: number;
  start_time: number;
  kills: number;
  deaths: number;
  assists: number;
  skill?: number;
  average_rank?: number;
  leaver_status: number;
  party_size?: number;
}

export interface Dota2PlayerProfile {
  account_id: number;
  personaname: string;
  name?: string;
  avatar: string;
  avatarfull: string;
  profileurl: string;
  cheese: number;
  rank_tier?: number;
  leaderboard_rank?: number;
  competitive_rank?: number;
  mmr_estimate?: { estimate: number };
}

// Generate Steam OpenID URL
export function getSteamAuthUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnUrl,
    "openid.realm": new URL(returnUrl).origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

// Verify Steam OpenID callback
export async function verifySteamAuth(
  params: URLSearchParams
): Promise<string | null> {
  // Check that the mode is id_res
  if (params.get("openid.mode") !== "id_res") {
    return null;
  }

  // Prepare verification request
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: verifyParams.toString(),
  });

  const text = await response.text();

  if (!text.includes("is_valid:true")) {
    return null;
  }

  // Extract Steam ID from claimed_id
  const claimedId = params.get("openid.claimed_id");
  if (!claimedId) return null;

  const steamIdMatch = claimedId.match(/\/openid\/id\/(\d+)$/);
  return steamIdMatch ? steamIdMatch[1] : null;
}

// Get Steam user profile
export async function getSteamUser(steamId: string): Promise<SteamUser | null> {
  const apiKey = process.env.STEAM_API_KEY!;

  const response = await fetch(
    `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  );

  if (!response.ok) {
    throw new Error("Failed to get Steam user");
  }

  const data = await response.json();
  return data.response?.players?.[0] || null;
}

// Get owned games
export async function getSteamOwnedGames(
  steamId: string,
  includeAppInfo: boolean = true,
  includeFreeGames: boolean = true
): Promise<SteamOwnedGame[]> {
  const apiKey = process.env.STEAM_API_KEY!;

  const params = new URLSearchParams({
    key: apiKey,
    steamid: steamId,
    include_appinfo: includeAppInfo ? "1" : "0",
    include_played_free_games: includeFreeGames ? "1" : "0",
    format: "json",
  });

  const response = await fetch(
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?${params}`
  );

  if (!response.ok) {
    throw new Error("Failed to get Steam owned games");
  }

  const data = await response.json();
  return data.response?.games || [];
}

// Get CS2/CS:GO stats
export async function getCS2Stats(steamId: string): Promise<CS2Stats | null> {
  const apiKey = process.env.STEAM_API_KEY!;

  const response = await fetch(
    `${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/?key=${apiKey}&steamid=${steamId}&appid=${STEAM_APPS.cs2}`
  );

  if (response.status === 403 || response.status === 400) {
    // Profile might be private
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to get CS2 stats");
  }

  const data = await response.json();
  const stats = data.playerstats?.stats;

  if (!stats) return null;

  // Convert array to object
  const statsMap: Record<string, number> = {};
  for (const stat of stats) {
    statsMap[stat.name] = stat.value;
  }

  return {
    total_kills: statsMap.total_kills || 0,
    total_deaths: statsMap.total_deaths || 0,
    total_time_played: statsMap.total_time_played || 0,
    total_planted_bombs: statsMap.total_planted_bombs || 0,
    total_defused_bombs: statsMap.total_defused_bombs || 0,
    total_wins: statsMap.total_wins || 0,
    total_matches_played: statsMap.total_matches_played || 0,
    total_mvps: statsMap.total_mvps || 0,
    total_damage_done: statsMap.total_damage_done || 0,
    total_money_earned: statsMap.total_money_earned || 0,
    total_kills_headshot: statsMap.total_kills_headshot || 0,
    total_shots_hit: statsMap.total_shots_hit || 0,
    total_shots_fired: statsMap.total_shots_fired || 0,
    last_match_kills: statsMap.last_match_kills || 0,
    last_match_deaths: statsMap.last_match_deaths || 0,
    last_match_mvps: statsMap.last_match_mvps || 0,
    last_match_damage: statsMap.last_match_damage || 0,
    last_match_rounds: statsMap.last_match_rounds || 0,
    last_match_wins: statsMap.last_match_wins || 0,
  };
}

// OpenDota API for Dota 2 (free, no API key required for basic usage)
const OPENDOTA_API = "https://api.opendota.com/api";

// Convert Steam64 ID to Steam32 (account ID used by Dota 2)
export function steamId64To32(steamId64: string): number {
  return Number(BigInt(steamId64) - BigInt("76561197960265728"));
}

// Convert Steam32 to Steam64
export function steamId32To64(steamId32: number): string {
  return (BigInt(steamId32) + BigInt("76561197960265728")).toString();
}

// Get Dota 2 player profile from OpenDota
export async function getDota2Profile(
  steamId: string
): Promise<Dota2PlayerProfile | null> {
  const accountId = steamId64To32(steamId);

  const response = await fetch(`${OPENDOTA_API}/players/${accountId}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to get Dota 2 profile");
  }

  return response.json();
}

// Get Dota 2 win/loss
export async function getDota2WinLoss(
  steamId: string
): Promise<{ win: number; lose: number } | null> {
  const accountId = steamId64To32(steamId);

  const response = await fetch(`${OPENDOTA_API}/players/${accountId}/wl`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to get Dota 2 win/loss");
  }

  return response.json();
}

// Get Dota 2 recent matches
export async function getDota2Matches(
  steamId: string,
  limit: number = 20
): Promise<Dota2Match[]> {
  const accountId = steamId64To32(steamId);

  const response = await fetch(
    `${OPENDOTA_API}/players/${accountId}/recentMatches`
  );

  if (!response.ok) {
    throw new Error("Failed to get Dota 2 matches");
  }

  const matches = await response.json();
  return matches.slice(0, limit);
}

// Get Dota 2 totals (aggregated stats)
export async function getDota2Totals(
  steamId: string
): Promise<{ field: string; n: number; sum: number }[]> {
  const accountId = steamId64To32(steamId);

  const response = await fetch(`${OPENDOTA_API}/players/${accountId}/totals`);

  if (!response.ok) {
    throw new Error("Failed to get Dota 2 totals");
  }

  return response.json();
}

// Calculate formatted CS2 stats
export function calculateCS2DisplayStats(
  stats: CS2Stats
): Record<string, string | number> {
  const kd = stats.total_deaths > 0
    ? stats.total_kills / stats.total_deaths
    : stats.total_kills;

  const hsPercent = stats.total_kills > 0
    ? (stats.total_kills_headshot / stats.total_kills) * 100
    : 0;

  const accuracy = stats.total_shots_fired > 0
    ? (stats.total_shots_hit / stats.total_shots_fired) * 100
    : 0;

  const winRate = stats.total_matches_played > 0
    ? (stats.total_wins / stats.total_matches_played) * 100
    : 0;

  const adr = stats.total_matches_played > 0
    ? stats.total_damage_done / stats.total_matches_played
    : 0;

  return {
    kills: stats.total_kills,
    deaths: stats.total_deaths,
    kd: Math.round(kd * 100) / 100,
    headshot_pct: `${Math.round(hsPercent)}%`,
    accuracy: `${Math.round(accuracy)}%`,
    win_rate: `${Math.round(winRate)}%`,
    adr: Math.round(adr),
    mvps: stats.total_mvps,
    matches_played: stats.total_matches_played,
    time_played_hours: Math.round(stats.total_time_played / 3600),
  };
}

// Calculate formatted Dota 2 stats from matches
export function calculateDota2Stats(
  matches: Dota2Match[]
): Record<string, string | number> {
  if (matches.length === 0) {
    return {};
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDuration = 0;
  let wins = 0;

  for (const match of matches) {
    totalKills += match.kills;
    totalDeaths += match.deaths;
    totalAssists += match.assists;
    totalDuration += match.duration;

    // Check if player won
    const isRadiant = match.player_slot < 128;
    if ((isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win)) {
      wins++;
    }
  }

  const gamesPlayed = matches.length;
  const kda = totalDeaths > 0
    ? (totalKills + totalAssists) / totalDeaths
    : totalKills + totalAssists;
  const avgDuration = gamesPlayed > 0 ? totalDuration / gamesPlayed : 0;
  const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
  const avgKills = gamesPlayed > 0 ? totalKills / gamesPlayed : 0;
  const avgDeaths = gamesPlayed > 0 ? totalDeaths / gamesPlayed : 0;
  const avgAssists = gamesPlayed > 0 ? totalAssists / gamesPlayed : 0;

  return {
    kills: totalKills,
    deaths: totalDeaths,
    assists: totalAssists,
    kda: Math.round(kda * 100) / 100,
    avg_kills: Math.round(avgKills * 10) / 10,
    avg_deaths: Math.round(avgDeaths * 10) / 10,
    avg_assists: Math.round(avgAssists * 10) / 10,
    win_rate: `${Math.round(winRate)}%`,
    avg_duration_min: Math.round(avgDuration / 60),
    games_played: gamesPlayed,
  };
}

// Dota 2 rank tier mapping
export const DOTA2_RANKS: Record<number, string> = {
  0: "Unranked",
  10: "Herald 1",
  11: "Herald 2",
  12: "Herald 3",
  13: "Herald 4",
  14: "Herald 5",
  20: "Guardian 1",
  21: "Guardian 2",
  22: "Guardian 3",
  23: "Guardian 4",
  24: "Guardian 5",
  30: "Crusader 1",
  31: "Crusader 2",
  32: "Crusader 3",
  33: "Crusader 4",
  34: "Crusader 5",
  40: "Archon 1",
  41: "Archon 2",
  42: "Archon 3",
  43: "Archon 4",
  44: "Archon 5",
  50: "Legend 1",
  51: "Legend 2",
  52: "Legend 3",
  53: "Legend 4",
  54: "Legend 5",
  60: "Ancient 1",
  61: "Ancient 2",
  62: "Ancient 3",
  63: "Ancient 4",
  64: "Ancient 5",
  70: "Divine 1",
  71: "Divine 2",
  72: "Divine 3",
  73: "Divine 4",
  74: "Divine 5",
  80: "Immortal",
};

// CS2 Premier rank mapping (new ranking system)
export const CS2_PREMIER_COLORS: Record<string, { min: number; max: number; color: string }> = {
  Grey: { min: 0, max: 4999, color: "#808080" },
  "Light Blue": { min: 5000, max: 9999, color: "#00BFFF" },
  Blue: { min: 10000, max: 14999, color: "#0066FF" },
  Purple: { min: 15000, max: 19999, color: "#9933FF" },
  Pink: { min: 20000, max: 24999, color: "#FF66B2" },
  Red: { min: 25000, max: 29999, color: "#FF3333" },
  Orange: { min: 30000, max: 34999, color: "#FF9900" },
  Yellow: { min: 35000, max: 39999, color: "#FFFF00" },
};

export function getCS2PremierRank(rating: number): { name: string; color: string } {
  for (const [name, { min, max, color }] of Object.entries(CS2_PREMIER_COLORS)) {
    if (rating >= min && rating <= max) {
      return { name: `${name} (${rating})`, color };
    }
  }
  return { name: `Elite (${rating})`, color: "#FFD700" };
}
