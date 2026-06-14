import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";

// Default RSS sources — focused on the INDIAN VALORANT pro scene.
// We deliberately avoid broad multi-topic feeds (general "esports" feeds, Dexerto,
// Dot Esports, r/VALORANT) because they flood the queue with cricket/WWE/global
// noise; the fetch's "valorant" auto-publish guard blocks most of it, but these
// targeted India/VCT feeds keep the signal high. Add more anytime in /admin/news.
const DEFAULT_SOURCES = [
  // ── India esports outlets (Valorant coverage) ──────────────────
  {
    name: "TalkEsport",
    url: "https://www.talkesport.com/feed/",
    slug: "talkesport",
    region: "india",
  },
  {
    name: "AFK Gaming",
    url: "https://afkgaming.com/feed",
    slug: "afk-gaming",
    region: "india",
  },
  {
    name: "Sportskeeda Valorant",
    url: "https://www.sportskeeda.com/feed/valorant",
    slug: "sportskeeda-valorant",
    region: "india",
  },

  // ── Google News — targeted Indian-scene queries ────────────────
  {
    name: "Google News - Valorant Esports India",
    url: "https://news.google.com/rss/search?q=valorant+esports+india&hl=en-IN&gl=IN&ceid=IN:en",
    slug: "google-valorant-india",
    region: "india",
  },
  {
    name: "Google News - Challengers South Asia",
    url: "https://news.google.com/rss/search?q=%22Challengers+South+Asia%22+valorant&hl=en-IN&gl=IN&ceid=IN:en",
    slug: "google-vcsa",
    region: "india",
  },
  {
    name: "Google News - Indian Valorant Teams",
    url: "https://news.google.com/rss/search?q=valorant+(%22Global+Esports%22+OR+%22S8UL%22+OR+%22Revenant%22+OR+%22Gods+Reign%22+OR+%22Velocity+Gaming%22)&hl=en-IN&gl=IN&ceid=IN:en",
    slug: "google-india-teams",
    region: "india",
  },

  // ── VCT pro scene (global, for VCT Pacific where India's GE plays) ──
  {
    name: "Valorant Competitive (Reddit)",
    url: "https://www.reddit.com/r/ValorantCompetitive/new/.rss",
    slug: "reddit-vct",
    region: "global",
  },
];

export async function POST() {
  try {
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

    // Fix any existing broken Sportskeeda sources (page URLs instead of /feed/ RSS URLs)
    const { data: allExisting } = await admin
      .from("news_sources")
      .select("id, name, url, slug");

    let fixed = 0;
    for (const source of allExisting || []) {
      // Find sources with broken Sportskeeda URLs (page URLs instead of RSS feed URLs)
      if (
        source.url.includes("sportskeeda.com") &&
        !source.url.includes("/feed/")
      ) {
        // Try to match to a default source by name similarity
        const match = DEFAULT_SOURCES.find(
          (d) =>
            d.url.includes("sportskeeda.com") &&
            (source.name.toLowerCase().includes(d.slug.split("-").pop() || "") ||
              d.name.toLowerCase().includes(source.name.toLowerCase().split(" ").pop() || ""))
        );
        if (match) {
          await admin
            .from("news_sources")
            .update({ url: match.url })
            .eq("id", source.id);
          fixed++;
        }
      }
    }

    // Get existing source slugs to avoid duplicates
    const existingSlugs = new Set(
      (allExisting || []).map((s) => s.slug)
    );
    // Also check by URL to avoid duplicate feeds
    const existingUrls = new Set(
      (allExisting || []).map((s) => s.url)
    );

    // Filter out sources that already exist (by slug or URL)
    const newSources = DEFAULT_SOURCES.filter(
      (s) => !existingSlugs.has(s.slug) && !existingUrls.has(s.url)
    );

    if (newSources.length === 0 && fixed === 0) {
      return NextResponse.json({
        success: true,
        message: "All default sources already exist",
        added: 0,
        fixed: 0,
        skipped: DEFAULT_SOURCES.length,
      });
    }

    let added = 0;
    if (newSources.length > 0) {
      // Insert new sources
      const { data: inserted, error } = await admin
        .from("news_sources")
        .insert(
          newSources.map((s) => ({
            ...s,
            is_active: true,
            source_type: "rss",
          }))
        )
        .select();

      if (error) {
        logger.error("Seed error", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
      added = inserted?.length || 0;
    }

    return NextResponse.json({
      success: true,
      added,
      fixed,
      skipped: DEFAULT_SOURCES.length - newSources.length,
    });
  } catch (error) {
    logger.error("Seed error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
