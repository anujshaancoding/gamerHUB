"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Clip, ClipReactionType } from "@/types/community";
import { CLIP_REACTIONS } from "@/types/community";

interface ClipCardProps {
  clip: Clip;
  onReact?: (reactionType: ClipReactionType) => void;
  isReacting?: boolean;
}

export function ClipCard({ clip, onReact, isReacting }: ClipCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Video/Thumbnail */}
      <div className="relative aspect-video bg-black">
        {showVideo ? (
          <video
            src={clip.video_url}
            controls
            autoPlay
            className="w-full h-full"
          />
        ) : (
          <>
            {clip.thumbnail_url ? (
              <img
                src={clip.thumbnail_url}
                alt={clip.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Play Button Overlay */}
            <button
              onClick={() => setShowVideo(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-8 w-8 text-black ml-1" />
              </div>
            </button>

            {/* Duration */}
            {clip.duration_seconds && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs">
                {formatDuration(clip.duration_seconds)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Creator */}
        <div>
          <h3 className="font-semibold line-clamp-1">{clip.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{clip.creator?.username}</span>
            {clip.game && (
              <>
                <span>•</span>
                <span>{clip.game.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {clip.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {clip.description}
          </p>
        )}

        {/* Stats and Reactions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {clip.view_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {clip.comment_count}
            </span>
          </div>

          {/* Reaction Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReactions(!showReactions)}
              className="gap-1"
            >
              {clip.user_reaction ? (
                <span className="text-lg">
                  {CLIP_REACTIONS[clip.user_reaction].emoji}
                </span>
              ) : (
                <span className="text-lg">👍</span>
              )}
              <span>{clip.like_count}</span>
            </Button>

            {/* Reaction Picker */}
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute bottom-full right-0 mb-2 p-2 rounded-lg bg-card border border-border shadow-lg z-10"
              >
                <div className="flex gap-1">
                  {Object.entries(CLIP_REACTIONS).map(([type, { emoji, label }]) => (
                    <button
                      key={type}
                      onClick={() => {
                        onReact?.(type as ClipReactionType);
                        setShowReactions(false);
                      }}
                      disabled={isReacting}
                      className={`p-2 rounded hover:bg-muted transition-colors ${
                        clip.user_reaction === type ? "bg-primary/10" : ""
                      }`}
                      title={label}
                    >
                      <span className="text-xl">{emoji}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Reaction bar component for inline use
interface ReactionBarProps {
  reactions: Record<string, number>;
  userReaction: ClipReactionType | null;
  onReact: (type: ClipReactionType) => void;
  isReacting?: boolean;
}

export function ReactionBar({
  reactions,
  userReaction,
  onReact,
  isReacting,
}: ReactionBarProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(CLIP_REACTIONS).map(([type, { emoji }]) => {
        const count = reactions[type] || 0;
        const isSelected = userReaction === type;

        if (count === 0 && !isSelected) return null;

        return (
          <button
            key={type}
            onClick={() => onReact(type as ClipReactionType)}
            disabled={isReacting}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
              isSelected
                ? "bg-primary/10 text-primary"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
