"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, UserCheck, Users, Clock } from "lucide-react";
import { Avatar, Badge, Button } from "@/components/ui";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { formatRelativeTime } from "@/lib/utils";
import type { ProfileWithRelationship } from "@/app/api/users/[userId]/social/route";

interface SocialListItemProps {
  profile: ProfileWithRelationship;
  listType: "friends" | "followers" | "following";
  onActionComplete?: () => void;
}

export function SocialListItem({ profile, listType, onActionComplete }: SocialListItemProps) {
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [localRelationship, setLocalRelationship] = useState(profile.relationship_to_viewer);

  const handleFollow = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (localRelationship?.is_following) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        setLocalRelationship((prev) => prev ? { ...prev, is_following: false } : null);
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        } as never);
        setLocalRelationship((prev) => prev ? { ...prev, is_following: true } : null);
      }
      onActionComplete?.();
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: profile.id }),
      });

      if (response.ok) {
        setLocalRelationship((prev) => prev ? { ...prev, has_pending_request: true } : null);
        onActionComplete?.();
      }
    } catch (error) {
      console.error("Add friend error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionButton = () => {
    if (!user || user.id === profile.id) return null;

    // Already friends
    if (localRelationship?.is_friend) {
      return (
        <Badge variant="success" size="sm" className="gap-1">
          <Users className="h-3 w-3" />
          Friends
        </Badge>
      );
    }

    // Pending request
    if (localRelationship?.has_pending_request) {
      return (
        <Badge variant="secondary" size="sm" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }

    // Show follow/add friend buttons
    return (
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddFriend}
          isLoading={loading}
          leftIcon={<UserPlus className="h-3 w-3" />}
        >
          Add
        </Button>
        <Button
          variant={localRelationship?.is_following ? "secondary" : "ghost"}
          size="sm"
          onClick={handleFollow}
          isLoading={loading}
          leftIcon={localRelationship?.is_following ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
        >
          {localRelationship?.is_following ? "Following" : "Follow"}
        </Button>
      </div>
    );
  };

  const getTimestamp = () => {
    if (listType === "friends" && profile.friends_since) {
      return `Friends since ${formatRelativeTime(profile.friends_since)}`;
    }
    if ((listType === "followers" || listType === "following") && profile.followed_since) {
      return formatRelativeTime(profile.followed_since);
    }
    return null;
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-surface-light rounded-lg transition-colors">
      <Link href={`/profile/${profile.username}`} className="flex-shrink-0">
        <Avatar
          src={profile.avatar_url}
          alt={profile.display_name || profile.username}
          size="md"
          status={getUserStatus(profile.id)}
          showStatus
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/profile/${profile.username}`}>
          <h4 className="font-medium text-text truncate hover:text-primary transition-colors">
            {profile.display_name || profile.username}
          </h4>
        </Link>
        <p className="text-sm text-text-muted truncate">@{profile.username}</p>
        {getTimestamp() && (
          <p className="text-xs text-text-muted">{getTimestamp()}</p>
        )}
      </div>

      <div className="flex-shrink-0">
        {getActionButton()}
      </div>
    </div>
  );
}
