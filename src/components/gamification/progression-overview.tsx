"use client";

import { Trophy, Target, Award, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { LevelBadge } from "./level-badge";
import { XPProgressBar } from "./xp-progress-bar";
import { BadgeShowcase } from "./badge-showcase";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  name: string;
  icon_url: string | null;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface ProgressionOverviewProps {
  level: number;
  totalXP: number;
  currentLevelXP: number;
  xpToNextLevel: number;
  stats: {
    matches_played: number;
    matches_won: number;
    challenges_completed: number;
    quests_completed: number;
    current_win_streak: number;
    best_win_streak: number;
  };
  recentBadges?: Badge[];
  activeTitle?: { name: string; color: string | null } | null;
  className?: string;
}

export function ProgressionOverview({
  level,
  totalXP,
  currentLevelXP,
  xpToNextLevel,
  stats,
  recentBadges = [],
  activeTitle,
  className,
}: ProgressionOverviewProps) {
  const winRate =
    stats.matches_played > 0
      ? Math.round((stats.matches_won / stats.matches_played) * 100)
      : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LevelBadge level={level} size="lg" />
            <div>
              <CardTitle>Level {level}</CardTitle>
              {activeTitle && (
                <p
                  className="text-sm font-medium"
                  style={{ color: activeTitle.color || undefined }}
                >
                  {activeTitle.name}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text">
              {totalXP.toLocaleString()}
            </p>
            <p className="text-sm text-text-muted">Total XP</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* XP Progress */}
        <XPProgressBar
          currentXP={currentLevelXP}
          xpToNextLevel={xpToNextLevel}
          level={level}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-text">{stats.matches_won}</p>
              <p className="text-xs text-text-muted">Wins</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-lg font-bold text-text">{winRate}%</p>
              <p className="text-xs text-text-muted">Win Rate</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold text-text">
                {stats.current_win_streak}
              </p>
              <p className="text-xs text-text-muted">Streak</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-text">
                {stats.quests_completed}
              </p>
              <p className="text-xs text-text-muted">Quests</p>
            </div>
          </div>
        </div>

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">
              Recent Badges
            </p>
            <BadgeShowcase badges={recentBadges} size="md" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
