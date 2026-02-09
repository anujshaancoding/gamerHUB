"use client";

import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Minus, Sparkles, AlertTriangle } from "lucide-react";
import {
  type GamingMood,
  type MoodIntensity,
  type MoodCompatibility,
  GAMING_MOODS,
  getMoodCompatibilityColor,
  calculateMoodCompatibility,
} from "@/types/mood";

interface MoodCompatibilityIndicatorProps {
  compatibility: MoodCompatibility;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MoodCompatibilityIndicator({
  compatibility,
  showDetails = false,
  size = "md",
}: MoodCompatibilityIndicatorProps) {
  const color = getMoodCompatibilityColor(compatibility.level);

  const getIcon = () => {
    switch (compatibility.level) {
      case "perfect":
      case "great":
        return ThumbsUp;
      case "good":
        return Sparkles;
      case "okay":
        return Minus;
      case "poor":
        return AlertTriangle;
    }
  };

  const Icon = getIcon();

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className={iconSizes[size]} />
        <span className="font-medium">{compatibility.score}%</span>
      </div>

      {showDetails && (
        <span className="text-muted-foreground capitalize">
          {compatibility.level} - {compatibility.reason}
        </span>
      )}
    </div>
  );
}

// Detailed compatibility comparison between two moods
interface MoodComparisonProps {
  mood1: GamingMood;
  intensity1: MoodIntensity;
  mood2: GamingMood;
  intensity2: MoodIntensity;
  showLabels?: boolean;
}

export function MoodComparison({
  mood1,
  intensity1,
  mood2,
  intensity2,
  showLabels = true,
}: MoodComparisonProps) {
  const compatibility = calculateMoodCompatibility(mood1, intensity1, mood2, intensity2);
  const color = getMoodCompatibilityColor(compatibility.level);
  const mood1Info = GAMING_MOODS[mood1];
  const mood2Info = GAMING_MOODS[mood2];

  return (
    <div className="flex items-center gap-3">
      {/* Mood 1 */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{mood1Info.emoji}</span>
        {showLabels && (
          <span className="text-sm font-medium">{mood1Info.label}</span>
        )}
      </div>

      {/* Compatibility Score */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2"
        >
          <div
            className="h-1 w-12 rounded-full"
            style={{ backgroundColor: `${color}30` }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${compatibility.score}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
          <span
            className="text-sm font-bold"
            style={{ color }}
          >
            {compatibility.score}%
          </span>
          <div
            className="h-1 w-12 rounded-full"
            style={{ backgroundColor: `${color}30` }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${compatibility.score}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </motion.div>
      </div>

      {/* Mood 2 */}
      <div className="flex items-center gap-2">
        {showLabels && (
          <span className="text-sm font-medium">{mood2Info.label}</span>
        )}
        <span className="text-xl">{mood2Info.emoji}</span>
      </div>
    </div>
  );
}

// Compatibility score circle
interface CompatibilityCircleProps {
  compatibility: MoodCompatibility;
  size?: number;
  showLabel?: boolean;
}

export function CompatibilityCircle({
  compatibility,
  size = 60,
  showLabel = true,
}: CompatibilityCircleProps) {
  const color = getMoodCompatibilityColor(compatibility.level);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (compatibility.score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-lg font-bold" style={{ color }}>
          {compatibility.score}%
        </span>
      </motion.div>
      {showLabel && (
        <span
          className="text-xs font-medium capitalize mt-1"
          style={{ color }}
        >
          {compatibility.level}
        </span>
      )}
    </div>
  );
}

// Compatibility list for multiple players
interface CompatibilityListProps {
  players: Array<{
    id: string;
    username: string;
    avatarUrl?: string;
    mood: GamingMood;
    intensity: MoodIntensity;
    compatibility: MoodCompatibility;
  }>;
  onPlayerClick?: (playerId: string) => void;
}

export function CompatibilityList({ players, onPlayerClick }: CompatibilityListProps) {
  // Sort by compatibility score
  const sortedPlayers = [...players].sort(
    (a, b) => b.compatibility.score - a.compatibility.score
  );

  return (
    <div className="space-y-2">
      {sortedPlayers.map((player) => {
        const moodInfo = GAMING_MOODS[player.mood];
        const color = getMoodCompatibilityColor(player.compatibility.level);

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 4 }}
            onClick={() => onPlayerClick?.(player.id)}
            className={`flex items-center gap-3 p-3 rounded-lg bg-muted/30 ${
              onPlayerClick ? "cursor-pointer hover:bg-muted/50" : ""
            }`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-primary">
                  {player.username[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{player.username}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{moodInfo.emoji}</span>
                <span>{moodInfo.label}</span>
              </div>
            </div>

            {/* Compatibility */}
            <div
              className="px-3 py-1 rounded-full font-bold"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {player.compatibility.score}%
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
