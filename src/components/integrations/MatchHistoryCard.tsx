"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Skull, Swords, Clock, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MatchHistoryItem {
  id: string;
  game_id: string;
  external_match_id: string;
  game_mode: string | null;
  map_name: string | null;
  agent_or_champion: string | null;
  result: "win" | "loss" | "draw" | null;
  score: Record<string, unknown> | null;
  stats: Record<string, unknown>;
  duration_seconds: number | null;
  played_at: string;
}

interface MatchHistoryCardProps {
  match: MatchHistoryItem;
  gameName?: string;
}

const resultColors = {
  win: "bg-green-500/20 text-green-300 border-green-500/50",
  loss: "bg-red-500/20 text-red-300 border-red-500/50",
  draw: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
};

const gameIcons: Record<string, string> = {
  valorant: "VAL",
  cs2: "CS2",
  "pubg-mobile": "PUBG",
  freefire: "FF",
  coc: "COC",
  "cod-mobile": "COD",
};

export function MatchHistoryCard({ match, gameName }: MatchHistoryCardProps) {
  const result = match.result || "draw";
  const stats = match.stats as Record<string, number>;
  const score = match.score as Record<string, number> | null;

  const kda = stats.kills !== undefined && stats.deaths !== undefined && stats.assists !== undefined
    ? `${stats.kills}/${stats.deaths}/${stats.assists}`
    : null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card
      className={cn(
        "p-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors",
        result === "win" && "border-l-2 border-l-green-500",
        result === "loss" && "border-l-2 border-l-red-500"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Game Icon */}
        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-zinc-400">
            {gameIcons[match.game_id] || match.game_id.slice(0, 3).toUpperCase()}
          </span>
        </div>

        {/* Match Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn("text-xs", resultColors[result])}
            >
              {result === "win" ? (
                <Trophy className="h-3 w-3 mr-1" />
              ) : result === "loss" ? (
                <Skull className="h-3 w-3 mr-1" />
              ) : (
                <Swords className="h-3 w-3 mr-1" />
              )}
              {result.charAt(0).toUpperCase() + result.slice(1)}
            </Badge>

            {match.game_mode && (
              <span className="text-xs text-zinc-500 capitalize">
                {match.game_mode.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            {/* Character/Agent */}
            {match.agent_or_champion && (
              <span className="text-white font-medium truncate max-w-[100px]">
                {match.agent_or_champion}
              </span>
            )}

            {/* KDA */}
            {kda && (
              <span className="text-zinc-400">
                <Swords className="h-3 w-3 inline mr-1" />
                {kda}
              </span>
            )}

            {/* Score */}
            {score && (score.team_score !== undefined || score.team_kills !== undefined) && (
              <span className="text-zinc-500">
                {score.team_score !== undefined
                  ? `${score.team_score} - ${score.enemy_score}`
                  : `${score.team_kills} kills`}
              </span>
            )}
          </div>
        </div>

        {/* Right Side Info */}
        <div className="text-right shrink-0">
          {/* Map */}
          {match.map_name && (
            <div className="flex items-center justify-end gap-1 text-xs text-zinc-500 mb-1">
              <MapPin className="h-3 w-3" />
              <span className="capitalize">{match.map_name}</span>
            </div>
          )}

          {/* Duration */}
          {match.duration_seconds && (
            <div className="flex items-center justify-end gap-1 text-xs text-zinc-500 mb-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(match.duration_seconds)}</span>
            </div>
          )}

          {/* Time ago */}
          <p className="text-xs text-zinc-600">
            {formatDistanceToNow(new Date(match.played_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  );
}

interface MatchHistoryListProps {
  matches: MatchHistoryItem[];
  gameName?: string;
  maxItems?: number;
}

export function MatchHistoryList({
  matches,
  gameName,
  maxItems = 10,
}: MatchHistoryListProps) {
  const displayMatches = matches.slice(0, maxItems);

  if (displayMatches.length === 0) {
    return (
      <Card className="p-6 text-center bg-zinc-900/50 border-zinc-800">
        <Swords className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">No match history yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {displayMatches.map((match) => (
        <MatchHistoryCard key={match.id} match={match} gameName={gameName} />
      ))}
    </div>
  );
}
