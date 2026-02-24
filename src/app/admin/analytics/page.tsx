"use client";

import { useState } from "react";
import {
  Eye,
  Users,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAdminAnalytics } from "@/lib/hooks/useAdminAnalytics";
import type { DailyPageView } from "@/lib/hooks/useAdminAnalytics";

const RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PercentChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-white/30 flex items-center gap-0.5"><Minus className="h-3 w-3" /> No data</span>;
  }
  if (previous === 0) {
    return <span className="text-xs text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> New</span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) {
    return <span className="text-xs text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> +{pct}%</span>;
  }
  if (pct < 0) {
    return <span className="text-xs text-red-400 flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" /> {pct}%</span>;
  }
  return <span className="text-xs text-white/30 flex items-center gap-0.5"><Minus className="h-3 w-3" /> 0%</span>;
}

// Custom tooltip matching the gaming theme
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; color: string; dataKey: string; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-lg bg-[#12121a] border border-white/10 shadow-xl text-xs">
      <p className="text-white/50 mb-1.5 font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-white/60">{entry.name}:</span>
          <span className="font-bold" style={{ color: entry.color }}>
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState(30);
  const { daily, topPages, summary, loading, refetch } = useAdminAnalytics(range);

  // Prepare chart data with formatted date labels
  const chartData = daily.map((d: DailyPageView) => ({
    ...d,
    label: formatDate(d.date),
    total_views: Number(d.total_views),
    unique_visitors: Number(d.unique_visitors),
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header row with range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Website Analytics</h2>
          <p className="text-xs text-white/30 mt-0.5">Track your daily page views and visitor metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/60"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="flex rounded-lg border border-white/5 overflow-hidden">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === opt.value
                    ? "bg-violet-500/20 text-violet-400"
                    : "bg-white/[0.02] text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Today&apos;s Views
            </span>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-violet-500/10">
              <Eye className="h-4 w-4 text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "..." : formatNumber(summary.todayViews)}
          </p>
          <div className="mt-1">
            {!loading && <PercentChange current={summary.todayViews} previous={summary.yesterdayViews} />}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Unique Today
            </span>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-cyan-500/10">
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "..." : formatNumber(summary.todayUnique)}
          </p>
          <p className="text-xs text-white/30 mt-1">Unique visitors</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Total Views
            </span>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-500/10">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "..." : formatNumber(summary.totalViews)}
          </p>
          <p className="text-xs text-white/30 mt-1">Last {range} days</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Avg Daily
            </span>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-amber-500/10">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "..." : formatNumber(summary.avgDailyViews)}
          </p>
          <p className="text-xs text-white/30 mt-1">Views per day</p>
        </div>
      </div>

      {/* Daily Views Area Chart */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
        <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
          Daily Page Views
        </h3>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-white/20 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/30">No page view data yet</p>
              <p className="text-xs text-white/20 mt-1">Data will appear as visitors browse your site</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  interval={range <= 7 ? 0 : range <= 30 ? 3 : 7}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="total_views"
                  name="Total Views"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#000", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="unique_visitors"
                  name="Unique Visitors"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#uniqueGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#06b6d4", stroke: "#000", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Pages Bar Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
            Top Pages
          </h3>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-white/20 animate-spin" />
            </div>
          ) : topPages.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-white/30">No data yet</p>
            </div>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPages.slice(0, 8).map((p) => ({
                    ...p,
                    path: p.path.length > 20 ? p.path.slice(0, 20) + "…" : p.path,
                    view_count: Number(p.view_count),
                    unique_count: Number(p.unique_count),
                  }))}
                  layout="vertical"
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="path"
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="view_count"
                    name="Views"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    opacity={0.7}
                    activeBar={{ opacity: 1 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
            Page Breakdown
          </h3>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-white/20 animate-spin" />
            </div>
          ) : topPages.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-white/30">No data yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[280px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/30 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-medium">Page</th>
                    <th className="pb-3 font-medium text-right">Views</th>
                    <th className="pb-3 font-medium text-right">Unique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topPages.map((page) => (
                    <tr key={page.path} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 text-white/70 truncate max-w-[200px]" title={page.path}>
                        {page.path}
                      </td>
                      <td className="py-2.5 text-right text-white/50 tabular-nums">
                        {formatNumber(Number(page.view_count))}
                      </td>
                      <td className="py-2.5 text-right text-white/50 tabular-nums">
                        {formatNumber(Number(page.unique_count))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
