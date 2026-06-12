"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, UserCheck, Users, Gamepad2, Trophy } from "lucide-react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { createClient } from "@/lib/db/client-browser";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ProPlayer } from "@/app/api/pro-players/route";

interface ProPlayerCardProps {
  player: ProPlayer;
  onFollow?: (userId: string, isFollowed: boolean) => void;
  isLoading?: boolean;
}

export function ProPlayerCard({ player, onFollow, isLoading }: ProPlayerCardProps) {
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const db = createClient();
  const [loading, setLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(player.is_followed_by_viewer);
  const { profile, follower_count, common_games } = player;

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading || isLoading) return;

    setLoading(true);
    try {
      if (isFollowed) {
        await db
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        setIsFollowed(false);
      } else {
        await db.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        } as never);
        setIsFollowed(true);
      }

      if (onFollow) {
        onFollow(profile.id, !isFollowed);
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Link href={`/profile/${profile.username}`}>
      <Card className="p-5 h-full min-w-[240px] w-[240px] snap-start hover:border-primary/50 transition-colors cursor-pointer">
        <div className="flex flex-col items-center text-center gap-3">
          {/* Avatar with Pro Badge */}
          <div className="relative">
            <Avatar
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              size="xl"
              status={getUserStatus(profile.id)}
              showStatus
            />
            <Badge
              variant="primary"
              size="sm"
              className="absolute -bottom-1 -right-1 gap-0.5"
            >
              <Trophy className="h-3 w-3" />
              PRO
            </Badge>
          </div>

          {/* Info */}
          <div className="w-full">
            <h4 className="font-bold text-text truncate text-lg">
              {profile.display_name || profile.username}
            </h4>
            <p className="text-sm text-text-muted truncate">@{profile.username}</p>
          </div>

          {/* Follower Count */}
          <div className="flex items-center gap-1 text-text-secondary">
            <Users className="h-4 w-4" />
            <span className="font-semibold">{formatFollowers(follower_count)}</span>
            <span className="text-text-muted">followers</span>
          </div>

          {/* Games */}
          {common_games && common_games.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {common_games.slice(0, 2).map((game, index) => (
                <Badge key={index} variant="outline" size="sm" className="gap-1">
                  <Gamepad2 className="h-3 w-3" />
                  {game.game_name.split(" ")[0]}
                  {game.rank && (
                    <span className="text-primary font-medium">
                      {game.rank.split(" ")[0]}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {/* Games from profile if no common_games */}
          {(!common_games || common_games.length === 0) && profile.user_games && (
            <div className="flex flex-wrap gap-1 justify-center">
              {profile.user_games.slice(0, 2).map((ug) => (
                <Badge key={ug.id} variant="outline" size="sm" className="gap-1">
                  <Gamepad2 className="h-3 w-3" />
                  {ug.game?.name?.split(" ")[0]}
                </Badge>
              ))}
            </div>
          )}

          {/* Follow Button */}
          {user && user.id !== profile.id && (
            <Button
              variant={isFollowed ? "secondary" : "primary"}
              size="sm"
              onClick={handleFollow}
              isLoading={loading || isLoading}
              leftIcon={isFollowed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              className="w-full"
            >
              {isFollowed ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </Card>
    </Link>
  );
}
