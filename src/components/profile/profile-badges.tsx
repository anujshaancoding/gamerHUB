"use client";

import { motion } from "framer-motion";
import { Award, Shield, Crown, Star, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

interface ProfileBadge {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
  category: string;
  rarity: string;
  points: number;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_featured: boolean;
  badge: ProfileBadge;
}

interface ProfileBadgesProps {
  badges: UserBadge[];
  isOwnProfile: boolean;
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: "bg-gray-500/20",
    border: "border-gray-500/50",
    text: "text-gray-300",
    glow: "",
  },
  uncommon: {
    bg: "bg-green-500/20",
    border: "border-green-500/50",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
  rare: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    text: "text-blue-400",
    glow: "shadow-blue-500/30",
  },
  epic: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/50",
    text: "text-purple-400",
    glow: "shadow-purple-500/40",
  },
  legendary: {
    bg: "bg-gradient-to-br from-yellow-500/30 to-orange-500/30",
    border: "border-yellow-500/50",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/50",
  },
};

const categoryIcons: Record<string, React.ElementType> = {
  trust: Shield,
  premium: Crown,
  achievement: Star,
  skill: Award,
  community: Sparkles,
  special: Crown,
};

function BadgeCard({ userBadge, index }: { userBadge: UserBadge; index: number }) {
  const badge = userBadge.badge;
  const rarity = rarityColors[badge.rarity] || rarityColors.common;
  const Icon = categoryIcons[badge.category] || Award;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`
        relative p-4 rounded-xl
        ${rarity.bg} border ${rarity.border}
        shadow-lg ${rarity.glow}
        transition-all duration-300 cursor-pointer
        group
      `}
    >
      {/* Featured indicator */}
      {userBadge.is_featured && (
        <div className="absolute -top-2 -right-2 p-1 rounded-full bg-warning text-black">
          <Star className="h-3 w-3 fill-current" />
        </div>
      )}

      {/* Badge Icon */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            ${rarity.bg} border ${rarity.border}
            group-hover:scale-110 transition-transform
          `}
        >
          {badge.icon_url ? (
            <img
              src={badge.icon_url}
              alt={badge.display_name}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <Icon className={`h-7 w-7 ${rarity.text}`} />
          )}
        </div>

        {/* Badge Name */}
        <div>
          <h4 className={`font-bold text-sm ${rarity.text}`}>
            {badge.display_name}
          </h4>
          <p className="text-xs text-text-muted capitalize">{badge.rarity}</p>
        </div>

        {/* Points */}
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Sparkles className="h-3 w-3" />
          {badge.points} pts
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-lg bg-surface border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-48">
        <p className="text-sm text-text font-medium mb-1">{badge.display_name}</p>
        <p className="text-xs text-text-muted">{badge.description}</p>
        <p className="text-xs text-text-dim mt-2">
          Earned {new Date(userBadge.earned_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}

export function ProfileBadges({ badges, isOwnProfile }: ProfileBadgesProps) {
  if (badges.length === 0) {
    return (
      <Card className="gaming-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/20">
              <Award className="h-5 w-5 text-accent" />
            </div>
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-surface flex items-center justify-center border border-border">
              <Award className="h-8 w-8 text-text-muted" />
            </div>
            <p className="text-text-muted font-medium">No badges earned yet</p>
            <p className="text-text-dim text-sm mt-1">
              {isOwnProfile
                ? "Keep playing and building your profile to earn badges!"
                : "This gamer hasn't earned any badges yet."}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Group badges by category
  const featuredBadges = badges.filter((b) => b.is_featured);
  const otherBadges = badges.filter((b) => !b.is_featured);

  return (
    <Card className="gaming-card-border overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/20">
              <Award className="h-5 w-5 text-accent" />
            </div>
            Badges
          </CardTitle>
          <Badge variant="accent" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {badges.length} Earned
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Featured Badges */}
          {featuredBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                Featured
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {featuredBadges.map((badge, index) => (
                  <BadgeCard key={badge.id} userBadge={badge} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* All Badges */}
          <div>
            {featuredBadges.length > 0 && (
              <h4 className="text-sm font-medium text-text-muted mb-3">
                All Badges
              </h4>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(featuredBadges.length > 0 ? otherBadges : badges).map(
                (badge, index) => (
                  <BadgeCard
                    key={badge.id}
                    userBadge={badge}
                    index={index + featuredBadges.length}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
