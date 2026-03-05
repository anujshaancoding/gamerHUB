"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Upload,
  X,
  Trash2,
  Plus,
} from "lucide-react";
import { useAdminNewsCreate } from "@/lib/hooks/useAdminNews";
import { NEWS_CATEGORIES, NEWS_REGIONS } from "@/types/news";
import { DEFAULT_GAME_THUMBNAILS } from "@/lib/news/constants";
import { optimizedUpload, createPreview } from "@/lib/upload";
import type { GameSlug, NewsCategory, NewsRegion } from "@/types/news";

const DRAFT_KEY = "admin-news-draft";

interface DraftData {
  title: string;
  summary: string;
  excerpt: string;
  gameSlug: GameSlug;
  category: NewsCategory;
  region: NewsRegion;
  thumbnailUrl: string;
  originalUrl: string;
  tags: string;
  isFeatured: boolean;
  isPinned: boolean;
  embedUrls: string[];
}

const ALLOWED_EMBED_DOMAINS = [
  "twitter.com",
  "x.com",
  "instagram.com",
  "youtube.com",
  "youtu.be",
  "www.twitter.com",
  "www.x.com",
  "www.instagram.com",
  "www.youtube.com",
  "m.youtube.com",
];

function isValidEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_EMBED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export default function AdminPostNewsPage() {
  const router = useRouter();
  const { createArticle, isCreating } = useAdminNewsCreate();

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

  // Draft restored flag
  const [draftRestored, setDraftRestored] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Restore draft from localStorage on mount ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: DraftData = JSON.parse(saved);
        setTitle(draft.title || "");
        setSummary(draft.summary || "");
        setExcerpt(draft.excerpt || "");
        setGameSlug(draft.gameSlug || "valorant");
        setCategory(draft.category || "general");
        setRegion(draft.region || "india");
        setThumbnailUrl(draft.thumbnailUrl || "");
        setOriginalUrl(draft.originalUrl || "");
        setTags(draft.tags || "");
        setIsFeatured(draft.isFeatured || false);
        setIsPinned(draft.isPinned || false);
        setEmbedUrls(draft.embedUrls || []);
        setDraftRestored(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // ── Save draft to localStorage (debounced) ──
  const saveDraft = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const draft: DraftData = {
        title, summary, excerpt, gameSlug, category, region,
        thumbnailUrl, originalUrl, tags, isFeatured, isPinned, embedUrls,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
  }, [title, summary, excerpt, gameSlug, category, region, thumbnailUrl, originalUrl, tags, isFeatured, isPinned, embedUrls]);

  useEffect(() => {
    saveDraft();
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [saveDraft]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle("");
    setSummary("");
    setExcerpt("");
    setGameSlug("valorant");
    setCategory("general");
    setRegion("india");
    setThumbnailUrl("");
    setOriginalUrl("");
    setTags("");
    setIsFeatured(false);
    setIsPinned(false);
    setEmbedUrls([]);
    setNewEmbedUrl("");
    setUploadPreview(null);
    setDraftRestored(false);
    toast.success("Draft cleared");
  };

  // ── Thumbnail upload handler ──
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

  // ── Embed URL handlers ──
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

  // ── Save / Publish ──
  const handleSave = async (status: "published" | "pending") => {
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
      await createArticle({
        title: title.trim(),
        summary: fullSummary || undefined,
        excerpt: excerpt.trim() || undefined,
        game_slug: gameSlug,
        category,
        region,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        original_url: originalUrl.trim() || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        is_featured: isFeatured,
        is_pinned: isPinned,
        status,
      });
      localStorage.removeItem(DRAFT_KEY);
      toast.success(status === "published" ? "News published!" : "Saved as pending");
      router.push("/admin/news");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const displayThumbnail = uploadPreview || thumbnailUrl;
  const defaultThumbnail = DEFAULT_GAME_THUMBNAILS[gameSlug];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to news
        </Link>
        {draftRestored && (
          <button
            onClick={clearDraft}
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear Draft
          </button>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">Post News Article</h2>
        <p className="text-xs text-white/40 mt-1">
          Manually create a news article for the platform
          {draftRestored && (
            <span className="text-violet-400 ml-2">(Draft restored)</span>
          )}
        </p>
      </div>

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
            Summary / Content
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write the news summary or full content..."
            rows={6}
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-y"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Excerpt <span className="text-white/20 normal-case">(short preview text)</span>
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
            {/* URL input */}
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => { setThumbnailUrl(e.target.value); setUploadPreview(null); }}
              placeholder="Paste image URL or upload below..."
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
            />

            {/* Upload button */}
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

            {/* Preview */}
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
            Source URL <span className="text-white/20 normal-case">(optional)</span>
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
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/[0.08] disabled:opacity-50 transition-colors"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save as Pending
        </button>
        <button
          onClick={() => handleSave("published")}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {isCreating ? (
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
