import type { Metadata } from "next";
import { createClient } from "@/lib/db/client";
import { BASE_URL } from "@/lib/features/seo/constants";
import {
  BlogListingPage,
  type BlogListingPost,
} from "@/components/content/blog/blog-listing-page";

export const metadata: Metadata = {
  title: "Gaming Blog — Guides, News & Updates",
  description:
    "Read the latest Valorant guides, news, patch notes, and analysis on ggLobby.",
  openGraph: {
    title: "Gaming Blog — Guides, News & Updates | ggLobby",
    description:
      "Read the latest Valorant guides, news, patch notes, and analysis on ggLobby.",
    type: "website",
    url: `${BASE_URL}/blog`,
    siteName: "ggLobby",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gaming Blog — Guides, News & Updates | ggLobby",
    description:
      "Read the latest Valorant guides, news, patch notes, and analysis on ggLobby.",
  },
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": [
        { url: "/blog/rss.xml", title: "ggLobby Gaming Blog RSS Feed" },
      ],
    },
  },
};

// Serve cached HTML and refresh in the background. Previously this page was
// rendered dynamically against the DB on every request (slow TTFB); blog posts
// are admin-published and change infrequently, so ISR is a better fit.
export const revalidate = 300;

async function getBlogPosts(): Promise<BlogListingPost[]> {
  try {
    const db = createClient();
    const { data: posts, error } = await db
      .from("blog_posts")
      .select(
        `
        id, title, slug, excerpt, featured_image_url, category, tags,
        published_at, views_count, likes_count, comments_count,
        created_at,
        author:profiles!blog_posts_author_id_fkey(id, username, display_name, avatar_url)
      `
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(30);

    if (error || !posts) return [];

    return (posts as Record<string, unknown>[]).map(
      (post): BlogListingPost => ({
        id: post.id as string,
        title: post.title as string,
        slug: (post.slug as string) || null,
        excerpt: (post.excerpt as string) || null,
        featured_image_url: (post.featured_image_url as string) || null,
        category: (post.category as string) || "news",
        tags: (post.tags as string[]) || [],
        published_at: (post.published_at as string) || null,
        created_at: post.created_at as string,
        views_count: (post.views_count as number) || 0,
        likes_count: (post.likes_count as number) || 0,
        comments_count: (post.comments_count as number) || 0,
        author: post.author as BlogListingPost["author"],
      })
    );
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return <BlogListingPage posts={posts} />;
}
