import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

// Default RSS sources for Indian esports gaming news
// These are reliable, free RSS feeds that cover Valorant, BGMI, and Free Fire
const DEFAULT_SOURCES = [
  // ── Indian Esports (multi-game, India-focused) ──────────────────
  {
    name: "Sportskeeda Esports",
    url: "https://www.sportskeeda.com/feed/esports",
    slug: "sportskeeda-esports",
    region: "india",
  },
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

  // ── Valorant-specific ───────────────────────────────────────────
  {
    name: "Sportskeeda Valorant",
    url: "https://www.sportskeeda.com/feed/valorant",
    slug: "sportskeeda-valorant",
    region: "india",
  },
  {
    name: "Valorant Reddit",
    url: "https://www.reddit.com/r/VALORANT/new/.rss",
    slug: "reddit-valorant",
    region: "global",
  },
  {
    name: "VCT Reddit",
    url: "https://www.reddit.com/r/ValorantCompetitive/new/.rss",
    slug: "reddit-vct",
    region: "global",
  },

  // ── BGMI-specific ──────────────────────────────────────────────
  {
    name: "Sportskeeda BGMI",
    url: "https://www.sportskeeda.com/feed/bgmi",
    slug: "sportskeeda-bgmi",
    region: "india",
  },
  {
    name: "BGMI Reddit",
    url: "https://www.reddit.com/r/bgmi/new/.rss",
    slug: "reddit-bgmi",
    region: "india",
  },
  {
    name: "PUBG Mobile Reddit",
    url: "https://www.reddit.com/r/PUBGMobile/new/.rss",
    slug: "reddit-pubgmobile",
    region: "global",
  },

  // ── Free Fire-specific ─────────────────────────────────────────
  {
    name: "Sportskeeda Free Fire",
    url: "https://www.sportskeeda.com/feed/free-fire",
    slug: "sportskeeda-freefire",
    region: "india",
  },
  {
    name: "Free Fire Reddit",
    url: "https://www.reddit.com/r/freefire/new/.rss",
    slug: "reddit-freefire",
    region: "global",
  },

  // ── Google News (India esports) ────────────────────────────────
  {
    name: "Google News - Valorant India",
    url: "https://news.google.com/rss/search?q=valorant+esports+india&hl=en-IN&gl=IN&ceid=IN:en",
    slug: "google-valorant-india",
    region: "india",
  },
  {
    name: "Google News - BGMI",
    url: "https://news.google.com/rss/search?q=BGMI+battlegrounds+mobile+india&hl=en-IN&gl=IN&ceid=IN:en",
    slug: "google-bgmi",
    region: "india",
  },
  {
    name: "Google News - Free Fire India",
    url: "https://news.google.com/rss/search?q=free+fire+garena+india&hl=en-IN&gl=IN&ceid=IN:en",
    slug: "google-freefire-india",
    region: "india",
  },

  // ── Global esports ─────────────────────────────────────────────
  {
    name: "Dexerto",
    url: "https://www.dexerto.com/feed/",
    slug: "dexerto",
    region: "global",
  },
  {
    name: "Dot Esports",
    url: "https://dotesports.com/feed",
    slug: "dot-esports",
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

    // Fix any existing broken Sportskeeda sources (wrong URLs like /bgmi instead of /feed/bgmi)
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
        console.error("Seed error:", error);
        return NextResponse.json(
          { error: "Failed to seed sources: " + error.message },
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
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
