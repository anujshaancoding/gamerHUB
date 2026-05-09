/**
 * BGMI stats → plain-English findings.
 */
import type { InsightFinding } from "./types";
import type { BgmiManualStats, MobileInsights } from "./mobile-types";
import { judge } from "./thresholds";

const BGMI_THRESHOLDS = {
  kdRatio:        { strongAtOrAbove: 4, weakAtOrBelow: 1.8 },
  winRate:        { strongAtOrAbove: 12, weakAtOrBelow: 3 },        // % chicken dinners
  killsPerMatch:  { strongAtOrAbove: 5, weakAtOrBelow: 2 },
  headshotPct:    { strongAtOrAbove: 25, weakAtOrBelow: 10 },
  damagePerMatch: { strongAtOrAbove: 600, weakAtOrBelow: 250 },
  survivalMin:    { strongAtOrAbove: 18, weakAtOrBelow: 8 },
  longestKillM:   { strongAtOrAbove: 200, weakAtOrBelow: 60 },
};

export function analyzeBgmi(stats: BgmiManualStats): MobileInsights {
  const findings: InsightFinding[] = [];

  const kd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
  const winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0;
  const killsPerMatch = stats.matchesPlayed > 0 ? stats.kills / stats.matchesPlayed : 0;
  const damagePerMatch = stats.matchesPlayed > 0 ? stats.damageDealt / stats.matchesPlayed : 0;

  const kdV = judge(kd, BGMI_THRESHOLDS.kdRatio);
  findings.push({
    metric: "K/D Ratio",
    value: kd.toFixed(2),
    verdict: kdV,
    category: "aim",
    message:
      kdV === "strong"
        ? "You're a fragger — your team can rely on you to clear squads."
        : kdV === "decent"
          ? "Average K/D for your tier. Push it higher by taking calculated fights, not third-party scraps."
          : "Low K/D suggests rushed engagements or under-leveled gear. Drop hot less, rotate smarter, win more 1v1s.",
    suggestion: kdV === "weak" ? "Practice in TDM mode for 10 mins before classic." : undefined,
  });

  const wrV = judge(winRate, BGMI_THRESHOLDS.winRate);
  findings.push({
    metric: "Win Rate",
    value: `${winRate.toFixed(1)}%`,
    verdict: wrV,
    category: "gamesense",
    message:
      wrV === "strong"
        ? "You secure chicken dinners regularly — your endgame and zone play are sharp."
        : wrV === "decent"
          ? "Decent WR. Improve endgame positioning — last 3 zones decide everything."
          : "Win rate is low. You're getting late-game kills but not closing — work on cover, vehicle play, and final-circle positioning.",
  });

  const kpmV = judge(killsPerMatch, BGMI_THRESHOLDS.killsPerMatch);
  findings.push({
    metric: "Kills per Match",
    value: killsPerMatch.toFixed(1),
    verdict: kpmV,
    category: "aim",
    message:
      kpmV === "strong"
        ? "High kills per match — you're aggressive in the right spots."
        : kpmV === "decent"
          ? "Steady kill output. Look for third-party opportunities to add 1-2 free kills per match."
          : "You're playing too passive. Push more knocked enemies for finishes and contest crates instead of avoiding them.",
  });

  const hsV = judge(stats.headshotPct, BGMI_THRESHOLDS.headshotPct);
  findings.push({
    metric: "Headshot %",
    value: `${stats.headshotPct.toFixed(1)}%`,
    verdict: hsV,
    category: "aim",
    message:
      hsV === "strong"
        ? "Your aim sits at head level — you delete enemies before they can react."
        : hsV === "decent"
          ? "Decent headshot rate. Sensitivity tuning + gyro can push this further."
          : "Low headshot % — you're spraying body. Drop sensitivity slightly, use ADS more, practice 1v1 rooms.",
    suggestion: hsV === "weak" ? "Spend 15 mins/day in Training Ground with a 4x scope." : undefined,
  });

  const dpmV = judge(damagePerMatch, BGMI_THRESHOLDS.damagePerMatch);
  findings.push({
    metric: "Damage per Match",
    value: damagePerMatch.toFixed(0),
    verdict: dpmV,
    category: "aim",
    message:
      dpmV === "strong"
        ? "You're a damage threat even when you don't get the kill — squad-mates clean up after you."
        : dpmV === "decent"
          ? "Average damage. Commit harder when you start a fight — finish what you start."
          : "Low damage suggests you're peeking once and disengaging. Take more committed engagements.",
  });

  const survV = judge(stats.survivalTimeMin, BGMI_THRESHOLDS.survivalMin);
  findings.push({
    metric: "Avg Survival Time",
    value: `${stats.survivalTimeMin.toFixed(1)} min`,
    verdict: survV,
    category: "gamesense",
    message:
      survV === "strong"
        ? "You make it to late game consistently — that's the foundation of high WR."
        : survV === "decent"
          ? "You survive about half the match. Avoid hot drops and reduce early aggression."
          : "You die early. Drop colder spots, loot fully before pushing, prioritize zone over kills.",
    suggestion: survV === "weak" ? "Try one cold-drop session — only fight after full loot." : undefined,
  });

  const lkV = judge(stats.longestKill, BGMI_THRESHOLDS.longestKillM);
  findings.push({
    metric: "Longest Kill",
    value: `${stats.longestKill}m`,
    verdict: lkV,
    category: "utility",
    message:
      lkV === "strong"
        ? "You can deliver damage at any range — sniper potential is real."
        : lkV === "decent"
          ? "Decent ranged threat. Practice Mini14/SLR to extend your kill range."
          : "Limited long-range threat. Practice scoped weapons in Training Ground at 200m+ targets.",
  });

  // Top weapon mention
  if (stats.topWeapon) {
    findings.push({
      metric: `${stats.topWeapon} Usage`,
      value: "Primary",
      verdict: "decent",
      category: "utility",
      message: `Your go-to weapon is the ${stats.topWeapon}. Most pros run AKM + sniper or M416 + sniper — make sure your secondary covers the gap your primary leaves.`,
    });
  }

  // Favorite map
  if (stats.favoriteMap) {
    findings.push({
      metric: `${stats.favoriteMap} Drop`,
      value: "Preferred",
      verdict: "decent",
      category: "map",
      message: `You play ${stats.favoriteMap} most. If WR is dragging, try the smaller maps (Sanhok/Livik) to push more games per hour.`,
    });
  }

  const strong = findings.filter((f) => f.verdict === "strong").length;
  const decent = findings.filter((f) => f.verdict === "decent").length;
  const weak = findings.filter((f) => f.verdict === "weak").length;

  let headline: string;
  if (weak === 0 && strong >= 5) headline = "Pro-tier numbers — your tier should reflect this soon.";
  else if (weak >= 5) headline = "Lots to fix, but pick one weakness and grind it for a week.";
  else if (strong >= weak * 2) headline = "Solid fragger fundamentals — endgame polish will push you up the tiers.";
  else if (weak > strong) headline = "You frag well but die before the final zone. Survive longer to climb.";
  else headline = "Balanced player — focus your next 50 matches on one weakness.";

  return {
    game: "bgmi",
    inGameName: stats.inGameName,
    rank: stats.tier,
    matchesPlayed: stats.matchesPlayed,
    winRate: Math.round(winRate),
    generatedAt: new Date().toISOString(),
    fromMock: false,
    summary: { strongCount: strong, decentCount: decent, weakCount: weak, headline },
    findings,
    rawStats: stats,
  };
}
