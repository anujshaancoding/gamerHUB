"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  Video,
  Users,
  Monitor,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CoachingSession, SessionType, SessionStatus } from "@/types/coaching";
import { SESSION_TYPES, formatDuration, formatPrice } from "@/types/coaching";

interface SessionCardProps {
  session: CoachingSession;
  role: "coach" | "student";
  onConfirm?: () => void;
  onCancel?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onJoin?: () => void;
}

export function SessionCard({
  session,
  role,
  onConfirm,
  onCancel,
  onStart,
  onComplete,
  onJoin,
}: SessionCardProps) {
  const sessionTypeInfo = SESSION_TYPES[session.session_type];
  const scheduledDate = new Date(session.scheduled_at);
  const isPast = scheduledDate < new Date();

  const getStatusConfig = (status: SessionStatus) => {
    const configs: Record<SessionStatus, { color: string; bg: string; icon: React.ElementType; label: string }> = {
      pending: { color: "text-yellow-500", bg: "bg-yellow-500/10", icon: AlertCircle, label: "Pending" },
      confirmed: { color: "text-blue-500", bg: "bg-blue-500/10", icon: CheckCircle, label: "Confirmed" },
      in_progress: { color: "text-green-500", bg: "bg-green-500/10", icon: Play, label: "In Progress" },
      completed: { color: "text-gray-500", bg: "bg-gray-500/10", icon: CheckCircle, label: "Completed" },
      cancelled: { color: "text-red-500", bg: "bg-red-500/10", icon: XCircle, label: "Cancelled" },
      no_show: { color: "text-orange-500", bg: "bg-orange-500/10", icon: XCircle, label: "No Show" },
    };
    return configs[status];
  };

  const getSessionIcon = (type: SessionType) => {
    const icons: Record<SessionType, React.ElementType> = {
      one_on_one: User,
      group: Users,
      vod_review: Video,
      live_coaching: Monitor,
    };
    return icons[type];
  };

  const statusConfig = getStatusConfig(session.status);
  const StatusIcon = statusConfig.icon;
  const SessionIcon = getSessionIcon(session.session_type);

  const otherParty = role === "coach" ? session.student : session.coach;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl border border-border overflow-hidden ${
        session.status === "cancelled" || session.status === "no_show"
          ? "opacity-60"
          : ""
      }`}
    >
      {/* Status bar */}
      <div className={`px-4 py-2 ${statusConfig.bg} flex items-center justify-between`}>
        <div className={`flex items-center gap-2 ${statusConfig.color}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{statusConfig.label}</span>
        </div>
        {session.status === "in_progress" && session.meeting_link && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={onJoin}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Join
          </Button>
        )}
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Other party avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {otherParty?.avatar_url ? (
              <img
                src={otherParty.avatar_url}
                alt={otherParty.username || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-primary">
                {(otherParty?.username || "?")[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {role === "coach" ? "Student:" : "Coach:"}
              </span>
              <span className="font-medium truncate">
                {otherParty?.username || "Unknown"}
              </span>
            </div>

            {/* Session type */}
            <div className="flex items-center gap-2 mt-1">
              <SessionIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{sessionTypeInfo.name}</span>
            </div>
          </div>

          {/* Price */}
          {session.price && (
            <div className="text-right">
              <p className="font-semibold">
                {formatPrice(session.price, session.currency || "INR")}
              </p>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {scheduledDate.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {scheduledDate.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <span>({formatDuration(session.duration_minutes)})</span>
        </div>

        {/* Topic & Goals */}
        {session.topic && (
          <div className="mb-3">
            <p className="text-sm font-medium">Topic</p>
            <p className="text-sm text-muted-foreground">{session.topic}</p>
          </div>
        )}

        {session.goals && session.goals.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Goals</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {session.goals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {/* Coach actions */}
          {role === "coach" && (
            <>
              {session.status === "pending" && (
                <>
                  <Button size="sm" onClick={onConfirm}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancel}>
                    Decline
                  </Button>
                </>
              )}
              {session.status === "confirmed" && !isPast && (
                <Button size="sm" onClick={onStart}>
                  <Play className="h-4 w-4 mr-1" />
                  Start Session
                </Button>
              )}
              {session.status === "in_progress" && (
                <Button size="sm" onClick={onComplete}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
            </>
          )}

          {/* Student actions */}
          {role === "student" && (
            <>
              {session.status === "pending" && (
                <Button size="sm" variant="outline" onClick={onCancel}>
                  Cancel Request
                </Button>
              )}
              {session.status === "confirmed" && !isPast && (
                <Button size="sm" variant="outline" onClick={onCancel}>
                  Cancel Session
                </Button>
              )}
            </>
          )}

          {/* Common actions */}
          {session.meeting_link && ["confirmed", "in_progress"].includes(session.status) && (
            <Button size="sm" variant="outline" onClick={onJoin}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Join Meeting
            </Button>
          )}

          <Button size="sm" variant="ghost" asChild>
            <Link href={`/coaching/sessions/${session.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Compact session item for lists
interface SessionItemProps {
  session: CoachingSession;
  role: "coach" | "student";
}

export function SessionItem({ session, role }: SessionItemProps) {
  const scheduledDate = new Date(session.scheduled_at);
  const sessionTypeInfo = SESSION_TYPES[session.session_type];
  const otherParty = role === "coach" ? session.student : session.coach;

  const statusColors: Record<SessionStatus, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    in_progress: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
    no_show: "bg-orange-500",
  };

  return (
    <Link
      href={`/coaching/sessions/${session.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {/* Status dot */}
      <div
        className={`w-2 h-2 rounded-full ${statusColors[session.status]}`}
      />

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
        {otherParty?.avatar_url ? (
          <img
            src={otherParty.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-primary">
            {(otherParty?.username || "?")[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {otherParty?.username || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground">
          {sessionTypeInfo.name}
        </p>
      </div>

      {/* Date */}
      <div className="text-right text-xs text-muted-foreground">
        <p>
          {scheduledDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
        <p>
          {scheduledDate.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </Link>
  );
}
