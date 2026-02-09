import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRSSFeed } from "@/lib/news/rss-parser";
import crypto from "crypto";

// POST - Fetch news from all active RSS sources
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const cronSecret = request.headers.get("x-cron-secret");
    const authHeader = request.headers.get("authorization");

    if (cronSecret !== process.env.CRON_SECRET && !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Fetch all active news sources
    const { data: sources, error: sourcesError } = await (admin as ReturnType<typeof createAdminClient>)
      .from("news_sources" as never)
      .select("*")
      .eq("is_active", true);

    if (sourcesError) {
      console.error("Error fetching sources:", sourcesError);
      return NextResponse.json(
        { error: "Failed to fetch sources" },
        { status: 500 }
      );
    }

    let totalNew = 0;
    let totalFound = 0;
    const results: Array<{ source: string; found: number; new_articles: number; error?: string }> = [];

    for (const source of (sources || []) as Record<string, unknown>[]) {
      const sourceId = source.id as string;
      const sourceName = source.name as string;
      const sourceUrl = source.url as string;
      const gameSlug = source.game_slug as string;
      const sourceRegion = source.region as string;

      // Create fetch log entry
      const { data: fetchLog } = await (admin as ReturnType<typeof createAdminClient>)
        .from("news_fetch_logs" as never)
        .insert({
          source_id: sourceId,
          status: "started",
        } as never)
        .select()
        .single();

      const fetchLogId = (fetchLog as Record<string, unknown> | null)?.id as string | undefined;

      try {
        // Parse RSS feed
        const items = await parseRSSFeed(sourceUrl);
        totalFound += items.length;

        let newArticles = 0;

        for (const item of items) {
          // Generate external_id from link URL
          const externalId = crypto
            .createHash("md5")
            .update(item.link)
            .digest("hex");

          // Check for duplicates (by source + external_id or by original_url)
          const { data: existing } = await (admin as ReturnType<typeof createAdminClient>)
            .from("news_articles" as never)
            .select("id")
            .or(`and(source_id.eq.${sourceId},external_id.eq.${externalId}),original_url.eq.${item.link}`)
            .limit(1);

          if (existing && (existing as unknown[]).length > 0) continue;

          // Insert new article as pending
          const { error: insertError } = await (admin as ReturnType<typeof createAdminClient>)
            .from("news_articles" as never)
            .insert({
              source_id: sourceId,
              external_id: externalId,
              original_title: item.title.substring(0, 500),
              original_url: item.link,
              original_content: item.content || item.description,
              original_published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              title: item.title.substring(0, 300),
              thumbnail_url: item.thumbnail,
              game_slug: gameSlug,
              region: sourceRegion,
              status: "pending",
              ai_processed: false,
            } as never);

          if (!insertError) {
            newArticles++;
          }
        }

        totalNew += newArticles;

        // Update fetch log
        if (fetchLogId) {
          await (admin as ReturnType<typeof createAdminClient>)
            .from("news_fetch_logs" as never)
            .update({
              status: "completed",
              articles_found: items.length,
              articles_new: newArticles,
              completed_at: new Date().toISOString(),
            } as never)
            .eq("id", fetchLogId);
        }

        // Update source last_fetched_at
        await (admin as ReturnType<typeof createAdminClient>)
          .from("news_sources" as never)
          .update({ last_fetched_at: new Date().toISOString() } as never)
          .eq("id", sourceId);

        results.push({ source: sourceName, found: items.length, new_articles: newArticles });
      } catch (sourceError) {
        const errorMessage = sourceError instanceof Error ? sourceError.message : "Unknown error";
        console.error(`Error fetching source ${sourceName}:`, sourceError);

        // Update fetch log with error
        if (fetchLogId) {
          await (admin as ReturnType<typeof createAdminClient>)
            .from("news_fetch_logs" as never)
            .update({
              status: "failed",
              error_message: errorMessage,
              completed_at: new Date().toISOString(),
            } as never)
            .eq("id", fetchLogId);
        }

        results.push({ source: sourceName, found: 0, new_articles: 0, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      sources_fetched: (sources || []).length,
      total_found: totalFound,
      total_new: totalNew,
      results,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
