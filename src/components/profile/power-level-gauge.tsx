"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Swords, Crown, Flame, Star } from "lucide-react";
import { useGameTheme } from "@/components/profile/game-theme-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface PowerLevelGaugeProps {
  gamesLinked: number;
  // matchesPlayed: number; // TODO: re-add when game integrations provide this
  hoursOnline: number;
  badgeCount: number;
  level: number;
  endorsementCount: number;
  isPremium: boolean;
  isVerified: boolean;
}

interface Tier {
  name: string;
  min: number;
  max: number;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  glowIntensity: number;
}

const TIERS: Tier[] = [
  { name: "Rookie", min: 0, max: 199, color: "#8B8B8B", icon: Shield, glowIntensity: 0 },
  { name: "Skilled", min: 200, max: 399, color: "#22C55E", icon: Swords, glowIntensity: 0.3 },
  { name: "Elite", min: 400, max: 599, color: "#3B82F6", icon: Crown, glowIntensity: 0.4 },
  { name: "Master", min: 600, max: 799, color: "#A855F7", icon: Flame, glowIntensity: 0.5 },
  { name: "Legend", min: 800, max: 999, color: "#FFD700", icon: Star, glowIntensity: 0.7 },
];

function calculatePowerLevel(props: PowerLevelGaugeProps): number {
  let score = 0;
  score += Math.min(props.gamesLinked * 30, 210);
  // score += Math.min(props.matchesPlayed * 0.05, 150); // TODO: re-add later
  score += Math.min(props.hoursOnline * 1.5, 150); // 100 hours = max 150 points
  score += Math.min(props.badgeCount * 10, 200);
  score += Math.min(props.level * 2, 200);
  score += Math.min(props.endorsementCount * 3, 150);
  if (props.isPremium) score += 39;
  if (props.isVerified) score += 50;
  return Math.min(Math.round(score), 999);
}

function getTier(score: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

export function PowerLevelGauge(props: PowerLevelGaugeProps) {
  const score = calculatePowerLevel(props);
  const tier = getTier(score);
  const { theme } = useGameTheme();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  // SVG arc parameters
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  // Arc from 180deg (left) to 0deg (right) = half circle
  const circumference = Math.PI * radius;
  const progress = animated ? score / 999 : 0;
  const dashOffset = circumference * (1 - progress);

  const TierIcon = tier.icon;

  return (
    <Card className="gaming-card-border overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${tier.color}20` }}>
            <Flame className="h-5 w-5" style={{ color: tier.color }} />
          </div>
          Power Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-2">
          {/* Radial Gauge */}
          <div className="relative" style={{ width: size, height: size / 2 + 30 }}>
            <svg
              width={size}
              height={size / 2 + strokeWidth}
              viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
              className="overflow-visible"
            >
              {/* Background track */}
              <path
                d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-border"
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <motion.path
                d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                fill="none"
                stroke={tier.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                style={{
                  filter: tier.glowIntensity > 0
                    ? `drop-shadow(0 0 ${6 * tier.glowIntensity}px ${tier.color})`
                    : undefined,
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                className="mb-1"
              >
                <TierIcon
                  className="h-6 w-6"
                  style={{ color: tier.color }}
                />
              </motion.div>
              <motion.p
                className="text-4xl font-black tabular-nums"
                style={{ color: tier.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {animated ? score : 0}
              </motion.p>
            </div>
          </div>

          {/* Tier label */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-1 px-4 py-1 rounded-full text-sm font-bold"
            style={{
              color: tier.color,
              backgroundColor: `${tier.color}18`,
              border: `1px solid ${tier.color}40`,
            }}
          >
            {tier.name}
          </motion.div>

          {/* Tier bar */}
          <div className="flex gap-1 mt-4 w-full max-w-[200px]">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: score >= t.min ? t.color : `${t.color}30`,
                  boxShadow: score >= t.min && t.glowIntensity > 0
                    ? `0 0 4px ${t.color}`
                    : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
