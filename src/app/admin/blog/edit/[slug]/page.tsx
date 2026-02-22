"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
} from "lucide-react";
import { RichTextEditor } from "@/components/blog/rich-text-editor";
import { useBlogPost, useUpdateBlogPost } from "@/lib/hooks/useBlog";
import {
  BLOG_CATEGORIES,
  BLOG_TEMPLATES,
  BLOG_COLOR_PALETTES,
  type BlogCategory,
  type BlogTemplate,
  type BlogColorPalette,
  type BlogStatus,
} from "@/types/blog";

export default function AdminEditBlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { post, loading: loadingPost } = useBlogPost(slug);
  const { updatePost, isUpdating } = useUpdateBlogPost();

  const [showSeo, setShowSeo] = useState(false);
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
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setExcerpt(post.excerpt || "");
      setCategory(post.category);
      setTags(post.tags?.join(", ") || "");
      setFeaturedImageUrl(post.featured_image_url || "");
      setAllowComments(post.allow_comments);
      setMetaTitle(post.meta_title || "");
      setMetaDescription(post.meta_description || "");
      setTemplate(post.template || "classic");
      setColorPalette(post.color_palette || "neon_surge");
      setStatus(post.status);
      setIsFeatured(post.is_featured);
      setIsPinned(post.is_pinned);
    }
  }, [post]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      await updatePost({
        slug,
        updates: {
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
          is_featured: isFeatured,
          is_pinned: isPinned,
        },
      });
      toast.success("Post updated!");
      router.push("/admin/blog");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  if (loadingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40">Post not found</p>
        <Link href="/admin/blog" className="text-violet-400 text-sm mt-2 inline-block">
          Back to posts
        </Link>
      </div>
    );
  }

  const author = post.author as { username?: string; display_name?: string } | undefined;

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to posts
      </Link>

      {/* Post metadata */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-wrap items-center gap-4 text-xs text-white/40">
        <span>
          Author: <strong className="text-white/60">{author?.display_name || author?.username || "Unknown"}</strong>
        </span>
        <span>
          Created: {new Date(post.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views_count}</span>
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes_count}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments_count}</span>
        </div>
      </div>

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

        {/* Status & Admin toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BlogStatus)}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer self-end pb-1">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-yellow-500 focus:ring-yellow-500/50"
            />
            <span className="text-sm text-white/60">Featured</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer self-end pb-1">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
            />
            <span className="text-sm text-white/60">Pinned</span>
          </label>
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
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
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
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
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
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
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
            placeholder="Brief summary..."
            rows={2}
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 resize-none"
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
            Featured Image URL
          </label>
          <input
            type="url"
            value={featuredImageUrl}
            onChange={(e) => setFeaturedImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
          />
          {featuredImageUrl && (
            <img
              src={featuredImageUrl}
              alt="Preview"
              className="mt-2 h-32 w-auto rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

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
          onClick={handleSave}
          disabled={isUpdating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
        <button
          onClick={() => window.open(`/blog/${slug}`, "_blank")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/[0.08] transition-colors"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>
    </div>
  );
}
