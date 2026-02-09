"use client";

import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function LevelBadge({
  level,
  size = "md",
  showLabel = false,
  className,
}: LevelBadgeProps) {
  // Determine color based on level ranges
  const getLevelColor = (level: number) => {
    if (level >= 100) return "from-red-500 to-orange-500 shadow-red-500/30";
    if (level >= 75) return "from-cyan-400 to-blue-500 shadow-cyan-500/30";
    if (level >= 50) return "from-purple-500 to-pink-500 shadow-purple-500/30";
    if (level >= 30) return "from-yellow-400 to-amber-500 shadow-yellow-500/30";
    if (level >= 20) return "from-gray-300 to-gray-400 shadow-gray-400/30";
    if (level >= 10) return "from-amber-600 to-amber-700 shadow-amber-600/30";
    return "from-slate-500 to-slate-600 shadow-slate-500/20";
  };

  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-lg",
          getLevelColor(level),
          sizes[size]
        )}
      >
        {level}
      </div>
      {showLabel && (
        <span className="text-sm text-text-muted">Level {level}</span>
      )}
    </div>
  );
}
