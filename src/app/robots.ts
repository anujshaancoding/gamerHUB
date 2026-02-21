import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/*",
          "/clans",
          "/clans/*",
          "/find-gamers",
          "/community",
          "/profile/*",
          "/privacy",
          "/terms",
          "/guidelines",
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
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/news-sitemap.xml`,
    ],
  };
}
