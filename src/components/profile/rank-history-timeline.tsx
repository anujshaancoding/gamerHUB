"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { AnimatedRankEmblem } from "@/components/profile/animated-rank-emblem";
import { useGameTheme } from "@/components/profile/game-theme-provider";

interface RankMilestone {
  id: string;
  rank: string;
  gameSlug: string;
  gameName: string;
  gameIcon?: string;
  date: string;
  isCurrent?: boolean;
}

interface RankHistoryTimelineProps {
  milestones: RankMilestone[];
}

export function RankHistoryTimeline({ milestones }: RankHistoryTimelineProps) {
  const { theme } = useGameTheme();

  if (milestones.length === 0) {
    return (
      <Card className="gaming-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <History className="h-5 w-5" style={{ color: theme.colors.primary }} />
            </div>
            Rank History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <History className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-muted text-sm">No rank milestones yet</p>
            <p className="text-text-dim text-xs mt-1">Rank changes will be tracked here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gaming-card-border overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
            <History className="h-5 w-5" style={{ color: theme.colors.primary }} />
          </div>
          Rank History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Horizontal scrollable timeline */}
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
          <div className="flex items-center gap-0 min-w-max py-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-center">
                {/* Node */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    flex flex-col items-center gap-2 px-3
                    ${milestone.isCurrent ? "scale-110" : ""}
                  `}
                >
                  {/* Game icon */}
                  {milestone.gameIcon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={milestone.gameIcon}
                      alt={milestone.gameName}
                      className="w-5 h-5 rounded opacity-60"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}

                  {/* Rank emblem */}
                  <AnimatedRankEmblem
                    rank={milestone.rank}
                    gameSlug={milestone.gameSlug}
                    size={milestone.isCurrent ? "md" : "sm"}
                  />

                  {/* Date */}
                  <p className="text-[10px] text-text-muted whitespace-nowrap">
                    {new Date(milestone.date).toLocaleDateString(undefined, {
                      month: "short",
                      year: "2-digit",
                    })}
                  </p>

                  {/* Current indicator */}
                  {milestone.isCurrent && (
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        color: theme.colors.primary,
                        backgroundColor: `${theme.colors.primary}20`,
                      }}
                    >
                      Current
                    </span>
                  )}
                </motion.div>

                {/* Connector line (not after last item) */}
                {index < milestones.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 + 0.05 }}
                    className="w-8 h-0.5 rounded-full origin-left"
                    style={{ background: theme.gradient.accent }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
