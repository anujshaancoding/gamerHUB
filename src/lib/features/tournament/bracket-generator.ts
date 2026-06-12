import type { BracketMatch, BracketType } from "@/types/database";

/**
 * Generate standard tournament seeding order (1v16, 8v9, 4v13, etc.)
 * This ensures top seeds don't meet until later rounds
 */
export function generateSeedOrder(teamCount: number): number[] {
  const order: number[] = [1];
  let size = 1;

  while (size < teamCount) {
    const newOrder: number[] = [];
    for (const seed of order) {
      newOrder.push(seed);
      newOrder.push(size * 2 + 1 - seed);
    }
    order.length = 0;
    order.push(...newOrder);
    size *= 2;
  }

  return order;
}

/**
 * Get the next power of 2 that can accommodate the team count
 */
export function getBracketSize(teamCount: number): number {
  return Math.pow(2, Math.ceil(Math.log2(teamCount)));
}

/**
 * Get round name based on round number and total rounds
 */
export function getRoundName(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  switch (fromFinal) {
    case 0:
      return "Finals";
    case 1:
      return "Semi-Finals";
    case 2:
      return "Quarter-Finals";
    default:
      return `Round ${round}`;
  }
}

/**
 * Generate single elimination bracket structure
 */
export function generateSingleEliminationBracket(
  teamCount: number
): BracketMatch[] {
  const rounds = Math.ceil(Math.log2(teamCount));
  const bracketSize = getBracketSize(teamCount);
  const matches: BracketMatch[] = [];
  const seedOrder = generateSeedOrder(bracketSize);

  // Generate first round matches
  const firstRoundMatchCount = bracketSize / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    const seed1 = seedOrder[i * 2];
    const seed2 = seedOrder[i * 2 + 1];

    const match: BracketMatch = {
      id: `r1-m${i + 1}`,
      round: 1,
      matchNumber: i + 1,
      bracketType: rounds === 1 ? "finals" : "winners",
      team1Seed: seed1 <= teamCount ? seed1 : null,
      team2Seed: seed2 <= teamCount ? seed2 : null,
      winnerAdvancesTo:
        rounds > 1
          ? {
              round: 2,
              matchNumber: Math.ceil((i + 1) / 2),
              slot: i % 2 === 0 ? "team1" : "team2",
            }
          : null,
    };

    matches.push(match);
  }

  // Generate subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    const bracketType: BracketType = round === rounds ? "finals" : "winners";

    for (let i = 0; i < matchesInRound; i++) {
      const match: BracketMatch = {
        id: `r${round}-m${i + 1}`,
        round,
        matchNumber: i + 1,
        bracketType,
        team1Seed: null,
        team2Seed: null,
        winnerAdvancesTo:
          round < rounds
            ? {
                round: round + 1,
                matchNumber: Math.ceil((i + 1) / 2),
                slot: i % 2 === 0 ? "team1" : "team2",
              }
            : null,
      };

      matches.push(match);
    }
  }

  return matches;
}

/**
 * Calculate bracket layout dimensions
 */
export function calculateBracketDimensions(
  teamCount: number,
  matchHeight: number = 80,
  matchGap: number = 24,
  roundGap: number = 80
): {
  width: number;
  height: number;
  rounds: number;
  matchWidth: number;
} {
  const rounds = Math.ceil(Math.log2(teamCount));
  const bracketSize = getBracketSize(teamCount);
  const firstRoundMatches = bracketSize / 2;
  const matchWidth = 224; // w-56 = 14rem = 224px

  // Height is determined by first round (most matches)
  const height = firstRoundMatches * matchHeight + (firstRoundMatches - 1) * matchGap;

  // Width is determined by number of rounds
  const width = rounds * matchWidth + (rounds - 1) * roundGap;

  return {
    width,
    height,
    rounds,
    matchWidth,
  };
}

/**
 * Get vertical position for a match in the bracket
 */
export function getMatchVerticalPosition(
  round: number,
  matchNumber: number,
  totalRounds: number,
  matchHeight: number = 80,
  baseGap: number = 24
): number {
  // First round matches are evenly spaced
  // Each subsequent round's matches are centered between their source matches

  if (round === 1) {
    return (matchNumber - 1) * (matchHeight + baseGap);
  }

  // For later rounds, center between the two source matches
  const sourceMatch1 = (matchNumber - 1) * 2 + 1;
  const sourceMatch2 = sourceMatch1 + 1;

  const pos1 = getMatchVerticalPosition(
    round - 1,
    sourceMatch1,
    totalRounds,
    matchHeight,
    baseGap
  );
  const pos2 = getMatchVerticalPosition(
    round - 1,
    sourceMatch2,
    totalRounds,
    matchHeight,
    baseGap
  );

  return (pos1 + pos2) / 2;
}

/**
 * Fisher-Yates shuffle for random seeding
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
