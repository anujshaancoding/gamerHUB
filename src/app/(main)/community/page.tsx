import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CommunityPageClient,
  type BlogPost,
  type FriendPost,
} from "@/components/community/community-page-client";
import type { NewsArticle } from "@/types/news";

export default async function CommunityPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Pre-fetch all three data sources in parallel for fastest initial load
  const [rawBlogPosts, rawFriendPosts, rawNewsArticles] = await Promise.all([
    supabase
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

    supabase
      .from("friend_posts")
      .select(`
        *,
        user:profiles!friend_posts_user_id_fkey(username, display_name, avatar_url, is_verified)
      `)
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
    <CommunityPageClient
      initialBlogPosts={blogPosts}
      initialFriendPosts={friendPosts}
      initialNewsArticles={newsArticles}
    />
  );
}
