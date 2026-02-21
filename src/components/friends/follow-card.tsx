"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  UserPlus,
  UserMinus,
  MapPin,
  Clock,
} from "lucide-react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { PremiumBadge } from "@/components/premium";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface ProfileWithFollowDate extends Profile {
  followed_at?: string;
}

interface FollowCardProps {
  profile: ProfileWithFollowDate;
  type: "following" | "follower";
  onSendFriendRequest?: (userId: string) => void;
}

export function FollowCard({
  profile,
  type,
  onSendFriendRequest,
}: FollowCardProps) {
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(type === "following");
  const profileStatus = getUserStatus(profile.id);

  const handleMessage = () => {
    window.location.href = `/messages?user=${profile.id}`;
  };

  const handleFollow = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        setIsFollowing(false);
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        } as never);

        if (error?.code === "23505") {
          setIsFollowing(true);
        } else if (!error) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = () => {
    onSendFriendRequest?.(profile.id);
  };

  return (
    <Card variant="default" className="h-full">
      <div className="flex gap-4">
        <Link href={`/profile/${profile.username}`}>
          <Avatar
            src={profile.avatar_url}
            alt={profile.display_name || profile.username}
            size="lg"
            status={profileStatus}
            showStatus
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${profile.username}`}
              className="hover:underline"
            >
              <h3 className="font-semibold text-text truncate">
                {profile.display_name || profile.username}
              </h3>
            </Link>
            {profile.is_premium && (
              <PremiumBadge size="sm" showLabel={false} animate={false} />
            )}
            {profile.gaming_style && (
              <Badge
                variant={
                  profile.gaming_style === "pro"
                    ? "primary"
                    : profile.gaming_style === "competitive"
                    ? "secondary"
                    : "default"
                }
                size="sm"
              >
                {profile.gaming_style}
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-muted truncate">@{profile.username}</p>

          <div className="flex flex-wrap gap-2 mt-2 text-xs text-text-muted">
            {profile.region && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.region}
              </span>
            )}
            {profile.followed_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {type === "following" ? "Following since" : "Follower since"}{" "}
                {formatRelativeTime(profile.followed_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {profileStatus === "online"
            ? "Online now"
            : profileStatus === "away"
            ? "Away"
            : profileStatus === "dnd"
            ? "Do Not Disturb"
            : profile.last_seen
            ? `Active ${formatRelativeTime(profile.last_seen)}`
            : "Offline"}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMessage}
            title="Send message"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {user && user.id !== profile.id && (
            <>
              {type === "follower" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddFriend}
                  title="Add as friend"
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Add Friend
                </Button>
              )}
              {type === "following" && (
                <Button
                  variant={isFollowing ? "secondary" : "ghost"}
                  size="icon"
                  onClick={handleFollow}
                  isLoading={loading}
                  title={isFollowing ? "Unfollow" : "Follow"}
                >
                  {isFollowing ? (
                    <UserMinus className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
