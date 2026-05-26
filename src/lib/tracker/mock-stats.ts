/**
 * Deterministic mock stats keyed off the Riot ID string. Used while the
 * Riot API integration isn't wired so the UI is fully functional.
 *
 * Replace the entire file with a real fetcher when API access is approved.
 */
import type {
  RawValorantStats,
  WeaponStat,
  PerAgentStat,
  RecentMatch,
  RoleStat,
  ValorantRole,
} from "./types";
import { AGENTS, WEAPONS } from "./valorant-assets";

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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const ROLE_MAP: Record<string, ValorantRole> = {
  jett: "duelist", phoenix: "duelist", reyna: "duelist", raze: "duelist",
  yoru: "duelist", neon: "duelist", iso: "duelist", waylay: "duelist",
  brimstone: "controller", omen: "controller", viper: "controller",
  astra: "controller", harbor: "controller", clove: "controller",
  killjoy: "sentinel", cypher: "sentinel", sage: "sentinel",
  chamber: "sentinel", deadlock: "sentinel", vyse: "sentinel",
  sova: "initiator", breach: "initiator", skye: "initiator",
  kayo: "initiator", fade: "initiator", gekko: "initiator", tejo: "initiator",
};

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
  const regions = ["na", "eu", "ap", "kr", "latam", "br"];
  const acts = ["Episode 9: Act III", "V26: A2", "V26: A3"];

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

  const agentIds = Object.keys(AGENTS);
  const mainAgentId = pick(rng(), agentIds);
  const mainAgentName = AGENTS[mainAgentId].name;

  // Pick 3 unique favorite weapons
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
      headshotPct: round1(range(rng(), 14, 38)),
      accuracy: round1(range(rng(), 18, 36)),
      matches: Math.round(range(rng(), 20, 350)),
    });
  }
  favoriteWeapons.sort((a, b) => b.kills - a.kills);

  // Per-agent table (3-5 agents)
  const numAgents = Math.floor(range(rng(), 3, 6));
  const usedAgents = new Set<string>([mainAgentId]);
  const perAgent: PerAgentStat[] = [];
  for (let i = 0; i < numAgents; i++) {
    const aId = i === 0 ? mainAgentId : pick(rng(), agentIds);
    if (usedAgents.has(aId) && i > 0) continue;
    usedAgents.add(aId);
    const matches = Math.round(range(rng(), 1, 8));
    const wins = Math.round(matches * range(rng(), 0.3, 0.7));
    const bestMap = pick(rng(), allMaps);
    perAgent.push({
      agentId: aId,
      agentName: AGENTS[aId]?.name ?? aId,
      matches,
      wins,
      winRate: matches > 0 ? Math.round((wins / matches) * 100) : 0,
      kd: round1(range(rng(), 0.6, 1.6)),
      adr: Math.round(range(rng(), 110, 180)),
      acs: Math.round(range(rng(), 180, 300)),
      bestMap,
      bestMapWinRate: Math.round(range(rng(), 40, 90)),
    });
  }
  perAgent.sort((a, b) => b.matches - a.matches);

  // Recent matches (last 4-8)
  const numRecent = Math.floor(range(rng(), 4, 9));
  const recentMatches: RecentMatch[] = [];
  for (let i = 0; i < numRecent; i++) {
    const aId = pick(rng(), [...usedAgents]);
    const kills = Math.round(range(rng(), 8, 28));
    const deaths = Math.round(range(rng(), 8, 22));
    const won = rng() > 0.5;
    recentMatches.push({
      matchId: `mock-${i}-${seed}`,
      map: pick(rng(), allMaps),
      agentId: aId,
      agentName: AGENTS[aId]?.name ?? aId,
      mode: "Competitive",
      won,
      myRoundsWon: won ? 13 : Math.round(range(rng(), 3, 12)),
      enemyRoundsWon: won ? Math.round(range(rng(), 3, 12)) : 13,
      kills,
      deaths,
      assists: Math.round(range(rng(), 2, 9)),
      acs: Math.round(range(rng(), 170, 320)),
      kd: deaths > 0 ? round1(kills / deaths) : kills,
      hsPct: round1(range(rng(), 15, 32)),
      startedAt: new Date(Date.now() - i * 86400000).toISOString(),
      durationMinutes: Math.round(range(rng(), 25, 45)),
      act: pick(rng(), acts),
    });
  }

  // Role performance (3-4 roles)
  const roleSet = new Set<ValorantRole>();
  for (const a of perAgent) roleSet.add(ROLE_MAP[a.agentId] ?? "duelist");
  const rolePerformance: RoleStat[] = [...roleSet].map((r) => ({
    role: r,
    matches: Math.round(range(rng(), 2, 12)),
    winRate: Math.round(range(rng(), 35, 70)),
    kda: round1(range(rng(), 0.8, 1.8)),
  }));

  const headshotPct = round1(range(rng(), 12, 32));
  const bodyPct = round1(range(rng(), 55, 75));
  const legsPct = round1(Math.max(0, 100 - headshotPct - bodyPct));

  const totalKills = Math.round(range(rng(), 40, 220));
  const totalDeaths = Math.round(range(rng(), 35, 180));
  const totalAssists = Math.round(range(rng(), 15, 80));
  const matchesPlayed = Math.round(range(rng(), 4, 20));
  const wins = Math.round(matchesPlayed * range(rng(), 0.35, 0.65));

  return {
    riotId,
    region: pick(rng(), regions),
    rank: pick(rng(), ranks),
    peakRank: pick(rng(), ranks),
    level: Math.round(range(rng(), 25, 320)),
    matchesPlayed,
    wins,
    losses: matchesPlayed - wins,
    winRate: matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0,
    mainAgentId,
    mainAgentName,
    playerCard: null,
    favoriteWeapons,
    kd: totalDeaths > 0 ? round1(totalKills / totalDeaths) : totalKills,
    acs: Math.round(range(rng(), 180, 280)),
    accuracy: {
      headPct: headshotPct,
      bodyPct,
      legsPct,
      headHits: Math.round(range(rng(), 40, 220)),
      bodyHits: Math.round(range(rng(), 200, 700)),
      legsHits: Math.round(range(rng(), 8, 60)),
    },
    totalKills,
    totalDeaths,
    totalAssists,
    playtimeMinutes: Math.round(range(rng(), 60, 600)),
    headshotPct,
    adr: Math.round(range(rng(), 95, 175)),
    firstBloodPct: round1(range(rng(), 7, 24)),
    kast: Math.round(range(rng(), 50, 78)),
    clutchPct: round1(range(rng(), 5, 35)),
    multiKillsPerMatch: round1(range(rng(), 0.5, 4.5)),
    tradeKillPct: round1(range(rng(), 10, 28)),
    ecoImpact: Math.round(range(rng(), 25, 80)),
    agentPickedRole: ROLE_MAP[mainAgentId] ?? "duelist",
    rolePerformancePct: Math.round(range(rng(), 30, 80)),
    rolePerformance,
    topMaps,
    flashAssistsPerMatch: round1(range(rng(), 0.5, 6)),
    utilDamagePerMatch: Math.round(range(rng(), 50, 350)),
    perAgent,
    recentMatches,
    availableActs: acts,
    currentAct: acts[acts.length - 1],
  };
}
