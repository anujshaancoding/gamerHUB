"use client";

import { motion } from "framer-motion";
import {
  Crosshair,
  TrendingUp,
  Clock,
  Trophy,
  Gamepad2,
  Award,
  Flame,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";

interface StatDefinition {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  format: (v: number) => string;
}

const STAT_DEFINITIONS: StatDefinition[] = [
  { key: "matches_played", label: "Matches", icon: Gamepad2, format: (v) => v.toLocaleString() },
  { key: "matches_won", label: "Wins", icon: Trophy, format: (v) => v.toLocaleString() },
  { key: "win_rate", label: "Win Rate", icon: TrendingUp, format: (v) => `${v}%` },
  { key: "kd_ratio", label: "K/D", icon: Crosshair, format: (v) => v.toFixed(2) },
  { key: "hours_played", label: "Hours", icon: Clock, format: (v) => v.toLocaleString() },
  { key: "games_linked", label: "Games", icon: Gamepad2, format: (v) => v.toString() },
  { key: "badge_count", label: "Badges", icon: Award, format: (v) => v.toString() },
  { key: "win_streak", label: "Win Streak", icon: Flame, format: (v) => v.toString() },
];

interface StatTrackersProps {
  /** Map of stat key to numeric value */
  stats: Record<string, number>;
  /** Which 3 stat keys to display (defaults to first 3) */
  pinnedStats?: string[];
}

export function StatTrackers({ stats, pinnedStats }: StatTrackersProps) {
  const { theme } = useGameTheme();

  // Resolve which 3 stats to show
  const displayKeys = pinnedStats?.slice(0, 3) ?? ["matches_played", "matches_won", "games_linked"];

  const displayStats = displayKeys
    .map((key) => {
      const def = STAT_DEFINITIONS.find((d) => d.key === key);
      if (!def) return null;
      return { ...def, value: stats[key] ?? 0 };
    })
    .filter(Boolean) as (StatDefinition & { value: number })[];

  return (
    <Card className="gaming-card-border overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
            <Zap className="h-5 w-5" style={{ color: theme.colors.primary }} />
          </div>
          Trackers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-3 rounded-xl bg-surface-light/50 border border-border hover:border-opacity-60 transition-all group"
                style={{
                  ["--hover-border" as string]: theme.colors.primary,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${theme.colors.primary}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: theme.colors.primary }} />
                </div>
                <motion.p
                  className="text-2xl font-black tabular-nums"
                  style={{ color: theme.colors.textAccent }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {stat.format(stat.value)}
                </motion.p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1 font-medium">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
