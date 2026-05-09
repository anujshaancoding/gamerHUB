/**
 * CS2 stat fetcher.
 *
 * If STEAM_API_KEY is set, hits Steam Web API:
 *   - ResolveVanityURL (if input is a vanity name, not 17-digit SteamID64)
 *   - GetPlayerSummaries (display name, avatar)
 *   - GetUserStatsForGame appid 730 (lifetime totals + per-weapon kills)
 *
 * Without a key, returns deterministic mocks so the UI works.
 *
 * Env vars (server-side):
 *   STEAM_API_KEY=...
 */
import type { RawCs2Stats } from "./cs2-types";
import type { LookupErrorCode, WeaponStat } from "./types";
import { getMockCs2Stats, simulateCs2Miss } from "./cs2-mock";

export type Cs2FetchResult =
  | { kind: "ok"; stats: RawCs2Stats; fromMock: boolean }
  | { kind: "error"; code: LookupErrorCode; message: string };

const STEAM_BASE = "https://api.steampowered.com";

export function isSteamLiveEnabled(): boolean {
  return !!process.env.STEAM_API_KEY;
}

/** Accept either a 17-digit SteamID64 or a vanity URL fragment. */
export function isValidSteamInput(input: string): boolean {
  const trimmed = input.trim();
  if (/^\d{17}$/.test(trimmed)) return true;
  // Vanity: 3-32 chars, letters/digits/_/-
  return /^[A-Za-z0-9_-]{3,32}$/.test(trimmed);
}

async function resolveSteamId(input: string, key: string): Promise<string | null> {
  if (/^\d{17}$/.test(input)) return input;
  const url = `${STEAM_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(input)}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const j = (await res.json().catch(() => null)) as { response?: { steamid?: string; success?: number } } | null;
  return j?.response?.success === 1 && j.response.steamid ? j.response.steamid : null;
}

interface SteamSummary {
  steamid: string;
  personaname: string;
  avatarfull: string;
  communityvisibilitystate: number; // 3 = public
}

async function getSummary(steamId: string, key: string): Promise<SteamSummary | null> {
  const url = `${STEAM_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const j = (await res.json().catch(() => null)) as { response?: { players?: SteamSummary[] } } | null;
  return j?.response?.players?.[0] ?? null;
}

async function getOwnedHours(steamId: string, key: string): Promise<number> {
  const url = `${STEAM_BASE}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=0&appids_filter[0]=730`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return 0;
  const j = (await res.json().catch(() => null)) as { response?: { games?: Array<{ appid: number; playtime_forever: number }> } } | null;
  const cs = j?.response?.games?.find((g) => g.appid === 730);
  return cs ? Math.round(cs.playtime_forever / 60) : 0;
}

interface SteamStatRow { name: string; value: number }

async function getCs2Stats(steamId: string, key: string): Promise<SteamStatRow[] | null> {
  const url = `${STEAM_BASE}/ISteamUserStats/GetUserStatsForGame/v2/?key=${key}&steamid=${steamId}&appid=730`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (res.status === 400 || res.status === 403) return null;
  if (!res.ok) return null;
  const j = (await res.json().catch(() => null)) as { playerstats?: { stats?: SteamStatRow[] } } | null;
  return j?.playerstats?.stats ?? null;
}

const WEAPON_ID_MAP: Record<string, string> = {
  ak47: "AK-47",
  m4a1: "M4A4",
  awp: "AWP",
  deagle: "Desert Eagle",
  usps: "USP-S",
  glock: "Glock-18",
  famas: "FAMAS",
  galilar: "Galil AR",
  mp9: "MP9",
  p90: "P90",
  knife: "Knife",
  bizon: "PP-Bizon",
  hkp2000: "P2000",
  p250: "P250",
  fiveseven: "Five-SeveN",
  nova: "Nova",
  xm1014: "XM1014",
  sg556: "SG 553",
  aug: "AUG",
};

const MAP_ID_MAP: Record<string, string> = {
  cs_office: "Office",
  de_dust2: "Dust 2",
  de_inferno: "Inferno",
  de_mirage: "Mirage",
  de_nuke: "Nuke",
  de_ancient: "Ancient",
  de_anubis: "Anubis",
  de_vertigo: "Vertigo",
  de_overpass: "Overpass",
  de_train: "Train",
  cs_italy: "Italy",
};

function statValue(rows: SteamStatRow[], name: string): number {
  return rows.find((r) => r.name === name)?.value ?? 0;
}

function buildTopWeapons(rows: SteamStatRow[]): WeaponStat[] {
  const out: WeaponStat[] = [];
  for (const [id, label] of Object.entries(WEAPON_ID_MAP)) {
    const kills = statValue(rows, `total_kills_${id}`);
    const shots = statValue(rows, `total_shots_${id}`);
    const hits = statValue(rows, `total_hits_${id}`);
    if (kills <= 0) continue;
    out.push({
      weaponId: id,
      weaponName: label,
      kills,
      headshotPct: 0,    // Steam doesn't expose per-weapon headshot
      accuracy: shots > 0 ? Math.round((hits / shots) * 1000) / 10 : 0,
      matches: 0,
    });
  }
  return out.sort((a, b) => b.kills - a.kills).slice(0, 3);
}

function buildTopMaps(rows: SteamStatRow[]): Array<{ map: string; winRate: number; matches: number }> {
  const out: Array<{ map: string; winRate: number; matches: number }> = [];
  for (const [id, label] of Object.entries(MAP_ID_MAP)) {
    const wins = statValue(rows, `total_wins_map_${id}`);
    const rounds = statValue(rows, `total_rounds_map_${id}`);
    if (rounds <= 0) continue;
    const matches = Math.round(rounds / 22) || 1;
    const matchWins = Math.round(matches * (wins / Math.max(rounds, 1)));
    out.push({
      map: label,
      winRate: rounds > 0 ? Math.round((wins / rounds) * 100) : 0,
      matches,
    });
    void matchWins;
  }
  return out.sort((a, b) => b.matches - a.matches).slice(0, 3);
}

async function fetchLive(input: string): Promise<Cs2FetchResult> {
  const key = process.env.STEAM_API_KEY!;
  const steamId = await resolveSteamId(input, key);
  if (!steamId) {
    return { kind: "error", code: "NOT_FOUND", message: `Couldn't find a Steam profile matching "${input}".` };
  }
  const summary = await getSummary(steamId, key);
  if (!summary) {
    return { kind: "error", code: "NOT_FOUND", message: "Steam profile not found." };
  }
  if (summary.communityvisibilitystate !== 3) {
    return { kind: "error", code: "PRIVATE_PROFILE", message: "This Steam profile is private. Set Game Details to Public in Steam privacy settings." };
  }
  const [hours, rows] = await Promise.all([
    getOwnedHours(steamId, key),
    getCs2Stats(steamId, key),
  ]);
  if (!rows) {
    return { kind: "error", code: "PRIVATE_PROFILE", message: "Game details are private — open them in Steam privacy settings." };
  }

  const stats: RawCs2Stats = {
    steamId,
    displayName: summary.personaname,
    avatarUrl: summary.avatarfull,
    hoursPlayed: hours,
    totalKills: statValue(rows, "total_kills"),
    totalDeaths: statValue(rows, "total_deaths"),
    totalKillsHeadshot: statValue(rows, "total_kills_headshot"),
    totalShotsFired: statValue(rows, "total_shots_fired"),
    totalShotsHit: statValue(rows, "total_shots_hit"),
    totalMatchesWon: statValue(rows, "total_matches_won"),
    totalMatchesPlayed: statValue(rows, "total_matches_played"),
    totalRoundsPlayed: statValue(rows, "total_rounds_played"),
    totalMvps: statValue(rows, "total_mvps"),
    totalPlantedBombs: statValue(rows, "total_planted_bombs"),
    totalDefusedBombs: statValue(rows, "total_defused_bombs"),
    topWeapons: buildTopWeapons(rows),
    topMaps: buildTopMaps(rows),
  };

  if (stats.totalMatchesPlayed === 0) {
    return { kind: "error", code: "NOT_FOUND", message: "This player has no recorded CS2 matches yet." };
  }

  return { kind: "ok", stats, fromMock: false };
}

export async function fetchCs2Stats(input: string): Promise<Cs2FetchResult> {
  if (isSteamLiveEnabled()) {
    try {
      const r = await fetchLive(input);
      if (r.kind === "ok") return r;
      if (r.code === "NOT_FOUND" || r.code === "PRIVATE_PROFILE") return r;
    } catch {
      // fall through
    }
  }
  const miss = simulateCs2Miss(input);
  if (miss === "NOT_FOUND") {
    return { kind: "error", code: "NOT_FOUND", message: `Couldn't find a Steam profile matching "${input}".` };
  }
  if (miss === "PRIVATE_PROFILE") {
    return { kind: "error", code: "PRIVATE_PROFILE", message: `This Steam profile is private.` };
  }
  return { kind: "ok", stats: getMockCs2Stats(input), fromMock: true };
}
