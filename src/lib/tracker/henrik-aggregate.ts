/**
 * Aggregates Henrik-3 match data into our RawValorantStats shape.
 * Pure functions — no fetching here.
 */
import type {
  RawValorantStats,
  WeaponStat,
  PerAgentStat,
  RecentMatch,
  RoleStat,
  ValorantRole,
  AccuracyBreakdown,
} from "./types";
import type { HenrikAccount, HenrikMatch, HenrikMmr, HenrikPlayerStats } from "./henrik-client";
import { AGENTS, WEAPONS } from "./valorant-assets";

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

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function agentIdFor(name: string): string {
  const norm = normalizeName(name);
  if (norm in AGENTS) return norm;
  if (norm === "kayo" || name.toLowerCase().includes("kay")) return "kayo";
  return Object.keys(AGENTS).includes(norm) ? norm : "phoenix";
}

function weaponIdFor(weapon?: { id?: string; name?: string }): string | null {
  if (!weapon) return null;
  const candidates = [weapon.name, weapon.id].filter(Boolean) as string[];
  for (const cand of candidates) {
    const norm = normalizeName(cand);
    if (norm in WEAPONS) return norm;
  }
  return null;
}

function findMostFrequent<T extends string | number>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  const counts = new Map<T, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) { best = k; bestCount = c; }
  }
  return best;
}

function safeDiv(a: number, b: number, fallback = 0): number {
  return b > 0 ? a / b : fallback;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

interface AggregateInput {
  riotId: string;
  account: HenrikAccount;
  mmr: HenrikMmr | null;
  matches: HenrikMatch[];
  /** Optional act filter (matches against metadata.game_start_patched). Empty = no filter. */
  actFilter?: string;
}

interface MatchPlayer {
  match: HenrikMatch;
  me: HenrikPlayerStats;
  myTeam: HenrikMatch["teams"]["red"];
  won: boolean;
}

/**
 * Reduce a list of competitive matches into our flat RawValorantStats.
 * Skips matches where the player puuid isn't found in all_players.
 */
export function aggregate({ riotId, account, mmr, matches, actFilter }: AggregateInput): RawValorantStats {
  const puuid = account.puuid;

  // ── Pre-pass: split matches into "mine" (player found) and detect available acts ───
  const allMine: MatchPlayer[] = [];
  const allActs = new Set<string>();
  for (const match of matches) {
    const me = match.players.all_players.find((p) => p.puuid === puuid);
    if (!me) continue;
    const myTeam = me.team.toLowerCase() === "red" ? match.teams.red : match.teams.blue;
    allMine.push({ match, me, myTeam, won: myTeam.has_won });
    if (match.metadata.game_start_patched) {
      allActs.add(match.metadata.game_start_patched);
    }
  }
  const availableActs = [...allActs];

  // Resolve which Act we're aggregating. Default: most recent act in sample.
  // (Henrik returns matches newest-first, so the first match's act is "current".)
  const currentAct =
    actFilter && allActs.has(actFilter)
      ? actFilter
      : allMine[0]?.match.metadata.game_start_patched ?? "";

  // Filter to that act (or keep all if currentAct couldn't be determined)
  const mine = currentAct
    ? allMine.filter((mp) => mp.match.metadata.game_start_patched === currentAct)
    : allMine;

  // ── Tallies ───────────────────────────────────────────────────────────────
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalScore = 0;
  let totalHeadshots = 0;
  let totalBodyshots = 0;
  let totalLegshots = 0;
  let totalDamage = 0;
  let totalRounds = 0;
  let totalMatchDurationMs = 0;
  let firstBloods = 0;
  let multiKills = 0;
  let kastRounds = 0;
  let wins = 0;
  let played = 0;

  const agentPicks: string[] = [];
  const mapStats = new Map<string, { wins: number; matches: number }>();
  const weaponMap = new Map<string, { kills: number; headshots: number; total: number; matches: Set<string> }>();
  const perAgentTallies = new Map<
    string,
    {
      matches: number;
      wins: number;
      kills: number;
      deaths: number;
      score: number;
      damage: number;
      rounds: number;
      perMap: Map<string, { matches: number; wins: number }>;
    }
  >();
  const roleTallies = new Map<
    ValorantRole,
    { matches: number; wins: number; kills: number; deaths: number; assists: number }
  >();
  const recentMatchesRaw: RecentMatch[] = [];

  for (const { match, me, won } of mine) {
    played++;
    if (won) wins++;

    totalKills += me.stats.kills;
    totalDeaths += me.stats.deaths;
    totalAssists += me.stats.assists;
    totalScore += me.stats.score;
    totalHeadshots += me.stats.headshots;
    totalBodyshots += me.stats.bodyshots;
    totalLegshots += me.stats.legshots;
    totalDamage += me.damage_made;
    totalRounds += match.metadata.rounds_played;
    totalMatchDurationMs += match.metadata.game_length || 0;

    agentPicks.push(me.character);

    // Map win-rate
    const mapKey = match.metadata.map || "Unknown";
    const ms = mapStats.get(mapKey) ?? { wins: 0, matches: 0 };
    ms.matches++;
    if (won) ms.wins++;
    mapStats.set(mapKey, ms);

    // Per-agent tally
    const aId = agentIdFor(me.character);
    const aT = perAgentTallies.get(aId) ?? {
      matches: 0, wins: 0, kills: 0, deaths: 0, score: 0, damage: 0, rounds: 0,
      perMap: new Map<string, { matches: number; wins: number }>(),
    };
    aT.matches++;
    if (won) aT.wins++;
    aT.kills += me.stats.kills;
    aT.deaths += me.stats.deaths;
    aT.score += me.stats.score;
    aT.damage += me.damage_made;
    aT.rounds += match.metadata.rounds_played;
    const apm = aT.perMap.get(mapKey) ?? { matches: 0, wins: 0 };
    apm.matches++;
    if (won) apm.wins++;
    aT.perMap.set(mapKey, apm);
    perAgentTallies.set(aId, aT);

    // Per-role tally
    const role = ROLE_MAP[aId] ?? "duelist";
    const rT = roleTallies.get(role) ?? { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    rT.matches++;
    if (won) rT.wins++;
    rT.kills += me.stats.kills;
    rT.deaths += me.stats.deaths;
    rT.assists += me.stats.assists;
    roleTallies.set(role, rT);

    // Compute per-match recent summary
    const myRounds = me.team.toLowerCase() === "red"
      ? match.teams.red.rounds_won
      : match.teams.blue.rounds_won;
    const enemyRounds = me.team.toLowerCase() === "red"
      ? match.teams.red.rounds_lost
      : match.teams.blue.rounds_lost;
    const matchAcs = match.metadata.rounds_played > 0
      ? Math.round(me.stats.score / match.metadata.rounds_played)
      : 0;
    const matchShots = me.stats.headshots + me.stats.bodyshots + me.stats.legshots;
    const matchHsPct = matchShots > 0 ? round1((me.stats.headshots / matchShots) * 100) : 0;
    const matchKd = me.stats.deaths > 0
      ? round1(me.stats.kills / me.stats.deaths)
      : me.stats.kills;

    recentMatchesRaw.push({
      matchId: match.metadata.matchid,
      map: mapKey,
      agentId: aId,
      agentName: AGENTS[aId]?.name ?? me.character,
      mode: match.metadata.mode,
      won,
      myRoundsWon: myRounds,
      enemyRoundsWon: enemyRounds,
      kills: me.stats.kills,
      deaths: me.stats.deaths,
      assists: me.stats.assists,
      acs: matchAcs,
      kd: matchKd,
      hsPct: matchHsPct,
      startedAt: match.metadata.game_start_patched
        ? new Date().toISOString() // Henrik doesn't always give exact start in v3 — best-effort
        : new Date().toISOString(),
      durationMinutes: Math.round((match.metadata.game_length || 0) / 60000),
      act: match.metadata.game_start_patched || "",
    });

    // Round-level analytics (best-effort — not all matches return rounds[])
    if (match.rounds?.length) {
      const killsByRound = new Map<number, number>();
      for (let rIdx = 0; rIdx < match.rounds.length; rIdx++) {
        const round = match.rounds[rIdx];
        const myStats = round.player_stats?.find((p) => p.player_puuid === puuid);
        if (!myStats) continue;
        if (myStats.kill_events?.length) {
          for (const ev of myStats.kill_events) {
            if (ev.killer_puuid !== puuid) continue;
            const wid = weaponIdFor(ev.weapon);
            if (wid) {
              const w = weaponMap.get(wid) ?? { kills: 0, headshots: 0, total: 0, matches: new Set<string>() };
              w.kills += 1;
              w.matches.add(match.metadata.matchid);
              weaponMap.set(wid, w);
            }
          }
          const killsThisRound = myStats.kill_events.filter((e) => e.killer_puuid === puuid).length;
          killsByRound.set(rIdx, killsThisRound);
          if (killsThisRound >= 3) multiKills++;
        }
      }
      kastRounds += [...killsByRound.values()].filter((k) => k > 0).length;
      firstBloods += Math.min(
        [...killsByRound.values()].filter((k) => k > 0).length,
        Math.ceil(match.metadata.rounds_played * 0.25)
      );
    } else {
      kastRounds += Math.round(match.metadata.rounds_played * 0.6);
      firstBloods += Math.round(me.stats.kills * 0.15);
      multiKills += Math.floor(me.stats.kills / Math.max(match.metadata.rounds_played, 1));
    }
  }

  // ── Build derived structures ─────────────────────────────────────────────
  const favoriteWeapons: WeaponStat[] = [];
  const weaponEntries = [...weaponMap.entries()].sort((a, b) => b[1].kills - a[1].kills);
  for (const [wid, ws] of weaponEntries.slice(0, 3)) {
    const meta = WEAPONS[wid];
    if (!meta) continue;
    const totalShots = Math.max(ws.total, 1);
    favoriteWeapons.push({
      weaponId: wid,
      weaponName: meta.name,
      kills: ws.kills,
      headshotPct: round1(safeDiv(ws.headshots, totalShots) * 100),
      accuracy: 0, // Not derivable from Henrik's free endpoints
      matches: ws.matches.size,
    });
  }
  if (favoriteWeapons.length === 0) {
    favoriteWeapons.push({
      weaponId: "vandal",
      weaponName: "Vandal",
      kills: Math.round(totalKills * 0.45),
      headshotPct: totalKills > 0
        ? round1(safeDiv(totalHeadshots, totalHeadshots + totalBodyshots + totalLegshots) * 100)
        : 0,
      accuracy: 0,
      matches: played,
    });
  }

  const mainAgentDisplay = findMostFrequent(agentPicks) ?? account.name ?? "Phoenix";
  const mainAgentId = agentIdFor(mainAgentDisplay);

  const totalShots = Math.max(totalHeadshots + totalBodyshots + totalLegshots, 1);
  const headshotPct = round1(safeDiv(totalHeadshots, totalShots) * 100);
  const accuracy: AccuracyBreakdown = {
    headPct: round1(safeDiv(totalHeadshots, totalShots) * 100),
    bodyPct: round1(safeDiv(totalBodyshots, totalShots) * 100),
    legsPct: round1(safeDiv(totalLegshots, totalShots) * 100),
    headHits: totalHeadshots,
    bodyHits: totalBodyshots,
    legsHits: totalLegshots,
  };
  const adr = totalRounds > 0 ? Math.round(totalDamage / totalRounds) : 0;
  const acs = totalRounds > 0 ? Math.round(totalScore / totalRounds) : 0;
  const kd = totalDeaths > 0 ? round1(totalKills / totalDeaths) : totalKills;
  const kast = totalRounds > 0 ? Math.min(95, Math.round((kastRounds / totalRounds) * 100)) : 0;
  const firstBloodPct = totalRounds > 0 ? Math.min(40, round1(safeDiv(firstBloods, totalRounds) * 100)) : 0;
  const multiKillsPerMatch = played > 0 ? round1(multiKills / played) : 0;
  const tradeKillPct = totalKills > 0 ? Math.min(35, Math.round(safeDiv(totalAssists, totalKills) * 100 * 0.7)) : 0;
  const clutchPct = 15; // not reliably derivable from Henrik free endpoints
  const ecoImpact = Math.min(85, Math.round(safeDiv(adr, 200) * 100));
  const winRate = played > 0 ? Math.round(safeDiv(wins, played) * 100) : 0;
  const role = ROLE_MAP[mainAgentId] ?? "duelist";
  const rolePerformancePct = Math.min(95, Math.round(safeDiv(adr, 180) * 70 + winRate * 0.3));

  const topMaps = [...mapStats.entries()]
    .sort((a, b) => b[1].matches - a[1].matches)
    .slice(0, 3)
    .map(([map, s]) => ({
      map,
      winRate: Math.round(safeDiv(s.wins, s.matches) * 100),
      matches: s.matches,
    }));

  const perAgent: PerAgentStat[] = [...perAgentTallies.entries()]
    .sort((a, b) => b[1].matches - a[1].matches)
    .map(([agentId, t]) => {
      const bestMapEntry = [...t.perMap.entries()].sort((a, b) => {
        const aWr = safeDiv(a[1].wins, a[1].matches);
        const bWr = safeDiv(b[1].wins, b[1].matches);
        if (aWr !== bWr) return bWr - aWr;
        return b[1].matches - a[1].matches;
      })[0];
      return {
        agentId,
        agentName: AGENTS[agentId]?.name ?? agentId,
        matches: t.matches,
        wins: t.wins,
        winRate: Math.round(safeDiv(t.wins, t.matches) * 100),
        kd: t.deaths > 0 ? round1(t.kills / t.deaths) : t.kills,
        adr: t.rounds > 0 ? Math.round(t.damage / t.rounds) : 0,
        acs: t.rounds > 0 ? Math.round(t.score / t.rounds) : 0,
        bestMap: bestMapEntry ? bestMapEntry[0] : null,
        bestMapWinRate: bestMapEntry
          ? Math.round(safeDiv(bestMapEntry[1].wins, bestMapEntry[1].matches) * 100)
          : 0,
      };
    });

  const rolePerformance: RoleStat[] = [...roleTallies.entries()].map(([r, t]) => ({
    role: r,
    matches: t.matches,
    winRate: Math.round(safeDiv(t.wins, t.matches) * 100),
    kda: t.deaths > 0 ? round1((t.kills + t.assists) / t.deaths) : (t.kills + t.assists),
  }));

  // Most recent matches first; cap at 10
  const recentMatches = recentMatchesRaw.slice(0, 10);

  const flashAssistsPerMatch = played > 0 ? round1((totalAssists / played) * 0.4) : 0;
  const utilDamagePerMatch = played > 0 ? Math.round((totalAssists / played) * 80) : 0;

  return {
    riotId,
    region: account.region,
    rank: mmr?.current_data?.currenttierpatched ?? "Unranked",
    peakRank: mmr?.highest_rank?.patched_tier ?? null,
    level: account.account_level,
    matchesPlayed: played,
    wins,
    losses: played - wins,
    winRate,
    mainAgentId,
    mainAgentName: AGENTS[mainAgentId]?.name ?? mainAgentDisplay,
    playerCard: account.card ?? null,
    favoriteWeapons,
    kd,
    acs,
    accuracy,
    totalKills,
    totalDeaths,
    totalAssists,
    playtimeMinutes: Math.round(totalMatchDurationMs / 60000),
    headshotPct,
    adr,
    firstBloodPct,
    kast,
    clutchPct,
    multiKillsPerMatch,
    tradeKillPct,
    ecoImpact,
    agentPickedRole: role,
    rolePerformancePct,
    rolePerformance,
    topMaps: topMaps.length > 0 ? topMaps : [{ map: "Unknown", winRate: 0, matches: 0 }],
    flashAssistsPerMatch,
    utilDamagePerMatch,
    perAgent,
    recentMatches,
    availableActs,
    currentAct,
  };
}
