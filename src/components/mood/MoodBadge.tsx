"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { GAMING_MOODS, type GamingMood, type MoodIntensity, formatMoodExpiry } from "@/types/mood";
import { IntensityDisplay } from "./IntensitySlider";

interface MoodBadgeProps {
  mood: GamingMood;
  intensity?: MoodIntensity;
  expiresAt?: string;
  note?: string;
  size?: "sm" | "md" | "lg";
  showExpiry?: boolean;
  showIntensity?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MoodBadge({
  mood,
  intensity = 3,
  expiresAt,
  note,
  size = "md",
  showExpiry = false,
  showIntensity = false,
  onClick,
  className = "",
}: MoodBadgeProps) {
  const moodInfo = GAMING_MOODS[mood];

  if (!moodInfo) return null;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const emojiSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const isClickable = !!onClick;

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${
        isClickable ? "cursor-pointer" : ""
      } ${className}`}
      style={{
        backgroundColor: `${moodInfo.color}15`,
        color: moodInfo.color,
      }}
      title={note || moodInfo.description}
    >
      <span className={emojiSizes[size]}>{moodInfo.emoji}</span>
      <span>{moodInfo.label}</span>

      {showIntensity && (
        <IntensityDisplay value={intensity} showLabel={false} size="sm" />
      )}

      {showExpiry && expiresAt && (
        <span className="flex items-center gap-0.5 text-xs opacity-75">
          <Clock className="h-3 w-3" />
          {formatMoodExpiry(expiresAt)}
        </span>
      )}
    </motion.div>
  );
}

// Compact mood indicator (just emoji + color dot)
interface MoodIndicatorProps {
  mood: GamingMood;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

export function MoodIndicator({ mood, size = "sm", showTooltip = true }: MoodIndicatorProps) {
  const moodInfo = GAMING_MOODS[mood];

  if (!moodInfo) return null;

  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  const fontSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className="inline-flex items-center gap-1"
      title={showTooltip ? `${moodInfo.label}: ${moodInfo.description}` : undefined}
    >
      <span className={fontSize}>{moodInfo.emoji}</span>
      <span
        className={`${dotSize} rounded-full`}
        style={{ backgroundColor: moodInfo.color }}
      />
    </div>
  );
}

// Mood card for displaying a player's mood
interface MoodCardProps {
  mood: GamingMood;
  intensity: MoodIntensity;
  expiresAt: string;
  note?: string;
  username?: string;
  avatarUrl?: string;
  onClick?: () => void;
}

export function MoodCard({
  mood,
  intensity,
  expiresAt,
  note,
  username,
  avatarUrl,
  onClick,
}: MoodCardProps) {
  const moodInfo = GAMING_MOODS[mood];

  if (!moodInfo) return null;

  const isClickable = !!onClick;

  return (
    <motion.div
      whileHover={isClickable ? { y: -2 } : undefined}
      onClick={onClick}
      className={`p-4 rounded-xl border border-border bg-card ${
        isClickable ? "cursor-pointer hover:border-primary/50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar or Emoji */}
        {username ? (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={username} width={40} height={40} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="font-bold text-primary">{username[0]?.toUpperCase()}</span>
            )}
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: `${moodInfo.color}20` }}
          >
            {moodInfo.emoji}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Username or Mood Label */}
          <div className="flex items-center gap-2">
            {username && <span className="font-medium">{username}</span>}
            <MoodBadge mood={mood} size="sm" />
          </div>

          {/* Note or Description */}
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {note || moodInfo.description}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2">
            <IntensityDisplay value={intensity} size="sm" />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatMoodExpiry(expiresAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
