"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Eye, User, Gamepad2, Tag, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BLOG_COLOR_PALETTES,
  BLOG_CATEGORIES,
  type BlogTemplate,
  type BlogColorPalette,
  type BlogPost,
} from "@/types/blog";
import { formatDistanceToNow } from "date-fns";

interface BlogTemplateRendererProps {
  post: BlogPost;
  template: BlogTemplate;
  colorPalette: BlogColorPalette;
}

function getPaletteStyles(paletteId: BlogColorPalette) {
  const p = BLOG_COLOR_PALETTES[paletteId];
  return {
    "--blog-primary": p.primaryHex,
    "--blog-secondary": p.secondaryHex,
    "--blog-bg": p.backgroundHex,
  } as React.CSSProperties;
}

/* ============ COLLAPSIBLE HELPERS ============ */

const EXCERPT_CLAMP = 3; // lines
const CONTENT_COLLAPSED_HEIGHT = 500; // px

/** Excerpt with line-clamp + "Read more" toggle (pure CSS, no layout shift) */
function CollapsibleExcerpt({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Compare scrollHeight (full) vs clientHeight (clamped)
    setNeedsClamp(el.scrollHeight > el.clientHeight + 2);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`whitespace-pre-line ${expanded ? "" : "line-clamp-3"} ${className ?? ""}`}
        style={style}
      >
        {text}
      </p>
      {needsClamp && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
          style={{ color: "var(--blog-primary)" }}
        >
          Read more...
        </button>
      )}
    </div>
  );
}

/** Blog HTML content with max-height collapse + gradient fade */
function CollapsibleContent({
  html,
  className,
  style,
}: {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setNeedsCollapse(el.scrollHeight > CONTENT_COLLAPSED_HEIGHT + 100);
  }, [html]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={className}
        style={{
          ...style,
          ...(needsCollapse && !expanded
            ? { maxHeight: CONTENT_COLLAPSED_HEIGHT, overflow: "hidden" }
            : {}),
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {needsCollapse && !expanded && (
        <>
          {/* Gradient fade */}
          <div
            className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
            style={{
              background: "linear-gradient(to top, var(--blog-bg, var(--background)), transparent)",
            }}
          />
          <div className="flex justify-center pt-2 relative z-10 -mt-6">
            <button
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: "color-mix(in srgb, var(--blog-primary) 15%, transparent)",
                color: "var(--blog-primary)",
                border: "1px solid color-mix(in srgb, var(--blog-primary) 30%, transparent)",
              }}
            >
              <ChevronDown className="w-4 h-4" />
              Read full article
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PostMeta({ post }: { post: BlogPost }) {
  const categoryInfo = BLOG_CATEGORIES[post.category];
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--blog-secondary)" }}>
      {post.author && (
        <div className="flex items-center gap-2">
          <Avatar
            src={post.author.avatar_url}
            alt={post.author.display_name || post.author.username || "Author"}
            size="sm"
          />
          <span className="font-medium text-white">
            {post.author.display_name || post.author.username}
          </span>
        </div>
      )}
      {post.published_at && (
        <span className="flex items-center gap-1 opacity-70">
          <Calendar className="w-3.5 h-3.5" />
          {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
        </span>
      )}
      <span className="flex items-center gap-1 opacity-70">
        <Eye className="w-3.5 h-3.5" />
        {post.views_count} views
      </span>
      <span className="flex items-center gap-1 opacity-70">
        <Clock className="w-3.5 h-3.5" />
        {Math.ceil((post.content?.split(/\s+/).length || 0) / 200)} min read
      </span>
      {categoryInfo && (
        <Badge variant="outline" className="text-xs" style={{ borderColor: "var(--blog-primary)", color: "var(--blog-primary)" }}>
          {categoryInfo.label}
        </Badge>
      )}
    </div>
  );
}

function PostTags({ post }: { post: BlogPost }) {
  if (!post.tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {post.tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "color-mix(in srgb, var(--blog-primary) 15%, transparent)",
            color: "var(--blog-primary)",
          }}
        >
          <Tag className="w-3 h-3" />
          {tag}
        </span>
      ))}
    </div>
  );
}

function GameBadge({ post }: { post: BlogPost }) {
  if (!post.game) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: "color-mix(in srgb, var(--blog-secondary) 20%, transparent)",
        color: "var(--blog-secondary)",
      }}
    >
      {post.game.icon_url ? (
        <img src={post.game.icon_url} alt={post.game.name} className="w-4 h-4 rounded" />
      ) : (
        <Gamepad2 className="w-3.5 h-3.5" />
      )}
      {post.game.name}
    </span>
  );
}

/* ============ CLASSIC EDITORIAL ============ */
function ClassicTemplate({ post }: { post: BlogPost }) {
  return (
    <article className="max-w-3xl mx-auto">
      {/* Hero image */}
      {post.featured_image_url && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
          <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <GameBadge post={post} />
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight" style={{ color: "var(--blog-primary)" }}>
        {post.title}
      </h1>

      {/* Meta */}
      <div className="mb-8 pb-6 border-b" style={{ borderColor: "color-mix(in srgb, var(--blog-primary) 20%, transparent)" }}>
        <PostMeta post={post} />
      </div>

      {/* Excerpt */}
      {post.excerpt && (
        <CollapsibleExcerpt
          text={post.excerpt}
          className="text-lg mb-8 leading-relaxed font-medium"
          style={{ color: "var(--blog-secondary)" }}
        />
      )}

      {/* Content */}
      <CollapsibleContent
        html={post.content}
        className="prose prose-invert prose-lg max-w-none
          prose-headings:font-bold prose-a:underline
          prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic"
        style={{
          "--tw-prose-headings": "var(--blog-primary)",
          "--tw-prose-links": "var(--blog-primary)",
          "--tw-prose-quotes": "var(--blog-secondary)",
          "--tw-prose-quote-borders": "var(--blog-primary)",
        } as React.CSSProperties}
      />

      <PostTags post={post} />
    </article>
  );
}

/* ============ MAGAZINE SPREAD ============ */
function MagazineTemplate({ post }: { post: BlogPost }) {
  return (
    <article>
      {/* Full-width hero with overlaid title */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-10">
        <div className="aspect-[21/9] min-h-[300px] max-h-[500px] overflow-hidden">
          <img
            src={post.featured_image_url || "/images/defaults/post.svg"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <GameBadge post={post} />
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight" style={{ color: "var(--blog-primary)" }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <CollapsibleExcerpt
                text={post.excerpt}
                className="text-lg text-white/80 max-w-2xl"
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <PostMeta post={post} />

        {/* Content with pull quote styling */}
        <CollapsibleContent
          html={post.content}
          className="mt-8 prose prose-invert prose-lg max-w-none
            prose-headings:font-black
            prose-blockquote:text-xl prose-blockquote:font-semibold prose-blockquote:border-l-4 prose-blockquote:pl-6
            prose-blockquote:my-8"
          style={{
            "--tw-prose-headings": "var(--blog-primary)",
            "--tw-prose-links": "var(--blog-primary)",
            "--tw-prose-quote-borders": "var(--blog-secondary)",
            "--tw-prose-quotes": "var(--blog-secondary)",
          } as React.CSSProperties}
        />

        <PostTags post={post} />
      </div>
    </article>
  );
}

/* ============ CYBERPUNK ============ */
function CyberpunkTemplate({ post }: { post: BlogPost }) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Scanline header */}
      <div
        className="relative rounded-xl overflow-hidden mb-8 border-2"
        style={{ borderColor: "var(--blog-primary)" }}
      >
        {post.featured_image_url && (
          <div className="relative aspect-video">
            <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, var(--blog-bg), transparent 60%)`,
              }}
            />
          </div>
        )}

        <div className="p-6 sm:p-8" style={{ backgroundColor: "var(--blog-bg)" }}>
          {/* Glitch-style title */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1" style={{ backgroundColor: "var(--blog-primary)" }} />
            <GameBadge post={post} />
            <div className="h-px flex-1" style={{ backgroundColor: "var(--blog-primary)" }} />
          </div>

          <h1
            className="text-3xl sm:text-5xl font-black mb-4 uppercase tracking-wider text-center"
            style={{
              color: "var(--blog-primary)",
              textShadow: "0 0 20px var(--blog-primary), 0 0 40px color-mix(in srgb, var(--blog-primary) 50%, transparent)",
            }}
          >
            {post.title}
          </h1>

          <div className="h-px mb-4" style={{ backgroundColor: "var(--blog-primary)" }} />

          {post.excerpt && (
            <CollapsibleExcerpt
              text={`> ${post.excerpt}`}
              className="text-center font-mono text-sm mb-4"
              style={{ color: "var(--blog-secondary)" }}
            />
          )}
        </div>
      </div>

      <PostMeta post={post} />

      {/* Content with neon-bordered sections */}
      <CollapsibleContent
        html={post.content}
        className="mt-8 prose prose-invert max-w-none
          prose-headings:uppercase prose-headings:tracking-wider prose-headings:font-black
          prose-pre:font-mono prose-pre:border
          prose-blockquote:border-l-4 prose-blockquote:font-mono"
        style={{
          "--tw-prose-headings": "var(--blog-primary)",
          "--tw-prose-links": "var(--blog-secondary)",
          "--tw-prose-code": "var(--blog-primary)",
          "--tw-prose-pre-bg": "color-mix(in srgb, var(--blog-primary) 5%, var(--blog-bg))",
          "--tw-prose-pre-border": "var(--blog-primary)",
          "--tw-prose-quote-borders": "var(--blog-primary)",
        } as React.CSSProperties}
      />

      <PostTags post={post} />
    </article>
  );
}

/* ============ MINIMAL FOCUS ============ */
function MinimalTemplate({ post }: { post: BlogPost }) {
  return (
    <article className="max-w-2xl mx-auto py-8">
      {/* Clean title */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-snug text-white">
        {post.title}
      </h1>

      {post.excerpt && (
        <CollapsibleExcerpt
          text={post.excerpt}
          className="text-lg mb-6 leading-relaxed"
          style={{ color: "var(--blog-secondary)" }}
        />
      )}

      <div className="mb-8 pb-6 border-b border-border">
        <PostMeta post={post} />
      </div>

      {/* Hero image - simple */}
      {post.featured_image_url && (
        <div className="rounded-lg overflow-hidden mb-10">
          <img src={post.featured_image_url} alt={post.title} className="w-full" />
        </div>
      )}

      {/* Clean content */}
      <CollapsibleContent
        html={post.content}
        className="prose prose-invert prose-lg max-w-none
          prose-headings:font-semibold
          prose-p:leading-relaxed prose-p:text-text-secondary
          prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:text-text-muted"
        style={{
          "--tw-prose-headings": "white",
          "--tw-prose-links": "var(--blog-primary)",
          "--tw-prose-quote-borders": "var(--blog-primary)",
        } as React.CSSProperties}
      />

      <PostTags post={post} />
    </article>
  );
}

/* ============ CARD GRID ============ */
function CardGridTemplate({ post }: { post: BlogPost }) {
  return (
    <article className="max-w-4xl mx-auto">
      {/* Header card */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-6 border"
        style={{
          borderColor: "color-mix(in srgb, var(--blog-primary) 30%, transparent)",
          background: `linear-gradient(135deg, color-mix(in srgb, var(--blog-primary) 5%, var(--blog-bg)), var(--blog-bg))`,
        }}
      >
        {post.featured_image_url && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6">
            <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <GameBadge post={post} />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--blog-primary)" }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <CollapsibleExcerpt
            text={post.excerpt}
            className="text-lg mb-4"
            style={{ color: "var(--blog-secondary)" }}
          />
        )}

        <PostMeta post={post} />
      </div>

      {/* Content in card sections */}
      <div
        className="rounded-2xl p-6 sm:p-8 border"
        style={{
          borderColor: "color-mix(in srgb, var(--blog-primary) 15%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--blog-primary) 2%, var(--blog-bg))",
        }}
      >
        <CollapsibleContent
          html={post.content}
          className="prose prose-invert prose-lg max-w-none
            prose-headings:font-bold
            prose-blockquote:border-l-4 prose-blockquote:pl-4
            prose-hr:my-8 prose-hr:border-border"
          style={{
            "--tw-prose-headings": "var(--blog-primary)",
            "--tw-prose-links": "var(--blog-secondary)",
            "--tw-prose-quote-borders": "var(--blog-primary)",
          } as React.CSSProperties}
        />
      </div>

      <PostTags post={post} />
    </article>
  );
}

/* ============ GAMING STREAM ============ */
function GamingStreamTemplate({ post }: { post: BlogPost }) {
  return (
    <article className="max-w-5xl mx-auto">
      {/* Stream-style header */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <div className="aspect-video">
          <img
            src={post.featured_image_url || "/images/defaults/post.svg"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay controls aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* Live-style badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span
            className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--blog-primary)",
              color: "var(--blog-bg)",
            }}
          >
            Article
          </span>
          <GameBadge post={post} />
        </div>

        {/* Bottom overlay info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-2xl sm:text-4xl font-black mb-2" style={{ color: "var(--blog-primary)" }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <CollapsibleExcerpt
              text={post.excerpt}
              className="text-white/80 text-sm sm:text-base max-w-3xl"
            />
          )}
        </div>
      </div>

      {/* Stream-style info bar */}
      <div
        className="flex items-center gap-4 rounded-xl px-4 py-3 mb-6 border"
        style={{
          borderColor: "color-mix(in srgb, var(--blog-primary) 30%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--blog-primary) 5%, transparent)",
        }}
      >
        <PostMeta post={post} />
      </div>

      {/* Content */}
      <CollapsibleContent
        html={post.content}
        className="prose prose-invert prose-lg max-w-none
          prose-headings:font-black
          prose-img:rounded-xl
          prose-blockquote:border-l-4 prose-blockquote:pl-4"
        style={{
          "--tw-prose-headings": "var(--blog-primary)",
          "--tw-prose-links": "var(--blog-secondary)",
          "--tw-prose-quote-borders": "var(--blog-primary)",
        } as React.CSSProperties}
      />

      <PostTags post={post} />
    </article>
  );
}

/* ============ MAIN RENDERER ============ */
const TEMPLATE_COMPONENTS: Record<BlogTemplate, React.ComponentType<{ post: BlogPost }>> = {
  classic: ClassicTemplate,
  magazine: MagazineTemplate,
  cyberpunk: CyberpunkTemplate,
  minimal: MinimalTemplate,
  card_grid: CardGridTemplate,
  gaming_stream: GamingStreamTemplate,
};

export function BlogTemplateRenderer({ post, template, colorPalette }: BlogTemplateRendererProps) {
  const TemplateComponent = TEMPLATE_COMPONENTS[template] || ClassicTemplate;
  const paletteStyles = getPaletteStyles(colorPalette);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={paletteStyles}
    >
      <TemplateComponent post={post} />
    </motion.div>
  );
}
