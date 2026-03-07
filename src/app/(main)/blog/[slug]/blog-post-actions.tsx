"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SocialShareButtons } from "@/components/blog/social-share-buttons";
import { ShareCardModal } from "@/components/blog/share-card-modal";
import { useLikeBlogPost, useBlogPost, useDeleteBlogPost } from "@/lib/hooks/useBlog";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/db/client-browser";

interface BlogPostActionsProps {
  slug: string;
  title: string;
  likesCount: number;
  commentsCount: number;
  authorId?: string;
}

export function BlogPostActions({
  slug,
  title,
  likesCount: serverLikesCount,
  commentsCount: serverCommentsCount,
  authorId,
}: BlogPostActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleLike, isLiking } = useLikeBlogPost();
  const { deletePost, isDeleting } = useDeleteBlogPost();
  const { post } = useBlogPost(slug);
  const [showShareCards, setShowShareCards] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAuthor = !!(user?.id && authorId && user.id === authorId);

  // Use client-fetched data when available, fall back to server props
  const likesCount = post?.likes_count ?? serverLikesCount;
  const commentsCount = post?.comments_count ?? serverCommentsCount;
  const hasLiked = post?.user_has_liked ?? false;

  // Deduplicated view counting — only fires once per session per post
  useEffect(() => {
    const viewKey = `viewed_blog_${slug}`;
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, "1");
      const db = createClient();
      db.rpc("increment_blog_view", { post_slug: slug }).then();
    }
  }, [slug]);

  const handleDelete = async () => {
    try {
      await deletePost(slug);
      toast.success("Post deleted");
      router.push("/blog");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
    setShowDeleteConfirm(false);
  };

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/blog/${slug}`
      : `/blog/${slug}`;

  return (
    <div className="space-y-4 py-6 border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleLike(slug)}
            disabled={isLiking}
            className={`flex items-center gap-2 text-sm transition-colors disabled:opacity-50 ${
              hasLiked
                ? "text-red-400 hover:text-red-300"
                : "text-text-muted hover:text-primary"
            }`}
          >
            <Heart
              className={`w-5 h-5 ${isLiking ? "animate-pulse" : ""} ${
                hasLiked ? "fill-current" : ""
              }`}
            />
            {likesCount} likes
          </button>
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <MessageCircle className="w-5 h-5" />
            {commentsCount} comments
          </span>
        </div>

        {/* Author actions */}
        {isAuthor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/admin/blog/edit/${slug}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm text-white/50 hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Social share buttons */}
      <div>
        <p className="text-xs text-text-dim mb-2 uppercase tracking-wider font-medium">
          Share this post
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SocialShareButtons url={url} title={title} />
          {post && (
            <button
              onClick={() => setShowShareCards(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-surface-light hover:bg-surface-lighter rounded-lg transition-colors text-text-muted hover:text-primary"
            >
              <ImageIcon className="w-4 h-4" />
              Share as Cards
            </button>
          )}
        </div>
      </div>

      {/* Share Card Modal */}
      {post && (
        <ShareCardModal
          isOpen={showShareCards}
          onClose={() => setShowShareCards(false)}
          post={post}
          articleUrl={url}
        />
      )}
    </div>
  );
}
