"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { getGameTheme, getRankVisual, type RankVisual } from "@/lib/constants/game-themes";

interface AnimatedRankEmblemProps {
  rank: string;
  gameSlug?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "px-2.5 py-1 text-xs gap-1",
  md: "px-3 py-1.5 text-sm gap-1.5",
  lg: "px-4 py-2 text-base gap-2",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4.5 w-4.5",
};

function getAnimationProps(visual: RankVisual) {
  switch (visual.animation) {
    case "shimmer":
      return {
        animate: {
          boxShadow: [
            `0 0 8px ${visual.glowColor}, 0 0 16px ${visual.glowColor}`,
            `0 0 16px ${visual.glowColor}, 0 0 32px ${visual.glowColor}`,
            `0 0 8px ${visual.glowColor}, 0 0 16px ${visual.glowColor}`,
          ],
        },
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };
    case "pulse":
      return {
        animate: {
          boxShadow: [
            `0 0 4px ${visual.glowColor}`,
            `0 0 12px ${visual.glowColor}`,
            `0 0 4px ${visual.glowColor}`,
          ],
        },
        transition: {
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };
    case "glow":
      return {
        animate: {
          boxShadow: [
            `0 0 4px ${visual.glowColor}`,
            `0 0 8px ${visual.glowColor}`,
            `0 0 4px ${visual.glowColor}`,
          ],
        },
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };
    default:
      return {
        animate: {},
        transition: {},
      };
  }
}

export function AnimatedRankEmblem({
  rank,
  gameSlug,
  size = "md",
  className = "",
}: AnimatedRankEmblemProps) {
  const theme = getGameTheme(gameSlug);
  const visual = getRankVisual(theme, rank);
  const animProps = getAnimationProps(visual);

  return (
    <motion.div
      className={`
        relative inline-flex items-center rounded-lg font-bold
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        color: visual.color,
        backgroundColor: `${visual.color}18`,
        border: `1.5px solid ${visual.borderColor}`,
        boxShadow: `0 0 6px ${visual.glowColor}`,
      }}
      animate={animProps.animate}
      transition={animProps.transition}
      whileHover={{ scale: 1.05, y: -1 }}
    >
      {/* Shimmer overlay for top-tier ranks */}
      {visual.animation === "shimmer" && (
        <motion.div
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg, transparent 30%, ${visual.color}30 45%, ${visual.color}50 50%, ${visual.color}30 55%, transparent 70%)`,
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1,
            }}
          />
        </motion.div>
      )}

      <Trophy className={iconSizes[size]} style={{ color: visual.color }} />
      <span className="relative z-10 font-bold">{rank}</span>
    </motion.div>
  );
}
