"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Flame, TrendingUp, BarChart3, Activity, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

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
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = [
  "12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a",
  "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p",
];

// Custom tooltip for recharts
function ChartTooltipContent({ active, payload, label, suffix }: {
  active?: boolean;
  payload?: Array<{ value: number; color: string }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg bg-surface border border-border shadow-xl text-xs">
      <p className="text-text-muted mb-1">{label}</p>
      <p className="font-bold" style={{ color: payload[0].color }}>
        {typeof payload[0].value === "number" ? payload[0].value.toFixed(1) : payload[0].value}{suffix || ""}
      </p>
    </div>
  );
}

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

  // Compute "Usually Online" hourly distribution from first_seen_at/last_seen_at
  const hourlyData = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    let daysWithData = 0;

    days.forEach((d) => {
      if (!d.first_seen_at || !d.last_seen_at || d.minutes_online === 0) return;
      daysWithData++;

      const firstHour = new Date(d.first_seen_at).getHours();
      const lastHour = new Date(d.last_seen_at).getHours();

      // Mark hours between first_seen and last_seen as active
      if (firstHour <= lastHour) {
        for (let h = firstHour; h <= lastHour; h++) {
          hourCounts[h]++;
        }
      } else {
        // Spans midnight
        for (let h = firstHour; h < 24; h++) hourCounts[h]++;
        for (let h = 0; h <= lastHour; h++) hourCounts[h]++;
      }
    });

    // Convert to percentages
    if (daysWithData === 0) return HOUR_LABELS.map((label, i) => ({ hour: label, activity: 0, index: i }));

    return HOUR_LABELS.map((label, i) => ({
      hour: label,
      activity: Math.round((hourCounts[i] / daysWithData) * 100),
      index: i,
    }));
  }, [days]);

  // Compute weekly activity (average minutes per day of week)
  const weeklyData = useMemo(() => {
    const weekdayTotals = new Array(7).fill(0);
    const weekdayCounts = new Array(7).fill(0);

    normalizedDays.forEach((d) => {
      const dayOfWeek = new Date(d.activity_date + "T00:00:00").getDay();
      weekdayTotals[dayOfWeek] += d.minutes_online;
      weekdayCounts[dayOfWeek]++;
    });

    return WEEKDAY_NAMES.map((name, i) => ({
      day: name,
      hours: weekdayCounts[i] > 0
        ? Math.round((weekdayTotals[i] / weekdayCounts[i] / 60) * 10) / 10
        : 0,
    }));
  }, [normalizedDays]);

  // Compute monthly trend (hours per month over last 12 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const joinDate = new Date(memberSince);
    const monthMap = new Map<string, number>();

    // Initialize months from join date (or 12 months ago, whichever is more recent)
    const monthsBack = Math.min(
      11,
      (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()),
    );

    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, 0);
    }

    normalizedDays.forEach((d) => {
      const key = d.activity_date.substring(0, 7); // YYYY-MM
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + d.minutes_online);
      }
    });

    return Array.from(monthMap.entries()).map(([key, minutes]) => {
      const [year, month] = key.split("-");
      return {
        month: `${MONTH_NAMES[parseInt(month) - 1]} '${year.slice(2)}`,
        hours: Math.round((minutes / 60) * 10) / 10,
      };
    });
  }, [normalizedDays, memberSince]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Usually Online - Area Chart */}
          <Card className="gaming-card-border overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Activity className="h-4 w-4" style={{ color: primaryColor }} />
                </div>
                Usually Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipContent active={active} payload={payload as never} label={label as string} suffix="% online" />
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="activity"
                      stroke={primaryColor}
                      strokeWidth={2}
                      fill="url(#activityGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: primaryColor, stroke: "#000", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted mt-2 text-center">
                Likelihood of being online by hour of day
              </p>
            </CardContent>
          </Card>

          {/* Weekly Activity - Bar Chart */}
          <Card className="gaming-card-border overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                  <BarChart3 className="h-4 w-4" style={{ color: accentColor }} />
                </div>
                Weekly Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipContent active={active} payload={payload as never} label={label as string} suffix=" hrs avg" />
                      )}
                    />
                    <Bar
                      dataKey="hours"
                      fill={accentColor}
                      radius={[4, 4, 0, 0]}
                      opacity={0.6}
                      activeBar={{ opacity: 1, fill: accentColor }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted mt-2 text-center">
                Average hours online per day of week
              </p>
            </CardContent>
          </Card>

          {/* Monthly Trend - Line Chart (full width) */}
          <Card className="gaming-card-border overflow-hidden md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                  <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
                </div>
                Monthly Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={accentColor} />
                        <stop offset="100%" stopColor={primaryColor} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipContent active={active} payload={payload as never} label={label as string} suffix=" hours" />
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="url(#lineGradient)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: primaryColor, stroke: "#000", strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: primaryColor, stroke: "#000", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted mt-2 text-center">
                Total hours online per month over the last year
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
