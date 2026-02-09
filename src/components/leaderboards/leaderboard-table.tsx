"use client";

import { useState } from "react";
import { Filter, Trophy, Loader2 } from "lucide-react";
import { Card, Button, Badge } from "@/components/ui";
import { LeaderboardEntryRow } from "./leaderboard-entry";
import type { LeaderboardEntry, Game } from "@/types/database";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId?: string;
  showGame?: boolean;
  title?: string;
  games?: Game[];
  selectedGame?: string;
  onGameChange?: (gameId: string | undefined) => void;
  regions?: string[];
  selectedRegion?: string;
  onRegionChange?: (region: string | undefined) => void;
}

export function LeaderboardTable({
  entries,
  loading,
  error,
  hasMore,
  onLoadMore,
  currentUserId,
  showGame = false,
  title = "Leaderboard",
  games,
  selectedGame,
  onGameChange,
  regions,
  selectedRegion,
  onRegionChange,
}: LeaderboardTableProps) {
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
          <Trophy className="h-5 w-5 text-warning" />
          <h2 className="text-xl font-bold text-text">{title}</h2>
          {entries.length > 0 && (
            <Badge variant="outline" size="sm">
              {entries.length} players
            </Badge>
          )}
        </div>
        {(games || regions) && (
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
      {showFilters && (games || regions) && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            {games && onGameChange && (
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Game
                </label>
                <select
                  value={selectedGame || ""}
                  onChange={(e) =>
                    onGameChange(e.target.value || undefined)
                  }
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
            {regions && onRegionChange && (
              <div>
                <label className="text-sm text-text-muted mb-1 block">
                  Region
                </label>
                <select
                  value={selectedRegion || ""}
                  onChange={(e) =>
                    onRegionChange(e.target.value || undefined)
                  }
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Regions</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="space-y-2">
        {loading && entries.length === 0 ? (
          <Card className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-text-muted">Loading leaderboard...</p>
          </Card>
        ) : entries.length === 0 ? (
          <Card className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-text-muted mb-3" />
            <p className="text-text-muted">No players on the leaderboard yet</p>
            <p className="text-sm text-text-muted mt-1">
              Complete matches and challenges to earn points!
            </p>
          </Card>
        ) : (
          <>
            {entries.map((entry) => (
              <LeaderboardEntryRow
                key={entry.id}
                entry={entry}
                showGame={showGame}
                isCurrentUser={currentUserId === entry.user_id}
              />
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={loading}
                >
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
    </div>
  );
}
