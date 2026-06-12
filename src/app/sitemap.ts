import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/features/seo";
import { createClient } from "@/lib/db/client";
import { AGENTS } from "@/lib/data/valorant-agents";
import { MAPS } from "@/lib/data/valorant-maps";
import { getAllPatches } from "@/lib/data/valorant-patches";
import { listProPlayers } from "@/lib/pro/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // V2 is a Valorant-only content site. The sitemap reflects the SEO-first
  // information architecture (V2-PLAN.md) — frozen Phase-3 surfaces
  // (community/clans/find-gamers) are intentionally excluded.
  const staticPages: MetadataRoute.Sitemap = (
    [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/agents`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/maps`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/pros`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/patch`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/passport`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/passport/gallery`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/tier-list`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/crosshairs`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/tools`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/giveaway`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/forum`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/leaderboard`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/rank-card`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/overview`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/updates`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/guidelines`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, changeFrequency: "monthly", priority: 0.2 },
    ] as const
  ).map((p) => ({ ...p, lastModified: now }));

  // Per-agent and per-map guide pages (static content data).
  const agentPages: MetadataRoute.Sitemap = AGENTS.map((a) => ({
    url: `${BASE_URL}/agents/${a.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const mapPages: MetadataRoute.Sitemap = MAPS.map((m) => ({
    url: `${BASE_URL}/maps/${m.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Per-patch breakdown pages (curated content data).
  const patchPages: MetadataRoute.Sitemap = getAllPatches().map((p) => ({
    url: `${BASE_URL}/patch/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Individual pro pages (DB-backed; tolerate failure so the sitemap still
  // builds if the VPS is unreachable at build time).
  let proPages: MetadataRoute.Sitemap = [];
  try {
    const pros = await listProPlayers("valorant");
    proPages = pros
      .filter((p) => !!p.slug)
      .map((p) => ({
        url: `${BASE_URL}/pros/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch (err) {
    console.error("sitemap: failed to load pro players", err);
  }

  // All published blog posts — canonical on /blog/{slug}. Posts without a
  // slug are skipped (they shouldn't be crawl-promoted under the legacy id
  // URL — that route is now a 308 redirect).
  const db = createClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select("id, slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const postPages: MetadataRoute.Sitemap = ((posts || []) as Array<{
    id: string;
    slug?: string | null;
    updated_at: string;
  }>)
    .filter((post) => !!post.slug)
    .map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...agentPages,
    ...mapPages,
    ...patchPages,
    ...proPages,
    ...postPages,
  ];
}
