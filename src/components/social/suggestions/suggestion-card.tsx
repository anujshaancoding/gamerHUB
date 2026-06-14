"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { PremiumBadge } from "@/components/monetization/premium";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { SuggestedUser } from "@/app/api/suggestions/route";

interface SuggestionCardProps {
  suggestion: SuggestedUser;
  onAddFriend?: (userId: string) => void;
  isLoading?: boolean;
  /** "carousel" keeps a fixed width for horizontal scroll; "grid" fills the
      grid track so it never overflows narrow columns. */
  variant?: "carousel" | "grid";
}

export function SuggestionCard({ suggestion, onAddFriend, isLoading, variant = "carousel" }: SuggestionCardProps) {
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const [loading, setLoading] = useState(false);
  const { profile, suggestion_reason } = suggestion;

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading || isLoading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: profile.id }),
      });

      if (response.ok && onAddFriend) {
        onAddFriend(profile.id);
      }
    } catch (error) {
      console.error("Add friend error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionLabel = () => {
    if (suggestion_reason.type === "mutual") {
      const count = suggestion_reason.mutual_friend_count || 0;
      if (count === 1 && suggestion_reason.mutual_friend_names?.[0]) {
        return `Friend of ${suggestion_reason.mutual_friend_names[0]}`;
      }
      return `${count} mutual friend${count !== 1 ? "s" : ""}`;
    }

    if (suggestion_reason.type === "similar_rank" && suggestion_reason.common_games?.[0]) {
      const game = suggestion_reason.common_games[0];
      return `${game.their_rank} in ${game.game_name.split(" ")[0]}`;
    }

    if (suggestion_reason.type === "random") {
      return "New Gamer";
    }

    return "Suggested";
  };

  return (
    <Link href={`/profile/${profile.username}`}>
      <Card className={cn(
        "p-4 h-full snap-start hover:border-primary/50 transition-colors cursor-pointer",
        variant === "grid" ? "w-full" : "min-w-[200px] w-[200px]"
      )}>
        <div className="flex flex-col items-center text-center gap-3">
          {/* Avatar */}
          <Avatar
            src={profile.avatar_url}
            alt={profile.display_name || profile.username}
            size="lg"
            status={getUserStatus(profile.id)}
            showStatus
          />

          {/* Info */}
          <div className="w-full">
            <h4 className="font-semibold text-text truncate flex items-center justify-center gap-1">
              {profile.display_name || profile.username}
              {profile.is_premium && <PremiumBadge size="sm" showLabel={false} animate={false} />}
            </h4>
            <p className="text-xs text-text-muted truncate">@{profile.username}</p>
          </div>

          {/* Suggestion Reason Badge */}
          <Badge
            variant={
              suggestion_reason.type === "mutual"
                ? "secondary"
                : suggestion_reason.type === "random"
                ? "outline"
                : "primary"
            }
            size="sm"
            className="gap-1"
          >
            <Users className="h-3 w-3" />
            {getSuggestionLabel()}
          </Badge>

          {/* Add Friend Button */}
          {user && user.id !== profile.id && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddFriend}
              isLoading={loading || isLoading}
              leftIcon={<UserPlus className="h-4 w-4" />}
              className="w-full"
            >
              Add Friend
            </Button>
          )}
        </div>
      </Card>
    </Link>
  );
}
