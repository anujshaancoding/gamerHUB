"use client";

interface BracketConnectorProps {
  matchIndex: number;
  roundIndex: number;
  totalMatchesInRound: number;
}

export function BracketConnector({
  matchIndex,
  roundIndex,
  totalMatchesInRound,
}: BracketConnectorProps) {
  // Match height and base gap (must match bracket layout)
  const matchHeight = 80;
  const baseGap = 24;
  const horizontalLength = 32;

  // Calculate vertical spacing based on round depth
  const verticalGap = Math.pow(2, roundIndex) * baseGap;
  const totalHeight = matchHeight + verticalGap;

  // Determine if this match is the top or bottom of a pair
  const isTopOfPair = matchIndex % 2 === 0;

  // Only draw connectors for matches that advance to the next round
  // Skip if this is the last match in an odd-numbered round
  if (totalMatchesInRound === 1 || (totalMatchesInRound % 2 === 1 && matchIndex === totalMatchesInRound - 1)) {
    return null;
  }

  return (
    <svg
      className="absolute top-1/2 -right-8 pointer-events-none text-border"
      width={horizontalLength}
      height={totalHeight}
      style={{
        transform: isTopOfPair
          ? "translateY(-50%)"
          : `translateY(calc(-50% - ${totalHeight}px))`,
      }}
    >
      {/* Horizontal line from match */}
      <line
        x1="0"
        y1={isTopOfPair ? matchHeight / 2 : totalHeight - matchHeight / 2}
        x2={horizontalLength / 2}
        y2={isTopOfPair ? matchHeight / 2 : totalHeight - matchHeight / 2}
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Vertical line connecting pair */}
      {isTopOfPair && (
        <line
          x1={horizontalLength / 2}
          y1={matchHeight / 2}
          x2={horizontalLength / 2}
          y2={totalHeight - matchHeight / 2}
          stroke="currentColor"
          strokeWidth="2"
        />
      )}

      {/* Horizontal line to next match */}
      {isTopOfPair && (
        <line
          x1={horizontalLength / 2}
          y1={totalHeight / 2}
          x2={horizontalLength}
          y2={totalHeight / 2}
          stroke="currentColor"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
