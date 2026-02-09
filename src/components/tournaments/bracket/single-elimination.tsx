"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BracketMatch } from "./bracket-match";
import { BracketConnector } from "./bracket-connector";
import { getRoundName } from "@/lib/tournament/bracket-generator";
import type { TournamentMatchWithTeams } from "@/types/database";

interface SingleEliminationBracketProps {
  matches: TournamentMatchWithTeams[];
  onMatchClick?: (match: TournamentMatchWithTeams) => void;
  isOrganizer?: boolean;
  className?: string;
}

export function SingleEliminationBracket({
  matches,
  onMatchClick,
  className,
}: SingleEliminationBracketProps) {
  const rounds = useMemo(() => {
    if (!matches.length) return [];

    // Filter to winners bracket and finals only
    const bracketMatches = matches.filter(
      (m) => m.bracket_type === "winners" || m.bracket_type === "finals"
    );

    const maxRound = Math.max(...bracketMatches.map((m) => m.round));

    return Array.from({ length: maxRound }, (_, i) => ({
      number: i + 1,
      name: getRoundName(i + 1, maxRound),
      matches: bracketMatches
        .filter((m) => m.round === i + 1)
        .sort((a, b) => a.match_number - b.match_number),
    }));
  }, [matches]);

  if (!rounds.length) {
    return (
      <div className="flex items-center justify-center p-8 text-text-muted">
        No bracket data available
      </div>
    );
  }

  return (
    <div className={cn("bracket-container overflow-x-auto pb-4", className)}>
      <div className="flex gap-8 min-w-max p-4">
        {rounds.map((round, roundIndex) => (
          <div key={round.number} className="bracket-round flex flex-col">
            {/* Round Header */}
            <div className="text-center mb-4">
              <h3 className="text-sm font-medium text-text-muted">
                {round.name}
              </h3>
            </div>

            {/* Matches */}
            <div
              className="flex flex-col justify-around flex-1"
              style={{
                gap: `${Math.pow(2, roundIndex) * 24}px`,
              }}
            >
              {round.matches.map((match, matchIndex) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: roundIndex * 0.1 + matchIndex * 0.05,
                    duration: 0.3,
                  }}
                  className="relative"
                >
                  <BracketMatch
                    match={match}
                    onClick={onMatchClick ? () => onMatchClick(match) : undefined}
                  />

                  {/* Connector to next round */}
                  {roundIndex < rounds.length - 1 && (
                    <BracketConnector
                      matchIndex={matchIndex}
                      roundIndex={roundIndex}
                      totalMatchesInRound={round.matches.length}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
