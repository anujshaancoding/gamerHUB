import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo";
import { createClient } from "@/lib/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/clans`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/find-gamers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/guidelines`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/updates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/overview`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/help`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // All published blog posts — canonical on /blog/{slug}.
  // Posts without a slug are skipped from the sitemap (they shouldn't be
  // crawl-promoted under the legacy id URL — that route is now a 308 redirect).
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

  return [...staticPages, ...postPages];
}
