import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const allow = [
    "/",
    "/clans",
    "/clans/*",
    "/find-gamers",
    "/community",
    "/community/post/*",
    "/profile/*",
    "/help",
    "/privacy",
    "/terms",
    "/guidelines",
    "/overview",
    "/blog",
    "/blog/*",
    "/updates",
  ];
  const disallow = [
    "/api/",
    "/settings/",
    "/messages/",
    "/admin/",
    "/write/",
    "/dashboard/",
    "/notifications/",
    "/premium/",
    "/auth/",
  ];

  // Explicitly allow major AI crawlers so blog content appears in
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
