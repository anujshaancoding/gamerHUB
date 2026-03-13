import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import {
  cachedResponse,
  privateCachedResponse,
  CACHE_DURATIONS,
} from "@/lib/api/cache-headers";
import type { SidebarActivityItem } from "@/types/sidebar-activity";
import { getUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 30);

    // Build parallel queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client lacks typed schema for all tables
    const sb = db as any;

    const queries: Promise<unknown>[] = [
      // 1. News articles (published)
      sb
        .from("news_articles")
        .select("id, title, thumbnail_url, game_slug, category, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5),

      // 2. Blog posts (published)
      sb
        .from("blog_posts")
        .select(
          "id, title, slug, category, featured_image_url, published_at, author:profiles!blog_posts_author_id_fkey(username, display_name, avatar_url)"
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5),

      // 3. Community listings (active tournaments & giveaways)
      sb
        .from("community_listings")
        .select(
          "id, title, listing_type, cover_image_url, starts_at, created_at, game:games(name)"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5),
    ];

    // 4. Friend posts (only for logged-in users, filtered by follows/friends)
    let friendPostPromise: Promise<unknown> | null = null;
    if (user) {
      const { data: following } = await db
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = ((following || []) as Array<Record<string, unknown>>).map((f) => f.following_id as string);

      if (followingIds.length > 0) {
        friendPostPromise = sb
          .from("friend_posts")
          .select(
            "id, content, image_url, likes_count, created_at, user:profiles!friend_posts_user_id_fkey(username, display_name, avatar_url)"
          )
          .in("user_id", followingIds)
          .order("created_at", { ascending: false })
          .limit(5);
      }
    }

    if (friendPostPromise) {
      queries.push(friendPostPromise);
    }

    const results = await Promise.all(queries);

    const [newsResult, blogResult, listingsResult, friendPostResult] = results as Array<{
      data?: Array<Record<string, unknown>> | null;
      error?: { message: string } | null;
    }>;

    const items: SidebarActivityItem[] = [];

    // Normalize news articles
    if (newsResult?.data) {
      for (const n of newsResult.data) {
        items.push({
          id: n.id as string,
          type: "news",
          title: n.title as string,
          thumbnailUrl: (n.thumbnail_url as string) || null,
          linkHref: `/news/${n.id}`,
          timestamp: n.published_at as string,
          meta: {
            category: n.category as string,
            gameSlug: n.game_slug as string,
          },
        });
      }
    }

    // Normalize blog posts
    if (blogResult?.data) {
      for (const b of blogResult.data) {
        const author = b.author as Record<string, unknown> | null;
        items.push({
          id: b.id as string,
          type: "blog",
          title: b.title as string,
          thumbnailUrl: (b.featured_image_url as string) || null,
          linkHref: `/community/post/${b.id}`,
          timestamp: b.published_at as string,
          meta: {
            authorName: (author?.display_name || author?.username || undefined) as string | undefined,
            authorAvatar: (author?.avatar_url || undefined) as string | undefined,
            category: b.category as string,
          },
        });
      }
    }

    // Normalize community listings
    if (listingsResult?.data) {
      for (const l of listingsResult.data) {
        const game = l.game as Record<string, unknown> | null;
        items.push({
          id: l.id as string,
          type: (l.listing_type as string) === "giveaway" ? "giveaway" : "tournament",
          title: l.title as string,
          thumbnailUrl: (l.cover_image_url as string) || null,
          linkHref: `/community?tab=tournaments`,
          timestamp: l.created_at as string,
          meta: {
            gameName: (game?.name || undefined) as string | undefined,
          },
        });
      }
    }

    // Normalize friend posts
    if (friendPostResult?.data) {
      for (const fp of friendPostResult.data) {
        const fpUser = fp.user as Record<string, unknown> | null;
        items.push({
          id: fp.id as string,
          type: "friend_post",
          title: ((fp.content as string) || "").slice(0, 100),
          thumbnailUrl: (fp.image_url as string) || null,
          linkHref: `/community?tab=friends&post=${fp.id}`,
          timestamp: fp.created_at as string,
          meta: {
            authorName: (fpUser?.display_name || fpUser?.username || undefined) as string | undefined,
            authorAvatar: (fpUser?.avatar_url || undefined) as string | undefined,
            likesCount: (fp.likes_count as number) || 0,
          },
        });
      }
    }

    // Sort all items by timestamp descending and take the requested limit
    items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const sliced = items.slice(0, limit);

    const responseData = { items: sliced };

    // Use private cache when logged in (friend posts are user-specific)
    if (user) {
      return privateCachedResponse(responseData, CACHE_DURATIONS.USER_DATA);
    }
    return cachedResponse(responseData, CACHE_DURATIONS.USER_DATA);
  } catch (error) {
    console.error("Sidebar activity fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
