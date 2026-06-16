"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Calendar, Clock, Flame, TrendingUp, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";

// recharts is heavy (~100KB). Code-split it out of the initial public profile
// bundle: the charts only render below the fold once enough activity data
// exists, so lazy-load them client-side with a lightweight skeleton fallback.
const ActivityCharts = dynamic(
  () => import("@/components/profile/activity-charts").then((m) => m.ActivityCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-[256px] rounded-xl bg-surface-light/30 border border-border animate-pulse" />
        <div className="h-[256px] rounded-xl bg-surface-light/30 border border-border animate-pulse" />
        <div className="h-[256px] md:col-span-2 rounded-xl bg-surface-light/30 border border-border animate-pulse" />
      </div>
    ),
  },
);

interface ActivityDay {
  activity_date: string;
  minutes_online: number;
  first_seen_at?: string;
  last_seen_at?: string;
}

interface ActivityCalendarProps {
  days: ActivityDay[];
  totalHoursOnline: number;
  currentStreak: number;
  longestStreak: number;
  averageDailyMinutes: number;
  memberSince: string;
}

const INTENSITY_OPACITIES = ["0F", "33", "66", "A6", "E6"];
const MIN_ACTIVE_DAYS_FOR_CHARTS = 3;

function getIntensityLevel(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 120) return 2;
  if (minutes < 300) return 3;
  return 4;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ActivityCalendar({
  days,
  totalHoursOnline,
  currentStreak,
  longestStreak,
  averageDailyMinutes,
  memberSince,
}: ActivityCalendarProps) {
  const { theme } = useGameTheme();
  const [tooltip, setTooltip] = useState<{
    date: string;
    minutes: number;
    isJoinDate: boolean;
    isBeforeJoin: boolean;
    x: number;
    y: number;
  } | null>(null);

  const joinDateStr = useMemo(() => {
    const d = new Date(memberSince);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  }, [memberSince]);

  // Normalize activity_date to string (postgres may return Date objects)
  const normalizedDays = useMemo(
    () =>
      days.map((d) => ({
        ...d,
        activity_date:
          typeof d.activity_date === "string"
            ? d.activity_date
            : new Date(d.activity_date).toISOString().substring(0, 10),
      })),
    [days],
  );

  // Build lookup map: YYYY-MM-DD -> minutes
  const dayMap = useMemo(() => {
    const map = new Map<string, number>();
    normalizedDays.forEach((d) => map.set(d.activity_date, d.minutes_online));
    return map;
  }, [normalizedDays]);

  // Count active days for low-data detection
  const activeDaysCount = useMemo(
    () => days.filter((d) => d.minutes_online > 0).length,
    [days],
  );

  // Always build a full 53-week grid (like GitHub). Cells before joinDate are out-of-range.
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const joinDate = new Date(memberSince);
    joinDate.setHours(0, 0, 0, 0);

    // Always start 52 weeks ago, aligned to Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

    const weeks: Array<Array<{ date: string; minutes: number; isInRange: boolean; isJoinDate: boolean } | null>> = [];
    const labels: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;

    const cursor = new Date(start);
    let weekIndex = 0;

    while (cursor <= today || weeks.length < 53) {
      const week: Array<{ date: string; minutes: number; isInRange: boolean; isJoinDate: boolean } | null> = [];

      for (let day = 0; day < 7; day++) {
        if (cursor > today) {
          week.push(null);
        } else {
          const dateStr = cursor.toISOString().split("T")[0];
          const month = cursor.getMonth();

          if (month !== lastMonth) {
            labels.push({ label: MONTH_NAMES[month], weekIndex });
            lastMonth = month;
          }

          week.push({
            date: dateStr,
            minutes: dayMap.get(dateStr) || 0,
            isInRange: cursor >= joinDate,
            isJoinDate: dateStr === joinDateStr,
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      weeks.push(week);
      weekIndex++;

      if (weekIndex > 53) break;
    }

    return { grid: weeks, monthLabels: labels };
  }, [dayMap, memberSince, joinDateStr]);

  const primaryColor = theme.colors.primary;
  const accentColor = theme.colors.accent || "#00d4ff";

  const stats = [
    { icon: Clock, label: "Total Online", value: `${totalHoursOnline}h` },
    { icon: Flame, label: "Current Streak", value: `${currentStreak}d` },
    { icon: TrendingUp, label: "Longest Streak", value: `${longestStreak}d` },
    { icon: Calendar, label: "Avg Daily", value: formatMinutes(averageDailyMinutes) },
  ];

  const hasLowData = activeDaysCount < MIN_ACTIVE_DAYS_FOR_CHARTS;

  return (
    <div className="space-y-4">
      {/* Main Activity Card with Heatmap */}
      <Card className="gaming-card-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
              <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-2 rounded-lg bg-surface-light/50 border border-border"
                >
                  <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: primaryColor }} />
                  <p className="text-lg font-bold tabular-nums" style={{ color: theme.colors.textAccent }}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Calendar heatmap */}
          <div className="pb-2">
            {/* Month labels row */}
            <div style={{ display: "flex", gap: 3, paddingLeft: 28, marginBottom: 4 }}>
              {grid.map((_, wi) => {
                const monthLabel = monthLabels.find((m) => m.weekIndex === wi);
                return (
                  <div key={wi} className="text-[10px] text-text-muted" style={{ flex: 1, minWidth: 0 }}>
                    {monthLabel?.label || ""}
                  </div>
                );
              })}
            </div>

            {/* Grid: day labels + week columns */}
            <div style={{ display: "flex", gap: 3, width: "100%" }}>
              {/* Day labels */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 24, flexShrink: 0 }}>
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="text-[9px] text-text-muted text-right pr-1"
                    style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "flex-end" }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              {grid.map((week, wi) => (
                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
                  {week.map((cell, di) => {
                    if (!cell) {
                      return <div key={di} style={{ aspectRatio: "1", width: "100%" }} />;
                    }

                    const isBeforeJoin = !cell.isInRange;
                    const level = isBeforeJoin ? 0 : getIntensityLevel(cell.minutes);
                    const bgColor = isBeforeJoin
                      ? "rgba(255,255,255,0.02)"
                      : level === 0
                        ? `${primaryColor}${INTENSITY_OPACITIES[0]}`
                        : `${primaryColor}${INTENSITY_OPACITIES[level]}`;

                    const isJoin = cell.isJoinDate;

                    return (
                      <div
                        key={di}
                        className="rounded-[2px] cursor-pointer transition-all hover:ring-1 hover:ring-white/30"
                        style={{
                          aspectRatio: "1",
                          width: "100%",
                          backgroundColor: bgColor,
                          ...(isJoin
                            ? { outline: `2px solid ${accentColor}`, outlineOffset: -1, zIndex: 1 }
                            : {}),
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            date: cell.date,
                            minutes: cell.minutes,
                            isJoinDate: cell.isJoinDate,
                            isBeforeJoin,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend + Join marker */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <div
                  className="rounded-[2px]"
                  style={{ width: 12, height: 12, backgroundColor: `${primaryColor}${INTENSITY_OPACITIES[0]}`, outline: `2px solid ${accentColor}`, outlineOffset: -1 }}
                />
                <span>Joined {new Date(memberSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted mr-1">Less</span>
                {INTENSITY_OPACITIES.map((opacity, i) => (
                  <div
                    key={i}
                    className="rounded-[2px]"
                    style={{ width: 12, height: 12, backgroundColor: `${primaryColor}${opacity}` }}
                  />
                ))}
                <span className="text-[10px] text-text-muted ml-1">More</span>
              </div>
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 px-2 py-1.5 rounded text-xs bg-surface border border-border shadow-lg pointer-events-none"
              style={{
                left: tooltip.x,
                top: tooltip.y - 40,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              {tooltip.isBeforeJoin ? (
                <span className="text-text-muted">
                  Started on{" "}
                  <span className="font-medium text-text-secondary" style={{ color: accentColor }}>
                    {new Date(memberSince).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              ) : (
                <>
                  <span className="font-medium">
                    {new Date(tooltip.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {tooltip.isJoinDate && (
                    <span className="ml-1" style={{ color: accentColor }}>
                      (Joined)
                    </span>
                  )}
                  <span className="text-text-muted ml-1">
                    {tooltip.minutes > 0 ? formatMinutes(tooltip.minutes) : "No activity"}
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      {hasLowData ? (
        <Card className="gaming-card-border overflow-hidden">
          <CardContent className="py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
                <Activity className="h-6 w-6" style={{ color: primaryColor, opacity: 0.5 }} />
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Not enough data yet</p>
                <p className="text-xs text-text-muted max-w-sm">
                  Come online more frequently to unlock detailed activity charts — we need at least {MIN_ACTIVE_DAYS_FOR_CHARTS} active days to generate insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ActivityCharts normalizedDays={normalizedDays} days={days} memberSince={memberSince} />
      )}
    </div>
  );
}
