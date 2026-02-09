"use client";

import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { SocialShareButtons } from "@/components/blog/social-share-buttons";

interface BlogPostActionsProps {
  slug: string;
  title: string;
  likesCount: number;
  commentsCount: number;
}

export function BlogPostActions({
  slug,
  title,
  likesCount,
  commentsCount,
}: BlogPostActionsProps) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/blog/${slug}`
      : `/blog/${slug}`;

  return (
    <div className="space-y-4 py-6 border-t border-border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <Heart className="w-5 h-5" />
            {likesCount} likes
          </span>
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <MessageCircle className="w-5 h-5" />
            {commentsCount} comments
          </span>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
        >
          <Heart className="w-4 h-4" />
          Sign in to like & comment
        </Link>
      </div>

      {/* Social share buttons */}
      <div>
        <p className="text-xs text-text-dim mb-2 uppercase tracking-wider font-medium">
          Share this post
        </p>
        <SocialShareButtons url={url} title={title} />
      </div>
    </div>
  );
}
