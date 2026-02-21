"use client";

import { motion } from "framer-motion";
import { Clock, Users, Mic, MapPin, Gamepad2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LFGPost } from "@/types/lfg";
import { getRegionLabel } from "@/lib/constants/games";
import { formatDistanceToNow } from "date-fns";

interface LFGPostCardProps {
  post: LFGPost;
  onClick?: () => void;
}

export function LFGPostCard({ post, onClick }: LFGPostCardProps) {
  const timeLeft = formatDistanceToNow(new Date(post.expires_at), {
    addSuffix: true,
  });
  const slotsLeft = post.max_players - post.current_players;
  const isFull = slotsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="interactive"
        className={`p-4 cursor-pointer ${isFull ? "opacity-60" : ""}`}
        onClick={onClick}
      >
        {/* Header: Creator + Game */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.creator?.avatar_url}
              alt={post.creator?.display_name || post.creator?.username || "User"}
              size="md"
            />
            <div>
              <p className="font-medium text-white">
                {post.creator?.display_name || post.creator?.username}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {post.creator_role && (
                  <Badge variant="secondary" size="sm">
                    {post.creator_role}
                  </Badge>
                )}
                {post.creator_rating && !post.creator_is_unranked && (
                  <span>{post.creator_rating.toLocaleString()} rating</span>
                )}
                {post.creator_is_unranked && <span>Unranked</span>}
              </div>
            </div>
          </div>
          {post.game && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {post.game.icon_url ? (
                <img
                  src={post.game.icon_url}
                  alt={post.game.name}
                  className="w-5 h-5 rounded"
                />
              ) : (
                <Gamepad2 className="w-5 h-5" />
              )}
              <span>{post.game.name}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>

        {/* Description */}
        {post.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Looking for roles */}
        {post.looking_for_roles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-gray-500">Looking for:</span>
            {post.looking_for_roles.map((role) => (
              <Badge key={role} variant="outline" size="sm">
                {role}
              </Badge>
            ))}
          </div>
        )}

        {/* Rating requirements */}
        {(post.min_rating || post.max_rating) && (
          <div className="text-sm text-gray-400 mb-3">
            Rating: {post.min_rating?.toLocaleString() || "Any"} -{" "}
            {post.max_rating?.toLocaleString() || "Any"}
            {post.accept_unranked && " (unranked ok)"}
          </div>
        )}

        {/* Footer: Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {post.current_players}/{post.max_players}
              </span>
              {!isFull && (
                <span className="text-primary">({slotsLeft} slots)</span>
              )}
              {isFull && <span className="text-red-400">(Full)</span>}
            </div>

            {post.voice_required && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Mic className="w-4 h-4" />
                <span>Voice</span>
              </div>
            )}

            {post.region && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{getRegionLabel(post.region)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Expires {timeLeft}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
