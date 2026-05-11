"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Clock,
  Zap,
  Target,
  Flame,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import type { Profile } from "@/types/database";

interface ActivityDayInput {
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  minutes_online: number;
}

interface ProfileStatsProps {
  profile: Profile;
  matchesPlayed: number;
  gamesLinked: number;
  activityDays?: ActivityDayInput[];
}

const MIN_DAYS_FOR_AUTO_HOURS = 3;

function formatHHMM(totalMinutes: number): string {
  const h = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
  const m = ((Math.round(totalMinutes) % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Average a set of timestamps modulo 24h using vector math so values straddling
// midnight don't average to noon.
function averageTimeOfDay(timestamps: string[]): number | null {
  if (timestamps.length === 0) return null;
  let sumX = 0;
  let sumY = 0;
  for (const ts of timestamps) {
    const d = new Date(ts);
    const minutes = d.getHours() * 60 + d.getMinutes();
    const angle = (minutes / (24 * 60)) * 2 * Math.PI;
    sumX += Math.cos(angle);
    sumY += Math.sin(angle);
  }
  const meanAngle = Math.atan2(sumY / timestamps.length, sumX / timestamps.length);
  const normalized = (meanAngle + 2 * Math.PI) % (2 * Math.PI);
  return (normalized / (2 * Math.PI)) * 24 * 60;
}

export function ProfileStats({
  profile,
  matchesPlayed,
  gamesLinked,
  activityDays,
}: ProfileStatsProps) {
  const { theme } = useGameTheme();

  const autoHours = useMemo(() => {
    if (!activityDays || activityDays.length === 0) return null;
    const validDays = activityDays.filter(
      (d) => d.first_seen_at && d.last_seen_at && d.minutes_online > 0,
    );
    if (validDays.length < MIN_DAYS_FOR_AUTO_HOURS) return null;

    const startMins = averageTimeOfDay(validDays.map((d) => d.first_seen_at as string));
    const endMins = averageTimeOfDay(validDays.map((d) => d.last_seen_at as string));
    if (startMins === null || endMins === null) return null;

    return { start: formatHHMM(startMins), end: formatHHMM(endMins) };
  }, [activityDays]);

  const manualHours = (profile.online_hours && typeof profile.online_hours === "object"
    ? (profile.online_hours as { start?: string; end?: string })
    : null);

  const startTime = autoHours?.start || manualHours?.start;
  const endTime = autoHours?.end || manualHours?.end;
  const hasOnlineHours = Boolean(startTime && endTime);

  const statItems = [
    { label: "Games Linked", value: gamesLinked, icon: Gamepad2, color: theme.colors.primary },
    { label: "Matches Played", value: matchesPlayed, icon: Trophy, color: theme.colors.accent },
    { label: "Gaming Style", value: profile.gaming_style || "Not set", icon: Target, color: theme.colors.textAccent, isText: true },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="gaming-card-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <Zap className="h-5 w-5" style={{ color: theme.colors.primary }} />
              </div>
              Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {statItems.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="stat-card-gaming flex items-center justify-between p-3 rounded-lg group"
                >
                  <span className="flex items-center gap-3 text-text-secondary">
                    <div
                      className="p-2 rounded-lg transition-all group-hover:scale-110"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                    </div>
                    {stat.label}
                  </span>
                  <span
                    className={`font-bold ${stat.isText ? "capitalize text-text" : "text-xl"}`}
                    style={!stat.isText ? { color: stat.color } : undefined}
                  >
                    {stat.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gaming Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="gaming-card-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.accent}20` }}>
                <Clock className="h-5 w-5" style={{ color: theme.colors.accent }} />
              </div>
              Usually Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasOnlineHours ? (
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <div className="text-center">
                  <p className="text-lg sm:text-2xl font-bold tabular-nums" style={{ color: theme.colors.primary }}>
                    {startTime}
                  </p>
                  <p className="text-[10px] sm:text-xs text-text-muted uppercase">Start</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-text-muted">
                  <div
                    className="w-4 sm:w-8 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent})` }}
                  />
                  <Flame className="h-4 sm:h-5 w-4 sm:w-5 text-warning animate-pulse" />
                  <div
                    className="w-4 sm:w-8 h-0.5 rounded-full"
                    style={{ background: `linear-gradient(to right, ${theme.colors.accent}, ${theme.colors.textAccent})` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-2xl font-bold tabular-nums" style={{ color: theme.colors.accent }}>
                    {endTime}
                  </p>
                  <p className="text-[10px] sm:text-xs text-text-muted uppercase">End</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-text-muted text-sm">Not enough activity yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
