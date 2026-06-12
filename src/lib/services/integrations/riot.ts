// Riot Games API Integration
// Supports Valorant and League of Legends via RSO (Riot Sign On)

const RIOT_AUTH_URL = "https://auth.riotgames.com";
const RIOT_API_BASE = "https://americas.api.riotgames.com";

// Regional API endpoints
const RIOT_REGIONS = {
  americas: "https://americas.api.riotgames.com",
  asia: "https://asia.api.riotgames.com",
  europe: "https://europe.api.riotgames.com",
  esports: "https://esports.api.riotgames.com",
} as const;

// Platform routing for game-specific APIs
const VALORANT_REGIONS = {
  na: "https://na.api.riotgames.com",
  eu: "https://eu.api.riotgames.com",
  ap: "https://ap.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  br: "https://br.api.riotgames.com",
  latam: "https://latam.api.riotgames.com",
} as const;

const LOL_PLATFORMS = {
  na1: "https://na1.api.riotgames.com",
  euw1: "https://euw1.api.riotgames.com",
  eun1: "https://eun1.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
  jp1: "https://jp1.api.riotgames.com",
  la1: "https://la1.api.riotgames.com",
  la2: "https://la2.api.riotgames.com",
  oc1: "https://oc1.api.riotgames.com",
  tr1: "https://tr1.api.riotgames.com",
  ru: "https://ru.api.riotgames.com",
  ph2: "https://ph2.api.riotgames.com",
  sg2: "https://sg2.api.riotgames.com",
  th2: "https://th2.api.riotgames.com",
  tw2: "https://tw2.api.riotgames.com",
  vn2: "https://vn2.api.riotgames.com",
} as const;

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface ValorantPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
}

export interface ValorantRank {
  currenttier: number;
  currenttierpatched: string;
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo: number;
  games_needed_for_rating: number;
}

export interface ValorantMatch {
  matchId: string;
  map: string;
  gameMode: string;
  gameStartMillis: number;
  gameLengthMillis: number;
  isRanked: boolean;
  players: ValorantMatchPlayer[];
  teams: ValorantTeam[];
}

export interface ValorantMatchPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  characterId: string;
  stats: {
    score: number;
    roundsPlayed: number;
    kills: number;
    deaths: number;
    assists: number;
    playtimeMillis: number;
    abilityCasts: Record<string, number>;
  };
  competitiveTier: number;
}

export interface ValorantTeam {
  teamId: string;
  won: boolean;
  roundsPlayed: number;
  roundsWon: number;
}

export interface LolSummoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface LolRankedStats {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface LolMatch {
  matchId: string;
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    gameType: string;
    mapId: number;
    participants: LolMatchParticipant[];
    teams: LolTeam[];
  };
}

export interface LolMatchParticipant {
  puuid: string;
  summonerName: string;
  championId: number;
  championName: string;
  teamId: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
}

export interface LolTeam {
  teamId: number;
  win: boolean;
}

// Generate RSO OAuth URL
export function getRiotAuthUrl(state: string): string {
  const clientId = process.env.RIOT_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/riot/callback`;

  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    client_id: clientId,
    response_type: "code",
    scope: "openid offline_access",
    state,
  });

  return `${RIOT_AUTH_URL}/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeRiotCode(code: string): Promise<RiotTokens> {
  const clientId = process.env.RIOT_CLIENT_ID!;
  const clientSecret = process.env.RIOT_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/riot/callback`;

  const response = await fetch(`${RIOT_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Riot code: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshRiotToken(refreshToken: string): Promise<RiotTokens> {
  const clientId = process.env.RIOT_CLIENT_ID!;
  const clientSecret = process.env.RIOT_CLIENT_SECRET!;

  const response = await fetch(`${RIOT_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Riot token");
  }

  return response.json();
}

// Get Riot account info
export async function getRiotAccount(accessToken: string): Promise<RiotAccount> {
  const response = await fetch(`${RIOT_API_BASE}/riot/account/v1/accounts/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Riot account");
  }

  return response.json();
}

// Get Riot account by PUUID (server-side with API key)
export async function getRiotAccountByPuuid(puuid: string): Promise<RiotAccount> {
  const apiKey = process.env.RIOT_API_KEY!;

  const response = await fetch(
    `${RIOT_API_BASE}/riot/account/v1/accounts/by-puuid/${puuid}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get Riot account by PUUID");
  }

  return response.json();
}

// Valorant API calls (using API key for server-side)
export async function getValorantRank(
  puuid: string,
  region: keyof typeof VALORANT_REGIONS = "na"
): Promise<ValorantRank | null> {
  const apiKey = process.env.RIOT_API_KEY!;
  const baseUrl = VALORANT_REGIONS[region];

  const response = await fetch(
    `${baseUrl}/val/ranked/v1/by-puuid/${puuid}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (response.status === 404) {
    return null; // Player hasn't played ranked
  }

  if (!response.ok) {
    throw new Error("Failed to get Valorant rank");
  }

  return response.json();
}

export async function getValorantMatchHistory(
  puuid: string,
  region: keyof typeof VALORANT_REGIONS = "na",
  count: number = 10
): Promise<{ history: { matchId: string; gameStartTimeMillis: number }[] }> {
  const apiKey = process.env.RIOT_API_KEY!;
  const baseUrl = VALORANT_REGIONS[region];

  const response = await fetch(
    `${baseUrl}/val/match/v1/matchlists/by-puuid/${puuid}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get Valorant match history");
  }

  const data = await response.json();
  return { history: data.history?.slice(0, count) || [] };
}

export async function getValorantMatch(
  matchId: string,
  region: keyof typeof VALORANT_REGIONS = "na"
): Promise<ValorantMatch> {
  const apiKey = process.env.RIOT_API_KEY!;
  const baseUrl = VALORANT_REGIONS[region];

  const response = await fetch(
    `${baseUrl}/val/match/v1/matches/${matchId}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get Valorant match");
  }

  return response.json();
}

// League of Legends API calls
export async function getLolSummonerByPuuid(
  puuid: string,
  platform: keyof typeof LOL_PLATFORMS = "na1"
): Promise<LolSummoner> {
  const apiKey = process.env.RIOT_API_KEY!;
  const baseUrl = LOL_PLATFORMS[platform];

  const response = await fetch(
    `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get LoL summoner");
  }

  return response.json();
}

export async function getLolRankedStats(
  summonerId: string,
  platform: keyof typeof LOL_PLATFORMS = "na1"
): Promise<LolRankedStats[]> {
  const apiKey = process.env.RIOT_API_KEY!;
  const baseUrl = LOL_PLATFORMS[platform];

  const response = await fetch(
    `${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get LoL ranked stats");
  }

  return response.json();
}

export async function getLolMatchHistory(
  puuid: string,
  region: keyof typeof RIOT_REGIONS = "americas",
  count: number = 10
): Promise<string[]> {
  const apiKey = process.env.RIOT_API_KEY!;
  const baseUrl = RIOT_REGIONS[region];

  const response = await fetch(
    `${baseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get LoL match history");
  }

  return response.json();
}

export async function getLolMatch(
  matchId: string,
  region: keyof typeof RIOT_REGIONS = "americas"
): Promise<LolMatch> {
  const apiKey = process.env.RIOT_API_KEY!;
  const baseUrl = RIOT_REGIONS[region];

  const response = await fetch(
    `${baseUrl}/lol/match/v5/matches/${matchId}`,
    {
      headers: {
        "X-Riot-Token": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get LoL match");
  }

  return response.json();
}

// Helper to calculate stats from match history
export function calculateValorantStats(
  matches: ValorantMatch[],
  puuid: string
): Record<string, number | string> {
  if (matches.length === 0) {
    return {};
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalScore = 0;
  let totalRounds = 0;
  let wins = 0;
  let headshots = 0;
  let bodyshots = 0;
  let legshots = 0;

  for (const match of matches) {
    const player = match.players.find((p) => p.puuid === puuid);
    if (!player) continue;

    const team = match.teams.find((t) => t.teamId === player.teamId);

    totalKills += player.stats.kills;
    totalDeaths += player.stats.deaths;
    totalAssists += player.stats.assists;
    totalScore += player.stats.score;
    totalRounds += player.stats.roundsPlayed;

    if (team?.won) wins++;
  }

  const gamesPlayed = matches.length;
  const kd = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
  const adr = totalRounds > 0 ? totalScore / totalRounds : 0;
  const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
  const totalShots = headshots + bodyshots + legshots;
  const hsPercent = totalShots > 0 ? (headshots / totalShots) * 100 : 0;

  return {
    kills: totalKills,
    deaths: totalDeaths,
    assists: totalAssists,
    kd: Math.round(kd * 100) / 100,
    adr: Math.round(adr),
    win_rate: `${Math.round(winRate)}%`,
    headshot_pct: `${Math.round(hsPercent)}%`,
    games_played: gamesPlayed,
  };
}

export function calculateLolStats(
  matches: LolMatch[],
  puuid: string
): Record<string, number | string> {
  if (matches.length === 0) {
    return {};
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalCs = 0;
  let totalVision = 0;
  let totalDuration = 0;
  let wins = 0;

  for (const match of matches) {
    const participant = match.info.participants.find((p) => p.puuid === puuid);
    if (!participant) continue;

    totalKills += participant.kills;
    totalDeaths += participant.deaths;
    totalAssists += participant.assists;
    totalCs += participant.totalMinionsKilled + participant.neutralMinionsKilled;
    totalVision += participant.visionScore;
    totalDuration += match.info.gameDuration;

    if (participant.win) wins++;
  }

  const gamesPlayed = matches.length;
  const kda = totalDeaths > 0
    ? (totalKills + totalAssists) / totalDeaths
    : totalKills + totalAssists;
  const csPerMin = totalDuration > 0 ? (totalCs / (totalDuration / 60)) : 0;
  const avgVision = gamesPlayed > 0 ? totalVision / gamesPlayed : 0;
  const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

  return {
    kills: totalKills,
    deaths: totalDeaths,
    assists: totalAssists,
    kda: Math.round(kda * 100) / 100,
    cs_per_min: Math.round(csPerMin * 10) / 10,
    vision_score: Math.round(avgVision),
    win_rate: `${Math.round(winRate)}%`,
    games_played: gamesPlayed,
  };
}

// Valorant rank tier mapping
export const VALORANT_RANKS: Record<number, string> = {
  0: "Unranked",
  3: "Iron 1",
  4: "Iron 2",
  5: "Iron 3",
  6: "Bronze 1",
  7: "Bronze 2",
  8: "Bronze 3",
  9: "Silver 1",
  10: "Silver 2",
  11: "Silver 3",
  12: "Gold 1",
  13: "Gold 2",
  14: "Gold 3",
  15: "Platinum 1",
  16: "Platinum 2",
  17: "Platinum 3",
  18: "Diamond 1",
  19: "Diamond 2",
  20: "Diamond 3",
  21: "Ascendant 1",
  22: "Ascendant 2",
  23: "Ascendant 3",
  24: "Immortal 1",
  25: "Immortal 2",
  26: "Immortal 3",
  27: "Radiant",
};
