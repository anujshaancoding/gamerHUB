import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filterRelevance, summarizeArticle, classifyArticle } from "@/lib/news/openai";

// POST - Process pending news articles through AI pipeline
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

    // Fetch unprocessed articles (limit batch size)
    const { data: articles, error } = await (admin as ReturnType<typeof createAdminClient>)
      .from("news_articles" as never)
      .select("*")
      .eq("ai_processed", false)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) {
      console.error("Error fetching articles:", error);
      return NextResponse.json(
        { error: "Failed to fetch pending articles" },
        { status: 500 }
      );
    }

    const typedArticles = (articles || []) as Record<string, unknown>[];
    let processed = 0;
    let approved = 0;
    let rejected = 0;

    // Process sequentially to avoid rate limits
    for (const article of typedArticles) {
      const articleId = article.id as string;
      const originalTitle = article.original_title as string;
      const originalContent = (article.original_content as string) || "";
      const gameSlug = article.game_slug as string;

      try {
        // Step 1: Relevance filtering
        const relevance = await filterRelevance(originalTitle, originalContent, gameSlug);

        if (relevance.relevanceScore < 0.3) {
          // Reject irrelevant articles
          await (admin as ReturnType<typeof createAdminClient>)
            .from("news_articles" as never)
            .update({
              ai_processed: true,
              ai_relevance_score: relevance.relevanceScore,
              status: "rejected",
              rejection_reason: `AI filter: ${relevance.reasoning}`,
              game_slug: relevance.detectedGame || gameSlug,
            } as never)
            .eq("id", articleId);

          rejected++;
          processed++;
          continue;
        }

        // Step 2: Summarization
        const detectedGame = relevance.detectedGame || gameSlug;
        const summary = await summarizeArticle(originalTitle, originalContent, detectedGame);

        // Step 3: Classification
        const classification = await classifyArticle(
          summary.title,
          summary.summary,
          detectedGame
        );

        // Update article with AI results
        await (admin as ReturnType<typeof createAdminClient>)
          .from("news_articles" as never)
          .update({
            ai_processed: true,
            ai_relevance_score: relevance.relevanceScore,
            title: summary.title.substring(0, 300),
            summary: summary.summary,
            excerpt: summary.excerpt.substring(0, 300),
            game_slug: detectedGame,
            category: classification.category,
            region: classification.region,
            tags: classification.tags,
            status: "approved",
          } as never)
          .eq("id", articleId);

        approved++;
        processed++;

        // Small delay between articles to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (articleError) {
        const errorMessage = articleError instanceof Error ? articleError.message : "Unknown error";
        console.error(`Error processing article ${articleId}:`, articleError);

        // Mark as processed with error so we don't retry indefinitely
        await (admin as ReturnType<typeof createAdminClient>)
          .from("news_articles" as never)
          .update({
            ai_processed: true,
            ai_processing_error: errorMessage,
            status: "pending",
          } as never)
          .eq("id", articleId);

        processed++;
      }
    }

    return NextResponse.json({
      success: true,
      total_pending: typedArticles.length,
      processed,
      approved,
      rejected,
    });
  } catch (error) {
    console.error("News process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
