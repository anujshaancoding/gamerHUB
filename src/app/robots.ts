import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
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
        ],
        disallow: [
          "/api/",
          "/settings/",
          "/messages/",
          "/admin/",
          "/write/",
          "/dashboard/",
          "/notifications/",
          "/premium/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
