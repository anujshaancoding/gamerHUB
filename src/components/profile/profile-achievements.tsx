"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Achievement, Game } from "@/types/database";

interface AchievementWithGame extends Achievement {
  game: Game | null;
}

interface ProfileAchievementsProps {
  achievements: AchievementWithGame[];
}

export function ProfileAchievements({ achievements }: ProfileAchievementsProps) {
  if (achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No achievements yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-surface-light border border-border text-center hover:border-warning/50 transition-colors"
            >
              {/* Badge Icon */}
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-warning/10 flex items-center justify-center">
                {achievement.badge_url ? (
                  <img
                    src={achievement.badge_url}
                    alt={achievement.title}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <Medal className="h-8 w-8 text-warning" />
                )}
              </div>

              {/* Title */}
              <h4 className="font-semibold text-text text-sm truncate">
                {achievement.title}
              </h4>

              {/* Game Tag */}
              {achievement.game && (
                <Badge variant="default" size="sm" className="mt-2">
                  {achievement.game.name}
                </Badge>
              )}

              {/* Date */}
              {achievement.achievement_date && (
                <p className="text-xs text-text-muted mt-2">
                  {formatDate(achievement.achievement_date)}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
