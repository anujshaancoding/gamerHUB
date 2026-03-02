"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, PinOff, Trash2, MessageSquare, Send } from "lucide-react";
import { Avatar } from "@/components/ui";
import { RelativeTime } from "@/components/ui";

interface WallPost {
  id: string;
  profile_id: string;
  author_id: string;
  content: string;
  reaction: string | null;
  is_pinned: boolean;
  created_at: string;
  author_avatar_url: string | null;
  author_username: string | null;
  author_display_name: string | null;
}

interface GamerWallProps {
  profileId: string;
  isOwnProfile: boolean;
  currentUserId?: string;
}

const REACTIONS = [
  { key: "gg", label: "GG", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { key: "respect", label: "Respect", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { key: "carry", label: "Carry", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { key: "legend", label: "Legend", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { key: "wholesome", label: "Wholesome", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
] as const;

const REACTION_BADGE_COLORS: Record<string, string> = {
  gg: "bg-green-500/20 text-green-400 border border-green-500/30",
  respect: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  carry: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  legend: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  wholesome: "bg-pink-500/20 text-pink-400 border border-pink-500/30",
};

const REACTION_LABELS: Record<string, string> = {
  gg: "GG",
  respect: "Respect",
  carry: "Carry",
  legend: "Legend",
  wholesome: "Wholesome",
};

export function GamerWall({ profileId, isOwnProfile, currentUserId }: GamerWallProps) {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/wall-posts?profileId=${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch wall posts:", error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/wall-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          content: content.trim(),
          reaction: selectedReaction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [data.post, ...prev]);
        setContent("");
        setSelectedReaction(null);
      }
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/wall-posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleTogglePin = async (postId: string, currentlyPinned: boolean) => {
    try {
      const res = await fetch(`/api/wall-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !currentlyPinned }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => {
          const updated = prev.map((p) =>
            p.id === postId ? { ...p, is_pinned: data.post.is_pinned } : p
          );
          // Re-sort: pinned first, then by created_at descending
          return updated.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        });
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const canDelete = (post: WallPost) => {
    if (!currentUserId) return false;
    return post.author_id === currentUserId || isOwnProfile;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Gamer Wall</h3>
      </div>

      {/* Post Form */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Leave a message on the wall..."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors"
            />
            <span className="absolute bottom-2 right-3 text-xs text-white/30">
              {content.length}/500
            </span>
          </div>

          {/* Reaction Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/50 mr-1">Reaction:</span>
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() =>
                  setSelectedReaction((prev) => (prev === r.key ? null : r.key))
                }
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedReaction === r.key
                    ? r.color + " ring-1 ring-white/20"
                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Posting..." : "Post to Wall"}
          </button>
        </form>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-10 w-10 text-white/20 mb-3" />
          <p className="text-sm text-white/40">
            No wall posts yet. Be the first to leave a message!
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative rounded-xl bg-white/5 border border-white/10 p-4"
            >
              {/* Pinned indicator */}
              {post.is_pinned && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                  <Pin className="h-3 w-3 text-yellow-400" />
                  <span className="text-[10px] font-medium text-yellow-400">Pinned</span>
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Author Avatar */}
                <Avatar
                  src={post.author_avatar_url}
                  alt={post.author_display_name || post.author_username || "User"}
                  fallback={post.author_display_name?.[0] || post.author_username?.[0] || "?"}
                  size="sm"
                />

                <div className="flex-1 min-w-0">
                  {/* Author Name & Timestamp */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {post.author_display_name || post.author_username || "Unknown"}
                    </span>
                    <RelativeTime
                      date={post.created_at}
                      className="text-xs text-white/30"
                    />
                  </div>

                  {/* Content */}
                  <p className="mt-1 text-sm text-white/70 whitespace-pre-wrap break-words">
                    {post.content}
                  </p>

                  {/* Reaction Badge */}
                  {post.reaction && REACTION_BADGE_COLORS[post.reaction] && (
                    <span
                      className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${REACTION_BADGE_COLORS[post.reaction]}`}
                    >
                      {REACTION_LABELS[post.reaction] || post.reaction}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {isOwnProfile && (
                    <button
                      onClick={() => handleTogglePin(post.id, post.is_pinned)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                      title={post.is_pinned ? "Unpin post" : "Pin post"}
                    >
                      {post.is_pinned ? (
                        <PinOff className="h-3.5 w-3.5 text-yellow-400 group-hover:text-yellow-300" />
                      ) : (
                        <Pin className="h-3.5 w-3.5 text-white/30 group-hover:text-white/60" />
                      )}
                    </button>
                  )}

                  {canDelete(post) && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group"
                      title="Delete post"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white/30 group-hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
