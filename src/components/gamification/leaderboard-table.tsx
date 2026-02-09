"use client";

import { Trophy, Medal, Award } from "lucide-react";
import { Avatar } from "@/components/ui";
import { LevelBadge } from "./level-badge";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_xp?: number;
  xp?: number;
  active_title?: { name: string; color: string | null } | null;
  active_frame?: { image_url: string } | null;
  is_current_user: boolean;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry | null;
  showXP?: boolean;
  className?: string;
}

const rankIcons = {
  1: <Trophy className="w-5 h-5 text-yellow-500" />,
  2: <Medal className="w-5 h-5 text-gray-400" />,
  3: <Award className="w-5 h-5 text-amber-600" />,
};

export function LeaderboardTable({
  entries,
  userRank,
  showXP = true,
  className,
}: LeaderboardTableProps) {
  const renderEntry = (entry: LeaderboardEntry, isHighlighted = false) => (
    <div
      key={entry.user_id}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg transition-colors",
        isHighlighted
          ? "bg-primary/10 border border-primary/30"
          : entry.rank <= 3
            ? "bg-surface-light"
            : "hover:bg-surface-light"
      )}
    >
      {/* Rank */}
      <div className="w-10 flex items-center justify-center">
        {rankIcons[entry.rank as 1 | 2 | 3] || (
          <span className="text-lg font-bold text-text-muted">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Avatar with frame */}
      <div className="relative">
        <Avatar
          src={entry.avatar_url}
          fallback={entry.display_name || entry.username}
          size="md"
        />
        {entry.active_frame && (
          <img
            src={entry.active_frame.image_url}
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text truncate">
            {entry.display_name || entry.username}
          </span>
          <LevelBadge level={entry.level} size="sm" />
        </div>
        {entry.active_title && (
          <p
            className="text-xs"
            style={{ color: entry.active_title.color || undefined }}
          >
            {entry.active_title.name}
          </p>
        )}
      </div>

      {/* XP */}
      {showXP && (
        <div className="text-right">
          <p className="font-bold text-text">
            {(entry.total_xp || entry.xp || 0).toLocaleString()}
          </p>
          <p className="text-xs text-text-muted">XP</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {entries.map((entry) =>
        renderEntry(entry, entry.is_current_user)
      )}

      {/* Show user rank if not in visible entries */}
      {userRank && !entries.some((e) => e.is_current_user) && (
        <>
          <div className="flex items-center justify-center py-2">
            <span className="text-text-muted text-sm">• • •</span>
          </div>
          {renderEntry(userRank, true)}
        </>
      )}

      {entries.length === 0 && (
        <p className="text-center text-text-muted py-8">
          No entries yet. Start playing to appear on the leaderboard!
        </p>
      )}
    </div>
  );
}
