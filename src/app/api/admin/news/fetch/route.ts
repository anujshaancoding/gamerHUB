import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import Parser from "rss-parser";
import { getUser } from "@/lib/auth/get-user";
import {
  GAME_KEYWORDS_SCORED,
  OTHER_GAME_KEYWORDS,
  INDIA_ASIA_KEYWORDS,
} from "@/lib/news/constants";

// Custom RSS fields for Reddit and other non-standard feeds
const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "ggLobby-NewsBot/1.0 (+https://gglobby.in)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["media:content", "mediaContent", { keepArray: false }],
    ],
  },
});

/**
 * Score-based game detection.
 * Returns { slug, score } or null if no game confidently matched.
 *
 * Logic:
 * 1. Check if article mentions any OTHER game — if it does and doesn't
 *    strongly match one of our 3 games, reject it.
 * 2. Score each of our 3 games by summing keyword weights.
 * 3. The game with the highest score wins, but only if score >= 3
 *    (at least one definitive keyword or multiple weak signals).
 */
function detectGameSlug(text: string, sourceSlug?: string): { slug: string; score: number } | null {
  const lower = text.toLowerCase();

  // Score each supported game
  const scores: Record<string, number> = {};
  for (const [slug, keywords] of Object.entries(GAME_KEYWORDS_SCORED)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.term.trim().toLowerCase())) {
        score += kw.weight;
      }
    }
    // If the RSS source itself is game-specific (e.g., "sportskeeda-valorant"),
    // give a +1 boost to help borderline articles from dedicated feeds match
    if (sourceSlug && sourceSlug.includes(slug)) {
      score += 1;
    }
    scores[slug] = score;
  }

  // Find the best match
  const bestSlug = Object.entries(scores).reduce((a, b) =>
    b[1] > a[1] ? b : a
  );
  const [topGame, topScore] = bestSlug;

  // If we have a strong match (score >= 3), accept it regardless of other game mentions
  if (topScore >= 3) {
    return { slug: topGame, score: topScore };
  }

  // Check if article is about a different game entirely
  const mentionsOtherGame = OTHER_GAME_KEYWORDS.some((kw) =>
    lower.includes(kw.toLowerCase())
  );

  if (mentionsOtherGame) {
    // Article is about a game we don't cover, and no strong match for our games
    return null;
  }

  // Weak match (score 1-2) — only accept if no other game detected
  if (topScore >= 1) {
    return { slug: topGame, score: topScore };
  }

  // No game detected at all
  return null;
}

function detectRegion(text: string): string {
  const lower = text.toLowerCase();
  if (INDIA_ASIA_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "india";
  }
  return "global";
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("patch") || lower.includes("update notes")) return "patch";
  if (lower.includes("tournament") || lower.includes("championship") || lower.includes("masters") || lower.includes("finals")) return "tournament";
  if (lower.includes("event") || lower.includes("lan")) return "event";
  if (lower.includes("roster") || lower.includes("transfer") || lower.includes("signs") || lower.includes("benched")) return "roster";
  if (lower.includes("meta") || lower.includes("tier list") || lower.includes("best agents")) return "meta";
  if (lower.includes("update") || lower.includes("new season") || lower.includes("new map")) return "update";
  return "general";
}

export async function POST() {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all active sources
    const { data: sources, error: sourcesError } = await admin
      .from("news_sources")
      .select("*")
      .eq("is_active", true);

    if (sourcesError || !sources?.length) {
      return NextResponse.json(
        { error: "No active news sources found" },
        { status: 404 }
      );
    }

    let totalFound = 0;
    let totalNew = 0;
    const errors: string[] = [];

    for (const source of sources) {
      // Create fetch log entry
      const { data: logEntry } = await admin
        .from("news_fetch_logs")
        .insert({
          source_id: source.id,
          status: "started",
          metadata: {},
        })
        .select()
        .single();

      try {
        const feed = await parser.parseURL(source.url);
        const items = feed.items || [];
        totalFound += items.length;

        let newCount = 0;

        for (const item of items.slice(0, 30)) {
          const itemUrl = item.link || item.guid || "";
          if (!itemUrl) continue;

          // Check if article already exists
          const { data: existing } = await admin
            .from("news_articles")
            .select("id")
            .eq("original_url", itemUrl)
            .maybeSingle();

          if (existing) continue;

          const title = item.title || "Untitled";
          const content = item.contentSnippet || item.content || "";
          const fullText = `${title} ${content}`;

          // Score-based game detection with source hint boost
          const gameMatch = detectGameSlug(fullText, source.slug);
          if (!gameMatch) {
            // Article doesn't match any of our 3 games, skip it
            continue;
          }
          const gameSlug = gameMatch.slug;

          const region = source.region || detectRegion(fullText);
          const category = detectCategory(fullText);

          // Auto-generate tags from detected signals
          const tags: string[] = [];
          if (region === "india") tags.push("INDIA");
          tags.push(category.toUpperCase());

          const excerpt =
            (item.contentSnippet || "").slice(0, 280) || null;

          // Use game match score as a relevance indicator
          const relevanceScore = Math.min(gameMatch.score / 10, 1);

          await admin.from("news_articles").insert({
            source_id: source.id,
            external_id: item.guid || itemUrl,
            original_title: title,
            original_url: itemUrl,
            original_content: (item.content || "").slice(0, 5000),
            original_published_at: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : null,
            title,
            summary: excerpt,
            excerpt,
            thumbnail_url:
              item.enclosure?.url ||
              extractMediaUrl(item) ||
              extractImageFromContent(item.content || "") ||
              null,
            game_slug: gameSlug,
            category,
            region,
            tags,
            status: "pending",
            ai_processed: false,
            ai_relevance_score: relevanceScore,
          });

          newCount++;
        }

        totalNew += newCount;

        // Update fetch log
        if (logEntry) {
          await admin
            .from("news_fetch_logs")
            .update({
              status: "completed",
              articles_found: items.length,
              articles_new: newCount,
              articles_processed: items.length,
              completed_at: new Date().toISOString(),
            })
            .eq("id", logEntry.id);
        }

        // Update source last_fetched_at
        await admin
          .from("news_sources")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", source.id);
      } catch (fetchError) {
        const errMsg = `Failed to fetch ${source.name}: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`;
        errors.push(errMsg);
        console.error(errMsg);

        if (logEntry) {
          await admin
            .from("news_fetch_logs")
            .update({
              status: "failed",
              error_message: errMsg,
              completed_at: new Date().toISOString(),
            })
            .eq("id", logEntry.id);
        }
      }
    }

    // Auto-cleanup: keep only the 5 most recent pending fetched articles per game
    // Published/approved articles are never removed
    const KEEP_PER_GAME = 5;
    const gameSlugs = ["valorant", "bgmi", "freefire"];
    let totalRemoved = 0;

    for (const gameSlug of gameSlugs) {
      // Get IDs of the newest KEEP_PER_GAME pending fetched articles for this game
      const { data: keepArticles } = await admin
        .from("news_articles")
        .select("id")
        .eq("game_slug", gameSlug)
        .eq("status", "pending")
        .not("source_id", "is", null) // only fetched articles (have a source)
        .order("created_at", { ascending: false })
        .limit(KEEP_PER_GAME);

      const keepIds = (keepArticles || []).map((a) => a.id);

      if (keepIds.length === 0) continue;

      // Delete all older pending fetched articles for this game beyond the kept ones
      const { data: deleted } = await admin
        .from("news_articles")
        .delete()
        .eq("game_slug", gameSlug)
        .eq("status", "pending")
        .not("source_id", "is", null)
        .not("id", "in", `(${keepIds.join(",")})`)
        .select("id");

      totalRemoved += deleted?.length || 0;
    }

    return NextResponse.json({
      success: true,
      sourcesProcessed: sources.length,
      totalFound,
      totalNew,
      totalRemoved,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Extract thumbnail from media:thumbnail or media:content RSS extensions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMediaUrl(item: any): string | null {
  try {
    const thumbnail = item.mediaThumbnail?.["$"]?.url || item.mediaThumbnail?.url;
    if (thumbnail) return thumbnail;
    const media = item.mediaContent?.["$"]?.url || item.mediaContent?.url;
    if (media) return media;
  } catch {
    // Ignore malformed media fields
  }
  return null;
}

function extractImageFromContent(html: string): string | null {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch?.[1] || null;
}
