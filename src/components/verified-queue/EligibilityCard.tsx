"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type VerifiedProfile,
  type BehaviorRating,
  getBehaviorColor,
  canAccessVerifiedQueue,
} from "@/types/verified-queue";
import { VerifiedBadge, BehaviorBadge } from "./VerifiedBadge";
import { RequirementsChecklist, InlineRequirements } from "./RequirementsChecklist";

interface EligibilityCardProps {
  profile: VerifiedProfile | null;
  onRequestVerification?: () => void;
  onJoinQueue?: () => void;
  isLoading?: boolean;
}

export function EligibilityCard({
  profile,
  onRequestVerification,
  onJoinQueue,
  isLoading = false,
}: EligibilityCardProps) {
  const canAccess = profile ? canAccessVerifiedQueue(profile) : false;
  const behaviorColor = profile ? getBehaviorColor(profile.behavior_rating) : "#94A3B8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 border-b border-border"
        style={{
          background: canAccess
            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))"
            : "linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(100, 116, 139, 0.1))",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: canAccess ? "rgba(34, 197, 94, 0.2)" : "rgba(148, 163, 184, 0.2)",
              }}
            >
              {canAccess ? (
                <ShieldCheck className="h-6 w-6 text-green-500" />
              ) : (
                <Shield className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">Verified Queue Eligibility</h3>
              <p className="text-sm text-muted-foreground">
                {canAccess
                  ? "You can join the verified queue"
                  : "Complete requirements to access"}
              </p>
            </div>
          </div>

          {profile && (
            <VerifiedBadge status={profile.status} size="sm" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Behavior Score */}
        {profile && (
          <div className="flex items-center gap-6">
            {/* Score Circle */}
            <div className="relative">
              <svg width="80" height="80" className="transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke={behaviorColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: profile.behavior_score / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    strokeDasharray: "220",
                    strokeDashoffset: 0,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-xl font-bold"
                  style={{ color: behaviorColor }}
                >
                  {profile.behavior_score}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Endorsements
                </span>
                <span className="font-medium text-green-500">
                  +{profile.positive_endorsements}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Reports
                </span>
                <span className="font-medium text-red-500">
                  -{profile.negative_reports}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Games
                </span>
                <span className="font-medium">{profile.games_played}</span>
              </div>
            </div>
          </div>
        )}

        {/* Requirements */}
        <div>
          <h4 className="text-sm font-medium mb-3">Verification Requirements</h4>
          <RequirementsChecklist profile={profile} compact />
        </div>

        {/* Eligibility Checks */}
        {profile && profile.status === "verified" && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Queue Access Requirements</h4>
            <div className="grid grid-cols-2 gap-2">
              <EligibilityCheck
                label="Verified Status"
                passed={profile.status === "verified"}
              />
              <EligibilityCheck
                label="Behavior Score ≥50"
                passed={profile.behavior_score >= 50}
              />
              <EligibilityCheck
                label="No Active Strikes"
                passed={profile.active_strikes === 0}
              />
              <EligibilityCheck
                label="Not Suspended"
                passed={profile.status !== "suspended"}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2">
          {!profile || profile.status === "unverified" ? (
            <Button
              className="w-full"
              onClick={onRequestVerification}
              disabled={isLoading}
            >
              <Shield className="h-4 w-4 mr-2" />
              Request Verification
            </Button>
          ) : profile.status === "pending" ? (
            <div className="text-center py-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-yellow-500">
                Verification in progress...
              </p>
            </div>
          ) : canAccess ? (
            <Button className="w-full" onClick={onJoinQueue} disabled={isLoading}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Join Verified Queue
            </Button>
          ) : (
            <div className="text-center py-3 bg-muted/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">
                {profile.behavior_score < 50
                  ? "Improve your behavior score to access"
                  : profile.active_strikes > 0
                  ? "Resolve active strikes to access"
                  : "Complete all requirements to access"}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface EligibilityCheckProps {
  label: string;
  passed: boolean;
}

function EligibilityCheck({ label, passed }: EligibilityCheckProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        passed ? "bg-green-500/10" : "bg-red-500/10"
      }`}
    >
      {passed ? (
        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
      )}
      <span className={passed ? "text-green-500" : "text-red-500"}>{label}</span>
    </div>
  );
}

// Compact eligibility indicator
interface EligibilityIndicatorProps {
  canAccess: boolean;
  reason?: string;
}

export function EligibilityIndicator({ canAccess, reason }: EligibilityIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
        canAccess ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
      }`}
    >
      {canAccess ? (
        <>
          <ShieldCheck className="h-4 w-4" />
          <span>Eligible for Verified Queue</span>
        </>
      ) : (
        <>
          <ShieldAlert className="h-4 w-4" />
          <span>{reason || "Not Eligible"}</span>
        </>
      )}
    </div>
  );
}
