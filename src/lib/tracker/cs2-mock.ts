/**
 * CS2 mock data — same deterministic seeding pattern as Valorant.
 * Replace with Steam Web API integration when STEAM_API_KEY is configured.
 */
import type { RawCs2Stats } from "./cs2-types";
import type { WeaponStat } from "./types";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

const CS2_WEAPONS = [
  { id: "ak47",   name: "AK-47" },
  { id: "m4a4",   name: "M4A4" },
  { id: "m4a1s",  name: "M4A1-S" },
  { id: "awp",    name: "AWP" },
  { id: "deagle", name: "Desert Eagle" },
  { id: "usps",   name: "USP-S" },
  { id: "glock",  name: "Glock-18" },
  { id: "famas",  name: "FAMAS" },
  { id: "galilar",name: "Galil AR" },
  { id: "mp9",    name: "MP9" },
];

const CS2_MAPS = ["Mirage", "Inferno", "Dust 2", "Nuke", "Ancient", "Anubis", "Vertigo", "Overpass"];

export function getMockCs2Stats(steamId: string): RawCs2Stats {
  const rng = makeRng(hash(steamId));

  const totalMatchesPlayed = Math.round(range(rng(), 80, 1200));
  const winRatePct = range(rng(), 0.42, 0.62);
  const totalMatchesWon = Math.round(totalMatchesPlayed * winRatePct);
  const totalRoundsPlayed = totalMatchesPlayed * 22;
  const totalKills = Math.round(range(rng(), 1500, 28000));
  const kdRatio = range(rng(), 0.85, 1.4);
  const totalDeaths = Math.max(1, Math.round(totalKills / kdRatio));
  const hsPct = range(rng(), 28, 58);
  const totalKillsHeadshot = Math.round(totalKills * (hsPct / 100));
  const accuracy = range(rng(), 13, 28);
  const totalShotsFired = Math.round(totalKills * range(rng(), 18, 40));
  const totalShotsHit = Math.round(totalShotsFired * (accuracy / 100));
  const totalMvps = Math.round(totalMatchesPlayed * range(rng(), 1.0, 3.5));
  const totalPlantedBombs = Math.round(totalMatchesPlayed * range(rng(), 0.05, 0.55));
  const totalDefusedBombs = Math.round(totalMatchesPlayed * range(rng(), 0.02, 0.18));
  const hoursPlayed = Math.round(totalMatchesPlayed * range(rng(), 0.55, 1.1));

  // Top weapons
  const usedW = new Set<string>();
  const topWeapons: WeaponStat[] = [];
  while (topWeapons.length < 3) {
    const w = pick(rng(), CS2_WEAPONS);
    if (usedW.has(w.id)) continue;
    usedW.add(w.id);
    topWeapons.push({
      weaponId: w.id,
      weaponName: w.name,
      kills: Math.round(range(rng(), 200, 6000)),
      headshotPct: Math.round(range(rng(), 28, 60) * 10) / 10,
      accuracy: Math.round(range(rng(), 15, 38) * 10) / 10,
      matches: Math.round(range(rng(), 30, 600)),
    });
  }
  topWeapons.sort((a, b) => b.kills - a.kills);

  // Top maps
  const usedM = new Set<string>();
  const topMaps: RawCs2Stats["topMaps"] = [];
  while (topMaps.length < 3) {
    const m = pick(rng(), CS2_MAPS);
    if (usedM.has(m)) continue;
    usedM.add(m);
    topMaps.push({
      map: m,
      winRate: Math.round(range(rng(), 35, 70)),
      matches: Math.round(range(rng(), 10, 80)),
    });
  }

  return {
    steamId,
    displayName: `Player_${steamId.slice(-6)}`,
    avatarUrl: null,
    hoursPlayed,
    totalKills,
    totalDeaths,
    totalKillsHeadshot,
    totalShotsFired,
    totalShotsHit,
    totalMatchesWon,
    totalMatchesPlayed,
    totalRoundsPlayed,
    totalMvps,
    totalPlantedBombs,
    totalDefusedBombs,
    topWeapons,
    topMaps,
  };
}

export function simulateCs2Miss(steamId: string): null | "NOT_FOUND" | "PRIVATE_PROFILE" {
  const lower = steamId.toLowerCase();
  if (lower.includes("notfound") || lower.includes("missing")) return "NOT_FOUND";
  if (lower.includes("private")) return "PRIVATE_PROFILE";
  if (steamId.length < 5) return "NOT_FOUND";
  return null;
}
