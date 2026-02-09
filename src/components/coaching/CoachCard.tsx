"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  Clock,
  MessageCircle,
  CheckCircle,
  Award,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CoachProfile, CoachTier } from "@/types/coaching";
import { COACH_TIERS, formatPrice } from "@/types/coaching";

interface CoachCardProps {
  coach: CoachProfile;
  onBook?: () => void;
}

export function CoachCard({ coach, onBook }: CoachCardProps) {
  const tierInfo = COACH_TIERS[coach.tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Featured Badge */}
      {coach.featured && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium text-center py-1">
          Featured Coach
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
              {coach.avatar_url ? (
                <img
                  src={coach.avatar_url}
                  alt={coach.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                  {coach.display_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {/* Status indicator */}
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card ${
                coach.status === "available"
                  ? "bg-green-500"
                  : coach.status === "busy"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
              title={coach.status}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/coaching/${coach.id}`}
                className="font-semibold hover:text-primary truncate"
              >
                {coach.display_name}
              </Link>
              {coach.verified && (
                <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{coach.username}</p>

            {/* Tier Badge */}
            <div
              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${tierInfo.color}15`,
                color: tierInfo.color,
              }}
            >
              <Award className="h-3 w-3" />
              {tierInfo.name}
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-lg font-bold">
              {formatPrice(coach.hourly_rate, coach.currency)}
            </p>
            {coach.hourly_rate && (
              <p className="text-xs text-muted-foreground">per hour</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {coach.bio}
        </p>

        {/* Specialties */}
        <div className="mt-3 flex flex-wrap gap-1">
          {coach.specialties.slice(0, 4).map((specialty) => (
            <span
              key={specialty}
              className="px-2 py-0.5 bg-muted text-xs rounded-full"
            >
              {specialty}
            </span>
          ))}
          {coach.specialties.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{coach.specialties.length - 4} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{coach.average_rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({coach.rating_count})
            </span>
          </div>

          {/* Sessions */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{coach.total_sessions} sessions</span>
          </div>

          {/* Students */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{coach.total_students} students</span>
          </div>
        </div>

        {/* Languages */}
        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          {coach.languages.slice(0, 3).join(", ")}
          {coach.languages.length > 3 && ` +${coach.languages.length - 3}`}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <Link href={`/coaching/${coach.id}`}>View Profile</Link>
          </Button>
          {coach.status === "available" && onBook && (
            <Button size="sm" className="flex-1" onClick={onBook}>
              Book Session
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Compact coach card for lists
interface CoachCardCompactProps {
  coach: CoachProfile;
}

export function CoachCardCompact({ coach }: CoachCardCompactProps) {
  return (
    <Link
      href={`/coaching/${coach.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
          {coach.avatar_url ? (
            <img
              src={coach.avatar_url}
              alt={coach.display_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-primary">
              {coach.display_name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
            coach.status === "available" ? "bg-green-500" : "bg-gray-500"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{coach.display_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            {coach.average_rating.toFixed(1)}
          </span>
          <span>•</span>
          <span>{formatPrice(coach.hourly_rate, coach.currency)}</span>
        </div>
      </div>
    </Link>
  );
}

// Tier badge component
interface TierBadgeProps {
  tier: CoachTier;
  size?: "sm" | "md";
}

export function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  const tierInfo = COACH_TIERS[tier];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${tierInfo.color}15`,
        color: tierInfo.color,
      }}
    >
      <Award className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {tierInfo.name}
    </span>
  );
}
