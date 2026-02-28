"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Globe,
  MessageSquare,
  UserPlus,
  UserMinus,
  UserCheck,
  Clock,
  Gamepad2,
  Trophy,
  Star,
  Users,
} from "lucide-react";
import { Card, Avatar, Badge, Button, Modal } from "@/components/ui";
import { getRegionLabel, getLanguageLabel } from "@/lib/constants/games";
import { createClient } from "@/lib/db/client-browser";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRelationship } from "@/lib/hooks/useFriends";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import { PremiumBadge } from "@/components/premium";
import { usePresence } from "@/lib/presence/PresenceProvider";
import type { Profile, UserGame, Game } from "@/types/database";

interface GamerWithGames extends Profile {
  user_games: (UserGame & { game: Game })[];
}

interface GamerCardProps {
  gamer: GamerWithGames;
}

export function GamerCard({ gamer }: GamerCardProps) {
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const db = createClient();
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const gamerStatus = getUserStatus(gamer.id);

  const { relationship, refetch: refetchRelationship } = useRelationship(
    user?.id !== gamer.id ? gamer.id : null
  );

  const handleMessage = () => {
    window.location.href = `/messages?user=${gamer.id}`;
  };

  const handleAddFriend = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: gamer.id }),
      });
      if (response.ok) {
        refetchRelationship();
        toast.success(`Friend request sent to ${gamer.display_name || gamer.username}`);
      } else {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Add friend error:", error);
      toast.error("Failed to send friend request");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const wasFollowing = relationship?.is_following;
      if (wasFollowing) {
        await db
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", gamer.id);
      } else {
        await db.from("follows").insert({
          follower_id: user.id,
          following_id: gamer.id,
        } as never);
      }
      refetchRelationship();
      toast.success(wasFollowing
        ? `Unfollowed ${gamer.display_name || gamer.username}`
        : `Following ${gamer.display_name || gamer.username}`
      );
    } catch (error) {
      console.error("Follow error:", error);
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  const getActionButton = () => {
    if (!user || user.id === gamer.id) return null;

    // Already friends
    if (relationship?.is_friend) {
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <Users className="h-3 w-3" />
          Friends
        </Badge>
      );
    }

    // Pending request sent
    if (relationship?.has_pending_request_sent) {
      return (
        <Badge variant="secondary" size="sm" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }

    // Pending request received - can accept
    if (relationship?.has_pending_request_received) {
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddFriend}
          isLoading={loading}
          title="Accept friend request"
        >
          <UserCheck className="h-4 w-4" />
        </Button>
      );
    }

    // Not friends - show add friend or follow
    return (
      <>
        <Button
          variant="primary"
          size="icon"
          onClick={handleAddFriend}
          isLoading={loading}
          title="Add friend"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
        <Button
          variant={relationship?.is_following ? "secondary" : "ghost"}
          size="icon"
          onClick={handleFollow}
          isLoading={loading}
          title={relationship?.is_following ? "Unfollow" : "Follow"}
        >
          {relationship?.is_following ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
        </Button>
      </>
    );
  };

  return (
    <>
      <Card
        variant="interactive"
        className="h-full flex flex-col"
        onClick={() => setShowPreview(true)}
      >
        <div className="flex gap-4 flex-1 pb-4">
          {/* Avatar */}
          <Avatar
            src={gamer.avatar_url}
            alt={gamer.display_name || gamer.username}
            size="lg"
            status={gamerStatus}
            showStatus
            className="self-start"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text truncate">
                {gamer.display_name || gamer.username}
              </h3>
              {gamer.is_premium && (
                <PremiumBadge size="sm" showLabel={false} animate={false} />
              )}
              {gamer.gaming_style && (
                <Badge
                  variant={
                    gamer.gaming_style === "pro"
                      ? "primary"
                      : gamer.gaming_style === "competitive"
                      ? "secondary"
                      : "default"
                  }
                  size="sm"
                >
                  {gamer.gaming_style}
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-muted truncate">@{gamer.username}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-text-muted">
              {gamer.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {getRegionLabel(gamer.region)}
                </span>
              )}
              {gamer.preferred_language && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {getLanguageLabel(gamer.preferred_language)}
                </span>
              )}
            </div>

            {/* Games */}
            {gamer.user_games && gamer.user_games.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {gamer.user_games.slice(0, 3).map((ug) => (
                  <Badge key={ug.id} variant="outline" size="sm" className="gap-1">
                    <Gamepad2 className="h-3 w-3" />
                    {ug.game?.name?.split(" ")[0] || "Unknown"}
                    {ug.rank && (
                      <span className="text-primary font-medium ml-1">
                        {ug.rank.split(" ")[0]}
                      </span>
                    )}
                  </Badge>
                ))}
                {gamer.user_games.length > 3 && (
                  <Badge variant="default" size="sm">
                    +{gamer.user_games.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status - always pinned to bottom */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {gamerStatus === "online"
              ? "Online now"
              : gamerStatus === "away"
              ? "Away"
              : gamerStatus === "dnd"
              ? "Do Not Disturb"
              : gamer.last_seen
              ? `Active ${formatRelativeTime(gamer.last_seen)}`
              : "Offline"}
          </span>
          <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={handleMessage}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            {getActionButton()}
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Player Profile"
        size="md"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar
              src={gamer.avatar_url}
              alt={gamer.display_name || gamer.username}
              size="xl"
              status={gamerStatus}
              showStatus
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-text">
                  {gamer.display_name || gamer.username}
                </h3>
                {gamer.is_premium && <PremiumBadge size="md" />}
              </div>
              <p className="text-text-muted">@{gamer.username}</p>
              {gamer.bio && (
                <p className="text-text-secondary mt-2 text-sm line-clamp-2">
                  {gamer.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Gamepad2 className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-text">
                {gamer.user_games?.length || 0}
              </p>
              <p className="text-xs text-text-muted">Games</p>
            </div>
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Trophy className="h-5 w-5 mx-auto text-warning mb-1" />
              <p className="text-lg font-bold text-text">0</p>
              <p className="text-xs text-text-muted">Matches</p>
            </div>
            <div className="text-center p-3 bg-surface-light rounded-lg">
              <Star className="h-5 w-5 mx-auto text-accent mb-1" />
              <p className="text-lg font-bold text-text">-</p>
              <p className="text-xs text-text-muted">Rating</p>
            </div>
          </div>

          {/* Games List */}
          {gamer.user_games && gamer.user_games.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2">
                Games
              </h4>
              <div className="space-y-2">
                {gamer.user_games.map((ug) => (
                  <div
                    key={ug.id}
                    className="flex items-center gap-3 p-2 bg-surface-light rounded-lg"
                  >
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">
                        {ug.game?.name || "Unknown"}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {ug.rank && (
                          <Badge variant="primary" size="sm">
                            {ug.rank}
                          </Badge>
                        )}
                        {ug.role && (
                          <Badge variant="secondary" size="sm">
                            {ug.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link href={`/profile/${gamer.username}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Full Profile
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={handleMessage}
              leftIcon={<MessageSquare className="h-4 w-4" />}
            >
              Message
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
