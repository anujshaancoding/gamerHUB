/**
 * Translates raw stats → plain-English findings (strong / decent / weak).
 * Pure functions only — no fetching, no side effects. Easy to unit test.
 */
import type {
  RawValorantStats,
  PlayerInsights,
  InsightFinding,
} from "./types";
import { VALORANT_THRESHOLDS, judge } from "./thresholds";

function buildAimFindings(s: RawValorantStats): InsightFinding[] {
  const out: InsightFinding[] = [];

  const hsVerdict = judge(s.headshotPct, VALORANT_THRESHOLDS.headshotPct);
  out.push({
    metric: "Headshot Rate",
    value: `${s.headshotPct.toFixed(1)}%`,
    verdict: hsVerdict,
    category: "aim",
    message:
      hsVerdict === "strong"
        ? "Your crosshair placement is sharp — you're landing headshots more often than most players in your rank."
        : hsVerdict === "decent"
          ? "Your headshot rate is around average. Tighten crosshair placement at common head-level angles to push it higher."
          : "Your headshot rate is low. You're spraying at body-level — work on pre-aiming common head angles before peeking.",
    suggestion: hsVerdict === "weak" ? "Daily 10-min crosshair-placement warmup before queue." : undefined,
    drillLink: hsVerdict === "weak" ? { label: "Open Aim Lab", href: "/aim" } : undefined,
  });

  const adrVerdict = judge(s.adr, VALORANT_THRESHOLDS.adr);
  out.push({
    metric: "Average Damage / Round",
    value: s.adr.toFixed(0),
    verdict: adrVerdict,
    category: "aim",
    message:
      adrVerdict === "strong"
        ? "You consistently deal heavy damage every round — even when you don't get the kill, you set teammates up."
        : adrVerdict === "decent"
          ? "Your damage output is fine but not dominant. Look for second-bullet follow-ups instead of disengaging after one shot."
          : "Low damage per round suggests you peek and back off without committing. Trade or commit fully when you take the duel.",
    suggestion: adrVerdict === "weak" ? "Practice spray transfers and follow-up shots." : undefined,
    drillLink: adrVerdict === "weak" ? { label: "Aim Lab — Tracking", href: "/aim" } : undefined,
  });

  const fbVerdict = judge(s.firstBloodPct, VALORANT_THRESHOLDS.firstBloodPct);
  out.push({
    metric: "Opening Duel Win %",
    value: `${s.firstBloodPct.toFixed(1)}%`,
    verdict: fbVerdict,
    category: "aim",
    message:
      fbVerdict === "strong"
        ? "You're winning opening duels — your team enters rounds on the front foot because of you."
        : fbVerdict === "decent"
          ? "You break even on first contact. Pre-aim tighter or pre-fire common angles to swing this in your favor."
          : "You're losing opening duels often. Either you're peeking unsupported or your reaction-peek timing is off.",
    suggestion: fbVerdict === "weak" ? "Drill peek-and-pre-fire timing — try our Peek Duel mode." : undefined,
    drillLink: fbVerdict === "weak" ? { label: "Peek Duel", href: "/aim" } : undefined,
  });

  const kastVerdict = judge(s.kast, VALORANT_THRESHOLDS.kast);
  out.push({
    metric: "Round Impact (KAST)",
    value: `${s.kast.toFixed(0)}%`,
    verdict: kastVerdict,
    category: "aim",
    message:
      kastVerdict === "strong"
        ? "You contribute (kill, assist, survive, or trade) in most rounds — high baseline value."
        : kastVerdict === "decent"
          ? "You're impacting most rounds, but ~30% slip by without your input. Stick with team and trade more."
          : "Many rounds go by without your input. Avoid isolated peeks — play closer to teammates so trades happen.",
  });

  return out;
}

function buildGameSenseFindings(s: RawValorantStats): InsightFinding[] {
  const out: InsightFinding[] = [];

  const clutchVerdict = judge(s.clutchPct, VALORANT_THRESHOLDS.clutchPct);
  out.push({
    metric: "Clutch Win %",
    value: `${s.clutchPct.toFixed(1)}%`,
    verdict: clutchVerdict,
    category: "gamesense",
    message:
      clutchVerdict === "strong"
        ? "You stay calm in 1vX situations — your decision-making under pressure is a real edge."
        : clutchVerdict === "decent"
          ? "You hold your own in clutches but let some winnable rounds slip. Slow down, use sound, force isolations."
          : "Clutch rounds are not landing. You're rushing decisions — practice using sound cues and isolating one enemy at a time.",
    suggestion: clutchVerdict === "weak" ? "Try our Clutch 1v5 mode to rehearse the pressure." : undefined,
    drillLink: clutchVerdict === "weak" ? { label: "Clutch 1v5", href: "/aim" } : undefined,
  });

  const mkVerdict = judge(s.multiKillsPerMatch, VALORANT_THRESHOLDS.multiKillsPerMatch);
  out.push({
    metric: "Multi-Kills / Match",
    value: s.multiKillsPerMatch.toFixed(1),
    verdict: mkVerdict,
    category: "gamesense",
    message:
      mkVerdict === "strong"
        ? "You convert advantageous fights — when you find one enemy, you usually find two."
        : mkVerdict === "decent"
          ? "You get the occasional double, but you're not pressing rotation kills. Keep momentum after first kills."
          : "You rarely string kills together. After winning a duel, reposition and stay aggressive — the enemy team is rotating.",
  });

  const tradeVerdict = judge(s.tradeKillPct, VALORANT_THRESHOLDS.tradeKillPct);
  out.push({
    metric: "Trade Kill %",
    value: `${s.tradeKillPct.toFixed(1)}%`,
    verdict: tradeVerdict,
    category: "gamesense",
    message:
      tradeVerdict === "strong"
        ? "You play with your team — when a teammate dies, you punish the killer immediately."
        : tradeVerdict === "decent"
          ? "Trades happen, but not consistently. Stay closer to the entry so trades happen automatically."
          : "Your team-mates are dying without trades. You're too far from the entry — close the gap.",
  });

  return out;
}

function buildEconomyFindings(s: RawValorantStats): InsightFinding[] {
  const v = judge(s.ecoImpact, VALORANT_THRESHOLDS.ecoImpact);
  return [
    {
      metric: "Eco Round Impact",
      value: `${s.ecoImpact.toFixed(0)}/100`,
      verdict: v,
      category: "economy",
      message:
        v === "strong"
          ? "You make pistols and ecos count — a real economy threat."
          : v === "decent"
            ? "Your eco play is okay. Coordinate stacked pistol pushes to get more out of save rounds."
            : "Eco rounds are dead weight. Talk to your team about stacks, force buys, and aggressive pistol takes.",
    },
  ];
}

function buildRoleFindings(s: RawValorantStats): InsightFinding[] {
  const v = judge(s.rolePerformancePct, VALORANT_THRESHOLDS.rolePerformancePct);
  const role = s.agentPickedRole;
  return [
    {
      metric: `${role[0].toUpperCase()}${role.slice(1)} Role Performance`,
      value: `${s.rolePerformancePct.toFixed(0)}/100`,
      verdict: v,
      category: "role",
      message:
        v === "strong"
          ? `You play your role (${role}) above expected — your agent picks suit your style.`
          : v === "decent"
            ? `You're meeting your ${role} role baseline. Try one signature agent and master their kit instead of swapping.`
            : `Your ${role} numbers are below the role baseline. You may be playing the wrong role — try a different one for a few games.`,
      suggestion: v === "weak" ? `Experiment with a different role for 5 matches and compare.` : undefined,
    },
  ];
}

function buildMapFindings(s: RawValorantStats): InsightFinding[] {
  return s.topMaps.slice(0, 3).map((m) => {
    const v = judge(m.winRate, VALORANT_THRESHOLDS.mapWinRate);
    return {
      metric: `${m.map} Win Rate`,
      value: `${m.winRate.toFixed(0)}% (${m.matches} matches)`,
      verdict: v,
      category: "map" as const,
      message:
        v === "strong"
          ? `${m.map} is your map — keep queuing it.`
          : v === "decent"
            ? `${m.map} is balanced — small adjustments to your callouts/util will tip it your way.`
            : `${m.map} is dragging your win rate down. Watch one defender VOD and learn 3 post-plant lineups.`,
      suggestion: v === "weak" ? `Pick up 2-3 lineups for ${m.map} this week.` : undefined,
    };
  });
}

function buildUtilityFindings(s: RawValorantStats): InsightFinding[] {
  const out: InsightFinding[] = [];

  const fa = judge(s.flashAssistsPerMatch, VALORANT_THRESHOLDS.flashAssistsPerMatch);
  out.push({
    metric: "Flash Assists / Match",
    value: s.flashAssistsPerMatch.toFixed(1),
    verdict: fa,
    category: "utility",
    message:
      fa === "strong"
        ? "Your flashes set up team kills — high-value support."
        : fa === "decent"
          ? "Some flashes connect, but you're popping them randomly. Wait for a teammate's swing."
          : "Your flashes are not setting up kills. Bind to push-to-flash and coordinate with the entry.",
  });

  const ud = judge(s.utilDamagePerMatch, VALORANT_THRESHOLDS.utilDamagePerMatch);
  out.push({
    metric: "Utility Damage / Match",
    value: s.utilDamagePerMatch.toFixed(0),
    verdict: ud,
    category: "utility",
    message:
      ud === "strong"
        ? "You squeeze damage out of your kit before the gunfight even starts."
        : ud === "decent"
          ? "Some util damage, but a lot of grenades miss. Practice common molly/grenade lineups."
          : "Your util mostly misses. Learn 3 lineups per agent — even basic ones will multiply your impact.",
  });

  return out;
}

function buildHeadline(strong: number, weak: number): string {
  if (weak === 0 && strong >= 6) return "Well-rounded threat — almost no weaknesses to exploit.";
  if (weak >= 5) return "Lots of room to grow — focus on one weakness at a time.";
  if (strong >= weak * 2) return "Strong fundamentals — small refinements will push you to the next rank.";
  if (weak > strong) return "Solid base, but a few clear weaknesses are holding your rank back.";
  return "Balanced player — pick one weakness and grind it for the next 2 weeks.";
}

export function analyzeValorant(stats: RawValorantStats, fromMock: boolean): PlayerInsights {
  const findings: InsightFinding[] = [
    ...buildAimFindings(stats),
    ...buildGameSenseFindings(stats),
    ...buildEconomyFindings(stats),
    ...buildRoleFindings(stats),
    ...buildMapFindings(stats),
    ...buildUtilityFindings(stats),
  ];

  const strong = findings.filter((f) => f.verdict === "strong").length;
  const decent = findings.filter((f) => f.verdict === "decent").length;
  const weak = findings.filter((f) => f.verdict === "weak").length;

  return {
    riotId: stats.riotId,
    game: "valorant",
    region: stats.region,
    rank: stats.rank,
    peakRank: stats.peakRank,
    level: stats.level,
    matchesPlayed: stats.matchesPlayed,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.winRate,
    mainAgentId: stats.mainAgentId,
    mainAgentName: stats.mainAgentName,
    playerCard: stats.playerCard,
    favoriteWeapons: stats.favoriteWeapons,
    kd: stats.kd,
    acs: stats.acs,
    adr: stats.adr,
    kast: stats.kast,
    headshotPct: stats.headshotPct,
    accuracy: stats.accuracy,
    playtimeMinutes: stats.playtimeMinutes,
    perAgent: stats.perAgent,
    recentMatches: stats.recentMatches,
    rolePerformance: stats.rolePerformance,
    availableActs: stats.availableActs,
    currentAct: stats.currentAct,
    generatedAt: new Date().toISOString(),
    fromMock,
    summary: {
      strongCount: strong,
      decentCount: decent,
      weakCount: weak,
      headline: buildHeadline(strong, weak),
    },
    findings,
  };
}
