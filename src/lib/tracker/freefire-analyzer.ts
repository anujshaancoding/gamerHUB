/**
 * Free Fire stats → plain-English findings.
 */
import type { InsightFinding } from "./types";
import type { FreeFireManualStats, MobileInsights } from "./mobile-types";
import { judge } from "./thresholds";

const FF_THRESHOLDS = {
  kdRatio:        { strongAtOrAbove: 3, weakAtOrBelow: 1.4 },
  winRate:        { strongAtOrAbove: 14, weakAtOrBelow: 4 },
  killsPerMatch:  { strongAtOrAbove: 4, weakAtOrBelow: 1.5 },
  headshotPct:    { strongAtOrAbove: 30, weakAtOrBelow: 12 },
  damagePerMatch: { strongAtOrAbove: 1200, weakAtOrBelow: 400 },
  survivalMin:    { strongAtOrAbove: 9, weakAtOrBelow: 4 },
};

export function analyzeFreeFire(stats: FreeFireManualStats): MobileInsights {
  const findings: InsightFinding[] = [];

  // FF doesn't expose deaths consistently — derive from K/D-style proxy
  const winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0;
  const killsPerMatch = stats.matchesPlayed > 0 ? stats.kills / stats.matchesPlayed : 0;
  const damagePerMatch = stats.matchesPlayed > 0 ? stats.damageDealt / stats.matchesPlayed : 0;
  // Approx K/D from kills + matches (each match = 1 death unless win)
  const deathsApprox = stats.matchesPlayed - stats.wins;
  const kd = deathsApprox > 0 ? stats.kills / deathsApprox : stats.kills;

  const kdV = judge(kd, FF_THRESHOLDS.kdRatio);
  findings.push({
    metric: "Approx K/D Ratio",
    value: kd.toFixed(2),
    verdict: kdV,
    category: "aim",
    message:
      kdV === "strong"
        ? "You frag hard — your squad benefits from your damage every game."
        : kdV === "decent"
          ? "Average K/D. Take more 1v1 fights to bump the number."
          : "Low K/D. Play tighter early — Free Fire's TTK is fast, so positioning matters more than reflex.",
  });

  const wrV = judge(winRate, FF_THRESHOLDS.winRate);
  findings.push({
    metric: "Booyah Rate",
    value: `${winRate.toFixed(1)}%`,
    verdict: wrV,
    category: "gamesense",
    message:
      wrV === "strong"
        ? "Booyahs come easy — your endgame play is dialed in."
        : wrV === "decent"
          ? "Decent Booyah rate. Tighten endgame rotations and use gloo walls more aggressively."
          : "Low Booyah rate. Survive longer — gloo walls in zone, prioritize cover, hold high ground.",
  });

  const kpmV = judge(killsPerMatch, FF_THRESHOLDS.killsPerMatch);
  findings.push({
    metric: "Kills per Match",
    value: killsPerMatch.toFixed(1),
    verdict: kpmV,
    category: "aim",
    message:
      kpmV === "strong"
        ? "High kills per match — you find frags consistently."
        : kpmV === "decent"
          ? "Steady. Push more knocked enemies and contest airdrops for free kills."
          : "Low kill output. You're playing too cautiously — engage more or queue with a squad.",
  });

  const hsV = judge(stats.headshotPct, FF_THRESHOLDS.headshotPct);
  findings.push({
    metric: "Headshot %",
    value: `${stats.headshotPct.toFixed(1)}%`,
    verdict: hsV,
    category: "aim",
    message:
      hsV === "strong"
        ? "Headshot machine — your accuracy is elite for your rank."
        : hsV === "decent"
          ? "Decent HS%. Practice with the AWM/Kar98 in training mode."
          : "Headshot rate is low. Drop sensitivity for ADS, keep crosshair at head height.",
    suggestion: hsV === "weak" ? "10 mins of training-mode dummy-shooting daily." : undefined,
  });

  const dpmV = judge(damagePerMatch, FF_THRESHOLDS.damagePerMatch);
  findings.push({
    metric: "Damage per Match",
    value: damagePerMatch.toFixed(0),
    verdict: dpmV,
    category: "aim",
    message:
      dpmV === "strong"
        ? "You output serious damage — even non-kill plays soften enemies for your squad."
        : dpmV === "decent"
          ? "Average damage. Commit fights instead of trading single shots."
          : "Low damage output. Take more fights, use grenades + gloo combos.",
  });

  const survV = judge(stats.survivalTimeMin, FF_THRESHOLDS.survivalMin);
  findings.push({
    metric: "Avg Survival Time",
    value: `${stats.survivalTimeMin.toFixed(1)} min`,
    verdict: survV,
    category: "gamesense",
    message:
      survV === "strong"
        ? "You make it to late game often — perfect for stacking placement points."
        : survV === "decent"
          ? "You survive about half the match. Avoid the busiest drops."
          : "You die early. Drop quieter spots, loot fully, avoid open ground without gloos.",
  });

  if (stats.favoriteCharacter) {
    findings.push({
      metric: `${stats.favoriteCharacter} Main`,
      value: "Primary character",
      verdict: "decent",
      category: "role",
      message: `You main ${stats.favoriteCharacter}. Make sure their ability synergizes with your weapon — utility-first characters (Alok, K, Skyler) suit aggressive play; passive characters suit campers.`,
    });
  }

  if (stats.topWeapon) {
    findings.push({
      metric: `${stats.topWeapon} Usage`,
      value: "Primary",
      verdict: "decent",
      category: "utility",
      message: `Your go-to weapon is the ${stats.topWeapon}. Pair it with a long-range backup (AWM/Kar98) for maps like Bermuda.`,
    });
  }

  if (stats.favoriteMap) {
    findings.push({
      metric: `${stats.favoriteMap} Map`,
      value: "Preferred",
      verdict: "decent",
      category: "map",
      message: `${stats.favoriteMap} is your home turf. Try Kalahari for closer fights or Purgatory for more open gameplay.`,
    });
  }

  const strong = findings.filter((f) => f.verdict === "strong").length;
  const decent = findings.filter((f) => f.verdict === "decent").length;
  const weak = findings.filter((f) => f.verdict === "weak").length;

  let headline: string;
  if (weak === 0 && strong >= 4) headline = "Top-tier Free Fire numbers — Booyahs should keep coming.";
  else if (weak >= 4) headline = "Plenty to grind — pick one stat and chase improvement.";
  else if (strong >= weak * 2) headline = "Strong base — small endgame tweaks unlock the next rank.";
  else if (weak > strong) headline = "You frag, but die before Booyah. Late-game survival is the lever.";
  else headline = "Balanced — pick one weakness and focus your next 30 matches.";

  return {
    game: "freefire",
    inGameName: stats.inGameName,
    rank: stats.rank,
    matchesPlayed: stats.matchesPlayed,
    winRate: Math.round(winRate),
    generatedAt: new Date().toISOString(),
    fromMock: false,
    summary: { strongCount: strong, decentCount: decent, weakCount: weak, headline },
    findings,
    rawStats: stats,
  };
}
