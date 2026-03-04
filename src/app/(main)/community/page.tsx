import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { BASE_URL } from "@/lib/seo/constants";
import {
  CommunityPageClient,
  type BlogPost,
  type FriendPost,
} from "@/components/community/community-page-client";
import type { NewsArticle } from "@/types/news";

// Dynamic OG metadata when sharing a specific friend post via ?post= param
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>;
}): Promise<Metadata> {
  const { post: postId } = await searchParams;

  // Default community page metadata
  if (!postId) {
    return {
      title: "Community",
      description:
        "Join the ggLobby gaming community. Read articles, discuss strategies, participate in tournaments, and connect with gamers across India.",
      openGraph: {
        title: "Community | ggLobby",
        description:
          "Join the ggLobby gaming community. Read articles, discuss strategies, and connect with gamers across India.",
        type: "website",
      },
      alternates: { canonical: "/community" },
    };
  }

  // Fetch the shared post for OG tags
  try {
    const db = createAdminClient();
    const { data: post } = await db
      .from("friend_posts")
      .select("id, content, image_url, user_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return { title: "Post not found | ggLobby" };
    }

    const { data: profile } = await db
      .from("profiles")
      .select("display_name, username")
      .eq("id", (post as any).user_id)
      .single();

    const authorName = (profile as any)?.display_name || (profile as any)?.username || "a gamer";
    const username = (profile as any)?.username || "";
    const content = (post as any).content as string;
    const description = content.length > 160 ? content.slice(0, 157) + "..." : content;
    const imageUrl = (post as any).image_url as string | null;

    // Title format like Twitter: "Display Name (@username) on ggLobby"
    const title = username
      ? `${authorName} (@${username}) on ggLobby`
      : `${authorName} on ggLobby`;

    // Use the actual post image directly (most reliable for WhatsApp/social platforms).
    // Fall back to the generated card for text-only posts.
    let ogImageUrl: string;
    if (imageUrl) {
      ogImageUrl = imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`;
    } else {
      ogImageUrl = `${BASE_URL}/api/og/post?id=${postId}`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        siteName: "ggLobby",
        url: `${BASE_URL}/community?post=${postId}`,
        images: [{ url: ogImageUrl, alt: `Post by ${authorName}` }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: "Community | ggLobby" };
  }
}

export default async function CommunityPage() {
  const db = createClient();
  const admin = createAdminClient();

  // Pre-fetch all three data sources in parallel for fastest initial load
  const [rawBlogPosts, rawFriendPostsData, rawNewsArticles] = await Promise.all([
    db
      .from("blog_posts")
      .select(`
        id, title, slug, excerpt, featured_image_url, category, tags,
        published_at, views_count, likes_count, comments_count,
        created_at,
        author:profiles!blog_posts_author_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)
      .then((r) => r.data),

    // Fetch friend posts WITHOUT FK join - do manual profile lookup
    db
      .from("friend_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4)
      .then((r) => r.data),

    admin
      .from("news_articles")
      .select(
        "id, title, excerpt, thumbnail_url, game_slug, category, region, tags, views_count, published_at, is_featured, is_pinned, created_at, original_url, source:news_sources(name, slug)"
      )
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(20)
      .then((r) => r.data),
  ]);

  // Manually join friend post authors
  let rawFriendPosts = rawFriendPostsData || [];
  if (rawFriendPosts.length > 0) {
    const userIds = [...new Set((rawFriendPosts as any[]).map((p: any) => p.user_id).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_verified")
        .in("id", userIds);

      const profileMap: Record<string, any> = {};
      for (const profile of (profiles || []) as any[]) {
        profileMap[profile.id] = profile;
      }

      rawFriendPosts = (rawFriendPosts as any[]).map((post: any) => ({
        ...post,
        user: profileMap[post.user_id] || null,
      }));
    }
  }

  const blogPosts: BlogPost[] = (rawBlogPosts || []).map((post: Record<string, unknown>) => ({
    id: post.id as string,
    title: post.title as string,
    excerpt: (post.excerpt as string) || "",
    content: "",
    cover_image: post.featured_image_url as string | undefined,
    author_id: "",
    created_at: post.created_at as string,
    likes_count: (post.likes_count as number) || 0,
    comments_count: (post.comments_count as number) || 0,
    views_count: post.views_count as number | undefined,
    category: (post.category as string) || "",
    tags: (post.tags as string[]) || [],
    author: post.author as BlogPost["author"],
  }));

  const friendPosts: FriendPost[] = (rawFriendPosts || []).filter(
    (p: Record<string, unknown>) => p.user !== null
  ) as FriendPost[];

  const newsArticles: NewsArticle[] = (rawNewsArticles || []) as NewsArticle[];

  return (
    <Suspense>
      <CommunityPageClient
        initialBlogPosts={blogPosts}
        initialFriendPosts={friendPosts}
        initialNewsArticles={newsArticles}
      />
    </Suspense>
  );
}
