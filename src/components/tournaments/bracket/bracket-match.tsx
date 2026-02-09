"use client";

import { forwardRef } from "react";
import { Trophy, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { TournamentMatchWithTeams } from "@/types/database";

interface BracketMatchProps {
  match: TournamentMatchWithTeams;
  onClick?: () => void;
  showActions?: boolean;
  className?: string;
}

const statusConfig = {
  pending: { color: "text-text-muted", bg: "bg-surface" },
  scheduled: { color: "text-primary", bg: "bg-surface" },
  ready: { color: "text-success", bg: "bg-surface" },
  in_progress: { color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  completed: { color: "text-success", bg: "bg-surface-light" },
  bye: { color: "text-text-muted", bg: "bg-surface/50" },
  forfeit: { color: "text-error", bg: "bg-error/10" },
};

export const BracketMatch = forwardRef<HTMLDivElement, BracketMatchProps>(
  ({ match, onClick, className }, ref) => {
    const config = statusConfig[match.status] || statusConfig.pending;

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "bracket-match w-56 rounded-lg border border-border overflow-hidden",
          "transition-all duration-200",
          onClick && "cursor-pointer hover:border-primary/50",
          config.bg,
          className
        )}
      >
        <TeamSlot
          team={match.team1}
          score={match.team1_score}
          isWinner={match.winner_id === match.team1_id}
          matchStatus={match.status}
        />

        <div className="h-px bg-border" />

        <TeamSlot
          team={match.team2}
          score={match.team2_score}
          isWinner={match.winner_id === match.team2_id}
          matchStatus={match.status}
        />

        {match.scheduled_at && match.status === "scheduled" && (
          <div className="px-2 py-1 text-xs text-text-muted bg-surface-light/50 text-center flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(match.scheduled_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        )}

        {match.disputed && (
          <div className="px-2 py-1 text-xs text-error bg-error/10 text-center flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Disputed
          </div>
        )}
      </div>
    );
  }
);

BracketMatch.displayName = "BracketMatch";

interface TeamSlotProps {
  team: TournamentMatchWithTeams["team1"] | null;
  score: number | null;
  isWinner: boolean;
  matchStatus: string;
}

function TeamSlot({ team, score, isWinner, matchStatus }: TeamSlotProps) {
  const isCompleted = matchStatus === "completed";

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 min-h-[40px]",
        isWinner && isCompleted && "bg-success/10"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {team ? (
          <>
            <Avatar
              src={team.clan?.avatar_url}
              alt={team.clan?.name || "Team"}
              size="sm"
              fallback={team.clan?.tag || "?"}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">
                {team.clan?.name || "Unknown"}
              </p>
              {team.seed && (
                <span className="text-xs text-text-muted">Seed #{team.seed}</span>
              )}
            </div>
          </>
        ) : (
          <span className="text-sm text-text-muted italic pl-1">TBD</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {score !== null && (
          <div
            className={cn(
              "text-lg font-bold min-w-6 text-center",
              isWinner && isCompleted ? "text-success" : "text-text-muted"
            )}
          >
            {score}
          </div>
        )}

        {isWinner && isCompleted && (
          <Trophy className="h-4 w-4 text-warning" />
        )}
      </div>
    </div>
  );
}

export { TeamSlot };
