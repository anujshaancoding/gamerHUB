"use client";

import { useState, useEffect, useRef } from "react";
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
  Upload,
  X,
  Plus,
} from "lucide-react";
import { useAdminNewsAction } from "@/lib/hooks/useAdminNews";
import { NEWS_CATEGORIES, NEWS_REGIONS } from "@/types/news";
import { DEFAULT_GAME_THUMBNAILS } from "@/lib/news/constants";
import { optimizedUpload, createPreview } from "@/lib/upload";
import type { NewsArticle, GameSlug, NewsCategory, NewsRegion } from "@/types/news";

const EMBED_REGEX = /\[embed:(https?:\/\/[^\]]+)\]/g;

const ALLOWED_EMBED_DOMAINS = [
  "twitter.com", "x.com", "instagram.com", "youtube.com", "youtu.be",
  "www.twitter.com", "www.x.com", "www.instagram.com", "www.youtube.com", "m.youtube.com",
];

function isValidEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_EMBED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function parseEmbedsFromSummary(text: string): { cleanText: string; embedUrls: string[] } {
  const embedUrls: string[] = [];
  const cleanText = text.replace(EMBED_REGEX, (_, url) => {
    embedUrls.push(url);
    return "";
  }).trim();
  return { cleanText, embedUrls };
}

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
  const [embedUrls, setEmbedUrls] = useState<string[]>([]);
  const [newEmbedUrl, setNewEmbedUrl] = useState("");

  // Thumbnail upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Parse embeds from existing summary
        const rawSummary = article.summary || article.original_content || "";
        const { cleanText, embedUrls: existingEmbeds } = parseEmbedsFromSummary(rawSummary);

        setTitle(article.title || article.original_title || "");
        setSummary(cleanText);
        setExcerpt(article.excerpt || "");
        setGameSlug(article.game_slug as GameSlug);
        setCategory(article.category as NewsCategory);
        setRegion(article.region as NewsRegion);
        setThumbnailUrl(article.thumbnail_url || "");
        setOriginalUrl(article.original_url || "");
        setTags((article.tags || []).join(", "));
        setIsFeatured(article.is_featured);
        setIsPinned(article.is_pinned);
        setEmbedUrls(existingEmbeds);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [articleId, router]);

  // Thumbnail upload handler
  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const preview = await createPreview(file);
      setUploadPreview(preview);

      const result = await optimizedUpload(file, "media", "news");
      setThumbnailUrl(result.publicUrl);
      setUploadPreview(null);
      toast.success("Thumbnail uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploadPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Embed URL handlers
  const addEmbedUrl = () => {
    const url = newEmbedUrl.trim();
    if (!url) return;
    if (!isValidEmbedUrl(url)) {
      toast.error("Only Twitter/X, Instagram, and YouTube URLs are supported");
      return;
    }
    if (embedUrls.includes(url)) {
      toast.error("This URL is already added");
      return;
    }
    setEmbedUrls([...embedUrls, url]);
    setNewEmbedUrl("");
  };

  const removeEmbedUrl = (index: number) => {
    setEmbedUrls(embedUrls.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!title.trim()) {
      toast.error("Title is required");
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

    // Append embed markers to summary
    let fullSummary = summary.trim();
    if (embedUrls.length > 0) {
      const embedMarkers = embedUrls.map((url) => `[embed:${url}]`).join("\n");
      fullSummary = fullSummary ? `${fullSummary}\n\n${embedMarkers}` : embedMarkers;
    }

    try {
      await updateArticle({
        id: articleId,
        updates: {
          title: title.trim(),
          summary: fullSummary || null,
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

  const displayThumbnail = uploadPreview || thumbnailUrl;
  const defaultThumbnail = DEFAULT_GAME_THUMBNAILS[gameSlug];

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
        <h2 className="text-lg font-semibold text-white">Edit News Article</h2>
        <p className="text-xs text-white/40 mt-1">
          {originalArticle?.status === "published"
            ? "Edit this published article — changes will be live immediately"
            : "Review and edit this article before publishing"}
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
      {!summary && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-400 space-y-1">
            <p className="font-medium">Required for publishing:</p>
            <p>- Add a summary / description</p>
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
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white"
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
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white"
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
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white"
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

        {/* Thumbnail */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            <ImageIcon className="h-3 w-3" />
            Thumbnail
          </label>
          <div className="space-y-3">
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => { setThumbnailUrl(e.target.value); setUploadPreview(null); }}
              placeholder="Paste image URL or upload below..."
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
            />

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleThumbnailUpload(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.05] border border-white/10 text-white/60 text-sm rounded-lg hover:bg-white/[0.08] disabled:opacity-50 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Upload Image"}
              </button>
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => { setThumbnailUrl(""); setUploadPreview(null); }}
                  className="text-xs text-white/30 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {displayThumbnail ? (
              <div className="relative">
                <img
                  src={displayThumbnail}
                  alt="Thumbnail preview"
                  className="h-32 w-auto rounded-lg object-cover border border-white/10"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-dashed border-white/10">
                <img
                  src={defaultThumbnail}
                  alt="Default"
                  className="h-12 w-12 rounded object-contain opacity-40"
                />
                <p className="text-xs text-white/30">
                  No thumbnail set — the default {gameSlug.toUpperCase()} game image will be used
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Embedded Posts */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            <LinkIcon className="h-3 w-3" />
            Embedded Posts <span className="text-white/20 normal-case">(Twitter, Instagram, YouTube)</span>
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={newEmbedUrl}
                onChange={(e) => setNewEmbedUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmbedUrl(); } }}
                placeholder="https://twitter.com/... or https://youtube.com/..."
                className="flex-1 px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
              />
              <button
                type="button"
                onClick={addEmbedUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.05] border border-white/10 text-white/60 text-sm rounded-lg hover:bg-white/[0.08] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            {embedUrls.length > 0 && (
              <div className="space-y-2">
                {embedUrls.map((url, index) => {
                  let platform = "Link";
                  if (url.includes("twitter.com") || url.includes("x.com")) platform = "Twitter/X";
                  else if (url.includes("instagram.com")) platform = "Instagram";
                  else if (url.includes("youtube.com") || url.includes("youtu.be")) platform = "YouTube";

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10"
                    >
                      <span className="text-[10px] font-medium text-violet-400 uppercase shrink-0">
                        {platform}
                      </span>
                      <span className="text-xs text-white/50 truncate flex-1">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeEmbedUrl(index)}
                        className="text-white/20 hover:text-red-400 transition-colors shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
          {originalArticle?.status === "published" ? "Update Article" : "Publish Now"}
        </button>
      </div>
    </div>
  );
}
