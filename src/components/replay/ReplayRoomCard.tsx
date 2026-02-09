"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Pause, Users, Clock, Eye, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReplayRoom, ReplayRoomStatus } from "@/types/replay";

interface ReplayRoomCardProps {
  room: ReplayRoom & {
    host?: {
      username: string;
      avatar_url?: string;
    };
  };
  onJoin?: () => void;
}

export function ReplayRoomCard({ room, onJoin }: ReplayRoomCardProps) {
  const getStatusConfig = (status: ReplayRoomStatus) => {
    const configs: Record<
      ReplayRoomStatus,
      { color: string; bg: string; label: string; icon: React.ElementType }
    > = {
      waiting: {
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        label: "Waiting",
        icon: Clock,
      },
      playing: {
        color: "text-green-500",
        bg: "bg-green-500/10",
        label: "Playing",
        icon: Play,
      },
      paused: {
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        label: "Paused",
        icon: Pause,
      },
      ended: {
        color: "text-gray-500",
        bg: "bg-gray-500/10",
        label: "Ended",
        icon: Clock,
      },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(room.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      {/* Thumbnail/Preview */}
      <div className="relative aspect-video bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="h-12 w-12 text-muted-foreground/50" />
        </div>

        {/* Status Badge */}
        <div
          className={`absolute top-2 left-2 ${statusConfig.bg} ${statusConfig.color} px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
        >
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </div>

        {/* Privacy Badge */}
        <div className="absolute top-2 right-2">
          {room.is_public ? (
            <div className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Public
            </div>
          ) : (
            <div className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Private
            </div>
          )}
        </div>

        {/* Participant Count */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Users className="h-3 w-3" />
          {room.participant_count}/{room.max_participants}
        </div>
      </div>

      <div className="p-4">
        {/* Room Name */}
        <h3 className="font-semibold mb-1 truncate">{room.name}</h3>

        {/* Replay Title */}
        {room.replay_title && (
          <p className="text-sm text-muted-foreground truncate mb-2">
            {room.replay_title}
          </p>
        )}

        {/* Host */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-muted">
            {room.host?.avatar_url ? (
              <img
                src={room.host.avatar_url}
                alt={room.host.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                {room.host?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            Hosted by {room.host?.username}
          </span>
        </div>

        {/* Room Code */}
        <div className="flex items-center justify-between">
          <div className="bg-muted px-3 py-1 rounded-lg">
            <span className="text-xs text-muted-foreground">Code: </span>
            <span className="font-mono font-bold">{room.code}</span>
          </div>

          {room.status !== "ended" && (
            <Button size="sm" onClick={onJoin || undefined} asChild={!onJoin}>
              {onJoin ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Join
                </>
              ) : (
                <Link href={`/replay/${room.code}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  Join
                </Link>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Compact room item for lists
interface ReplayRoomItemProps {
  room: ReplayRoom & {
    host?: {
      username: string;
    };
  };
}

export function ReplayRoomItem({ room }: ReplayRoomItemProps) {
  const statusColors: Record<ReplayRoomStatus, string> = {
    waiting: "bg-yellow-500",
    playing: "bg-green-500",
    paused: "bg-blue-500",
    ended: "bg-gray-500",
  };

  return (
    <Link
      href={`/replay/${room.code}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className={`w-2 h-2 rounded-full ${statusColors[room.status]}`} />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{room.name}</p>
        <p className="text-xs text-muted-foreground">
          {room.host?.username} • {room.participant_count} watching
        </p>
      </div>

      <div className="bg-muted px-2 py-1 rounded text-xs font-mono">
        {room.code}
      </div>
    </Link>
  );
}
