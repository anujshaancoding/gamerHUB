"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Trophy,
  Medal,
  Users,
  Swords,
  Star,
  Award,
  Upload,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FeedActivity {
  id: string;
  user_id: string;
  activity_type: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  reaction_count: number;
  created_at: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  user_reaction: string | null;
}

interface FeedItemProps {
  activity: FeedActivity;
  onReact?: (activityId: string, reactionType: string) => void;
  isReacting?: boolean;
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  match_completed: Swords,
  match_created: Swords,
  tournament_joined: Trophy,
  tournament_won: Trophy,
  challenge_completed: Medal,
  badge_earned: Award,
  level_up: Star,
  title_unlocked: Award,
  clan_joined: Users,
  clan_created: Users,
  friend_added: UserPlus,
  achievement_unlocked: Medal,
  battle_pass_tier: Star,
  season_rank: Trophy,
  media_uploaded: Upload,
};

const activityColors: Record<string, string> = {
  match_completed: "bg-blue-500/20 text-blue-400",
  tournament_won: "bg-yellow-500/20 text-yellow-400",
  badge_earned: "bg-purple-500/20 text-purple-400",
  level_up: "bg-green-500/20 text-green-400",
  clan_joined: "bg-orange-500/20 text-orange-400",
};

function getActivityText(activity: FeedActivity): string {
  const meta = activity.metadata;

  switch (activity.activity_type) {
    case "match_completed":
      return `completed a match${meta.result === "win" ? " with a victory!" : ""}`;
    case "tournament_won":
      return `won the tournament "${meta.tournament_name || "Tournament"}"!`;
    case "tournament_joined":
      return `joined the tournament "${meta.tournament_name || "Tournament"}"`;
    case "badge_earned":
      return `earned the "${meta.badge_name || "badge"}" badge`;
    case "level_up":
      return `reached level ${meta.new_level || "?"}`;
    case "title_unlocked":
      return `unlocked the title "${meta.title_name || "?"}"`;
    case "clan_joined":
      return `joined the clan "${meta.clan_name || "?"}"`;
    case "clan_created":
      return `created a new clan "${meta.clan_name || "?"}"`;
    case "friend_added":
      return `became friends with ${meta.friend_name || "someone"}`;
    case "battle_pass_tier":
      return `reached tier ${meta.tier || "?"} in the Battle Pass`;
    case "media_uploaded":
      return `uploaded new ${meta.media_type || "media"}`;
    default:
      return "had some activity";
  }
}

export function FeedItem({ activity, onReact, isReacting }: FeedItemProps) {
  const [localReactionCount, setLocalReactionCount] = useState(activity.reaction_count);
  const [localUserReaction, setLocalUserReaction] = useState(activity.user_reaction);

  const Icon = activityIcons[activity.activity_type] || Star;
  const colorClass = activityColors[activity.activity_type] || "bg-zinc-500/20 text-zinc-400";

  const handleReact = () => {
    if (!onReact) return;

    // Optimistic update
    if (localUserReaction) {
      setLocalReactionCount((c) => Math.max(0, c - 1));
      setLocalUserReaction(null);
    } else {
      setLocalReactionCount((c) => c + 1);
      setLocalUserReaction("like");
    }

    onReact(activity.id, "like");
  };

  return (
    <Card className="p-4 bg-zinc-900/50 border-zinc-800">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${activity.user.username}`}>
          <Avatar className="h-10 w-10 border border-zinc-700">
            {activity.user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activity.user.avatar_url}
                alt={activity.user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                {activity.user.username[0].toUpperCase()}
              </div>
            )}
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/profile/${activity.user.username}`}
                className="font-semibold text-white hover:underline"
              >
                {activity.user.display_name || activity.user.username}
              </Link>
              <span className="text-zinc-400 ml-1">{getActivityText(activity)}</span>
            </div>

            <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
              <Icon className="h-4 w-4" />
            </div>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-zinc-500 mt-1">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReact}
              disabled={isReacting}
              className={cn(
                "h-8 px-2",
                localUserReaction
                  ? "text-red-400 hover:text-red-300"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Heart
                className={cn("h-4 w-4 mr-1", localUserReaction && "fill-current")}
              />
              {localReactionCount > 0 && localReactionCount}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
