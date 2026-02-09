"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Film,
  Heart,
  ArrowRight,
  Settings,
  Layers,
  BarChart3,
  Sparkles,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCreatorProfile,
  useCreatorAnalytics,
  useCreatorClips,
} from "@/lib/hooks/useCreatorProfile";
import { CREATOR_TIERS, type CreatorTier } from "@/types/creator";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
}

function StatCard({ title, value, trend, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border border-border"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
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
              <span>{Math.abs(trend)}% vs last period</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}

function TierBadge({ tier }: { tier: CreatorTier }) {
  const tierInfo = CREATOR_TIERS[tier];

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        backgroundColor: `${tierInfo.color}20`,
        color: tierInfo.color,
      }}
    >
      <Crown className="h-4 w-4" />
      {tierInfo.name}
    </div>
  );
}

export function CreatorDashboard() {
  const { profile, isLoading: profileLoading, tier } = useCreatorProfile();
  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useCreatorAnalytics("30d");
  const { clips, isLoading: clipsLoading } = useCreatorClips({ limit: 4 });

  const isLoading = profileLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-card animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-card animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-16 w-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Become a Creator</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create your creator profile to access overlays, analytics, clips, and
          sponsorship opportunities.
        </p>
        <Button asChild size="lg">
          <Link href="/creator/setup">Get Started</Link>
        </Button>
      </div>
    );
  }

  const tierInfo = CREATOR_TIERS[tier];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile.display_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} />
          <Button variant="outline" asChild>
            <Link href="/creator/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Tier Progress */}
      {tier !== "diamond" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">Level Up Your Creator Status</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {analytics?.summary.totalFollowers || 0} /{" "}
                {CREATOR_TIERS[getNextTier(tier)].minFollowers} followers to reach{" "}
                {CREATOR_TIERS[getNextTier(tier)].name}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Next tier benefits:</span>
              </div>
              <ul className="text-sm mt-2 space-y-1">
                {CREATOR_TIERS[getNextTier(tier)].benefits.slice(0, 2).map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    ((analytics?.summary.totalFollowers || 0) /
                      CREATOR_TIERS[getNextTier(tier)].minFollowers) *
                      100,
                    100
                  )}%`,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={analytics?.summary.totalViews || 0}
          trend={analytics?.summary.viewsTrend}
          icon={Eye}
        />
        <StatCard
          title="Followers"
          value={analytics?.summary.totalFollowers || 0}
          trend={analytics?.summary.followersTrend}
          icon={Users}
        />
        <StatCard
          title="Clips"
          value={analytics?.summary.totalClips || 0}
          icon={Film}
        />
        <StatCard
          title="Total Likes"
          value={analytics?.summary.totalLikes || 0}
          icon={Heart}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/creator/overlays">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Layers className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Stream Overlays</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage OBS overlays
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </motion.div>
        </Link>

        <Link href="/creator/analytics">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View detailed performance metrics
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </motion.div>
        </Link>

        <Link href="/sponsorships">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Sponsorships</h3>
                <p className="text-sm text-muted-foreground">
                  Browse brand opportunities
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Recent Clips */}
      {clips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Clips</h2>
            <Button variant="ghost" asChild>
              <Link href="/creator/clips">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {clips.map((clip) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl overflow-hidden border border-border"
              >
                <div className="aspect-video bg-muted relative">
                  {clip.thumbnail_url ? (
                    <img
                      src={clip.thumbnail_url}
                      alt={clip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs">
                    {formatDuration(clip.duration)}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate">{clip.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {clip.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {clip.likes_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4">Your Creator Benefits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tierInfo.benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-background rounded-lg"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tierInfo.color }}
              />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getNextTier(currentTier: CreatorTier): CreatorTier {
  const tierOrder: CreatorTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];
  const currentIndex = tierOrder.indexOf(currentTier);
  return tierOrder[Math.min(currentIndex + 1, tierOrder.length - 1)];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
