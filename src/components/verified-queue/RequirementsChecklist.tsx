"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Gamepad2,
  Clock,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VerifiedProfile } from "@/types/verified-queue";
import { getVerificationProgress } from "@/types/verified-queue";

interface RequirementsChecklistProps {
  profile: VerifiedProfile | null;
  onVerifyEmail?: () => void;
  onVerifyPhone?: () => void;
  onLinkPlatform?: () => void;
  compact?: boolean;
}

interface RequirementItemData {
  key: string;
  icon: typeof Mail;
  label: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

export function RequirementsChecklist({
  profile,
  onVerifyEmail,
  onVerifyPhone,
  onLinkPlatform,
  compact = false,
}: RequirementsChecklistProps) {
  const requirements: RequirementItemData[] = [
    {
      key: "email",
      icon: Mail,
      label: "Email Verified",
      description: "Verify your email address",
      completed: profile?.email_verified || false,
      action: onVerifyEmail,
      actionLabel: "Verify Email",
    },
    {
      key: "phone",
      icon: Phone,
      label: "Phone Verified",
      description: "Add and verify a phone number",
      completed: profile?.phone_verified || false,
      action: onVerifyPhone,
      actionLabel: "Verify Phone",
    },
    {
      key: "platform",
      icon: Gamepad2,
      label: "Platform Linked",
      description: "Connect your gaming account",
      completed: profile?.platform_linked || false,
      action: onLinkPlatform,
      actionLabel: "Link Platform",
    },
    {
      key: "playtime",
      icon: Clock,
      label: "10+ Hours Played",
      description: `${profile?.playtime_hours || 0}/10 hours completed`,
      completed: (profile?.playtime_hours || 0) >= 10,
    },
  ];

  const progress = profile ? getVerificationProgress(profile) : 0;
  const completedCount = requirements.filter((r) => r.completed).length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1">
          {requirements.map((req) => {
            const Icon = req.icon;
            return (
              <div
                key={req.key}
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  req.completed
                    ? "bg-green-500/20 text-green-500"
                    : "bg-muted text-muted-foreground"
                }`}
                title={req.label}
              >
                <Icon className="h-3 w-3" />
              </div>
            );
          })}
        </div>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{requirements.length}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Verification Progress</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      </div>

      {/* Requirements list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requirements.map((req, idx) => (
          <RequirementItem
            key={req.key}
            {...req}
            delay={idx * 0.1}
          />
        ))}
      </div>

      {/* Status message */}
      {progress === 100 && profile?.status === "unverified" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
        >
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-500">
            All requirements met! You can request verification.
          </span>
        </motion.div>
      )}

      {profile?.status === "suspended" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20"
        >
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-500">
            Your account is suspended until{" "}
            {profile.suspension_ends_at
              ? new Date(profile.suspension_ends_at).toLocaleDateString()
              : "further notice"}
          </span>
        </motion.div>
      )}
    </div>
  );
}

interface RequirementItemProps extends RequirementItemData {
  delay?: number;
}

function RequirementItem({
  icon: Icon,
  label,
  description,
  completed,
  action,
  actionLabel,
  delay = 0,
}: RequirementItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 p-3 rounded-lg ${
        completed ? "bg-green-500/10" : "bg-muted/50"
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          completed ? "bg-green-500/20" : "bg-muted"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${
            completed ? "text-green-500" : "text-muted-foreground"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            completed ? "text-green-500" : "text-foreground"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>

      {completed ? (
        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
      ) : action ? (
        <Button size="sm" variant="outline" onClick={action} className="shrink-0">
          {actionLabel}
        </Button>
      ) : (
        <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
    </motion.div>
  );
}

// Minimal inline requirements display
interface InlineRequirementsProps {
  profile: VerifiedProfile | null;
}

export function InlineRequirements({ profile }: InlineRequirementsProps) {
  const progress = profile ? getVerificationProgress(profile) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{progress}%</span>
    </div>
  );
}
