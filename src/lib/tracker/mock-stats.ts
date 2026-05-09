/**
 * Deterministic mock stats keyed off the Riot ID string. Used while the
 * Riot API integration isn't wired so the UI is fully functional.
 *
 * Replace the entire file with a real fetcher when API access is approved.
 */
import type { RawValorantStats, WeaponStat } from "./types";
import { AGENTS, WEAPONS } from "./valorant-assets";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — produces a stateful, well-distributed sequence from one seed. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: number, arr: T[]): T {
  return arr[Math.floor(rnd * arr.length) % arr.length];
}

function range(rnd: number, min: number, max: number): number {
  return min + rnd * (max - min);
}

/**
 * Used to exercise the not-found UI in mock mode.
 *  - Tag "0000" or name containing "notfound"/"missing" → not-found
 *  - Tag "PRIV" → private profile
 * In live mode, real Riot 404s/403s replace this.
 */
export function simulateMockMiss(riotId: string): null | "NOT_FOUND" | "PRIVATE_PROFILE" {
  const lower = riotId.toLowerCase();
  const [name, tag] = riotId.split("#");
  if (tag?.toUpperCase() === "PRIV") return "PRIVATE_PROFILE";
  if (tag === "0000") return "NOT_FOUND";
  if (lower.includes("notfound") || lower.includes("missing")) return "NOT_FOUND";
  if (name && name.length < 3) return "NOT_FOUND";
  return null;
}

export function getMockValorantStats(riotId: string): RawValorantStats {
  const seed = hash(riotId.toLowerCase());
  const rng = makeRng(seed);
  const ranks = [
    "Iron 2", "Bronze 1", "Bronze 3", "Silver 2", "Gold 1",
    "Gold 3", "Platinum 1", "Platinum 3", "Diamond 1", "Diamond 3",
    "Ascendant 1", "Immortal 2",
  ];
  const allMaps = ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus", "Sunset"];
  const roles: Array<"duelist" | "controller" | "sentinel" | "initiator"> = [
    "duelist",
    "controller",
    "sentinel",
    "initiator",
  ];

  const usedMaps = new Set<string>();
  const topMaps: RawValorantStats["topMaps"] = [];
  while (topMaps.length < 3) {
    const m = pick(rng(), allMaps);
    if (usedMaps.has(m)) continue;
    usedMaps.add(m);
    topMaps.push({
      map: m,
      winRate: Math.round(range(rng(), 30, 70)),
      matches: Math.round(range(rng(), 8, 40)),
    });
  }

  // Pick a main agent
  const agentIds = Object.keys(AGENTS);
  const mainAgentId = pick(rng(), agentIds);
  const mainAgentName = AGENTS[mainAgentId].name;

  // Pick 3 unique favorite weapons (rifles + sidearms biased to common picks)
  const weaponPool = [
    "vandal", "phantom", "operator", "sheriff", "spectre",
    "marshal", "guardian", "ghost", "classic", "judge", "bulldog",
  ];
  const usedWeapons = new Set<string>();
  const favoriteWeapons: WeaponStat[] = [];
  while (favoriteWeapons.length < 3) {
    const w = pick(rng(), weaponPool);
    if (usedWeapons.has(w)) continue;
    usedWeapons.add(w);
    favoriteWeapons.push({
      weaponId: w,
      weaponName: WEAPONS[w]?.name ?? w,
      kills: Math.round(range(rng(), 200, 4500)),
      headshotPct: Math.round(range(rng(), 14, 38) * 10) / 10,
      accuracy: Math.round(range(rng(), 18, 36) * 10) / 10,
      matches: Math.round(range(rng(), 20, 350)),
    });
  }
  favoriteWeapons.sort((a, b) => b.kills - a.kills);

  return {
    riotId,
    rank: pick(rng(), ranks),
    level: Math.round(range(rng(), 25, 320)),
    matchesPlayed: Math.round(range(rng(), 60, 600)),
    winRate: Math.round(range(rng(), 38, 62)),
    mainAgentId,
    mainAgentName,
    favoriteWeapons,
    headshotPct: Math.round(range(rng(), 12, 32) * 10) / 10,
    adr: Math.round(range(rng(), 95, 175)),
    firstBloodPct: Math.round(range(rng(), 7, 24) * 10) / 10,
    kast: Math.round(range(rng(), 50, 78)),
    clutchPct: Math.round(range(rng(), 5, 35) * 10) / 10,
    multiKillsPerMatch: Math.round(range(rng(), 0.5, 4.5) * 10) / 10,
    tradeKillPct: Math.round(range(rng(), 10, 28) * 10) / 10,
    ecoImpact: Math.round(range(rng(), 25, 80)),
    agentPickedRole: pick(rng(), roles),
    rolePerformancePct: Math.round(range(rng(), 30, 80)),
    topMaps,
    flashAssistsPerMatch: Math.round(range(rng(), 0.5, 6) * 10) / 10,
    utilDamagePerMatch: Math.round(range(rng(), 50, 350)),
  };
}
