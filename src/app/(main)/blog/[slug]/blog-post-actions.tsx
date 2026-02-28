"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Image as ImageIcon } from "lucide-react";
import { SocialShareButtons } from "@/components/blog/social-share-buttons";
import { ShareCardModal } from "@/components/blog/share-card-modal";
import { useLikeBlogPost, useBlogPost } from "@/lib/hooks/useBlog";
import { createClient } from "@/lib/db/client-browser";

interface BlogPostActionsProps {
  slug: string;
  title: string;
  likesCount: number;
  commentsCount: number;
}

export function BlogPostActions({
  slug,
  title,
  likesCount: serverLikesCount,
  commentsCount: serverCommentsCount,
}: BlogPostActionsProps) {
  const { toggleLike, isLiking } = useLikeBlogPost();
  const { post } = useBlogPost(slug);
  const [showShareCards, setShowShareCards] = useState(false);

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
