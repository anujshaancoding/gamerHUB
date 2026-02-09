"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Shield, ShieldAlert, ShieldOff } from "lucide-react";
import {
  type VerificationStatus,
  type BehaviorRating,
  getBehaviorColor,
} from "@/types/verified-queue";

interface VerifiedBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  { icon: typeof ShieldCheck; label: string; color: string }
> = {
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    color: "#22C55E",
  },
  pending: {
    icon: Shield,
    label: "Pending",
    color: "#F59E0B",
  },
  unverified: {
    icon: Shield,
    label: "Unverified",
    color: "#94A3B8",
  },
  suspended: {
    icon: ShieldOff,
    label: "Suspended",
    color: "#EF4444",
  },
};

export function VerifiedBadge({
  status,
  size = "md",
  showLabel = true,
}: VerifiedBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { icon: "h-3 w-3", text: "text-xs", padding: "px-1.5 py-0.5" },
    md: { icon: "h-4 w-4", text: "text-sm", padding: "px-2 py-1" },
    lg: { icon: "h-5 w-5", text: "text-base", padding: "px-3 py-1.5" },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full ${sizes.padding}`}
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
    >
      <Icon className={sizes.icon} />
      {showLabel && (
        <span className={`font-medium ${sizes.text}`}>{config.label}</span>
      )}
    </motion.div>
  );
}

// Compact verified icon for inline use
interface VerifiedIconProps {
  verified: boolean;
  size?: "sm" | "md" | "lg";
}

export function VerifiedIcon({ verified, size = "md" }: VerifiedIconProps) {
  if (!verified) return null;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <ShieldCheck
      className={`${sizeClasses[size]} text-green-500`}
      title="Verified Player"
    />
  );
}

// Behavior score badge
interface BehaviorBadgeProps {
  score: number;
  rating: BehaviorRating;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function BehaviorBadge({
  score,
  rating,
  size = "md",
  showScore = true,
}: BehaviorBadgeProps) {
  const color = getBehaviorColor(rating);

  const sizeClasses = {
    sm: { text: "text-xs", padding: "px-1.5 py-0.5" },
    md: { text: "text-sm", padding: "px-2 py-1" },
    lg: { text: "text-base", padding: "px-3 py-1.5" },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full ${sizes.padding}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      {showScore && <span className={`font-bold ${sizes.text}`}>{score}</span>}
      <span className={`font-medium capitalize ${sizes.text}`}>{rating}</span>
    </motion.div>
  );
}

// Full profile badge combining verification and behavior
interface ProfileBadgeProps {
  status: VerificationStatus;
  behaviorScore: number;
  behaviorRating: BehaviorRating;
  compact?: boolean;
}

export function ProfileBadge({
  status,
  behaviorScore,
  behaviorRating,
  compact = false,
}: ProfileBadgeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <VerifiedBadge status={status} size="sm" showLabel={false} />
        <BehaviorBadge
          score={behaviorScore}
          rating={behaviorRating}
          size="sm"
          showScore={true}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <VerifiedBadge status={status} />
      <BehaviorBadge score={behaviorScore} rating={behaviorRating} />
    </div>
  );
}
