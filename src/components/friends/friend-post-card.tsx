"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  CheckCircle,
  Trash2,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, RelativeTime } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SharePopup } from "@/components/ui/share-popup";
import { AuthGateModal } from "@/components/auth/auth-gate-modal";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useFriendPostComments,
  useAddFriendPostComment,
  useDeleteFriendPostComment,
  useFriendPostBookmarked,
  useBookmarkFriendPost,
  useFriendPostLiked,
  type FriendPostComment,
} from "@/lib/hooks/useFriendPosts";

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
  onShare?: () => Promise<void> | void;
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
  onShare,
  onDelete,
}: FriendPostCardProps) {
  const { user } = useAuth();
  const { can: permissions } = usePermissions();

  // Server-backed like state
  const { data: serverLiked } = useFriendPostLiked(post.id, user?.id);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Server-backed bookmark state
  const { data: serverBookmarked } = useFriendPostBookmarked(post.id, user?.id);
  const { toggleBookmark } = useBookmarkFriendPost();
  const [bookmarked, setBookmarked] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { data: comments = [], isLoading: commentsLoading } = useFriendPostComments(post.id, showComments);
  const { addComment, isAdding: isAddingComment } = useAddFriendPostComment();
  const { deleteComment } = useDeleteFriendPostComment();

  // Other state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);

  const canDelete = !isGuest && (
    (user && post.user_id === user.id) || permissions.deleteFreeUserPost
  );

  // Sync liked state from server
  useEffect(() => {
    if (serverLiked !== undefined) {
      setLiked(serverLiked);
    }
  }, [serverLiked]);

  // Sync bookmark state from server
  useEffect(() => {
    if (serverBookmarked !== undefined) {
      setBookmarked(serverBookmarked);
    }
  }, [serverBookmarked]);

  // Sync likes count from server (only when not actively liking)
  useEffect(() => {
    if (!isLiking) {
      setLikesCount(post.likes_count || 0);
    }
  }, [post.likes_count, isLiking]);

  const handleDelete = async () => {
    if (isDeleting || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (isGuest) {
      setShowAuthGate(true);
      return;
    }
    if (isLiking) return;

    const wasLiked = liked;
    const prevCount = likesCount;
    setLiked(!wasLiked);
    setLikesCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsLiking(true);

    try {
      await onLike?.();
    } catch {
      setLiked(wasLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    if (isGuest) {
      setShowAuthGate(true);
      return;
    }
    setShowComments((prev) => !prev);
    // Focus input after opening
    if (!showComments) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  };

  const handleSubmitComment = async () => {
    const content = commentText.trim();
    if (!content || isAddingComment) return;

    try {
      await addComment({ postId: post.id, content });
      setCommentText("");
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({ postId: post.id, commentId });
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleShare = () => {
    if (isGuest) {
      setShowAuthGate(true);
      return;
    }
    setShowSharePopup((prev) => !prev);
  };

  const handleBookmark = async () => {
    if (isGuest) {
      setShowAuthGate(true);
      return;
    }

    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);

    try {
      await toggleBookmark(post.id);
      toast.success(wasBookmarked ? "Removed from saved" : "Post saved!");
    } catch {
      setBookmarked(wasBookmarked);
      toast.error("Failed to save post");
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
      <div
        className={cn(
          "group relative rounded-2xl transition-all duration-300",
          "backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]",
          "hover:border-primary/20 hover:bg-white/[0.05]",
          "hover:shadow-lg hover:shadow-primary/5",
          "animate-fadeInUp"
        )}
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />

        <div className="relative p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <Link
              href={post.user?.username ? `/profile/${post.user.username}` : "#"}
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
            <div className="relative rounded-xl overflow-hidden mb-3 border border-white/[0.06] aspect-[16/9]">
              <Image
                src={post.image_url}
                alt="Post image"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 600px"
                unoptimized={post.image_url.startsWith("/uploads/")}
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
                onClick={handleComment}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 group/comment",
                  showComments
                    ? "text-accent bg-accent/10"
                    : "text-text-muted hover:text-accent hover:bg-accent/10"
                )}
              >
                <MessageCircle className="h-[18px] w-[18px] transition-transform group-hover/comment:scale-110" />
                <span className="text-sm font-medium">{post.comments_count || 0}</span>
              </button>

              {/* Share */}
              <div className="relative">
                <button
                  onClick={handleShare}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 group/share",
                    showSharePopup
                      ? "text-primary bg-primary/10"
                      : "text-text-muted hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Share2 className="h-[18px] w-[18px] transition-transform group-hover/share:scale-110" />
                  <span className="text-sm font-medium">Share</span>
                </button>
                <SharePopup
                  isOpen={showSharePopup}
                  onClose={() => setShowSharePopup(false)}
                  url={typeof window !== "undefined" ? `${window.location.origin}/community?post=${post.id}` : ""}
                  title={`Post by ${post.user?.display_name || post.user?.username || "a gamer"}`}
                  text={post.content.slice(0, 120)}
                />
              </div>
            </div>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                bookmarked
                  ? "text-primary bg-primary/10"
                  : "text-text-muted hover:text-primary hover:bg-primary/10"
              )}
            >
              <Bookmark className={cn("h-[18px] w-[18px]", bookmarked && "fill-current")} />
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-3 space-y-3">
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              {/* Comment input */}
              <div className="flex items-center gap-2">
                <Avatar
                  src={user ? undefined : undefined}
                  alt="You"
                  size="sm"
                />
                <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="flex-1 bg-transparent text-sm text-text placeholder-text-dim outline-none"
                    maxLength={500}
                    disabled={isAddingComment}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isAddingComment}
                    className={cn(
                      "p-1 rounded-lg transition-all",
                      commentText.trim()
                        ? "text-primary hover:bg-primary/10"
                        : "text-text-dim cursor-not-allowed"
                    )}
                  >
                    {isAddingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Comments list */}
              {commentsLoading ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {comments.map((comment: FriendPostComment) => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-2 group/cmt px-1"
                    >
                      <Link href={comment.user?.username ? `/profile/${comment.user.username}` : "#"} onClick={handleProfileClick}>
                        <Avatar
                          src={comment.user?.avatar_url}
                          alt={comment.user?.display_name || "User"}
                          size="xs"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={comment.user?.username ? `/profile/${comment.user.username}` : "#"}
                          onClick={handleProfileClick}
                          className="text-xs font-semibold text-text hover:text-primary transition-colors inline-flex items-center gap-1 mb-0.5 px-1"
                        >
                          {comment.user?.display_name || comment.user?.username}
                          {comment.user?.is_verified && (
                            <CheckCircle className="h-3 w-3 text-primary" />
                          )}
                        </Link>
                        <div className="bg-white/[0.04] rounded-xl px-3 py-2">
                          <p className="text-sm text-text-secondary break-words">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 px-1">
                          <span className="text-[11px] text-text-dim">
                            <RelativeTime date={comment.created_at} />
                          </span>
                          {user && comment.user_id === user.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-[11px] text-text-dim hover:text-red-400 transition-colors opacity-0 group-hover/cmt:opacity-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-text-dim text-xs py-2">
                  No comments yet. Be the first!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auth gate modal for guest interactions */}
      <AuthGateModal
        isOpen={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        redirectTo={`/profile/${post.user?.username}`}
      />
    </>
  );
}
