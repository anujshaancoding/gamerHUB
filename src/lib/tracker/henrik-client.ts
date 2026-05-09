/**
 * Henrik-3 Valorant API client.
 *
 * Docs: https://docs.henrikdev.xyz/valorant/general/introduction
 *
 * Server-side ONLY — uses the HENRIK_API_KEY from env, never exposed to client.
 * All errors map to our LookupErrorCode for consistent UI handling.
 */
import type { LookupErrorCode } from "./types";

const BASE = "https://api.henrikdev.xyz";

export interface HenrikError {
  code: LookupErrorCode;
  message: string;
  status: number;
}

export type HenrikResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: HenrikError };

/** Common headers; key always lives server-side. */
function authHeaders(): HeadersInit {
  const key = process.env.HENRIK_API_KEY;
  return key ? { Authorization: key } : {};
}

async function request<T>(path: string): Promise<HenrikResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: authHeaders(),
      // Cache successful responses briefly to spare the rate limit during multi-call lookups.
      next: { revalidate: 30 },
    });
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_ERROR",
        message: err instanceof Error ? err.message : "Network error reaching Valorant API.",
        status: 0,
      },
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Player not found. Double-check the spelling and #TAG.",
        status: 404,
      },
    };
  }
  if (res.status === 403) {
    return {
      ok: false,
      error: {
        code: "PRIVATE_PROFILE",
        message: "This profile is private or restricted by Riot.",
        status: 403,
      },
    };
  }
  if (res.status === 429) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Slow down — we're hitting the rate limit. Try again in a minute.",
        status: 429,
      },
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_ERROR",
        message: `Valorant API returned ${res.status}.`,
        status: res.status,
      },
    };
  }

  const json = (await res.json().catch(() => null)) as { data?: T } | null;
  if (!json || json.data === undefined) {
    return {
      ok: false,
      error: { code: "UPSTREAM_ERROR", message: "Empty response from Valorant API.", status: 502 },
    };
  }
  return { ok: true, data: json.data };
}

// ── Account ────────────────────────────────────────────────────────────────

export interface HenrikAccount {
  puuid: string;
  region: string;            // "na" | "eu" | "ap" | "kr" | "latam" | "br"
  account_level: number;
  name: string;
  tag: string;
  card?: { small?: string; large?: string; wide?: string };
}

export function getAccount(name: string, tag: string): Promise<HenrikResult<HenrikAccount>> {
  return request<HenrikAccount>(
    `/valorant/v2/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
  );
}

// ── MMR ────────────────────────────────────────────────────────────────────

export interface HenrikMmr {
  current_data: {
    currenttier: number;
    currenttierpatched: string;     // e.g. "Diamond 2"
    ranking_in_tier: number;
    elo: number;
  };
  highest_rank: { patched_tier: string };
}

export function getMmr(
  region: string,
  name: string,
  tag: string
): Promise<HenrikResult<HenrikMmr>> {
  return request<HenrikMmr>(
    `/valorant/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
  );
}

// ── Matches ────────────────────────────────────────────────────────────────

export interface HenrikPlayerStats {
  puuid: string;
  name: string;
  tag: string;
  team: "Red" | "Blue";
  character: string;            // agent name
  stats: {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    bodyshots: number;
    headshots: number;
    legshots: number;
  };
  damage_made: number;
  damage_received: number;
}

export interface HenrikMatch {
  metadata: {
    map: string;
    matchid: string;
    mode: string;                 // "Competitive" etc.
    rounds_played: number;
    game_length: number;
    game_start_patched: string;
  };
  players: { all_players: HenrikPlayerStats[] };
  teams: {
    red: { has_won: boolean; rounds_won: number; rounds_lost: number };
    blue: { has_won: boolean; rounds_won: number; rounds_lost: number };
  };
  rounds?: Array<{
    winning_team: "Red" | "Blue";
    player_stats?: Array<{
      player_puuid: string;
      damage_events?: Array<{
        weapon?: { id?: string; name?: string };
        damage: number;
      }>;
      kill_events?: Array<{
        killer_puuid: string;
        weapon?: { id?: string; name?: string };
      }>;
    }>;
  }>;
}

export function getMatches(
  region: string,
  name: string,
  tag: string,
  size = 20,
  mode: "competitive" | "unrated" | "" = "competitive"
): Promise<HenrikResult<HenrikMatch[]>> {
  const qs = new URLSearchParams({ size: String(size) });
  if (mode) qs.set("mode", mode);
  return request<HenrikMatch[]>(
    `/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?${qs.toString()}`
  );
}
