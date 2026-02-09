"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Calendar,
  Activity,
  Heart,
  AlertTriangle,
  Layers,
  RefreshCw,
  Users,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import type { StandingLevel } from "@/types/database";

interface AccountStandingProps {
  factors: {
    accountAge: StandingLevel;
    activity: StandingLevel;
    community: StandingLevel;
    cleanRecord: StandingLevel;
    engagement: StandingLevel;
    repeatPlays: StandingLevel;
    clanActivity: StandingLevel;
    verified: boolean;
  };
}

interface FactorConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const factorConfigs: FactorConfig[] = [
  {
    key: "accountAge",
    label: "Account Age",
    icon: Calendar,
    color: "#00ff88",
  },
  { key: "activity", label: "Activity", icon: Activity, color: "#00d4ff" },
  { key: "community", label: "Community", icon: Heart, color: "#ff00ff" },
  {
    key: "cleanRecord",
    label: "Clean Record",
    icon: AlertTriangle,
    color: "#ffaa00",
  },
  { key: "engagement", label: "Engagement", icon: Layers, color: "#ff6b6b" },
  {
    key: "repeatPlays",
    label: "Repeat Plays",
    icon: RefreshCw,
    color: "#00ff88",
  },
  {
    key: "clanActivity",
    label: "Clan Activity",
    icon: Users,
    color: "#00d4ff",
  },
];

const standingLevels: Record<
  StandingLevel,
  { label: string; width: string; opacity: number }
> = {
  new: { label: "New", width: "20%", opacity: 0.3 },
  growing: { label: "Growing", width: "50%", opacity: 0.5 },
  established: { label: "Established", width: "75%", opacity: 0.75 },
  veteran: { label: "Veteran", width: "100%", opacity: 1 },
};

function StandingBar({
  label,
  level,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  level: StandingLevel;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  const standing = standingLevels[level];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-text-secondary">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          <span className="text-xs">{label}</span>
        </span>
        <span
          className="text-xs font-medium"
          style={{ color, opacity: standing.opacity }}
        >
          {standing.label}
        </span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: standing.width }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}60, ${color})`,
            opacity: standing.opacity,
          }}
        />
      </div>
    </motion.div>
  );
}

export function GlobalRatingBreakdown({ factors }: AccountStandingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="gaming-card-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-accent/20">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            Account Standing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {factorConfigs.map((config, index) => (
              <StandingBar
                key={config.key}
                label={config.label}
                level={
                  factors[config.key as keyof typeof factors] as StandingLevel
                }
                icon={config.icon}
                color={config.color}
                delay={0.1 + index * 0.08}
              />
            ))}

            {/* Verified Badge */}
            {factors.verified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2 mt-3 pt-3 border-t border-border"
              >
                <CheckCircle className="h-4 w-4 text-accent" />
                <span className="text-xs text-accent font-semibold">
                  Verified Account
                </span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper to convert numeric scores to standing levels
export function scoreToStanding(score: number): StandingLevel {
  if (score < 25) return "new";
  if (score < 50) return "growing";
  if (score < 75) return "established";
  return "veteran";
}
