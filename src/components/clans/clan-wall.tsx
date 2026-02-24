"use client";

import { useState, useCallback } from "react";
import {
  MessageSquare,
  Pin,
  Trash2,
  Send,
  Image as ImageIcon,
  Smile,
  MoreVertical,
} from "lucide-react";
import { Avatar, Badge, Button, Card } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils";
import { useClanWall, type WallPost } from "@/lib/hooks/useClanWall";
import type { ClanMemberRole } from "@/types/database";

const REACTION_EMOJIS = ["🔥", "💪", "👏", "😂", "❤️", "🎮"];

interface ClanWallProps {
  clanId: string;
  userRole: ClanMemberRole | null;
  userId: string | null;
}

export function ClanWall({ clanId, userRole, userId }: ClanWallProps) {
  const {
    posts,
    loading,
    hasMore,
    loadingMore,
    loadMore,
    createPost,
    creatingPost,
    deletePost,
    toggleReaction,
    togglePin,
  } = useClanWall(clanId);

  const [newContent, setNewContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  const canManage = userRole === "leader" || userRole === "co_leader";
  const isMember = !!userRole;

  const handleSubmit = useCallback(async () => {
    if (!newContent.trim() || creatingPost) return;
    try {
      await createPost({ content: newContent.trim() });
      setNewContent("");
    } catch {
      // Error handled by mutation
    }
  }, [newContent, creatingPost, createPost]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-surface-light rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Post composer */}
      {isMember && (
        <Card className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Post something on the wall..."
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
                maxLength={280}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-muted">
                  {newContent.length}/280
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={creatingPost}
                  disabled={!newContent.trim()}
                  leftIcon={<Send className="h-3 w-3" />}
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Posts feed */}
      {posts.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-8 w-8 mx-auto text-text-muted mb-2" />
          <p className="text-text-muted">No posts yet</p>
          {isMember && (
            <p className="text-xs text-text-muted mt-1">
              Be the first to post on the wall!
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <WallPostCard
              key={post.id}
              post={post}
              userId={userId}
              canManage={canManage}
              showEmojiPicker={showEmojiPicker}
              onToggleEmojiPicker={setShowEmojiPicker}
              onReaction={toggleReaction}
              onPin={togglePin}
              onDelete={deletePost}
              isMember={isMember}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadMore()}
            isLoading={loadingMore}
          >
            Load more posts
          </Button>
        </div>
      )}
    </div>
  );
}

interface WallPostCardProps {
  post: WallPost;
  userId: string | null;
  canManage: boolean;
  showEmojiPicker: string | null;
  onToggleEmojiPicker: (id: string | null) => void;
  onReaction: (postId: string, emoji: string) => void;
  onPin: (postId: string, pinned: boolean) => void;
  onDelete: (postId: string) => void;
  isMember: boolean;
}

function WallPostCard({
  post,
  userId,
  canManage,
  showEmojiPicker,
  onToggleEmojiPicker,
  onReaction,
  onPin,
  onDelete,
  isMember,
}: WallPostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isAuthor = post.user_id === userId;
  const canDelete = isAuthor || canManage;

  const reactionEntries = Object.entries(post.reactions || {}).filter(
    ([, users]) => users.length > 0
  );

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar
          src={post.profile?.avatar_url}
          alt={post.profile?.display_name || post.profile?.username || "User"}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-text">
                {post.profile?.display_name || post.profile?.username || "User"}
              </span>
              {post.profile?.is_premium && (
                <Badge variant="primary" className="text-[10px] px-1 py-0">
                  PRO
                </Badge>
              )}
              {post.is_pinned && (
                <Badge variant="warning" className="text-[10px] px-1 py-0 gap-0.5">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned
                </Badge>
              )}
              <span className="text-xs text-text-muted">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>

            {/* Actions menu */}
            {canDelete && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-surface-light text-text-muted"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-6 bg-surface border border-border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    {canManage && (
                      <button
                        onClick={() => {
                          onPin(post.id, !post.is_pinned);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-surface-light flex items-center gap-2"
                      >
                        <Pin className="h-3 w-3" />
                        {post.is_pinned ? "Unpin" : "Pin"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(post.id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm text-error hover:bg-surface-light flex items-center gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-text mt-1 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Image */}
          {post.image_url && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full h-auto max-h-64 object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {reactionEntries.map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => isMember && onReaction(post.id, emoji)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  userId && users.includes(userId)
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-surface-light border-border text-text-muted hover:border-primary/30"
                }`}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}

            {/* Add reaction button */}
            {isMember && (
              <div className="relative">
                <button
                  onClick={() =>
                    onToggleEmojiPicker(
                      showEmojiPicker === post.id ? null : post.id
                    )
                  }
                  className="p-1 rounded-full hover:bg-surface-light text-text-muted"
                >
                  <Smile className="h-4 w-4" />
                </button>
                {showEmojiPicker === post.id && (
                  <div className="absolute bottom-8 left-0 bg-surface border border-border rounded-lg shadow-lg z-10 p-2 flex gap-1">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReaction(post.id, emoji);
                          onToggleEmojiPicker(null);
                        }}
                        className="p-1 rounded hover:bg-surface-light text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
