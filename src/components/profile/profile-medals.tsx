"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Flame,
  Zap,
  Shield,
  X,
  Lock,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Achievement, Game } from "@/types/database";

interface AchievementWithGame extends Achievement {
  game: Game | null;
}

interface BadgeDefinitionData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: string;
  rarity: string;
  unlock_criteria: Record<string, unknown>;
  xp_reward: number | null;
  is_secret: boolean | null;
  sort_order: number | null;
}

interface UserStats {
  matches_played: number;
  matches_won: number;
  challenges_completed: number;
  quests_completed: number;
  best_win_streak: number;
  followers: number;
  following: number;
  clans_joined: number;
}

interface ProfileMedalsProps {
  achievements?: AchievementWithGame[];
  username?: string;
  userStats?: UserStats;
}

// Static badge definitions (from gamification design — tables not yet migrated)
const ALL_BADGE_DEFINITIONS: BadgeDefinitionData[] = [
  // Milestone badges
  { id: "b-1", slug: "first_match", name: "First Blood", description: "Complete your first match", icon_url: null, category: "milestone", rarity: "common", unlock_criteria: { type: "matches_completed", count: 1 }, xp_reward: 25, is_secret: false, sort_order: 1 },
  { id: "b-2", slug: "matches_10", name: "Getting Started", description: "Complete 10 matches", icon_url: null, category: "milestone", rarity: "common", unlock_criteria: { type: "matches_completed", count: 10 }, xp_reward: 50, is_secret: false, sort_order: 2 },
  { id: "b-3", slug: "matches_50", name: "Regular Player", description: "Complete 50 matches", icon_url: null, category: "milestone", rarity: "rare", unlock_criteria: { type: "matches_completed", count: 50 }, xp_reward: 100, is_secret: false, sort_order: 3 },
  { id: "b-4", slug: "matches_100", name: "Dedicated Gamer", description: "Complete 100 matches", icon_url: null, category: "milestone", rarity: "rare", unlock_criteria: { type: "matches_completed", count: 100 }, xp_reward: 200, is_secret: false, sort_order: 4 },
  { id: "b-5", slug: "matches_500", name: "Veteran Player", description: "Complete 500 matches", icon_url: null, category: "milestone", rarity: "epic", unlock_criteria: { type: "matches_completed", count: 500 }, xp_reward: 500, is_secret: false, sort_order: 5 },
  { id: "b-6", slug: "matches_1000", name: "Legendary Grinder", description: "Complete 1000 matches", icon_url: null, category: "milestone", rarity: "legendary", unlock_criteria: { type: "matches_completed", count: 1000 }, xp_reward: 1000, is_secret: false, sort_order: 6 },
  // Skill badges
  { id: "b-10", slug: "first_win", name: "Victor", description: "Win your first match", icon_url: null, category: "skill", rarity: "common", unlock_criteria: { type: "matches_won", count: 1 }, xp_reward: 25, is_secret: false, sort_order: 10 },
  { id: "b-11", slug: "wins_10", name: "Rising Competitor", description: "Win 10 matches", icon_url: null, category: "skill", rarity: "common", unlock_criteria: { type: "matches_won", count: 10 }, xp_reward: 75, is_secret: false, sort_order: 11 },
  { id: "b-12", slug: "wins_50", name: "Skilled Player", description: "Win 50 matches", icon_url: null, category: "skill", rarity: "rare", unlock_criteria: { type: "matches_won", count: 50 }, xp_reward: 150, is_secret: false, sort_order: 12 },
  { id: "b-13", slug: "wins_100", name: "Master Competitor", description: "Win 100 matches", icon_url: null, category: "skill", rarity: "epic", unlock_criteria: { type: "matches_won", count: 100 }, xp_reward: 300, is_secret: false, sort_order: 13 },
  { id: "b-20", slug: "streak_3", name: "On a Roll", description: "Win 3 matches in a row", icon_url: null, category: "skill", rarity: "common", unlock_criteria: { type: "win_streak", count: 3 }, xp_reward: 50, is_secret: false, sort_order: 20 },
  { id: "b-21", slug: "streak_5", name: "Hot Streak", description: "Win 5 matches in a row", icon_url: null, category: "skill", rarity: "rare", unlock_criteria: { type: "win_streak", count: 5 }, xp_reward: 100, is_secret: false, sort_order: 21 },
  { id: "b-22", slug: "streak_10", name: "Unstoppable", description: "Win 10 matches in a row", icon_url: null, category: "skill", rarity: "epic", unlock_criteria: { type: "win_streak", count: 10 }, xp_reward: 250, is_secret: false, sort_order: 22 },
  // Social badges
  { id: "b-30", slug: "first_friend", name: "Friendly", description: "Follow your first player", icon_url: null, category: "social", rarity: "common", unlock_criteria: { type: "follows_given", count: 1 }, xp_reward: 10, is_secret: false, sort_order: 30 },
  { id: "b-31", slug: "friends_10", name: "Networker", description: "Follow 10 players", icon_url: null, category: "social", rarity: "common", unlock_criteria: { type: "follows_given", count: 10 }, xp_reward: 25, is_secret: false, sort_order: 31 },
  { id: "b-32", slug: "friends_50", name: "Popular", description: "Follow 50 players", icon_url: null, category: "social", rarity: "rare", unlock_criteria: { type: "follows_given", count: 50 }, xp_reward: 75, is_secret: false, sort_order: 32 },
  { id: "b-33", slug: "followers_10", name: "Rising Star", description: "Get 10 followers", icon_url: null, category: "social", rarity: "common", unlock_criteria: { type: "followers", count: 10 }, xp_reward: 50, is_secret: false, sort_order: 33 },
  { id: "b-34", slug: "followers_100", name: "Influencer", description: "Get 100 followers", icon_url: null, category: "social", rarity: "epic", unlock_criteria: { type: "followers", count: 100 }, xp_reward: 200, is_secret: false, sort_order: 34 },
  { id: "b-35", slug: "clan_joined", name: "Team Player", description: "Join a clan", icon_url: null, category: "social", rarity: "common", unlock_criteria: { type: "clan_joined", count: 1 }, xp_reward: 50, is_secret: false, sort_order: 35 },
  // Challenge badges
  { id: "b-40", slug: "first_challenge", name: "Challenger", description: "Complete your first challenge", icon_url: null, category: "milestone", rarity: "common", unlock_criteria: { type: "challenges_completed", count: 1 }, xp_reward: 50, is_secret: false, sort_order: 40 },
  { id: "b-41", slug: "challenges_10", name: "Serial Challenger", description: "Complete 10 challenges", icon_url: null, category: "milestone", rarity: "rare", unlock_criteria: { type: "challenges_completed", count: 10 }, xp_reward: 150, is_secret: false, sort_order: 41 },
  { id: "b-42", slug: "challenges_50", name: "Challenge Master", description: "Complete 50 challenges", icon_url: null, category: "milestone", rarity: "epic", unlock_criteria: { type: "challenges_completed", count: 50 }, xp_reward: 400, is_secret: false, sort_order: 42 },
];

// Medal rarity configurations
const rarityConfig = {
  common: {
    bg: "bg-gradient-to-br from-gray-600 to-gray-700",
    border: "border-gray-500",
    glow: "shadow-gray-500/30",
    text: "text-gray-300",
    barColor: "bg-gray-400",
    icon: Medal,
  },
  uncommon: {
    bg: "bg-gradient-to-br from-green-600 to-green-700",
    border: "border-green-500",
    glow: "shadow-green-500/30",
    text: "text-green-300",
    barColor: "bg-green-400",
    icon: Award,
  },
  rare: {
    bg: "bg-gradient-to-br from-blue-600 to-blue-700",
    border: "border-blue-500",
    glow: "shadow-blue-500/40",
    text: "text-blue-300",
    barColor: "bg-blue-400",
    icon: Shield,
  },
  epic: {
    bg: "bg-gradient-to-br from-purple-600 to-purple-700",
    border: "border-purple-500",
    glow: "shadow-purple-500/50",
    text: "text-purple-300",
    barColor: "bg-purple-400",
    icon: Zap,
  },
  legendary: {
    bg: "bg-gradient-to-br from-yellow-500 to-orange-600",
    border: "border-yellow-400",
    glow: "shadow-yellow-500/60",
    text: "text-yellow-300",
    barColor: "bg-yellow-400",
    icon: Crown,
  },
  mythic: {
    bg: "bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500",
    border: "border-pink-400",
    glow: "shadow-pink-500/70",
    text: "text-pink-300",
    barColor: "bg-pink-400",
    icon: Flame,
  },
};

type Rarity = keyof typeof rarityConfig;

const categoryLabels: Record<string, string> = {
  all: "All",
  milestone: "Milestone",
  skill: "Skill",
  social: "Social",
  seasonal: "Seasonal",
  special: "Special",
};

function getRarityConfig(rarity: string) {
  return rarityConfig[rarity as Rarity] || rarityConfig.common;
}

function getProgressForBadge(
  criteria: Record<string, unknown>,
  stats: UserStats
): { current: number; target: number; percentage: number } {
  const type = criteria.type as string;
  const target = (criteria.count as number) || 1;
  let current = 0;

  switch (type) {
    case "matches_completed":
      current = stats.matches_played;
      break;
    case "matches_won":
      current = stats.matches_won;
      break;
    case "win_streak":
      current = stats.best_win_streak;
      break;
    case "challenges_completed":
      current = stats.challenges_completed;
      break;
    case "follows_given":
      current = stats.following;
      break;
    case "followers":
      current = stats.followers;
      break;
    case "clan_joined":
      current = stats.clans_joined;
      break;
    default:
      current = 0;
  }

  const clamped = Math.min(current, target);
  const percentage = target > 0 ? Math.round((clamped / target) * 100) : 0;
  return { current: clamped, target, percentage };
}

function getProgressLabel(criteria: Record<string, unknown>): string {
  const type = criteria.type as string;
  switch (type) {
    case "matches_completed":
      return "matches played";
    case "matches_won":
      return "matches won";
    case "win_streak":
      return "win streak";
    case "challenges_completed":
      return "challenges done";
    case "follows_given":
      return "following";
    case "followers":
      return "followers";
    case "clan_joined":
      return "clan joined";
    default:
      return "progress";
  }
}

// ---------- Earned Medal Card ----------
function EarnedMedalCard({
  badge,
  earnedAt,
  index,
  onClick,
}: {
  badge: BadgeDefinitionData;
  earnedAt: string;
  index: number;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const config = getRarityConfig(badge.rarity);
  const Icon = config.icon;
  const isHighRarity = badge.rarity === "legendary" || badge.rarity === "mythic";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05, rotateY: 5, transition: { duration: 0.2 } }}
      className={`
        relative p-3 sm:p-4 rounded-xl cursor-pointer
        ${config.bg} border ${config.border}
        shadow-lg ${config.glow} hover:shadow-xl
        transform-gpu perspective-1000
        medal-shine
      `}
      onClick={onClick}
    >
      {/* Hexagon decoration */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
            fill="currentColor"
            className="text-white"
          />
        </svg>
      </div>

      {/* Earned checkmark */}
      <div className="absolute top-2 left-2 z-10">
        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
      </div>

      {/* Medal Icon */}
      <div className="relative flex justify-center mb-2 sm:mb-3">
        <div className={`
          w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
          bg-black/30 backdrop-blur-sm border-2 ${config.border}
          ${isHighRarity ? "animate-pulse-subtle" : ""}
        `}>
          {badge.icon_url && !imgError ? (
            <img
              src={badge.icon_url}
              alt={badge.name}
              className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${config.text}`} />
          )}
        </div>

        {isHighRarity && (
          <div className="absolute -top-1 -right-1">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className={`font-bold text-center text-sm truncate ${config.text}`}>
        {badge.name}
      </h4>

      {/* XP reward */}
      {badge.xp_reward && badge.xp_reward > 0 && (
        <div className="mt-1 flex justify-center">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-white/70">
            +{badge.xp_reward} XP
          </span>
        </div>
      )}

      {/* Earned date */}
      <p className="text-[10px] text-white/60 text-center mt-1">
        {formatDate(earnedAt)}
      </p>

      {/* Rarity Badge */}
      <div className="absolute top-2 right-2">
        <span className={`
          text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded
          bg-black/40 ${config.text}
        `}>
          {badge.rarity}
        </span>
      </div>
    </motion.div>
  );
}

// ---------- Locked Medal Card ----------
function LockedMedalCard({
  badge,
  progress,
  index,
  onClick,
}: {
  badge: BadgeDefinitionData;
  progress: { current: number; target: number; percentage: number };
  index: number;
  onClick: () => void;
}) {
  const config = getRarityConfig(badge.rarity);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className="relative p-3 sm:p-4 rounded-xl cursor-pointer
        bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50
        shadow-md hover:shadow-lg hover:border-gray-600/70
        transform-gpu"
      onClick={onClick}
    >
      {/* Lock overlay */}
      <div className="absolute top-2 left-2 z-10">
        <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
          <Lock className="h-3 w-3 text-gray-400" strokeWidth={2.5} />
        </div>
      </div>

      {/* Medal Icon (dimmed) */}
      <div className="relative flex justify-center mb-2 sm:mb-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
          bg-gray-700/50 border-2 border-gray-600/50">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-center text-sm truncate text-gray-400">
        {badge.name}
      </h4>

      {/* "Not Yet Earned" label */}
      <p className="text-[10px] text-gray-500 text-center mt-1 mb-2">
        Not Yet Earned
      </p>

      {/* Progress bar */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-gray-500">
            {progress.current}/{progress.target}
          </span>
          <span className="text-[9px] text-gray-500">
            {progress.percentage}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-700/80 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ delay: index * 0.05 + 0.3, duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${config.barColor}`}
          />
        </div>
      </div>

      {/* Rarity Badge (dimmed) */}
      <div className="absolute top-2 right-2">
        <span className="text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded
          bg-black/30 text-gray-500">
          {badge.rarity}
        </span>
      </div>
    </motion.div>
  );
}

// ---------- Earned Detail Modal ----------
function EarnedDetailModal({
  badge,
  earnedAt,
  onClose,
}: {
  badge: BadgeDefinitionData;
  earnedAt: string;
  onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const config = getRarityConfig(badge.rarity);
  const Icon = config.icon;
  const isHighRarity = badge.rarity === "legendary" || badge.rarity === "mythic";

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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        <div className="flex flex-col items-center">
          {/* Earned banner */}
          <div className="mb-4 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Earned
            </span>
          </div>

          <motion.div
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 360 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`
              w-32 h-32 rounded-full flex items-center justify-center mb-6
              bg-black/30 backdrop-blur-sm border-4 ${config.border}
              ${isHighRarity ? "animate-pulse-subtle" : ""}
            `}
          >
            {badge.icon_url && !imgError ? (
              <img
                src={badge.icon_url}
                alt={badge.name}
                className="w-24 h-24 rounded-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Icon className={`h-16 w-16 ${config.text}`} />
            )}
          </motion.div>

          <span className={`
            text-xs uppercase font-black tracking-widest px-4 py-1 rounded-full mb-4
            bg-black/40 ${config.text}
          `}>
            {badge.rarity} {badge.category}
          </span>

          <h2 className={`text-2xl font-black text-center ${config.text} mb-2`}>
            {badge.name}
          </h2>

          {badge.description && (
            <p className="text-white/80 text-center mb-4">
              {badge.description}
            </p>
          )}

          {badge.xp_reward && badge.xp_reward > 0 && (
            <div className="px-4 py-2 rounded-lg bg-black/30 mb-4">
              <span className="text-white font-medium">+{badge.xp_reward} XP</span>
            </div>
          )}

          <p className="text-white/60 text-sm">
            Earned on {new Date(earnedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Locked Detail Modal ----------
function LockedDetailModal({
  badge,
  progress,
  onClose,
}: {
  badge: BadgeDefinitionData;
  progress: { current: number; target: number; percentage: number };
  onClose: () => void;
}) {
  const config = getRarityConfig(badge.rarity);
  const Icon = config.icon;
  const remaining = progress.target - progress.current;
  const label = getProgressLabel(badge.unlock_criteria);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className="relative max-w-md w-full p-8 rounded-2xl
          bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600
          shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        <div className="flex flex-col items-center">
          {/* Locked banner */}
          <div className="mb-4 px-4 py-1.5 rounded-full bg-gray-600/30 border border-gray-500/40">
            <span className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> Not Yet Earned
            </span>
          </div>

          <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6
            bg-gray-700/50 border-4 border-gray-600/50">
            <Icon className="h-16 w-16 text-gray-500" />
          </div>

          <span className="text-xs uppercase font-black tracking-widest px-4 py-1 rounded-full mb-4
            bg-black/30 text-gray-400">
            {badge.rarity} {badge.category}
          </span>

          <h2 className="text-2xl font-black text-center text-gray-300 mb-2">
            {badge.name}
          </h2>

          {badge.description && (
            <p className="text-gray-400 text-center mb-4">
              {badge.description}
            </p>
          )}

          {badge.xp_reward && badge.xp_reward > 0 && (
            <div className="px-4 py-2 rounded-lg bg-black/20 mb-4">
              <span className="text-gray-400 font-medium">Reward: +{badge.xp_reward} XP</span>
            </div>
          )}

          {/* Large progress bar */}
          <div className="w-full mt-2 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-bold text-gray-300">
                {progress.current} / {progress.target}
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${config.barColor}`}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              {remaining > 0
                ? `${remaining} more ${label} to unlock`
                : "Ready to claim!"}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Main Component ----------
export function ProfileMedals({
  userStats,
}: ProfileMedalsProps) {
  const [selectedBadge, setSelectedBadge] = useState<{
    badge: BadgeDefinitionData;
    earned: boolean;
    earnedAt?: string;
    progress?: { current: number; target: number; percentage: number };
  } | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const defaultStats: UserStats = {
    matches_played: 0,
    matches_won: 0,
    challenges_completed: 0,
    quests_completed: 0,
    best_win_streak: 0,
    followers: 0,
    following: 0,
    clans_joined: 0,
  };
  const stats = userStats || defaultStats;

  // Auto-detect earned badges: if progress >= target, it's earned
  const earnedMap = useMemo(() => {
    const map = new Map<string, { earned_at: string }>();
    ALL_BADGE_DEFINITIONS.forEach((badge) => {
      const progress = getProgressForBadge(badge.unlock_criteria, stats);
      if (progress.percentage >= 100) {
        map.set(badge.id, { earned_at: new Date().toISOString() });
      }
    });
    return map;
  }, [stats]);

  // Filter out secret unearned badges, then apply category filter
  const visibleBadges = useMemo(() => {
    return ALL_BADGE_DEFINITIONS.filter((b) => {
      if (b.is_secret && !earnedMap.has(b.id)) return false;
      if (activeCategory !== "all" && b.category !== activeCategory) return false;
      return true;
    });
  }, [earnedMap, activeCategory]);

  // Sort: earned first, then locked (by progress % desc — closest to unlock first)
  const sortedBadges = useMemo(() => {
    const earned: BadgeDefinitionData[] = [];
    const locked: BadgeDefinitionData[] = [];

    visibleBadges.forEach((b) => {
      if (earnedMap.has(b.id)) {
        earned.push(b);
      } else {
        locked.push(b);
      }
    });

    // Earned sorted by sort_order
    earned.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    locked.sort((a, b) => {
      const progA = getProgressForBadge(a.unlock_criteria, stats).percentage;
      const progB = getProgressForBadge(b.unlock_criteria, stats).percentage;
      return progB - progA;
    });

    return [...earned, ...locked];
  }, [visibleBadges, earnedMap, stats]);

  // Get available categories
  const categories = useMemo(() => {
    const cats = new Set(ALL_BADGE_DEFINITIONS.map((b) => b.category));
    return ["all", ...Array.from(cats)];
  }, []);

  const totalVisible = ALL_BADGE_DEFINITIONS.filter(
    (b) => !b.is_secret || earnedMap.has(b.id)
  ).length;
  const totalEarned = earnedMap.size;
  const overallPercentage = totalVisible > 0 ? Math.round((totalEarned / totalVisible) * 100) : 0;

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
              {totalEarned} / {totalVisible} Earned
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall completion bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-dim">Overall Completion</span>
              <span className="text-xs font-bold text-text-muted">{overallPercentage}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-light overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
              />
            </div>
          </div>

          {/* Category filter pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-border">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`
                      text-xs font-semibold px-3 py-1.5 rounded-full transition-all
                      ${isActive
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface-light text-text-muted hover:bg-surface-light/80"}
                    `}
                  >
                    {categoryLabels[cat] || cat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {sortedBadges.map((badge, index) => {
              const isEarned = earnedMap.has(badge.id);
              const progress = getProgressForBadge(badge.unlock_criteria, stats);

              if (isEarned) {
                return (
                  <EarnedMedalCard
                    key={badge.id}
                    badge={badge}
                    earnedAt={earnedMap.get(badge.id)!.earned_at}
                    index={index}
                    onClick={() =>
                      setSelectedBadge({
                        badge,
                        earned: true,
                        earnedAt: earnedMap.get(badge.id)!.earned_at,
                      })
                    }
                  />
                );
              }

              return (
                <LockedMedalCard
                  key={badge.id}
                  badge={badge}
                  progress={progress}
                  index={index}
                  onClick={() =>
                    setSelectedBadge({ badge, earned: false, progress })
                  }
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBadge && selectedBadge.earned && (
          <EarnedDetailModal
            badge={selectedBadge.badge}
            earnedAt={selectedBadge.earnedAt!}
            onClose={() => setSelectedBadge(null)}
          />
        )}
        {selectedBadge && !selectedBadge.earned && (
          <LockedDetailModal
            badge={selectedBadge.badge}
            progress={selectedBadge.progress!}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
