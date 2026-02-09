"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Reply, Send, CornerDownRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBlogComments, useAddBlogComment } from "@/lib/hooks/useBlog";
import type { BlogComment } from "@/types/blog";
import { formatDistanceToNow } from "date-fns";

interface BlogCommentsProps {
  postSlug: string;
}

export function BlogComments({ postSlug }: BlogCommentsProps) {
  const { comments, allowComments, loading, refetch } = useBlogComments(postSlug);
  const { addComment, isAdding } = useAddBlogComment();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment({ post_id: postSlug, content: newComment });
      setNewComment("");
      refetch();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      await addComment({
        post_id: postSlug,
        content: replyContent,
        parent_id: parentId,
      });
      setReplyingTo(null);
      setReplyContent("");
      refetch();
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: BlogComment;
    isReply?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition">
              <Heart className="w-3.5 h-3.5" />
              {comment.likes_count}
            </button>
            {!isReply && (
              <button
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
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
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    disabled={isAdding}
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
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (!allowComments) {
    return (
      <div className="text-center py-8 text-gray-500">
        Comments are disabled for this post.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">
        Comments ({comments.length})
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
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
