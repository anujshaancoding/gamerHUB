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
import type { BlogPost, BlogTemplate, BlogColorPalette } from "@/types/blog";
import { BlogPostActions } from "./blog-post-actions";
import { BlogComments } from "@/components/blog/blog-comments";
import { BlogTemplateRenderer } from "@/components/blog/blog-template-renderer";
import { JsonLd, BASE_URL, ORGANIZATION_JSONLD } from "@/lib/seo";

// On-demand ISR: revalidated via revalidatePath() in PATCH/DELETE handlers
// Falls back to 1 hour max-stale for safety
export const revalidate = 3600;

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
    `Read "${post.title}" on ggLobby`;

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

// Enhanced JSON-LD structured data for search engines
function BlogPostJsonLd({ post }: { post: BlogPost }) {
  const postUrl = `${BASE_URL}/blog/${post.slug}`;
  const categoryInfo = BLOG_CATEGORIES[post.category];

  const blogPosting = {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.meta_description,
    image: post.featured_image_url
      ? {
          "@type": "ImageObject",
          url: post.featured_image_url,
          width: 1200,
          height: 630,
        }
      : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author?.display_name || post.author?.username,
      url: post.author?.username
        ? `${BASE_URL}/profile/${post.author.username}`
        : undefined,
    },
    publisher: ORGANIZATION_JSONLD,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    articleSection: categoryInfo?.label || post.category,
    keywords: post.tags?.join(", "),
    wordCount: post.content?.split(/\s+/).length,
    inLanguage: "en",
    isAccessibleForFree: true,
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

  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${BASE_URL}/blog`,
      },
      ...(post.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: categoryInfo?.label || post.category,
              item: `${BASE_URL}/blog?category=${post.category}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: post.category ? 4 : 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={blogPosting} />
      <JsonLd data={breadcrumb} />
    </>
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

  const postTemplate = (post.template || "classic") as BlogTemplate;
  const postPalette = (post.color_palette || "neon_surge") as BlogColorPalette;

  return (
    <div className="max-w-5xl mx-auto">
      {/* JSON-LD structured data */}
      <BlogPostJsonLd post={post} />

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

      {/* Template-rendered content */}
      <BlogTemplateRenderer
        post={post}
        template={postTemplate}
        colorPalette={postPalette}
      />

      {/* Interactive actions (client component) */}
      <div className="max-w-4xl mx-auto mt-8">
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
      </div>
    </div>
  );
}
