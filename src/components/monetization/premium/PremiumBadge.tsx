"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { icon: "h-3 w-3", padding: "px-1.5 py-0.5", text: "text-[10px]" },
  md: { icon: "h-3.5 w-3.5", padding: "px-2.5 py-1", text: "text-xs" },
  lg: { icon: "h-4 w-4", padding: "px-3 py-1.5", text: "text-sm" },
};

export function PremiumBadge({
  size = "md",
  animate = true,
  showLabel = true,
  className = "",
}: PremiumBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const badge = (
    <div
      className={`
        inline-flex items-center gap-1 ${sizeConfig.padding} rounded-full
        ${sizeConfig.text} font-semibold border transition-all hover:scale-105
        ${className}
      `}
      style={{
        color: "#fbbf24",
        backgroundColor: "rgba(251, 191, 36, 0.15)",
        borderColor: "rgba(251, 191, 36, 0.30)",
      }}
      title="Premium Member"
    >
      <Crown className={sizeConfig.icon} />
      {showLabel && <span>Premium</span>}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}
