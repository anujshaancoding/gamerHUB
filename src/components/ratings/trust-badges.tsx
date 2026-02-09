"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  CheckCircle,
  Award,
  Heart,
  Clock,
} from "lucide-react";
import type { TrustBadges as TrustBadgesType } from "@/types/database";

interface TrustBadgesProps {
  badges: TrustBadgesType;
}

interface BadgeConfig {
  key: keyof TrustBadgesType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const badgeConfigs: BadgeConfig[] = [
  {
    key: "isVerified",
    label: "Verified",
    icon: CheckCircle,
    color: "#00d4ff",
    bgColor: "rgba(0, 212, 255, 0.15)",
  },
  {
    key: "isTrusted",
    label: "Trusted",
    icon: Shield,
    color: "#00ff88",
    bgColor: "rgba(0, 255, 136, 0.15)",
  },
  {
    key: "isVeteran",
    label: "Veteran",
    icon: Award,
    color: "#ffaa00",
    bgColor: "rgba(255, 170, 0, 0.15)",
  },
  {
    key: "isActive",
    label: "Active",
    icon: Zap,
    color: "#ff00ff",
    bgColor: "rgba(255, 0, 255, 0.15)",
  },
  {
    key: "isCommunityPillar",
    label: "Community Pillar",
    icon: Heart,
    color: "#ff6b6b",
    bgColor: "rgba(255, 107, 107, 0.15)",
  },
  {
    key: "isEstablished",
    label: "Established",
    icon: Clock,
    color: "#b8b8c8",
    bgColor: "rgba(184, 184, 200, 0.15)",
  },
];

export function TrustBadges({ badges }: TrustBadgesProps) {
  const earnedBadges = badgeConfigs.filter((config) => badges[config.key]);

  if (earnedBadges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {earnedBadges.map((config, index) => (
        <motion.div
          key={config.key}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105"
          style={{
            color: config.color,
            backgroundColor: config.bgColor,
            borderColor: `${config.color}30`,
          }}
          title={config.label}
        >
          <config.icon className="h-3 w-3" />
          <span>{config.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
