"use client";

import { motion } from "framer-motion";
import { Shield, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { getTrustLevel, getTrustLevelColor, type TrustLevel } from "@/types/verification";

interface TrustScoreIndicatorProps {
  score: number;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TRUST_LEVEL_CONFIG: Record<
  TrustLevel,
  { icon: React.ElementType; label: string; description: string }
> = {
  low: {
    icon: AlertTriangle,
    label: "Low Trust",
    description: "Verify your account to increase trust",
  },
  medium: {
    icon: Shield,
    label: "Medium Trust",
    description: "Good standing, consider phone verification",
  },
  high: {
    icon: TrendingUp,
    label: "High Trust",
    description: "Trusted member of the community",
  },
  verified: {
    icon: CheckCircle,
    label: "Verified",
    description: "Fully verified and trusted",
  },
};

export function TrustScoreIndicator({
  score,
  showDetails = false,
  size = "md",
  className = "",
}: TrustScoreIndicatorProps) {
  const trustLevel = getTrustLevel(score);
  const config = TRUST_LEVEL_CONFIG[trustLevel];
  const Icon = config.icon;
  const colorClass = getTrustLevelColor(trustLevel);

  const sizeClasses = {
    sm: {
      container: "h-8",
      ring: "w-8 h-8",
      text: "text-xs",
      icon: "h-3 w-3",
    },
    md: {
      container: "h-12",
      ring: "w-12 h-12",
      text: "text-sm",
      icon: "h-4 w-4",
    },
    lg: {
      container: "h-16",
      ring: "w-16 h-16",
      text: "text-base",
      icon: "h-5 w-5",
    },
  };

  const classes = sizeClasses[size];

  // Calculate the progress for the ring
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circular progress indicator */}
      <div className={`relative ${classes.ring}`}>
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted/20"
          />
          {/* Progress ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className={colorClass}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${classes.text} ${colorClass}`}>{score}</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={`${classes.icon} ${colorClass}`} />
            <span className={`font-medium ${classes.text}`}>{config.label}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{config.description}</p>
        </div>
      )}
    </div>
  );
}

// Mini version for inline display
interface TrustScoreBadgeProps {
  score: number;
  className?: string;
}

export function TrustScoreBadge({ score, className = "" }: TrustScoreBadgeProps) {
  const trustLevel = getTrustLevel(score);
  const colorClass = getTrustLevelColor(trustLevel);

  const bgColorClass = {
    low: "bg-red-500/10",
    medium: "bg-yellow-500/10",
    high: "bg-blue-500/10",
    verified: "bg-green-500/10",
  }[trustLevel];

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${bgColorClass} ${colorClass} ${className}
      `}
      title={`Trust Score: ${score}/100`}
    >
      <Shield className="h-3 w-3" />
      {score}
    </span>
  );
}

// Detailed breakdown component
interface TrustScoreBreakdownProps {
  score: number;
  factors: Record<string, number | undefined>;
  className?: string;
}

export function TrustScoreBreakdown({
  score,
  factors,
  className = "",
}: TrustScoreBreakdownProps) {
  const factorLabels: Record<string, string> = {
    account_age: "Account Age",
    email_verified: "Email Verified",
    phone_verified: "Phone Verified",
    verified_games: "Verified Games",
    positive_ratings: "Positive Ratings",
    confirmed_reports: "Reports Against",
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <TrustScoreIndicator score={score} showDetails size="lg" />

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Score Breakdown</h4>
        <div className="space-y-1">
          {Object.entries(factors).map(([key, value]) => {
            if (value === undefined) return null;
            const isNegative = value < 0;

            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {factorLabels[key] || key}
                </span>
                <span
                  className={
                    isNegative
                      ? "text-red-500"
                      : value > 0
                        ? "text-green-500"
                        : "text-muted-foreground"
                  }
                >
                  {isNegative ? "" : "+"}
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Total Score</span>
          <span className={getTrustLevelColor(getTrustLevel(score))}>{score}/100</span>
        </div>
      </div>
    </div>
  );
}
