"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Eye,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCreateBlogPost } from "@/lib/hooks/useBlog";

const RichTextEditor = dynamic(
  () => import("@/components/blog/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[400px] bg-white/[0.03] border border-white/10 rounded-xl animate-pulse" /> }
);

const BlogTemplateRenderer = dynamic(
  () => import("@/components/blog/blog-template-renderer").then((mod) => mod.BlogTemplateRenderer),
  { ssr: false }
);

import { useBlogAuthor } from "@/lib/hooks/useBlogAuthor";
import { FeaturedImageUpload } from "@/components/blog/featured-image-upload";
import {
  BLOG_CATEGORIES,
  BLOG_TEMPLATES,
  BLOG_COLOR_PALETTES,
  type BlogCategory,
  type BlogTemplate,
  type BlogColorPalette,
  type CreateBlogPostInput,
  type BlogPost,
} from "@/types/blog";

export default function AdminNewBlogPost() {
  const router = useRouter();
  const { ensureAuthor, isAuthor, isRegistering } = useBlogAuthor();
  const { createPost, isCreating } = useCreateBlogPost();

  const [showSeo, setShowSeo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentJson, setContentJson] = useState<Record<string, unknown> | null>(null);
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<BlogCategory>("news");
  const [tags, setTags] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [template, setTemplate] = useState<BlogTemplate>("classic");
  const [colorPalette, setColorPalette] = useState<BlogColorPalette>("neon_surge");
  const [allowComments, setAllowComments] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (!isAuthor && !isRegistering) {
      ensureAuthor().catch(() => {});
    }
  }, [isAuthor, isRegistering, ensureAuthor]);

  const buildInput = (status: "draft" | "published"): CreateBlogPostInput => ({
    title: title.trim(),
    content,
    content_json: contentJson || undefined,
    excerpt: excerpt.trim() || undefined,
    category,
    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    featured_image_url: featuredImageUrl.trim() || undefined,
    allow_comments: allowComments,
    meta_title: metaTitle.trim() || undefined,
    meta_description: metaDescription.trim() || undefined,
    template,
    color_palette: colorPalette,
    status,
  });

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (status === "published" && !content.trim()) {
      toast.error("Content is required to publish");
      return;
    }

    try {
      await ensureAuthor();
      await createPost(buildInput(status));
      toast.success(status === "published" ? "Post published!" : "Draft saved!");
      router.push("/admin/blog");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  // Build a mock post object for preview
  const previewPost: BlogPost = {
    id: "preview",
    slug: "preview",
    title: title || "Untitled Post",
    content: content || "<p>Start writing to see the preview...</p>",
    excerpt: excerpt || null,
    featured_image_url: featuredImageUrl || null,
    category: category,
    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    template,
    color_palette: colorPalette,
    status: "draft",
    author_id: "",
    game_id: null,
    content_json: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    is_featured: false,
    is_pinned: false,
    allow_comments: allowComments,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    reviewed_by: null,
    reviewed_at: null,
    author: undefined,
    game: undefined,
  };

  // Preview modal
  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-surface border-b border-border">
          <h2 className="text-sm font-medium text-white/60">Preview — {BLOG_TEMPLATES[template]?.label} / {BLOG_COLOR_PALETTES[colorPalette]?.label}</h2>
          <div className="flex items-center gap-3">
            {/* Template & palette selectors in preview */}
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as BlogTemplate)}
              className="px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-xs text-white [&>option]:bg-zinc-900"
            >
              {Object.entries(BLOG_TEMPLATES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={colorPalette}
              onChange={(e) => setColorPalette(e.target.value as BlogColorPalette)}
              className="px-2 py-1.5 bg-zinc-900 border border-white/10 rounded text-xs text-white [&>option]:bg-zinc-900"
            >
              {Object.entries(BLOG_COLOR_PALETTES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowPreview(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Close Preview
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <BlogTemplateRenderer
            post={previewPost}
            template={template}
            colorPalette={colorPalette}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to posts
      </Link>

      {/* Main editor card */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Content
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            onJsonChange={setContentJson}
            placeholder="Write your post content..."
          />
        </div>

        {/* Category & Template row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BlogCategory)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              {Object.entries(BLOG_CATEGORIES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as BlogTemplate)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              {Object.entries(BLOG_TEMPLATES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              Color Palette
            </label>
            <select
              value={colorPalette}
              onChange={(e) => setColorPalette(e.target.value as BlogColorPalette)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white"
            >
              {Object.entries(BLOG_COLOR_PALETTES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., esports, valorant, tips"
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of the post..."
            rows={2}
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
          />
        </div>

        {/* Featured Image with Upload */}
        <FeaturedImageUpload
          value={featuredImageUrl}
          onChange={setFeaturedImageUrl}
        />

        {/* Allow Comments */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-sm text-white/60">Allow comments</span>
        </label>

        {/* SEO Settings */}
        <div className="border-t border-white/5 pt-4">
          <button
            onClick={() => setShowSeo(!showSeo)}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            {showSeo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            SEO Settings
          </button>
          {showSeo && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-white/30 mb-1">
                  Meta Title ({metaTitle.length}/70)
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value.slice(0, 70))}
                  placeholder="SEO title..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1">
                  Meta Description ({metaDescription.length}/160)
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                  placeholder="SEO description..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSave("draft")}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/[0.08] disabled:opacity-50 transition-colors"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Draft
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/[0.08] transition-colors"
        >
          <Eye className="h-4 w-4" />
          Preview
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
          Publish
        </button>
      </div>
    </div>
  );
}
