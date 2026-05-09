/**
 * CS2 stats → plain-English findings.
 * Same verdict shape as the Valorant analyzer.
 */
import type { InsightFinding } from "./types";
import type { RawCs2Stats, Cs2Insights } from "./cs2-types";
import { judge } from "./thresholds";

const CS2_THRESHOLDS = {
  kdRatio:    { strongAtOrAbove: 1.15, weakAtOrBelow: 0.85 },
  headshotPct:{ strongAtOrAbove: 50, weakAtOrBelow: 30 },
  accuracy:   { strongAtOrAbove: 22, weakAtOrBelow: 13 },
  winRate:    { strongAtOrAbove: 55, weakAtOrBelow: 42 },
  mvpPerMatch:{ strongAtOrAbove: 2.5, weakAtOrBelow: 0.8 },
  bombPlants: { strongAtOrAbove: 0.4, weakAtOrBelow: 0.1 },
  bombDefuses:{ strongAtOrAbove: 0.15, weakAtOrBelow: 0.04 },
  mapWinRate: { strongAtOrAbove: 55, weakAtOrBelow: 42 },
};

export function analyzeCs2(stats: RawCs2Stats, fromMock: boolean): Cs2Insights {
  const findings: InsightFinding[] = [];

  const kd = stats.totalDeaths > 0 ? stats.totalKills / stats.totalDeaths : 0;
  const hsPct = stats.totalKills > 0 ? (stats.totalKillsHeadshot / stats.totalKills) * 100 : 0;
  const accuracy = stats.totalShotsFired > 0 ? (stats.totalShotsHit / stats.totalShotsFired) * 100 : 0;
  const winRate = stats.totalMatchesPlayed > 0 ? (stats.totalMatchesWon / stats.totalMatchesPlayed) * 100 : 0;
  const mvpPerMatch = stats.totalMatchesPlayed > 0 ? stats.totalMvps / stats.totalMatchesPlayed : 0;
  const plantsPerMatch = stats.totalMatchesPlayed > 0 ? stats.totalPlantedBombs / stats.totalMatchesPlayed : 0;
  const defusesPerMatch = stats.totalMatchesPlayed > 0 ? stats.totalDefusedBombs / stats.totalMatchesPlayed : 0;

  // K/D
  const kdV = judge(kd, CS2_THRESHOLDS.kdRatio);
  findings.push({
    metric: "K/D Ratio",
    value: kd.toFixed(2),
    verdict: kdV,
    category: "aim",
    message:
      kdV === "strong"
        ? "You're trading kills better than you take losses — your aim and positioning are paying off."
        : kdV === "decent"
          ? "You break even on duels. To climb, win the trades you currently lose by repositioning."
          : "You're losing more duels than you win. Slow down peeks, hold cleaner angles, prefire common spots.",
    suggestion: kdV === "weak" ? "Try a 15-min Aim Botz or recoil-master warmup before queueing." : undefined,
  });

  // HS%
  const hsV = judge(hsPct, CS2_THRESHOLDS.headshotPct);
  findings.push({
    metric: "Headshot %",
    value: `${hsPct.toFixed(1)}%`,
    verdict: hsV,
    category: "aim",
    message:
      hsV === "strong"
        ? "Your crosshair sits at head level — that's the difference-maker in CS2."
        : hsV === "decent"
          ? "Solid headshot rate. Push it higher by pre-aiming at common head-level angles when peeking."
          : "You're spraying body-level. CS2 punishes that — work on crosshair placement and short bursts to the head.",
  });

  // Accuracy
  const accV = judge(accuracy, CS2_THRESHOLDS.accuracy);
  findings.push({
    metric: "Shot Accuracy",
    value: `${accuracy.toFixed(1)}%`,
    verdict: accV,
    category: "aim",
    message:
      accV === "strong"
        ? "You don't waste bullets — you commit to shots that connect."
        : accV === "decent"
          ? "Average accuracy. Practice spray transfers so follow-up shots land."
          : "Most of your bullets miss. Cut down on full sprays at distance — burst or single-tap past 20 meters.",
  });

  // Win rate
  const wrV = judge(winRate, CS2_THRESHOLDS.winRate);
  findings.push({
    metric: "Match Win Rate",
    value: `${winRate.toFixed(1)}%`,
    verdict: wrV,
    category: "gamesense",
    message:
      wrV === "strong"
        ? "You win more than you lose — your impact translates to round wins, not just kills."
        : wrV === "decent"
          ? "Around 50% — typical for ranked. Focus on round-impact decisions: trade kills, save grenades for execs."
          : "Win rate is dragging. You may be overpeeking or queuing solo against stacks. Group up, communicate.",
  });

  // MVP/match
  const mvpV = judge(mvpPerMatch, CS2_THRESHOLDS.mvpPerMatch);
  findings.push({
    metric: "MVPs per Match",
    value: mvpPerMatch.toFixed(2),
    verdict: mvpV,
    category: "gamesense",
    message:
      mvpV === "strong"
        ? "You're carrying rounds — high-impact frags or clutch saves are routine for you."
        : mvpV === "decent"
          ? "You contribute. Stack rounds by playing for first-blood early in halves to force MVPs."
          : "You rarely close out rounds. Look for setup kills and clutch moments — they're how MVPs happen.",
  });

  // Bomb plants
  const planV = judge(plantsPerMatch, CS2_THRESHOLDS.bombPlants);
  findings.push({
    metric: "Bomb Plants / Match",
    value: plantsPerMatch.toFixed(2),
    verdict: planV,
    category: "role",
    message:
      planV === "strong"
        ? "You take entry initiative on T-side — your team relies on you to set up post-plants."
        : planV === "decent"
          ? "You plant occasionally. Ask for the bomb on rounds where your role wants to play default."
          : "You're a passive T. Carry the bomb more — being the planter increases your team's plant rate and round value.",
  });

  // Defuses
  const defV = judge(defusesPerMatch, CS2_THRESHOLDS.bombDefuses);
  findings.push({
    metric: "Defuses / Match",
    value: defusesPerMatch.toFixed(2),
    verdict: defV,
    category: "role",
    message:
      defV === "strong"
        ? "You close out CT rounds — defuses save match points."
        : defV === "decent"
          ? "You defuse when needed. Pre-buy a kit when CT-side eco allows."
          : "You almost never defuse. Carry kits and play retake setups — your team needs you on the bomb.",
  });

  // Map performance (top maps)
  for (const m of stats.topMaps.slice(0, 3)) {
    const v = judge(m.winRate, CS2_THRESHOLDS.mapWinRate);
    findings.push({
      metric: `${m.map} Win Rate`,
      value: `${m.winRate.toFixed(0)}% (${m.matches} matches)`,
      verdict: v,
      category: "map",
      message:
        v === "strong"
          ? `${m.map} is your map — keep queuing it.`
          : v === "decent"
            ? `${m.map} is balanced. Learn 2-3 utility lineups to tip it your way.`
            : `${m.map} is dragging your record down. Watch a defender VOD and ban it for a couple of weeks.`,
      suggestion: v === "weak" ? `Pick up smokes/molotovs for ${m.map}.` : undefined,
    });
  }

  // Top weapons → utility/aim feedback
  for (const w of stats.topWeapons.slice(0, 3)) {
    findings.push({
      metric: `${w.weaponName} Mastery`,
      value: `${w.kills.toLocaleString()} kills`,
      verdict: w.headshotPct >= 45 ? "strong" : w.headshotPct >= 28 ? "decent" : "weak",
      category: "utility",
      message:
        w.headshotPct >= 45
          ? `You're lethal with the ${w.weaponName} — your headshot rate is elite.`
          : w.headshotPct >= 28
            ? `Solid ${w.weaponName} usage. Keep practicing crosshair placement for headshots.`
            : `Your ${w.weaponName} headshot rate is low. Practice pre-aiming head level — body shots aren't enough at higher ranks.`,
    });
  }

  const strong = findings.filter((f) => f.verdict === "strong").length;
  const decent = findings.filter((f) => f.verdict === "decent").length;
  const weak = findings.filter((f) => f.verdict === "weak").length;

  let headline: string;
  if (weak === 0 && strong >= 5) headline = "Well-rounded threat — almost no weaknesses to exploit.";
  else if (weak >= 5) headline = "Lots of room to grow — focus on one weakness at a time.";
  else if (strong >= weak * 2) headline = "Strong fundamentals — small refinements will push your rating up.";
  else if (weak > strong) headline = "Solid base, but a few clear weaknesses are holding your Premier rating back.";
  else headline = "Balanced player — pick one weakness and grind it for the next 2 weeks.";

  return {
    riotId: stats.steamId,
    game: "cs2",
    rank: "—",
    hoursPlayed: stats.hoursPlayed,
    avatarUrl: stats.avatarUrl,
    displayName: stats.displayName,
    steamId: stats.steamId,
    matchesPlayed: stats.totalMatchesPlayed,
    winRate: Math.round(winRate),
    favoriteWeapons: stats.topWeapons,
    generatedAt: new Date().toISOString(),
    fromMock,
    summary: {
      strongCount: strong,
      decentCount: decent,
      weakCount: weak,
      headline,
    },
    findings,
  };
}
