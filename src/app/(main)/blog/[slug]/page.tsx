import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { JsonLd, BASE_URL, SITE_NAME, ORGANIZATION_JSONLD } from "@/lib/features/seo";
import { BLOG_CATEGORIES } from "@/types/blog";
import { CommunityPostPage } from "@/app/(main)/community/post/[id]/community-post-client";

interface Props {
  params: Promise<{ slug: string }>;
}

interface PostMeta {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  category: string;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  author: { display_name: string; username: string } | null;
}

export const revalidate = 3600;

async function getPost(slug: string) {
  const db = createClient();
  const { data } = await db
    .from("blog_posts")
    .select(`
      *,
      author:profiles!blog_posts_author_id_fkey(
        id, username, display_name, avatar_url, bio,
        gaming_style, region, is_verified, social_links
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data ? (data as unknown as PostMeta & Record<string, unknown>) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post not found",
      robots: { index: false, follow: false },
    };
  }

  const title = post.meta_title || post.title;
  const description =
    post.meta_description ||
    post.excerpt ||
    `Read ${post.title} by ${post.author?.display_name || "a gamer"} on ${SITE_NAME}`;
  const ogImageUrl = `${BASE_URL}/api/og/blog/${slug}`;
  const fallbackImage = post.featured_image_url;
  const canonical = `${BASE_URL}/blog/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: post.author ? [post.author.display_name] : undefined,
      tags: post.tags || undefined,
      images: [
        { url: ogImageUrl, width: 1200, height: 630, alt: post.title },
        ...(fallbackImage
          ? [{ url: fallbackImage, width: 1200, height: 630, alt: post.title }]
          : []),
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical,
    },
    keywords: post.tags || undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

export default async function BlogSlugPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const postUrl = `${BASE_URL}/blog/${slug}`;
  const categoryInfo = post.category
    ? BLOG_CATEGORIES[post.category as keyof typeof BLOG_CATEGORIES]
    : null;
  const ogImageUrl = `${BASE_URL}/api/og/blog/${slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt || post.meta_description,
          image: {
            "@type": "ImageObject",
            url: post.featured_image_url || ogImageUrl,
            width: 1200,
            height: 630,
          },
          datePublished: post.published_at,
          dateModified: post.updated_at,
          author: {
            "@type": "Person",
            name: post.author?.display_name,
            url: post.author?.username
              ? `${BASE_URL}/profile/${post.author.username}`
              : undefined,
          },
          publisher: ORGANIZATION_JSONLD,
          mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
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
        }}
      />
      <JsonLd
        data={{
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: `${BASE_URL}/blog`,
            },
            { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
          ],
        }}
      />
      <CommunityPostPage initialPost={post as never} />
    </>
  );
}
