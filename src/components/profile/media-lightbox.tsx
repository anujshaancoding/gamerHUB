"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  X,
  Heart,
  MessageCircle,
  Trash2,
  Pencil,
  Check,
  Loader2,
  Send,
} from "lucide-react";

export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  is_public: boolean;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  can_delete: boolean;
}

interface Props {
  item: MediaItem;
  viewerId: string | null;
  isOwner: boolean;
  onClose: () => void;
  onLikeChange: (id: string, liked: boolean, likeCount: number) => void;
  onCommentCountChange: (id: string, count: number) => void;
  onTitleChange: (id: string, title: string | null) => void;
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function MediaLightbox({
  item,
  viewerId,
  isOwner,
  onClose,
  onLikeChange,
  onCommentCountChange,
  onTitleChange,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(item.title ?? "");
  const [savingTitle, setSavingTitle] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const r = await fetch(`/api/profile/media/${item.id}/comments`);
      const d = await r.json();
      setComments(Array.isArray(d.comments) ? d.comments : []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [item.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function toggleLike() {
    if (!viewerId || likeBusy) return;
    setLikeBusy(true);
    // Optimistic update
    const optimisticLiked = !item.liked_by_me;
    const optimisticCount = item.like_count + (optimisticLiked ? 1 : -1);
    onLikeChange(item.id, optimisticLiked, Math.max(0, optimisticCount));
    try {
      const r = await fetch(`/api/profile/media/${item.id}/like`, { method: "POST" });
      const d = await r.json();
      if (r.ok) onLikeChange(item.id, d.liked, d.like_count);
    } catch {
      // Revert on failure
      onLikeChange(item.id, item.liked_by_me, item.like_count);
    } finally {
      setLikeBusy(false);
    }
  }

  async function postComment() {
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      const r = await fetch(`/api/profile/media/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = await r.json();
      if (r.ok) {
        setComments((prev) => [...prev, d.comment]);
        setDraft("");
        onCommentCountChange(item.id, comments.length + 1);
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(id: string) {
    const r = await fetch(`/api/profile/media/${item.id}/comments?id=${id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      setComments((prev) => {
        const next = prev.filter((c) => c.id !== id);
        onCommentCountChange(item.id, next.length);
        return next;
      });
    }
  }

  async function saveTitle() {
    setSavingTitle(true);
    try {
      const r = await fetch(`/api/profile/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, title: titleDraft }),
      });
      const d = await r.json();
      if (r.ok) {
        onTitleChange(item.id, d.media.title ?? null);
        setEditing(false);
      }
    } finally {
      setSavingTitle(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-4"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 z-10 text-white/70 hover:text-white"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-7 w-7" />
      </button>

      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-surface lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="flex flex-1 items-center justify-center bg-black lg:max-w-[64%]">
          {item.type === "video" ? (
            <video
              src={item.url}
              controls
              autoPlay
              className="max-h-[40vh] w-full object-contain lg:max-h-[92vh]"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.title || "media"}
              className="max-h-[40vh] w-full object-contain lg:max-h-[92vh]"
            />
          )}
        </div>

        {/* Side panel: title, likes, comments */}
        <div className="flex w-full flex-col lg:w-[36%]">
          {/* Header: title + like */}
          <div className="border-b border-border p-4">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  maxLength={120}
                  autoFocus
                  placeholder="Add a title…"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
                <button
                  onClick={saveTitle}
                  disabled={savingTitle}
                  className="rounded-lg bg-primary p-2 text-background hover:bg-primary-dark disabled:opacity-50"
                  aria-label="Save title"
                >
                  {savingTitle ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 break-words text-base font-bold text-text">
                  {item.title || (
                    <span className="font-normal italic text-text-dim">Untitled</span>
                  )}
                </h3>
                {isOwner && (
                  <button
                    onClick={() => {
                      setTitleDraft(item.title ?? "");
                      setEditing(true);
                    }}
                    className="shrink-0 text-text-dim hover:text-primary"
                    aria-label="Edit title"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={toggleLike}
                disabled={!viewerId || likeBusy}
                title={viewerId ? undefined : "Log in to like"}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    item.liked_by_me ? "fill-error text-error" : "text-text-dim"
                  }`}
                />
                <span className={item.liked_by_me ? "text-error" : "text-text-dim"}>
                  {item.like_count}
                </span>
              </button>
              <span className="inline-flex items-center gap-1.5 text-sm text-text-dim">
                <MessageCircle className="h-5 w-5" />
                {item.comment_count}
              </span>
            </div>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingComments ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-text-dim" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-dim">
                No comments yet.{viewerId ? " Be the first!" : ""}
              </p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-2.5">
                    <Avatar url={c.avatar_url} name={c.display_name || c.username} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-text">
                          {c.display_name || c.username || "Player"}
                        </span>
                        <span className="shrink-0 text-xs text-text-dim">
                          {timeAgo(c.created_at)}
                        </span>
                        {c.can_delete && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="ml-auto shrink-0 text-text-dim hover:text-error"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-text-muted">
                        {c.content}
                      </p>
                    </div>
                  </li>
                ))}
                <div ref={commentsEndRef} />
              </ul>
            )}
          </div>

          {/* Add comment */}
          {viewerId ? (
            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a comment…"
                  rows={1}
                  maxLength={500}
                  className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      postComment();
                    }
                  }}
                />
                <button
                  onClick={postComment}
                  disabled={posting || !draft.trim()}
                  className="rounded-lg bg-primary p-2.5 text-background transition-colors hover:bg-primary-dark disabled:opacity-50"
                  aria-label="Post comment"
                >
                  {posting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border p-3 text-center text-sm text-text-dim">
              Log in to like and comment.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name || "user"}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}
