"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Star } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { PremiumBadge } from "@/components/premium";
import type { LeaderboardEntry } from "@/types/database";

interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  showGame?: boolean;
  isCurrentUser?: boolean;
}

export function LeaderboardEntryRow({
  entry,
  showGame = false,
  isCurrentUser = false,
}: LeaderboardEntryProps) {
  const rankChange = entry.rank_change || 0;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankChangeIndicator = () => {
    if (rankChange > 0) {
      return (
        <span className="flex items-center gap-0.5 text-success text-xs">
          <TrendingUp className="h-3 w-3" />
          {rankChange}
        </span>
      );
    }
    if (rankChange < 0) {
      return (
        <span className="flex items-center gap-0.5 text-error text-xs">
          <TrendingDown className="h-3 w-3" />
          {Math.abs(rankChange)}
        </span>
      );
    }
    return <Minus className="h-3 w-3 text-text-muted" />;
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
        isCurrentUser
          ? "bg-primary/10 border border-primary/30"
          : "bg-surface hover:bg-surface-light"
      }`}
    >
      {/* Rank */}
      <div className="flex items-center gap-2 w-16">
        <span
          className={`font-bold ${
            entry.computed_rank <= 3 ? "text-lg" : "text-base"
          } ${isCurrentUser ? "text-primary" : "text-text"}`}
        >
          #{entry.computed_rank}
        </span>
        {getRankIcon(entry.computed_rank)}
      </div>

      {/* Rank Change */}
      <div className="w-10">{getRankChangeIndicator()}</div>

      {/* User Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link href={`/profile/${entry.username}`}>
          <Avatar
            src={entry.avatar_url}
            alt={entry.username}
            size="sm"
            fallback={entry.username?.charAt(0) || "?"}
          />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/profile/${entry.username}`}
              className="font-medium text-text hover:text-primary truncate"
            >
              {entry.display_name || entry.username}
            </Link>
            {entry.is_premium && (
              <PremiumBadge size="sm" showLabel={false} animate={false} />
            )}
          </div>
          {showGame && entry.game_name && (
            <span className="text-xs text-text-muted">{entry.game_name}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-sm text-text-muted">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {entry.matches_won}/{entry.matches_played}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          {entry.challenges_completed}
        </span>
      </div>

      {/* Points */}
      <div className="text-right">
        <span className="font-bold text-primary text-lg">
          {entry.total_points.toLocaleString()}
        </span>
        <p className="text-xs text-text-muted">points</p>
      </div>
    </div>
  );
}
