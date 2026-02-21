"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Award,
  Gamepad2,
  TrendingUp,
  UserPlus,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useGameTheme } from "@/components/profile/game-theme-provider";

interface ActivityItem {
  id: string;
  type: "achievement" | "badge" | "game_added" | "rank_up" | "joined";
  title: string;
  description?: string;
  date: string;
  icon_url?: string | null;
}

interface ProfileActivityProps {
  activities: ActivityItem[];
}

const typeConfig: Record<
  ActivityItem["type"],
  { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }
> = {
  achievement: { icon: Trophy, label: "Achievement" },
  badge: { icon: Award, label: "Badge" },
  game_added: { icon: Gamepad2, label: "Game" },
  rank_up: { icon: TrendingUp, label: "Rank Up" },
  joined: { icon: UserPlus, label: "Joined" },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function ProfileActivity({ activities }: ProfileActivityProps) {
  const { theme } = useGameTheme();

  if (activities.length === 0) {
    return (
      <Card className="gaming-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}20` }}>
              <Clock className="h-5 w-5" style={{ color: theme.colors.primary }} />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-muted text-sm">No recent activity</p>
            <p className="text-text-dim text-xs mt-1">
              Play games and earn badges to see activity here
            </p>
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
            <Clock className="h-5 w-5" style={{ color: theme.colors.primary }} />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-0.5 rounded-full"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          />

          <div className="space-y-1">
            {activities.map((activity, index) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex items-start gap-4 py-3 px-1 rounded-lg hover:bg-surface-light/30 transition-colors"
                >
                  {/* Timeline dot */}
                  <div
                    className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2"
                    style={{
                      backgroundColor: `${theme.colors.primary}15`,
                      borderColor: `${theme.colors.primary}40`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium text-text">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-text-muted mt-0.5">{activity.description}</p>
                    )}
                  </div>

                  {/* Date */}
                  <span className="text-xs text-text-dim shrink-0 pt-1.5">
                    {formatRelativeDate(activity.date)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
