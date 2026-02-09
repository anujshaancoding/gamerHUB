import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Clock,
  Calendar,
  Gamepad2,
  ArrowLeft,
  User,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getBlogPostBySlug, getAllPublishedSlugs } from "@/lib/data/blog";
import { BLOG_CATEGORIES, AUTHOR_ROLES } from "@/types/blog";
import type { BlogPost } from "@/types/blog";
import { BlogPostActions } from "./blog-post-actions";
import { BlogComments } from "@/components/blog/blog-comments";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

// Pre-render all published posts at build time
export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

// Dynamic metadata per post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const title = post.meta_title || post.title;
  const description =
    post.meta_description ||
    post.excerpt ||
    `Read "${post.title}" on GamerHub Blog`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: post.author
        ? [post.author.display_name || post.author.username]
        : undefined,
      images: post.featured_image_url
        ? [
            {
              url: post.featured_image_url,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.featured_image_url
        ? [post.featured_image_url]
        : undefined,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

// JSON-LD structured data for search engines
function JsonLd({ post }: { post: BlogPost }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image_url,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author?.display_name || post.author?.username,
    },
    publisher: {
      "@type": "Organization",
      name: "GamerHub",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blog/${post.slug}`,
    },
    articleSection: post.category,
    keywords: post.tags?.join(", "),
    wordCount: post.content?.split(/\s+/).length,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: post.likes_count,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: post.comments_count,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Simple server-side markdown renderer
function renderMarkdown(content: string) {
  return content.split("\n\n").map((paragraph, index) => {
    // Headers
    if (paragraph.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="text-xl font-bold text-text mt-8 mb-4"
        >
          {paragraph.replace("## ", "")}
        </h2>
      );
    }
    if (paragraph.startsWith("### ")) {
      return (
        <h3
          key={index}
          className="text-lg font-semibold text-text mt-6 mb-3"
        >
          {paragraph.replace("### ", "")}
        </h3>
      );
    }

    // Bold text processing
    const processBold = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    // Unordered lists
    if (paragraph.includes("\n- ") || paragraph.startsWith("- ")) {
      const items = paragraph
        .split("\n")
        .filter((item) => item.startsWith("- "));
      return (
        <ul
          key={index}
          className="list-disc list-inside space-y-2 mb-4 text-text-secondary"
        >
          {items.map((item, i) => (
            <li key={i}>{processBold(item.replace("- ", ""))}</li>
          ))}
        </ul>
      );
    }

    // Numbered lists
    if (/^\d+\.\s/.test(paragraph)) {
      const items = paragraph
        .split("\n")
        .filter((item) => /^\d+\.\s/.test(item));
      return (
        <ol
          key={index}
          className="list-decimal list-inside space-y-2 mb-4 text-text-secondary"
        >
          {items.map((item, i) => (
            <li key={i}>{processBold(item.replace(/^\d+\.\s/, ""))}</li>
          ))}
        </ol>
      );
    }

    // Italic text
    if (
      paragraph.startsWith("*") &&
      paragraph.endsWith("*") &&
      !paragraph.startsWith("**")
    ) {
      return (
        <p key={index} className="text-text-muted italic mb-4">
          {paragraph.slice(1, -1)}
        </p>
      );
    }

    // Regular paragraph
    return (
      <p key={index} className="text-text-secondary leading-relaxed mb-4">
        {processBold(paragraph)}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const categoryInfo = BLOG_CATEGORIES[post.category];
  const authorRole = post.author?.blog_author?.role;
  const authorRoleInfo = authorRole ? AUTHOR_ROLES[authorRole] : null;

  const categoryColors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    red: "text-red-400 bg-red-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    pink: "text-pink-400 bg-pink-500/10",
  };

  const getCategoryStyle = () => {
    const color = categoryInfo?.color || "blue";
    return categoryColors[color] || categoryColors.blue;
  };

  return (
    <article className="max-w-4xl mx-auto">
      {/* JSON-LD structured data */}
      <JsonLd post={post} />

      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Cover image */}
      {post.featured_image_url && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
          />
          {/* Game + category overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            {post.game && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-sm text-white font-medium">
                {post.game.icon_url ? (
                  <img
                    src={post.game.icon_url}
                    alt={post.game.name}
                    className="w-4 h-4 rounded"
                  />
                ) : (
                  <Gamepad2 className="w-4 h-4" />
                )}
                {post.game.name}
              </span>
            )}
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getCategoryStyle()}`}
            >
              {categoryInfo?.label || post.category}
            </span>
          </div>
        </div>
      )}

      {/* Title & meta */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-text-muted mb-6">{post.excerpt}</p>
        )}

        {/* Author + stats bar */}
        <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-border">
          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={
                    post.author.display_name ||
                    post.author.username ||
                    "Author"
                  }
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center">
                  <User className="w-5 h-5 text-text-muted" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text">
                {post.author?.display_name || post.author?.username}
              </p>
              {authorRoleInfo && (
                <p className="text-xs text-text-muted">
                  {authorRoleInfo.label}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-text-muted ml-auto">
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at), "MMM d, yyyy")}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {Math.ceil(post.content.split(/\s+/).length / 200)} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {post.views_count > 999
                ? `${(post.views_count / 1000).toFixed(1)}k`
                : post.views_count}{" "}
              views
            </span>
          </div>
        </div>
      </header>

      {/* Article content */}
      {post.content.trimStart().startsWith("<") ? (
        <div
          className="prose prose-invert prose-lg max-w-none mb-8
            prose-headings:text-text prose-p:text-text-secondary
            prose-a:text-primary prose-strong:text-text
            prose-ul:text-text-secondary prose-ol:text-text-secondary
            prose-blockquote:border-primary/50 prose-blockquote:text-text-muted
            prose-code:text-primary prose-pre:bg-surface-light"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      ) : (
        <div className="mb-8">{renderMarkdown(post.content)}</div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-6 mb-6 border-b border-border">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${tag}`}
              className="text-sm text-text-muted bg-surface-light px-3 py-1 rounded-full hover:bg-surface-lighter hover:text-primary transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Interactive actions (client component) */}
      <BlogPostActions
        slug={slug}
        title={post.title}
        likesCount={post.likes_count}
        commentsCount={post.comments_count}
      />

      {/* Comments section */}
      {post.allow_comments && (
        <section className="mt-8 pt-8 border-t border-border">
          <BlogComments postSlug={slug} />
        </section>
      )}
    </article>
  );
}
