import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Get news posts (supports both legacy news_posts and new news_articles)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const source = searchParams.get("source") || "articles";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // New: Serve from news_articles table
    if (source === "articles") {
      const game = searchParams.get("game");
      const category = searchParams.get("category");
      const region = searchParams.get("region");
      const search = searchParams.get("search");
      const featured = searchParams.get("featured");

      let query = supabase
        .from("news_articles" as never)
        .select("*", { count: "exact" })
        .eq("status", "published")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (game) {
        query = query.eq("game_slug", game);
      }
      if (category) {
        query = query.eq("category", category);
      }
      if (region) {
        query = query.eq("region", region);
      }
      if (search) {
        query = query.ilike("title", `%${search}%`);
      }
      if (featured === "true") {
        query = query.eq("is_featured", true);
      }

      const { data: posts, error, count } = await query;

      if (error) {
        console.error("Error fetching news articles:", error);
        return NextResponse.json(
          { error: "Failed to fetch news" },
          { status: 500 }
        );
      }

      return cachedResponse(
        {
          posts: posts || [],
          total: count || 0,
          limit,
          offset,
        },
        CACHE_DURATIONS.LEADERBOARD // 5 minutes - news should be fresh
      );
    }

    // Legacy: Serve from news_posts table (announcements)
    const type = searchParams.get("type");

    let query = supabase
      .from("news_posts")
      .select("*", { count: "exact" })
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("post_type", type);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Error fetching news:", error);
      return NextResponse.json(
        { error: "Failed to fetch news" },
        { status: 500 }
      );
    }

    return cachedResponse(
      {
        posts,
        total: count || 0,
        limit,
        offset,
      },
      CACHE_DURATIONS.SEASON
    );
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
