import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const game = searchParams.get("game") || "";
    const category = searchParams.get("category") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const admin = createAdminClient();

    let query = admin
      .from("news_articles")
      .select(
        "id, title, excerpt, thumbnail_url, game_slug, category, region, tags, views_count, published_at, is_featured, is_pinned, source:news_sources(name, slug)",
        { count: "exact" }
      )
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (game) query = query.eq("game_slug", game);
    if (category) query = query.eq("category", category);

    const { data: articles, count, error } = await query;

    if (error) {
      console.error("News fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch news" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { articles: articles || [], total: count || 0 },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
