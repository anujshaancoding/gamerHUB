"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Send,
  Save,
  Loader2,
  ArrowLeft,
  Gamepad2,
  Globe,
  Tag,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useAdminNewsAction } from "@/lib/hooks/useAdminNews";
import { NEWS_CATEGORIES, NEWS_REGIONS } from "@/types/news";
import type { NewsArticle, GameSlug, NewsCategory, NewsRegion } from "@/types/news";

export default function AdminEditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  const { updateArticle, isUpdating } = useAdminNewsAction();

  const [loading, setLoading] = useState(true);
  const [originalArticle, setOriginalArticle] = useState<NewsArticle | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [gameSlug, setGameSlug] = useState<GameSlug>("valorant");
  const [category, setCategory] = useState<NewsCategory>("general");
  const [region, setRegion] = useState<NewsRegion>("india");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Load article data
  useEffect(() => {
    async function loadArticle() {
      try {
        const res = await fetch(`/api/admin/news?id=${articleId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const article = json.article as NewsArticle | undefined;
        if (!article) {
          toast.error("Article not found");
          router.push("/admin/news");
          return;
        }

        setOriginalArticle(article);
        setTitle(article.title || article.original_title || "");
        setSummary(article.summary || article.original_content || "");
        setExcerpt(article.excerpt || "");
        setGameSlug(article.game_slug as GameSlug);
        setCategory(article.category as NewsCategory);
        setRegion(article.region as NewsRegion);
        setThumbnailUrl(article.thumbnail_url || "");
        setOriginalUrl(article.original_url || "");
        setTags((article.tags || []).join(", "));
        setIsFeatured(article.is_featured);
        setIsPinned(article.is_pinned);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [articleId, router]);

  const validate = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!thumbnailUrl.trim()) {
      toast.error("Thumbnail image is required for publishing");
      return false;
    }
    if (!summary.trim()) {
      toast.error("Summary is required for publishing");
      return false;
    }
    return true;
  };

  const handleSave = async (status: "published" | "pending") => {
    if (status === "published" && !validate()) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      await updateArticle({
        id: articleId,
        updates: {
          title: title.trim(),
          summary: summary.trim() || null,
          excerpt: excerpt.trim() || null,
          game_slug: gameSlug,
          category,
          region,
          thumbnail_url: thumbnailUrl.trim() || null,
          original_url: originalUrl.trim() || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          is_featured: isFeatured,
          is_pinned: isPinned,
          status,
        },
      });
      toast.success(status === "published" ? "Article published!" : "Saved as pending");
      router.push("/admin/news");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/news"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to news
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-white">Edit & Publish News Article</h2>
        <p className="text-xs text-white/40 mt-1">
          Review and edit this fetched article before publishing to the platform
        </p>
      </div>

      {/* Source info banner */}
      {originalArticle?.source && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
          <ExternalLink className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-400">
              Fetched from <span className="font-medium">{(originalArticle.source as { name?: string })?.name}</span>
            </p>
            {originalArticle.original_url && (
              <a
                href={originalArticle.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-400/60 hover:text-emerald-400 truncate block"
              >
                {originalArticle.original_url}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Validation hints */}
      {(!thumbnailUrl || !summary) && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-400 space-y-1">
            <p className="font-medium">Required for publishing:</p>
            {!thumbnailUrl && <p>- Add a thumbnail image</p>}
            {!summary && <p>- Add a summary / description</p>}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter news headline..."
            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Game, Category, Region row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              <Gamepad2 className="h-3 w-3" />
              Game *
            </label>
            <select
              value={gameSlug}
              onChange={(e) => setGameSlug(e.target.value as GameSlug)}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="valorant">Valorant</option>
              <option value="bgmi">BGMI</option>
              <option value="freefire">Free Fire</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              <Tag className="h-3 w-3" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NewsCategory)}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              {Object.entries(NEWS_CATEGORIES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              <Globe className="h-3 w-3" />
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as NewsRegion)}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              {Object.entries(NEWS_REGIONS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Summary / Description *
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write the news summary or full content..."
            rows={8}
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-y"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Excerpt <span className="text-white/20 normal-case">(short preview text for cards)</span>
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value.slice(0, 280))}
            placeholder="Brief one-liner for preview cards..."
            rows={2}
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <p className="text-[10px] text-white/20 mt-1">{excerpt.length}/280</p>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            <ImageIcon className="h-3 w-3" />
            Thumbnail URL *
          </label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="Preview"
              className="mt-2 h-32 w-auto rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>

        {/* Original Source URL */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            <LinkIcon className="h-3 w-3" />
            Source URL
          </label>
          <input
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://original-source.com/article"
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Tags <span className="text-white/20 normal-case">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., vct, tournament, india"
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-sm text-white/60">Featured</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-sm text-white/60">Pinned</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSave("pending")}
          disabled={isUpdating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/[0.08] disabled:opacity-50 transition-colors"
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save as Pending
        </button>
        <button
          onClick={() => handleSave("published")}
          disabled={isUpdating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Publish Now
        </button>
      </div>
    </div>
  );
}
