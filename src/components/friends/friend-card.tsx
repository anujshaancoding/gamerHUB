"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  UserMinus,
  Gamepad2,
  MoreVertical,
  MapPin,
} from "lucide-react";
import { Card, Avatar, Badge, Button, Modal } from "@/components/ui";
import { PremiumBadge } from "@/components/premium";
import { formatRelativeTime } from "@/lib/utils";
import type { FriendWithProfile } from "@/types/database";

interface FriendCardProps {
  friend: FriendWithProfile;
  onRemove?: (friendId: string) => void;
  isRemoving?: boolean;
}

export function FriendCard({ friend, onRemove, isRemoving }: FriendCardProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const { profile } = friend;

  const handleMessage = () => {
    window.location.href = `/messages?user=${profile.id}`;
  };

  const handleRemove = () => {
    onRemove?.(friend.friend_id);
    setShowRemoveConfirm(false);
  };

  return (
    <>
      <Card variant="interactive" className="h-full">
        <div className="flex gap-4">
          <Link href={`/profile/${profile.username}`}>
            <Avatar
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              size="lg"
              status={profile.is_online ? "online" : "offline"}
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
            <p className="text-sm text-text-muted truncate">
              @{profile.username}
            </p>

            <div className="flex flex-wrap gap-2 mt-2 text-xs text-text-muted">
              {profile.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.region}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Gamepad2 className="h-3 w-3" />
                Friends since {formatRelativeTime(friend.friends_since)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {profile.is_online
              ? "Online now"
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRemoveConfirm(true)}
              title="Remove friend"
              className="text-error hover:bg-error/10"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        title="Remove Friend"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-text">
              {profile.display_name || profile.username}
            </span>{" "}
            from your friends list?
          </p>
          <p className="text-sm text-text-muted">
            You will no longer be able to see each other in your friends list,
            but you can still follow them or send a new friend request later.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowRemoveConfirm(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRemove}
              isLoading={isRemoving}
            >
              Remove Friend
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
