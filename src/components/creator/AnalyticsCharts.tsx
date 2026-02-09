"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Heart,
  BarChart3,
  Calendar,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorAnalytics } from "@/lib/hooks/useCreatorProfile";
import type { AnalyticsTimeRange, TopContent } from "@/types/creator";

const TIME_RANGES: { value: AnalyticsTimeRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

export function AnalyticsCharts() {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30d");
  const { data: analytics, isLoading, error } = useCreatorAnalytics(timeRange);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-card animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-card animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Unable to Load Analytics</h3>
        <p className="text-muted-foreground">
          There was an error loading your analytics data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex flex-wrap gap-2">
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={timeRange === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Views"
          value={analytics?.summary.totalViews || 0}
          trend={analytics?.summary.viewsTrend}
          icon={Eye}
          breakdown={[
            { label: "Profile Views", value: analytics?.breakdown.profileViews || 0 },
            { label: "Clip Views", value: analytics?.breakdown.clipViews || 0 },
          ]}
        />
        <SummaryCard
          title="Followers"
          value={analytics?.summary.totalFollowers || 0}
          trend={analytics?.summary.followersTrend}
          icon={Users}
          breakdown={[
            { label: "New This Period", value: analytics?.breakdown.newFollowers || 0 },
          ]}
        />
        <SummaryCard
          title="Engagement Rate"
          value={`${analytics?.summary.engagementRate || 0}%`}
          icon={Heart}
          description="Interactions per view"
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Performance Over Time</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Followers</span>
            </div>
          </div>
        </div>

        {analytics?.chartData && analytics.chartData.length > 0 ? (
          <SimpleChart data={analytics.chartData} />
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <p>No data available for this time period</p>
          </div>
        )}
      </div>

      {/* Top Content */}
      {analytics?.topContent && analytics.topContent.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Top Performing Content</h3>
          <div className="space-y-4">
            {analytics.topContent.map((content, index) => (
              <TopContentItem key={content.id} content={content} rank={index + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Audience Insights */}
      {analytics?.audienceInsights && analytics.audienceInsights.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Audience Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.audienceInsights.map((insight) => (
              <AudienceInsightCard key={insight.metric} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  breakdown?: { label: string; value: number }[];
  description?: string;
}

function SummaryCard({
  title,
  value,
  trend,
  icon: Icon,
  breakdown,
  description,
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {breakdown.map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Simple Chart Component (CSS-based, no external library)
interface SimpleChartProps {
  data: { date: string; views: number; followers: number; engagements: number }[];
}

function SimpleChart({ data }: SimpleChartProps) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const maxFollowers = Math.max(...data.map((d) => d.followers), 1);

  return (
    <div className="h-48 flex items-end gap-1">
      {data.slice(-30).map((day, index) => (
        <div
          key={day.date}
          className="flex-1 flex flex-col items-center gap-1 group relative"
        >
          {/* Views bar */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(day.views / maxViews) * 100}%` }}
            transition={{ duration: 0.5, delay: index * 0.02 }}
            className="w-full bg-primary/80 rounded-t min-h-[2px]"
          />
          {/* Followers bar (overlay) */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(day.followers / maxFollowers) * 30}%` }}
            transition={{ duration: 0.5, delay: index * 0.02 }}
            className="w-full bg-green-500/80 rounded-t absolute bottom-0 min-h-[1px]"
          />
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs whitespace-nowrap">
              <p className="font-medium">
                {new Date(day.date).toLocaleDateString()}
              </p>
              <p className="text-muted-foreground">Views: {day.views}</p>
              <p className="text-muted-foreground">Followers: {day.followers}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Top Content Item
interface TopContentItemProps {
  content: TopContent;
  rank: number;
}

function TopContentItem({ content, rank }: TopContentItemProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
        {rank}
      </div>
      <div className="w-16 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
        {content.thumbnail ? (
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{content.title}</p>
        <p className="text-xs text-muted-foreground capitalize">{content.type}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {content.views.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          {content.likes.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// Audience Insight Card
interface AudienceInsightCardProps {
  insight: {
    metric: string;
    breakdown: { label: string; value: number; percentage: number }[];
  };
}

function AudienceInsightCard({ insight }: AudienceInsightCardProps) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-3">{insight.metric}</h4>
      <div className="space-y-3">
        {insight.breakdown.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.label}</span>
              <span className="text-muted-foreground">{item.percentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
