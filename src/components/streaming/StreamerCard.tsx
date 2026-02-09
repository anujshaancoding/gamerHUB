"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, Radio, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { formatViewerCount } from "@/lib/hooks/useStreaming";

interface StreamerCardProps {
  streamer: {
    id: string;
    user_id: string;
    twitch_login: string;
    twitch_display_name: string | null;
    twitch_profile_image_url: string | null;
    twitch_broadcaster_type: string;
    stream_title: string | null;
    stream_game_name: string | null;
    status: "offline" | "live" | "hosting";
    current_viewer_count: number;
    last_stream_started_at: string | null;
    is_featured: boolean;
    follower_count: number;
    profile: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      level?: number;
    };
  };
  variant?: "default" | "compact";
}

export function StreamerCard({ streamer, variant = "default" }: StreamerCardProps) {
  const isLive = streamer.status === "live";
  const displayName =
    streamer.twitch_display_name ||
    streamer.profile.display_name ||
    streamer.profile.username;

  if (variant === "compact") {
    return (
      <Link href={`/streamers/${streamer.user_id}`}>
        <Card
          className={cn(
            "p-3 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors",
            isLive && "border-l-2 border-l-red-500"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                {streamer.twitch_profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={streamer.twitch_profile_image_url}
                    alt={displayName}
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-purple-600 flex items-center justify-center text-white">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
              </Avatar>
              {isLive && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                  <Radio className="h-2 w-2 text-white" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white truncate">
                  {displayName}
                </span>
                {streamer.is_featured && (
                  <Badge className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                    Featured
                  </Badge>
                )}
              </div>
              {isLive ? (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="text-red-400 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatViewerCount(streamer.current_viewer_count)}
                  </span>
                  <span className="truncate">{streamer.stream_game_name}</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500">Offline</span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/streamers/${streamer.user_id}`}>
      <Card
        className={cn(
          "overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors",
          isLive && "ring-2 ring-red-500/50"
        )}
      >
        {/* Thumbnail / Preview */}
        <div className="aspect-video bg-zinc-800 relative">
          {isLive ? (
            <>
              {/* Twitch preview would go here */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <Badge className="bg-red-600 text-white">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
                <Badge className="bg-black/60 text-white">
                  <Eye className="h-3 w-3 mr-1" />
                  {formatViewerCount(streamer.current_viewer_count)}
                </Badge>
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-medium truncate text-sm">
                  {streamer.stream_title || "Streaming..."}
                </p>
                <p className="text-zinc-300 text-xs truncate">
                  {streamer.stream_game_name}
                </p>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-zinc-500 text-sm">Offline</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                {streamer.twitch_profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={streamer.twitch_profile_image_url}
                    alt={displayName}
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-purple-600 flex items-center justify-center text-white">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
              </Avatar>
              {isLive && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white truncate">
                  {displayName}
                </h3>
                {streamer.twitch_broadcaster_type === "partner" && (
                  <Badge variant="outline" className="text-xs text-purple-400">
                    Partner
                  </Badge>
                )}
                {streamer.twitch_broadcaster_type === "affiliate" && (
                  <Badge variant="outline" className="text-xs text-purple-400">
                    Affiliate
                  </Badge>
                )}
              </div>
              <p className="text-sm text-zinc-400">
                {streamer.follower_count.toLocaleString()} followers
              </p>
              {!isLive && streamer.last_stream_started_at && (
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last live{" "}
                  {formatDistanceToNow(new Date(streamer.last_stream_started_at), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
