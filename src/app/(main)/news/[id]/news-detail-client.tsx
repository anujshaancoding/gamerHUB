"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Eye,
  ExternalLink,
  Gamepad2,
  Share2,
  Tag,
  Star,
  Pin,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NEWS_CATEGORIES, NEWS_REGIONS } from "@/types/news";
import type { NewsArticle, NewsCategory } from "@/types/news";
import { NewsComments } from "@/components/news/news-comments";

const GAME_COLORS: Record<string, string> = {
  valorant: "bg-red-500/90 text-white",
  bgmi: "bg-orange-500/90 text-white",
  freefire: "bg-yellow-500/90 text-black",
};

const GAME_NAMES: Record<string, string> = {
  valorant: "VALORANT",
  bgmi: "BGMI",
  freefire: "FREE FIRE",
};

const CATEGORY_COLORS: Record<string, string> = {
  patch: "bg-green-500/10 text-green-400 border-green-500/20",
  tournament: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  event: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  update: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  roster: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  meta: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  general: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

interface NewsDetailClientProps {
  article: NewsArticle;
}

export function NewsDetailClient({ article }: NewsDetailClientProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: article.title,
      text: article.excerpt || article.summary?.slice(0, 100) || article.title,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
      return;
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const categoryInfo = NEWS_CATEGORIES[article.category as NewsCategory];
  const sourceName = (article.source as { name?: string } | undefined)?.name;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to news
      </Link>

      {/* Hero image */}
      {article.thumbnail_url ? (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-light">
          <Image
            src={article.thumbnail_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
            unoptimized
          />
          {/* Game badge on image */}
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                GAME_COLORS[article.game_slug] || "bg-primary/90 text-white"
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              {GAME_NAMES[article.game_slug] || article.game_slug}
            </span>
          </div>
          {/* Featured / Pinned */}
          <div className="absolute top-4 right-4 flex gap-2">
            {article.is_pinned && (
              <span className="px-2 py-1.5 rounded-lg bg-yellow-500/90 text-black">
                <Pin className="h-3.5 w-3.5" />
              </span>
            )}
            {article.is_featured && (
              <span className="px-2 py-1.5 rounded-lg bg-purple-500/90 text-white">
                <Star className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-light flex items-center justify-center">
          <Gamepad2 className="h-16 w-16 text-text-dim" />
          <div className="absolute top-4 left-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                GAME_COLORS[article.game_slug] || "bg-primary/90 text-white"
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              {GAME_NAMES[article.game_slug] || article.game_slug}
            </span>
          </div>
        </div>
      )}

      {/* Article header */}
      <div className="space-y-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {categoryInfo && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                CATEGORY_COLORS[article.category] || CATEGORY_COLORS.general
              }`}
            >
              <Tag className="h-3 w-3" />
              {categoryInfo.label}
            </span>
          )}
          {article.region !== "global" && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
              {NEWS_REGIONS[article.region]?.label || article.region}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight">
          {article.title}
        </h1>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-text-muted flex-wrap">
          {article.published_at && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {article.views_count.toLocaleString()} views
          </span>
          {sourceName && (
            <span className="flex items-center gap-1.5">
              <ExternalLink className="h-4 w-4" />
              {sourceName}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light hover:bg-surface-lighter text-text-secondary hover:text-text text-sm font-medium transition-colors border border-border"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
              </>
            )}
          </button>
          {article.original_url && (
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-light hover:bg-surface-lighter text-text-secondary hover:text-text text-sm font-medium transition-colors border border-border"
            >
              <ExternalLink className="h-4 w-4" />
              View Original
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* Article content */}
      <div className="prose prose-invert max-w-none">
        {article.summary ? (
          <div className="text-text-secondary leading-relaxed whitespace-pre-wrap text-base">
            {article.summary}
          </div>
        ) : article.excerpt ? (
          <div className="text-text-secondary leading-relaxed text-base">
            {article.excerpt}
          </div>
        ) : (
          <p className="text-text-muted italic">No content available for this article.</p>
        )}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs bg-surface-light text-text-muted border border-border"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Source attribution */}
      {article.original_url && sourceName && (
        <div className="rounded-xl border border-border bg-surface-light/50 p-4">
          <p className="text-xs text-text-muted mb-1">Source</p>
          <a
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {sourceName} - View original article
          </a>
        </div>
      )}

      {/* Divider before comments */}
      <hr className="border-border" />

      {/* Comments section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments
        </h2>
        <NewsComments articleId={article.id} />
      </div>
    </div>
  );
}
