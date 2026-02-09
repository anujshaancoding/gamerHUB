"use client";

import { useState } from "react";
import { Filter, Target, Loader2 } from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { ChallengeCard } from "./challenge-card";
import type { ChallengeWithProgress, Game } from "@/types/database";

interface ChallengeListProps {
  challenges: ChallengeWithProgress[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onJoinChallenge?: (challengeId: string) => Promise<void>;
  joiningId?: string;
  title?: string;
  games?: Game[];
  selectedGame?: string;
  onGameChange?: (gameId: string | undefined) => void;
  selectedPeriod?: string;
  onPeriodChange?: (period: string | undefined) => void;
  selectedDifficulty?: string;
  onDifficultyChange?: (difficulty: string | undefined) => void;
}

const PERIODS = ["daily", "weekly", "monthly", "seasonal", "event"];
const DIFFICULTIES = ["easy", "medium", "hard", "legendary"];

export function ChallengeList({
  challenges,
  loading,
  error,
  hasMore,
  onLoadMore,
  onJoinChallenge,
  joiningId,
  title = "Challenges",
  games,
  selectedGame,
  onGameChange,
  selectedPeriod,
  onPeriodChange,
  selectedDifficulty,
  onDifficultyChange,
}: ChallengeListProps) {
  const [showFilters, setShowFilters] = useState(false);

  if (error) {
    return (
      <Card className="text-center py-8">
        <p className="text-error">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-text">{title}</h2>
          {challenges.length > 0 && (
            <Badge variant="outline" size="sm">
              {challenges.length} active
            </Badge>
          )}
        </div>
        {(games || onPeriodChange || onDifficultyChange) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            {games && onGameChange && (
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Game
                </label>
                <select
                  value={selectedGame || ""}
                  onChange={(e) => onGameChange(e.target.value || undefined)}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Games</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {onPeriodChange && (
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Period
                </label>
                <select
                  value={selectedPeriod || ""}
                  onChange={(e) => onPeriodChange(e.target.value || undefined)}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Periods</option>
                  {PERIODS.map((period) => (
                    <option key={period} value={period}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {onDifficultyChange && (
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty || ""}
                  onChange={(e) =>
                    onDifficultyChange(e.target.value || undefined)
                  }
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Difficulties</option>
                  {DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Grid */}
      {loading && challenges.length === 0 ? (
        <Card className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-text-muted">Loading challenges...</p>
        </Card>
      ) : challenges.length === 0 ? (
        <Card className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">No challenges available</p>
          <p className="text-sm text-text-muted mt-1">
            Check back later for new challenges!
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={
                  onJoinChallenge
                    ? () => onJoinChallenge(challenge.id)
                    : undefined
                }
                joining={joiningId === challenge.id}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={onLoadMore} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
