"use client";

import Link from "next/link";
import { Users, Gamepad2, ArrowRight } from "lucide-react";
import { Button, Avatar } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { PremiumBadge } from "@/components/premium";

interface Friend {
  id: string;
  name: string;
  game: string;
  avatar: string;
  avatarUrl?: string;
  status: string;
  username?: string;
  isPremium?: boolean;
}

interface SidebarFriendsSectionProps {
  user: { id: string } | null;
  onlineFriends: Friend[];
  friendsLoading: boolean;
  getUserStatus: (userId: string) => "online" | "away" | "dnd" | "offline";
  openChat: (friend: Friend) => void;
}

export type { Friend };

export function SidebarFriendsSection({
  user,
  onlineFriends,
  friendsLoading,
  getUserStatus,
  openChat,
}: SidebarFriendsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-text">Online Friends</h3>
        </div>
        <span className="text-xs text-text-muted bg-surface-light px-2 py-1 rounded-full">
          {onlineFriends.length} online
        </span>
      </div>
      <div className="space-y-2">
        {!user ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-text-muted mb-2">Sign in to see friends</p>
            <Link href="/login">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
          </Card>
        ) : friendsLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface-light" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-surface-light rounded mb-1" />
                <div className="h-3 w-16 bg-surface-light rounded" />
              </div>
            </div>
          ))
        ) : onlineFriends.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-text-muted">No friends online</p>
          </Card>
        ) : (
          onlineFriends.map((friend, index) => (
            <div
              key={friend.id}
              onClick={() => openChat(friend)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors cursor-pointer group animate-fadeInRight"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              <div className="relative">
                {friend.avatarUrl ? (
                  <Avatar
                    src={friend.avatarUrl}
                    alt={friend.name}
                    size="md"
                    status={getUserStatus(friend.id)}
                    showStatus
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                    {friend.avatar}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-text truncate group-hover:text-primary transition-colors flex items-center gap-1">
                  {friend.name}
                  {friend.isPremium && <PremiumBadge size="sm" showLabel={false} animate={false} />}
                </span>
                <p className="text-xs text-text-muted truncate">
                  {friend.game ? `${friend.game} • ` : ""}{friend.status}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                <Gamepad2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
      <Link href="/friends">
        <Button variant="ghost" size="sm" className="w-full mt-3 text-text-muted">
          View All Friends
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
