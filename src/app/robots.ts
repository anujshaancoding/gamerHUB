import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // V2 is a Valorant-only content site. Allow the public content pillars
  // (V2-PLAN.md IA); disallow private/app surfaces and the frozen Phase-3
  // social routes (they 307 to "/" and are excluded from the sitemap, but
  // listing them here keeps crawlers from wasting budget on the redirect).
  const allow = [
    "/",
    "/agents",
    "/agents/*",
    "/maps",
    "/maps/*",
    "/patch",
    "/patch/*",
    "/tier-list",
    "/crosshairs",
    "/pros",
    "/pros/*",
    "/tools",
    "/tools/*",
    "/blog",
    "/blog/*",
    "/forum",
    "/forum/*",
    "/giveaway",
    "/leaderboard",
    "/rank-card",
    "/overview",
    "/updates",
    "/help",
    "/privacy",
    "/terms",
    "/guidelines",
    "/disclaimer",
  ];
  const disallow = [
    "/api/",
    "/settings/",
    "/admin/",
    "/write/",
    "/dashboard/",
    "/notifications/",
    "/premium/",
    "/auth/",
    // Frozen Phase-3 social surfaces (kept in code, removed from nav).
    "/clans",
    "/clans/",
    "/friends",
    "/messages",
    "/messages/",
    "/community",
    "/community/",
    "/find-gamers",
    "/lfg",
  ];

  // Explicitly allow major AI crawlers so blog/guide content appears in
  // ChatGPT search, Perplexity, Claude, Google AI Overviews, etc.
  const aiBots = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
    "Bytespider",
    "Amazonbot",
    "Meta-ExternalAgent",
    "DuckAssistBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow, disallow },
      ...aiBots.map((userAgent) => ({ userAgent, allow, disallow })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
