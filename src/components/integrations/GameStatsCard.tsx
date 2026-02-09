"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2, TrendingUp, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface StatField {
  key: string;
  label: string;
}

interface GameStatsCardProps {
  gameId: string;
  gameName: string;
  stats: Record<string, unknown>;
  rankInfo: Record<string, unknown>;
  statFields: StatField[];
  syncedAt: string | null;
  onSync: () => void;
  isSyncing?: boolean;
}

const gameColors: Record<string, string> = {
  valorant: "from-red-500/20 to-red-900/20 border-red-500/30",
  cs2: "from-orange-500/20 to-orange-900/20 border-orange-500/30",
  "pubg-mobile": "from-yellow-500/20 to-yellow-900/20 border-yellow-500/30",
  freefire: "from-orange-500/20 to-red-900/20 border-orange-500/30",
  coc: "from-green-500/20 to-yellow-900/20 border-green-500/30",
  "cod-mobile": "from-orange-600/20 to-gray-900/20 border-orange-600/30",
};

const gameLogos: Record<string, string> = {
  valorant: "VAL",
  cs2: "CS2",
  "pubg-mobile": "PUBG",
  freefire: "FF",
  coc: "COC",
  "cod-mobile": "COD",
};

export function GameStatsCard({
  gameId,
  gameName,
  stats,
  rankInfo,
  statFields,
  syncedAt,
  onSync,
  isSyncing,
}: GameStatsCardProps) {
  const colorClass = gameColors[gameId] || "from-zinc-500/20 to-zinc-900/20 border-zinc-500/30";
  const hasStats = Object.keys(stats).length > 0;
  const hasRank = rankInfo && Object.keys(rankInfo).length > 0 && rankInfo.tier_name;

  return (
    <Card
      className={cn(
        "overflow-hidden bg-gradient-to-br border",
        colorClass
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {gameLogos[gameId] || gameId.toUpperCase().slice(0, 3)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{gameName}</h3>
              {syncedAt && (
                <p className="text-xs text-zinc-500">
                  Updated{" "}
                  {formatDistanceToNow(new Date(syncedAt), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="text-zinc-400 hover:text-white"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Rank Badge */}
        {hasRank && (
          <div className="mt-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <Badge
              variant="outline"
              className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
            >
              {String(rankInfo.tier_name)}
            </Badge>
            {rankInfo.lp !== undefined && (
              <span className="text-sm text-zinc-400">{String(rankInfo.lp)} LP</span>
            )}
            {rankInfo.ranking_in_tier !== undefined && (
              <span className="text-sm text-zinc-400">
                {String(rankInfo.ranking_in_tier)} RR
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        {hasStats ? (
          <div className="grid grid-cols-3 gap-4">
            {statFields.map((field) => {
              const value = stats[field.key];
              if (value === undefined) return null;

              return (
                <div key={field.key} className="text-center">
                  <p className="text-lg font-bold text-white">
                    {String(value)}
                  </p>
                  <p className="text-xs text-zinc-500">{field.label}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <TrendingUp className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">
              No stats yet. Click sync to fetch your data.
            </p>
          </div>
        )}
      </div>

      {/* Win Rate Bar (if available) */}
      {stats.win_rate && typeof stats.games_played === "number" && stats.games_played > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Win Rate</span>
            <span>{String(stats.win_rate)}</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
              style={{
                width: String(stats.win_rate),
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
