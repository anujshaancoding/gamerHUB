"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Avatar, RelativeTime } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthGateModal } from "@/components/auth/auth-gate-modal";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useAuth } from "@/lib/hooks/useAuth";

interface FriendPost {
  id: string;
  content: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user?: {
    username: string;
    display_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
}

interface FriendPostCardProps {
  post: FriendPost;
  index?: number;
  isGuest?: boolean;
  onLike?: () => Promise<void> | void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onDelete?: () => Promise<void> | void;
}

function highlightHashtags(text: string) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return (
        <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function FriendPostCard({
  post,
  index = 0,
  isGuest = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
}: FriendPostCardProps) {
  const { user } = useAuth();
  const { can: permissions } = usePermissions();
  // Optimistic local state for like
  const [liked, setLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = !isGuest && (
    (user && post.user_id === user.id) || permissions.deleteFreeUserPost
  );

  const handleDelete = async () => {
    if (isDeleting || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  const handleLike = async () => {
    if (isGuest) {
      setShowAuthGate(true);
      return;
    }
    if (isLiking) return;

    // Toggle instantly
    const wasLiked = liked;
    const prevCount = likesCount;
    setLiked(!wasLiked);
    setLikesCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsLiking(true);

    try {
      await onLike?.();
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleGuestAction = () => {
    if (isGuest) {
      setShowAuthGate(true);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    if (isGuest) {
      e.preventDefault();
      setShowAuthGate(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={cn(
          "group relative rounded-2xl overflow-hidden transition-all duration-300",
          "backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]",
          "hover:border-primary/20 hover:bg-white/[0.05]",
          "hover:shadow-lg hover:shadow-primary/5"
        )}
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />

        <div className="relative p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <Link
              href={`/profile/${post.user?.username}`}
              onClick={handleProfileClick}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <Avatar
                src={post.user?.avatar_url}
                alt={post.user?.display_name || post.user?.username || "User"}
                size="md"
                showStatus={false}
              />
              <div>
                <p className="font-semibold text-white text-sm sm:text-base leading-tight flex items-center gap-1">
                  {post.user?.display_name || post.user?.username}
                  {post.user?.is_verified && (
                    <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </p>
                <p className="text-xs text-text-dim mt-0.5">
                  @{post.user?.username} · <RelativeTime date={post.created_at} />
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-1 -mr-2 -mt-1">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <Button variant="ghost" size="icon" className="text-text-dim hover:text-text">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {highlightHashtags(post.content)}
            </p>
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="relative rounded-xl overflow-hidden mb-3 border border-white/[0.06]">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full max-h-[400px] object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = "none";
                }}
              />
              {/* Subtle bottom shadow overlay */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          )}

          {/* Gradient divider */}
          <div className="h-px my-3 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          {/* Reaction bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Like */}
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 group/like",
                  liked
                    ? "text-red-400 bg-red-500/10"
                    : "text-text-muted hover:text-red-400 hover:bg-red-500/10"
                )}
              >
                <Heart
                  className={cn(
                    "h-[18px] w-[18px] transition-transform duration-200 group-hover/like:scale-110",
                    liked && "fill-current scale-110"
                  )}
                />
                <span className="text-sm font-medium">{likesCount}</span>
              </button>

              {/* Comment */}
              <button
                onClick={isGuest ? handleGuestAction : onComment}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all duration-200 group/comment"
              >
                <MessageCircle className="h-[18px] w-[18px] transition-transform group-hover/comment:scale-110" />
                <span className="text-sm font-medium">{post.comments_count || 0}</span>
              </button>

              {/* Share */}
              <button
                onClick={onShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all duration-200 group/share"
              >
                <Share2 className="h-[18px] w-[18px] transition-transform group-hover/share:scale-110" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>

            {/* Bookmark */}
            <button
              onClick={isGuest ? handleGuestAction : onBookmark}
              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <Bookmark className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Auth gate modal for guest interactions */}
      <AuthGateModal
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        redirectTo={`/profile/${post.user?.username}`}
      />
    </>
  );
}
