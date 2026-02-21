import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gglobby.com";

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
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
