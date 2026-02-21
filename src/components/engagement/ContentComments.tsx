"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Reply, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CommentAuthor {
  id?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  author?: CommentAuthor;
  replies?: Comment[];
  user_has_liked?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  replyingTo: string | null;
  replyContent: string;
  isAdding: boolean;
  onSetReplyingTo: (id: string | null) => void;
  onSetReplyContent: (content: string) => void;
  onReply: (parentId: string) => void;
  onLikeComment?: (commentId: string) => Promise<void>;
}

function CommentItem({
  comment,
  isReply = false,
  replyingTo,
  replyContent,
  isAdding,
  onSetReplyingTo,
  onSetReplyContent,
  onReply,
  onLikeComment,
}: CommentItemProps) {
  // --- Optimistic local state for like ---
  const [liked, setLiked] = useState(comment.user_has_liked ?? false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking || !onLikeComment) return;

    // Toggle instantly
    const wasLiked = liked;
    const prevCount = likesCount;
    setLiked(!wasLiked);
    setLikesCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsLiking(true);

    try {
      await onLikeComment(comment.id);
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout="position"
      className={`${isReply ? "ml-8 pl-4 border-l border-gray-800" : ""}`}
    >
      <div className="flex gap-3">
        <Avatar
          src={comment.author?.avatar_url}
          alt={comment.author?.display_name || comment.author?.username || "User"}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">
              {comment.author?.display_name || comment.author?.username}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-xs transition-all duration-200",
                liked
                  ? "text-red-400"
                  : "text-gray-500 hover:text-red-400"
              )}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  liked && "fill-current scale-110"
                )}
              />
              {likesCount}
            </button>
            {!isReply && (
              <button
                onClick={() =>
                  onSetReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
          </div>

          {/* Reply form */}
          <AnimatePresence>
            {replyingTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => onSetReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => onReply(comment.id)}
                    disabled={isAdding || !replyContent.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  isAdding={isAdding}
                  onSetReplyingTo={onSetReplyingTo}
                  onSetReplyContent={onSetReplyContent}
                  onReply={onReply}
                  onLikeComment={onLikeComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ContentCommentsProps {
  contentId: string;
  comments: Comment[];
  allowComments: boolean;
  loading: boolean;
  onAddComment: (data: { content: string; parent_id?: string }) => Promise<void>;
  isAdding: boolean;
  onRefetch: () => void;
  onLikeComment?: (commentId: string) => Promise<void>;
  title?: string;
}

export function ContentComments({
  comments,
  allowComments,
  loading,
  onAddComment,
  isAdding,
  onRefetch,
  onLikeComment,
  title = "Comments",
}: ContentCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await onAddComment({ content: newComment });
      setNewComment("");
      onRefetch();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleReply = useCallback(async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      await onAddComment({
        content: replyContent,
        parent_id: parentId,
      });
      setReplyingTo(null);
      setReplyContent("");
      onRefetch();
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  }, [replyContent, onAddComment, onRefetch]);

  if (!allowComments) {
    return (
      <div className="text-center py-8 text-gray-500">
        Comments are disabled.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">
        {title} ({comments.length})
      </h3>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="flex-1"
        />
        <Button type="submit" disabled={isAdding || !newComment.trim()}>
          <Send className="w-4 h-4 mr-2" />
          Post
        </Button>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              isAdding={isAdding}
              onSetReplyingTo={setReplyingTo}
              onSetReplyContent={setReplyContent}
              onReply={handleReply}
              onLikeComment={onLikeComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
