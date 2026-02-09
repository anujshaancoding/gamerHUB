"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  Shield,
  Phone,
  Mail,
  Gamepad2,
  Star,
  Crown,
  Video,
  Trophy,
  Sparkles,
} from "lucide-react";
import type { BadgeType } from "@/types/verification";

interface VerifiedBadgeProps {
  type: BadgeType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

const BADGE_CONFIG: Record<
  BadgeType,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  phone_verified: {
    icon: Phone,
    label: "Phone Verified",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  email_verified: {
    icon: Mail,
    label: "Email Verified",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  game_verified: {
    icon: Gamepad2,
    label: "Game Verified",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  streamer: {
    icon: Video,
    label: "Streamer",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  pro_player: {
    icon: Crown,
    label: "Pro Player",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  content_creator: {
    icon: Star,
    label: "Content Creator",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  tournament_winner: {
    icon: Trophy,
    label: "Tournament Winner",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  early_adopter: {
    icon: Sparkles,
    label: "Early Adopter",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  premium_member: {
    icon: Shield,
    label: "Premium",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
};

const SIZE_CLASSES = {
  sm: {
    container: "h-5 w-5",
    icon: "h-3 w-3",
    labelText: "text-xs",
    labelPadding: "px-2 py-0.5",
  },
  md: {
    container: "h-6 w-6",
    icon: "h-4 w-4",
    labelText: "text-sm",
    labelPadding: "px-2.5 py-1",
  },
  lg: {
    container: "h-8 w-8",
    icon: "h-5 w-5",
    labelText: "text-base",
    labelPadding: "px-3 py-1.5",
  },
};

export function VerifiedBadge({
  type,
  size = "md",
  showLabel = false,
  animate = false,
  className = "",
}: VerifiedBadgeProps) {
  const config = BADGE_CONFIG[type];
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = config.icon;

  const badge = (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full
        ${showLabel ? `${sizeClasses.labelPadding} ${config.bgColor}` : ""}
        ${className}
      `}
      title={config.label}
    >
      <div
        className={`
          flex items-center justify-center rounded-full
          ${showLabel ? "" : config.bgColor}
          ${showLabel ? "" : sizeClasses.container}
        `}
      >
        <Icon className={`${sizeClasses.icon} ${config.color}`} />
      </div>
      {showLabel && (
        <span className={`${sizeClasses.labelText} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}

// Display multiple badges
interface BadgeGroupProps {
  badges: BadgeType[];
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
  className?: string;
}

export function BadgeGroup({
  badges,
  size = "sm",
  maxDisplay = 4,
  className = "",
}: BadgeGroupProps) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {displayBadges.map((badge) => (
        <VerifiedBadge key={badge} type={badge} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">+{remainingCount}</span>
      )}
    </div>
  );
}

// Verification level badge (composite)
interface VerificationLevelBadgeProps {
  level: 0 | 1 | 2 | 3 | 4;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const LEVEL_CONFIG = {
  0: { label: "Unverified", color: "text-gray-400", bgColor: "bg-gray-500/10" },
  1: { label: "Email Verified", color: "text-green-400", bgColor: "bg-green-500/10" },
  2: { label: "Phone Verified", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  3: { label: "Game Verified", color: "text-purple-400", bgColor: "bg-purple-500/10" },
  4: { label: "Fully Verified", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
};

export function VerificationLevelBadge({
  level,
  size = "md",
  showLabel = false,
}: VerificationLevelBadgeProps) {
  const config = LEVEL_CONFIG[level];
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full
        ${sizeClasses.labelPadding} ${config.bgColor}
      `}
      title={config.label}
    >
      <CheckCircle className={`${sizeClasses.icon} ${config.color}`} />
      {showLabel && (
        <span className={`${sizeClasses.labelText} ${config.color} font-medium`}>
          {config.label}
        </span>
      )}
      {!showLabel && (
        <span className={`${sizeClasses.labelText} ${config.color} font-medium`}>
          L{level}
        </span>
      )}
    </div>
  );
}
