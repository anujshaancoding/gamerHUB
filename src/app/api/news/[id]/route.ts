import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: article, error } = await admin
      .from("news_articles")
      .select(
        `
        id, title, summary, excerpt, original_url, original_content,
        thumbnail_url, game_slug, category, region, tags,
        views_count, published_at, is_featured, is_pinned,
        created_at,
        source:news_sources(name, slug)
      `
      )
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error || !article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Increment view count in background
    admin
      .rpc("increment_news_view", { article_id: id })
      .then(() => {})
      .catch(() => {});

    return NextResponse.json(
      { article },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("News article API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
