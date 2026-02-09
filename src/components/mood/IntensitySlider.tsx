"use client";

import { motion } from "framer-motion";
import { MOOD_INTENSITIES, type MoodIntensity } from "@/types/mood";

interface IntensitySliderProps {
  value: MoodIntensity;
  onChange: (value: MoodIntensity) => void;
  showLabels?: boolean;
  size?: "sm" | "md";
}

export function IntensitySlider({
  value,
  onChange,
  showLabels = true,
  size = "md",
}: IntensitySliderProps) {
  const handleClick = (level: MoodIntensity) => {
    onChange(level);
  };

  const getIntensityColor = (level: MoodIntensity) => {
    const colors: Record<MoodIntensity, string> = {
      1: "#94A3B8",
      2: "#3B82F6",
      3: "#22C55E",
      4: "#F59E0B",
      5: "#EF4444",
    };
    return colors[level];
  };

  const dotSize = size === "sm" ? "w-6 h-6" : "w-8 h-8";
  const barHeight = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div className="space-y-2">
      <div className="relative flex items-center justify-between">
        {/* Background bar */}
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${barHeight} bg-muted rounded-full`} />

        {/* Filled bar */}
        <motion.div
          className={`absolute left-0 top-1/2 -translate-y-1/2 ${barHeight} rounded-full`}
          initial={false}
          animate={{
            width: `${((value - 1) / 4) * 100}%`,
            backgroundColor: getIntensityColor(value),
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Dots */}
        {MOOD_INTENSITIES.map((intensity) => (
          <motion.button
            key={intensity.level}
            onClick={() => handleClick(intensity.level)}
            className={`relative z-10 ${dotSize} rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              value >= intensity.level
                ? "text-white"
                : "text-muted-foreground bg-muted border-2 border-border"
            }`}
            initial={false}
            animate={{
              backgroundColor:
                value >= intensity.level ? getIntensityColor(intensity.level) : "transparent",
              scale: value === intensity.level ? 1.15 : 1,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={`${intensity.label}: ${intensity.description}`}
          >
            {intensity.level}
          </motion.button>
        ))}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span
            className="font-medium"
            style={{ color: getIntensityColor(value) }}
          >
            {MOOD_INTENSITIES[value - 1].label}
          </span>
          <span>Max</span>
        </div>
      )}
    </div>
  );
}

// Simple intensity display (read-only)
interface IntensityDisplayProps {
  value: MoodIntensity;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function IntensityDisplay({
  value,
  showLabel = true,
  size = "sm",
}: IntensityDisplayProps) {
  const getIntensityColor = (level: MoodIntensity) => {
    const colors: Record<MoodIntensity, string> = {
      1: "#94A3B8",
      2: "#3B82F6",
      3: "#22C55E",
      4: "#F59E0B",
      5: "#EF4444",
    };
    return colors[level];
  };

  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`${dotSize} rounded-full transition-colors`}
          style={{
            backgroundColor:
              level <= value ? getIntensityColor(value) : "var(--muted)",
          }}
        />
      ))}
      {showLabel && (
        <span
          className="text-xs ml-1"
          style={{ color: getIntensityColor(value) }}
        >
          {MOOD_INTENSITIES[value - 1].label}
        </span>
      )}
    </div>
  );
}
