"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Palette,
  LayoutTemplate,
  MessageSquare,
} from "lucide-react";
import { PremiumFeatureGate } from "@/components/premium/PremiumFeatureGate";
import { RichTextEditor } from "@/components/blog/rich-text-editor";
import { BlogEditorTutorial } from "@/components/blog/blog-editor-tutorial";
import { BlogCreationWizard } from "@/components/blog/blog-creation-wizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateBlogPost,
  useUpdateBlogPost,
  useBlogPost,
} from "@/lib/hooks/useBlog";
import { useBlogAuthor } from "@/lib/hooks/useBlogAuthor";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  BLOG_CATEGORIES,
  BLOG_TEMPLATES,
  BLOG_COLOR_PALETTES,
  type BlogCategory,
  type BlogTemplate,
  type BlogColorPalette,
  type CreateBlogPostInput,
} from "@/types/blog";

function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");

  const { ensureAuthor, isAuthor, isRegistering, author } = useBlogAuthor();
  const { can: permissions } = usePermissions();
  const { createPost, isCreating } = useCreateBlogPost();
  const { updatePost, isUpdating } = useUpdateBlogPost();
  const { post: existingPost, loading: loadingPost } = useBlogPost(
    editSlug || ""
  );

  const [showTutorial, setShowTutorial] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  // Template & palette state
  const [template, setTemplate] = useState<BlogTemplate>("classic");
  const [colorPalette, setColorPalette] = useState<BlogColorPalette>("neon_surge");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentJson, setContentJson] = useState<Record<string, unknown> | null>(null);
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<BlogCategory>("opinion");
  const [tags, setTags] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Auto-register as author on mount
  useEffect(() => {
    if (!isAuthor && !isRegistering) {
      ensureAuthor().catch(() => {
        // Silent — will be caught by the author check below
      });
    }
  }, [isAuthor, isRegistering, ensureAuthor]);

  // Populate form when editing an existing post
  useEffect(() => {
    if (editSlug && existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setExcerpt(existingPost.excerpt || "");
      setCategory(existingPost.category);
      setTags(existingPost.tags?.join(", ") || "");
      setFeaturedImageUrl(existingPost.featured_image_url || "");
      setAllowComments(existingPost.allow_comments);
      setMetaTitle(existingPost.meta_title || "");
      setMetaDescription(existingPost.meta_description || "");
      setTemplate(existingPost.template || "classic");
      setColorPalette(existingPost.color_palette || "neon_surge");
    }
  }, [editSlug, existingPost]);

  const handleWizardComplete = (t: BlogTemplate, p: BlogColorPalette) => {
    setTemplate(t);
    setColorPalette(p);
  };

  const buildInput = (
    status: "draft" | "published"
  ): CreateBlogPostInput => ({
    title: title.trim(),
    content,
    content_json: contentJson || undefined,
    excerpt: excerpt.trim() || undefined,
    category,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    featured_image_url: featuredImageUrl.trim() || undefined,
    allow_comments: allowComments,
    meta_title: metaTitle.trim() || undefined,
    meta_description: metaDescription.trim() || undefined,
    template,
    color_palette: colorPalette,
    status,
  });

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error("Please add a title before saving.");
      return;
    }

    try {
      if (editSlug) {
        await updatePost({ slug: editSlug, updates: buildInput("draft") });
        toast.success("Draft updated!");
      } else {
        const post = await createPost(buildInput("draft"));
        toast.success("Draft saved!");
        router.replace(`/write?edit=${post.slug}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save draft."
      );
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required to publish.");
      return;
    }

    try {
      const status = "published";

      if (editSlug) {
        await updatePost({
          slug: editSlug,
          updates: buildInput(status),
        });
        toast.success("Post published!");
        router.push("/community");
      } else {
        await createPost(buildInput(status));
        toast.success("Post published!");
        router.push("/community");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to publish."
      );
    }
  };

  if (editSlug && loadingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedTemplateInfo = BLOG_TEMPLATES[template];
  const selectedPaletteInfo = BLOG_COLOR_PALETTES[colorPalette];

  const editorContent = (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {editSlug ? "Edit Post" : "Write a New Post"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Share your gaming knowledge, guides, and insights with the community.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowTutorial(true)}
          title="How to write a post"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Selected template & palette indicator */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-surface-light rounded-lg border border-border">
        <div className="flex items-center gap-2 text-sm">
          <LayoutTemplate className="w-4 h-4 text-primary" />
          <span className="text-text-muted">Template:</span>
          <span className="font-medium text-text">{selectedTemplateInfo.label}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-text-muted">Palette:</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: selectedPaletteInfo.primaryHex }}
            />
            <span className="font-medium text-text">{selectedPaletteInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Editor Notes Banner */}
      {editSlug && existingPost && (existingPost as Record<string, unknown>).editor_notes && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-400 mb-1">Editor Suggestions</p>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {(existingPost as Record<string, unknown>).editor_notes as string}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <Input
          label="Title"
          placeholder="Your post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Rich text editor */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text mb-2">
          Content
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          onJsonChange={setContentJson}
          placeholder="Start writing your post..."
        />
      </div>

      {/* Category + Tags row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BlogCategory)}
            className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Object.entries(BLOG_CATEGORIES)
              .filter(([key]) => key !== "news" || permissions.useNewsCategory)
              .map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Input
            label="Tags"
            placeholder="fps, strategy, tips (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      {/* Excerpt */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text mb-2">
          Excerpt
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="A short summary for the blog listing..."
          rows={2}
          className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-text text-sm placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Featured image */}
      <div className="mb-4">
        <Input
          label="Featured Image URL"
          placeholder="https://example.com/image.jpg"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
        />
        {featuredImageUrl && (
          <div className="mt-2 relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-border">
            <img
              src={featuredImageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Allow comments toggle */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          role="switch"
          aria-checked={allowComments}
          onClick={() => setAllowComments(!allowComments)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            allowComments ? "bg-primary" : "bg-surface-lighter"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              allowComments ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-text">Allow comments</span>
      </div>

      {/* SEO collapsible */}
      <div className="mb-6 border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-muted hover:text-text bg-surface-light transition-colors"
        >
          <span>SEO Settings (optional)</span>
          {showSeo ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {showSeo && (
          <div className="p-4 space-y-4 border-t border-border">
            <Input
              label="Meta Title"
              placeholder="Custom page title for search engines..."
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Meta Description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Short description for search results (150-160 chars recommended)..."
                rows={2}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-text text-sm placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pb-8">
        <Button
          variant="secondary"
          onClick={handleSaveDraft}
          disabled={isCreating || isUpdating}
          isLoading={isCreating || isUpdating}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
        <Button
          variant="primary"
          onClick={handlePublish}
          disabled={isCreating || isUpdating || !title.trim() || !content.trim()}
          isLoading={isCreating || isUpdating}
        >
          <Send className="w-4 h-4 mr-2" />
          Publish
        </Button>
        {editSlug && (
          <Button
            variant="ghost"
            onClick={() => router.push(`/blog/${editSlug}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Post
          </Button>
        )}
      </div>

      {/* Tutorial modal */}
      <BlogEditorTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );

  return (
    <BlogCreationWizard
      initialTemplate={template}
      initialPalette={colorPalette}
      onComplete={handleWizardComplete}
      skipWizard={!!editSlug}
    >
      {editorContent}
    </BlogCreationWizard>
  );
}

export default function WritePageWrapper() {
  return (
    <PremiumFeatureGate featureName="Blog creation">
      <WritePage />
    </PremiumFeatureGate>
  );
}
