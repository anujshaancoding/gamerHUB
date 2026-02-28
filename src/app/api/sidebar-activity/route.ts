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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const followingIds = (following as any[])?.map((f) => f.following_id) || [];

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [newsResult, blogResult, listingsResult, friendPostResult] = results as any[];

    const items: SidebarActivityItem[] = [];

    // Normalize news articles
    if (newsResult?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const n of newsResult.data as any[]) {
        items.push({
          id: n.id,
          type: "news",
          title: n.title,
          thumbnailUrl: n.thumbnail_url || null,
          linkHref: `/news/${n.id}`,
          timestamp: n.published_at,
          meta: {
            category: n.category,
            gameSlug: n.game_slug,
          },
        });
      }
    }

    // Normalize blog posts
    if (blogResult?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const b of blogResult.data as any[]) {
        items.push({
          id: b.id,
          type: "blog",
          title: b.title,
          thumbnailUrl: b.featured_image_url || null,
          linkHref: `/community?tab=blogs`,
          timestamp: b.published_at,
          meta: {
            authorName: b.author?.display_name || b.author?.username || undefined,
            authorAvatar: b.author?.avatar_url || undefined,
            category: b.category,
          },
        });
      }
    }

    // Normalize community listings
    if (listingsResult?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const l of listingsResult.data as any[]) {
        items.push({
          id: l.id,
          type: l.listing_type === "giveaway" ? "giveaway" : "tournament",
          title: l.title,
          thumbnailUrl: l.cover_image_url || null,
          linkHref: `/community?tab=tournaments`,
          timestamp: l.created_at,
          meta: {
            gameName: l.game?.name || undefined,
          },
        });
      }
    }

    // Normalize friend posts
    if (friendPostResult?.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const fp of friendPostResult.data as any[]) {
        items.push({
          id: fp.id,
          type: "friend_post",
          title: (fp.content || "").slice(0, 100),
          thumbnailUrl: fp.image_url || null,
          linkHref: `/community?tab=friends`,
          timestamp: fp.created_at,
          meta: {
            authorName: fp.user?.display_name || fp.user?.username || undefined,
            authorAvatar: fp.user?.avatar_url || undefined,
            likesCount: fp.likes_count || 0,
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
