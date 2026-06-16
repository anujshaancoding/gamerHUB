"use client";

import { useMemo } from "react";
import { TrendingUp, BarChart3, Activity } from "lucide-react";
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

interface ActivityChartsProps {
  /** Days normalized so activity_date is always a YYYY-MM-DD string */
  normalizedDays: ActivityDay[];
  /** Raw days (used for hourly distribution which reads *_seen_at) */
  days: ActivityDay[];
  memberSince: string;
}

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

export function ActivityCharts({ normalizedDays, days, memberSince }: ActivityChartsProps) {
  const { theme } = useGameTheme();

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
  const { monthlyData, activeMonths } = useMemo(() => {
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

    const data = Array.from(monthMap.entries()).map(([key, minutes]) => {
      const [year, month] = key.split("-");
      return {
        month: `${MONTH_NAMES[parseInt(month) - 1]} '${year.slice(2)}`,
        hours: Math.round((minutes / 60) * 10) / 10,
      };
    });

    const active = Array.from(monthMap.values()).filter((minutes) => minutes > 0).length;

    return { monthlyData: data, activeMonths: active };
  }, [normalizedDays, memberSince]);

  const primaryColor = theme.colors.primary;
  const accentColor = theme.colors.accent || "#00d4ff";

  return (
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
          {activeMonths < 2 ? (
            <div className="h-[180px] w-full flex flex-col items-center justify-center gap-2 text-center">
              <div className="p-3 rounded-full" style={{ backgroundColor: `${primaryColor}15` }}>
                <TrendingUp className="h-6 w-6" style={{ color: primaryColor, opacity: 0.5 }} />
              </div>
              <p className="text-sm text-text-secondary">Trend takes shape over time</p>
              <p className="text-xs text-text-muted max-w-sm">
                We need activity across at least two months to draw a meaningful monthly trend.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
