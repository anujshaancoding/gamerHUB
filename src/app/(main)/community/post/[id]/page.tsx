import type { Metadata } from "next";
import { createClient } from "@/lib/db/client";
import { JsonLd, BASE_URL, SITE_NAME, ORGANIZATION_JSONLD } from "@/lib/seo";
import { BLOG_CATEGORIES } from "@/types/blog";
import { CommunityPostPage } from "./community-post-client";

interface Props {
  params: Promise<{ id: string }>;
}

interface PostMeta {
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

async function getPost(id: string) {
  const db = createClient();
  const { data } = await db
    .from("blog_posts")
    .select(`
      title, slug, excerpt, content, featured_image_url, category, tags,
      meta_title, meta_description, published_at, updated_at,
      likes_count, comments_count,
      author:profiles!blog_posts_author_id_fkey(display_name, username)
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();
  return data ? (data as unknown as PostMeta) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: "Post not found | ggLobby",
      robots: { index: false, follow: false },
    };
  }

  const title = post.meta_title || post.title;
  const description =
    post.meta_description ||
    post.excerpt ||
    `Read ${post.title} by ${post.author?.display_name || "a gamer"} on ggLobby`;
  const imageUrl = post.featured_image_url;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ggLobby`,
      description,
      type: "article",
      url: `${BASE_URL}/community/post/${id}`,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: post.author ? [post.author.display_name] : undefined,
      tags: post.tags || undefined,
      ...(imageUrl
        ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }] }
        : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${title} | ggLobby`,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    alternates: {
      canonical: `${BASE_URL}/community/post/${id}`,
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

export default async function Page({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);

  const postUrl = `${BASE_URL}/community/post/${id}`;
  const categoryInfo = post?.category ? BLOG_CATEGORIES[post.category as keyof typeof BLOG_CATEGORIES] : null;

  return (
    <>
      {post && (
        <>
          <JsonLd
            data={{
              "@type": "BlogPosting",
              headline: post.title,
              description: post.excerpt || post.meta_description,
              image: post.featured_image_url
                ? { "@type": "ImageObject", url: post.featured_image_url, width: 1200, height: 630 }
                : undefined,
              datePublished: post.published_at,
              dateModified: post.updated_at,
              author: {
                "@type": "Person",
                name: post.author?.display_name,
                url: post.author?.username ? `${BASE_URL}/profile/${post.author.username}` : undefined,
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
                { "@type": "ListItem", position: 2, name: "Community", item: `${BASE_URL}/community` },
                { "@type": "ListItem", position: 3, name: "Blog", item: `${BASE_URL}/community?tab=blog` },
                { "@type": "ListItem", position: 4, name: post.title, item: postUrl },
              ],
            }}
          />
        </>
      )}
      <CommunityPostPage />
    </>
  );
}
