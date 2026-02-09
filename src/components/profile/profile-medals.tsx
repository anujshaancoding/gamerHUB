"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Flame,
  Zap,
  Target,
  Shield,
  Swords,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Achievement, Game } from "@/types/database";

interface AchievementWithGame extends Achievement {
  game: Game | null;
}

interface ProfileMedalsProps {
  achievements: AchievementWithGame[];
  username: string;
}

// Medal rarity configurations
const rarityConfig = {
  common: {
    bg: "bg-gradient-to-br from-gray-600 to-gray-700",
    border: "border-gray-500",
    glow: "shadow-gray-500/30",
    text: "text-gray-300",
    icon: Medal,
  },
  uncommon: {
    bg: "bg-gradient-to-br from-green-600 to-green-700",
    border: "border-green-500",
    glow: "shadow-green-500/30",
    text: "text-green-300",
    icon: Award,
  },
  rare: {
    bg: "bg-gradient-to-br from-blue-600 to-blue-700",
    border: "border-blue-500",
    glow: "shadow-blue-500/40",
    text: "text-blue-300",
    icon: Shield,
  },
  epic: {
    bg: "bg-gradient-to-br from-purple-600 to-purple-700",
    border: "border-purple-500",
    glow: "shadow-purple-500/50",
    text: "text-purple-300",
    icon: Zap,
  },
  legendary: {
    bg: "bg-gradient-to-br from-yellow-500 to-orange-600",
    border: "border-yellow-400",
    glow: "shadow-yellow-500/60",
    text: "text-yellow-300",
    icon: Crown,
  },
  mythic: {
    bg: "bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500",
    border: "border-pink-400",
    glow: "shadow-pink-500/70",
    text: "text-pink-300",
    icon: Flame,
  },
};

// Determine rarity based on achievement data (could be extended)
function getAchievementRarity(achievement: Achievement): keyof typeof rarityConfig {
  // This could be based on actual rarity field or game-specific logic
  const title = achievement.title.toLowerCase();
  if (title.includes("mythic") || title.includes("legendary champion")) return "mythic";
  if (title.includes("legendary") || title.includes("master")) return "legendary";
  if (title.includes("epic") || title.includes("elite")) return "epic";
  if (title.includes("rare") || title.includes("veteran")) return "rare";
  if (title.includes("uncommon") || title.includes("skilled")) return "uncommon";
  return "common";
}

function MedalCard({
  achievement,
  index,
  onClick,
}: {
  achievement: AchievementWithGame;
  index: number;
  onClick: () => void;
}) {
  const rarity = getAchievementRarity(achievement);
  const config = rarityConfig[rarity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
      }}
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        transition: { duration: 0.2 },
      }}
      className={`
        relative p-4 rounded-xl cursor-pointer
        ${config.bg} border ${config.border}
        shadow-lg ${config.glow} hover:shadow-xl
        transform-gpu perspective-1000
        medal-shine
      `}
      onClick={onClick}
    >
      {/* Hexagon background decoration */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
            fill="currentColor"
            className="text-white"
          />
        </svg>
      </div>

      {/* Medal Icon */}
      <div className="relative flex justify-center mb-3">
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          bg-black/30 backdrop-blur-sm border-2 ${config.border}
          ${rarity === "legendary" || rarity === "mythic" ? "animate-pulse-subtle" : ""}
        `}>
          {achievement.badge_url ? (
            <img
              src={achievement.badge_url}
              alt={achievement.title}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <Icon className={`h-8 w-8 ${config.text}`} />
          )}
        </div>

        {/* Rarity indicator */}
        {(rarity === "legendary" || rarity === "mythic") && (
          <div className="absolute -top-1 -right-1">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className={`font-bold text-center text-sm truncate ${config.text}`}>
        {achievement.title}
      </h4>

      {/* Game Tag */}
      {achievement.game && (
        <div className="mt-2 flex justify-center">
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/30 text-white/80 truncate max-w-full">
            {achievement.game.name}
          </span>
        </div>
      )}

      {/* Date */}
      {achievement.achievement_date && (
        <p className="text-[10px] text-white/60 text-center mt-1">
          {formatDate(achievement.achievement_date)}
        </p>
      )}

      {/* Rarity Badge */}
      <div className="absolute top-2 right-2">
        <span className={`
          text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded
          bg-black/40 ${config.text}
        `}>
          {rarity}
        </span>
      </div>
    </motion.div>
  );
}

function MedalDetailModal({
  achievement,
  onClose,
}: {
  achievement: AchievementWithGame;
  onClose: () => void;
}) {
  const rarity = getAchievementRarity(achievement);
  const config = rarityConfig[rarity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, rotateY: -30 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.8, rotateY: 30 }}
        className={`
          relative max-w-md w-full p-8 rounded-2xl
          ${config.bg} border-2 ${config.border}
          shadow-2xl ${config.glow}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Medal display */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 360 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`
              w-32 h-32 rounded-full flex items-center justify-center mb-6
              bg-black/30 backdrop-blur-sm border-4 ${config.border}
              ${rarity === "legendary" || rarity === "mythic" ? "animate-pulse-subtle" : ""}
            `}
          >
            {achievement.badge_url ? (
              <img
                src={achievement.badge_url}
                alt={achievement.title}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <Icon className={`h-16 w-16 ${config.text}`} />
            )}
          </motion.div>

          {/* Rarity badge */}
          <span className={`
            text-xs uppercase font-black tracking-widest px-4 py-1 rounded-full mb-4
            bg-black/40 ${config.text}
          `}>
            {rarity} Achievement
          </span>

          {/* Title */}
          <h2 className={`text-2xl font-black text-center ${config.text} mb-2`}>
            {achievement.title}
          </h2>

          {/* Description */}
          {achievement.description && (
            <p className="text-white/80 text-center mb-4">
              {achievement.description}
            </p>
          )}

          {/* Game */}
          {achievement.game && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 mb-4">
              {achievement.game.icon_url && (
                <img
                  src={achievement.game.icon_url}
                  alt={achievement.game.name}
                  className="w-6 h-6 rounded"
                />
              )}
              <span className="text-white font-medium">{achievement.game.name}</span>
            </div>
          )}

          {/* Date earned */}
          {achievement.achievement_date && (
            <p className="text-white/60 text-sm">
              Earned on {new Date(achievement.achievement_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProfileMedals({ achievements, username }: ProfileMedalsProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithGame | null>(null);

  if (achievements.length === 0) {
    return (
      <Card className="gaming-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning/20">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
            Medals & Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-12 w-12 text-text-muted" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-text-dim opacity-30"
              />
            </div>
            <p className="text-text-muted font-medium">No achievements yet</p>
            <p className="text-text-dim text-sm mt-1">
              Start playing to earn medals!
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Group achievements by rarity for stats
  const rarityCounts = achievements.reduce((acc, achievement) => {
    const rarity = getAchievementRarity(achievement);
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Card className="gaming-card-border overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/20">
                <Trophy className="h-5 w-5 text-warning" />
              </div>
              Medals & Achievements
            </CardTitle>
            <span className="text-sm text-text-muted">
              {achievements.length} earned
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Rarity Summary */}
          <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-border">
            {Object.entries(rarityCounts).map(([rarity, count]) => {
              const config = rarityConfig[rarity as keyof typeof rarityConfig];
              return (
                <motion.div
                  key={rarity}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    ${config.bg} ${config.border} border
                  `}
                >
                  <config.icon className={`h-3.5 w-3.5 ${config.text}`} />
                  <span className={`text-xs font-bold ${config.text}`}>
                    {count} {rarity}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Medals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <MedalCard
                key={achievement.id}
                achievement={achievement}
                index={index}
                onClick={() => setSelectedAchievement(achievement)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <MedalDetailModal
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
