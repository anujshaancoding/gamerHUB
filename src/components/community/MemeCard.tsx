"use client";

import { motion } from "framer-motion";
import { Heart, MessageSquare, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import type { Meme } from "@/types/community";

interface MemeCardProps {
  meme: Meme;
  onLike?: () => void;
  isLiking?: boolean;
}

export function MemeCard({ meme, onLike, isLiking }: MemeCardProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/memes/${meme.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: meme.title, url });
      } catch {
        // User cancelled or error
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar
            src={meme.creator?.avatar_url}
            alt={meme.creator?.username || "User"}
            size="sm"
          />
          <div>
            <Link
              href={meme.creator?.username ? `/profile/${meme.creator.username}` : "#"}
              className="text-sm font-medium hover:text-primary"
            >
              {meme.creator?.username}
            </Link>
            {meme.game && (
              <div className="text-xs text-muted-foreground">
                {meme.game.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="relative">
        <img
          src={meme.image_url}
          alt={meme.title}
          className="w-full"
          loading="lazy"
        />
        {meme.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm text-center font-medium">
              {meme.caption}
            </p>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="p-3 border-b border-border">
        <h3 className="font-medium">{meme.title}</h3>
      </div>

      {/* Actions */}
      <div className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            disabled={isLiking}
            className={meme.user_liked ? "text-red-500 hover:text-red-600" : ""}
          >
            {isLiking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Heart
                  className={`h-4 w-4 mr-1 ${
                    meme.user_liked ? "fill-current" : ""
                  }`}
                />
                {meme.like_count}
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/memes/${meme.id}`}>
              <MessageSquare className="h-4 w-4 mr-1" />
              {meme.comment_count}
            </Link>
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tags */}
      {meme.tags && meme.tags.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1">
          {meme.tags.slice(0, 5).map((tag) => (
            <Link
              key={tag}
              href={`/memes?tag=${tag}`}
              className="text-xs text-primary hover:underline"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Meme Grid Component
interface MemeGalleryProps {
  memes: Meme[];
  onLike?: (memeId: string) => void;
  isLiking?: boolean;
  columns?: 2 | 3 | 4;
}

export function MemeGallery({
  memes,
  onLike,
  isLiking,
  columns = 3,
}: MemeGalleryProps) {
  const columnClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${columnClass[columns]}`}>
      {memes.map((meme, index) => (
        <motion.div
          key={meme.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <MemeCard
            meme={meme}
            onLike={() => onLike?.(meme.id)}
            isLiking={isLiking}
          />
        </motion.div>
      ))}
    </div>
  );
}
