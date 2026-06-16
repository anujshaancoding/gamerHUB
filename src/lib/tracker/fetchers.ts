/**
 * Stat fetchers. Hits Henrik-3 when TRACKER_USE_LIVE=true and HENRIK_API_KEY is set,
 * otherwise serves deterministic mocks so the UI stays alive.
 *
 * Env vars (all server-side):
 *   TRACKER_USE_LIVE=true     enables live API calls
 *   HENRIK_API_KEY=HDEV-...   Henrik-3 API key (preferred over Riot direct)
 *   RIOT_API_KEY=...          (reserved for future direct Riot integration)
 */
import type { RawValorantStats, LookupErrorCode } from "./types";
import { getMockValorantStats, simulateMockMiss } from "./mock-stats";
import { getAccount, getMmr, getMatches } from "./henrik-client";
import { aggregate } from "./henrik-aggregate";

export type FetchResult =
  | { kind: "ok"; stats: RawValorantStats; fromMock: boolean }
  | { kind: "error"; code: LookupErrorCode; message: string };

// ⚠️ RIOT POLICY (audit finding H9): looking up an ARBITRARY player's match
// history / MMR by Riot ID — as the live path does — is only permitted for the
// authenticated user's OWN account, gated behind Riot Sign-On (RSO). Until the
// tracker is RSO-gated to the caller's own PUUID, live mode must stay OFF in
// production. Default is mocks; enabling live without RSO is a ToS violation.
// See memory: riot-api-policy-constraints.
export function isLiveTrackerEnabled(): boolean {
  if (process.env.TRACKER_USE_LIVE !== "true" || !process.env.HENRIK_API_KEY) {
    return false;
  }
  // Hard gate: require an explicit acknowledgement flag so live can't be turned
  // on by setting TRACKER_USE_LIVE alone before RSO gating is implemented.
  if (process.env.TRACKER_RSO_COMPLIANT !== "true") {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[tracker] TRACKER_USE_LIVE=true but TRACKER_RSO_COMPLIANT is not set — " +
          "refusing live lookups of arbitrary Riot IDs (Riot ToS). Serving mocks.",
      );
    }
    return false;
  }
  return true;
}

function parseRiotId(riotId: string): { name: string; tag: string } | null {
  const idx = riotId.lastIndexOf("#");
  if (idx <= 0 || idx === riotId.length - 1) return null;
  return { name: riotId.slice(0, idx).trim(), tag: riotId.slice(idx + 1).trim() };
}

async function fetchLive(riotId: string, actFilter?: string): Promise<FetchResult> {
  const parsed = parseRiotId(riotId);
  if (!parsed) {
    return { kind: "error", code: "INVALID_FORMAT", message: "Invalid Riot ID format." };
  }

  const account = await getAccount(parsed.name, parsed.tag);
  if (!account.ok) {
    return { kind: "error", code: account.error.code, message: account.error.message };
  }

  // MMR + matches in parallel (rate-limit friendly enough at 30 rpm)
  const [mmrRes, matchesRes] = await Promise.all([
    getMmr(account.data.region, parsed.name, parsed.tag),
    getMatches(account.data.region, parsed.name, parsed.tag, 20, "competitive"),
  ]);

  if (!matchesRes.ok) {
    return { kind: "error", code: matchesRes.error.code, message: matchesRes.error.message };
  }

  const stats = aggregate({
    riotId,
    account: account.data,
    mmr: mmrRes.ok ? mmrRes.data : null,
    matches: matchesRes.data,
    actFilter,
  });

  if (stats.matchesPlayed === 0) {
    return {
      kind: "error",
      code: "NOT_FOUND",
      message:
        "No competitive matches found for this player. They may have a brand-new account or only play unrated.",
    };
  }

  return { kind: "ok", stats, fromMock: false };
}

export async function fetchValorantStats(riotId: string, actFilter?: string): Promise<FetchResult> {
  if (isLiveTrackerEnabled()) {
    try {
      const result = await fetchLive(riotId, actFilter);
      // Hard error codes propagate to the UI as-is; transient errors silently
      // fall back to mock so the experience never breaks.
      if (result.kind === "ok") return result;
      if (
        result.code === "NOT_FOUND" ||
        result.code === "PRIVATE_PROFILE" ||
        result.code === "RATE_LIMITED" ||
        result.code === "INVALID_FORMAT"
      ) {
        return result;
      }
      // UPSTREAM_ERROR → fall through to mock
    } catch {
      // Network blip → fall through to mock
    }
  }

  // No HENRIK_API_KEY / TRACKER_USE_LIVE: in production we surface a real error
  // so users don't see fake stats. In dev we still return mocks so the UI can
  // be developed without a key.
  if (process.env.NODE_ENV === "production") {
    return {
      kind: "error",
      code: "UPSTREAM_ERROR",
      message: "Valorant stat lookup is temporarily unavailable. Please try again later.",
    };
  }

  // Mock path (also hit when live is disabled)
  const miss = simulateMockMiss(riotId);
  if (miss === "NOT_FOUND") {
    return {
      kind: "error",
      code: "NOT_FOUND",
      message: `We couldn't find a Valorant player with the ID "${riotId}". Double-check the spelling and tag.`,
    };
  }
  if (miss === "PRIVATE_PROFILE") {
    return {
      kind: "error",
      code: "PRIVATE_PROFILE",
      message: `${riotId}'s match history is private. Stats can only be analyzed for public profiles.`,
    };
  }
  return { kind: "ok", stats: getMockValorantStats(riotId), fromMock: true };
}

export function isValidRiotId(input: string): boolean {
  return /^[\p{L}\p{N} ]{3,16}#[A-Za-z0-9]{3,5}$/u.test(input.trim());
}
