import type { MetadataRoute } from "next";
import { BLOG_CATEGORIES } from "@/types/blog";
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
      url: `${BASE_URL}/login`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Category filter pages under community
  const categoryPages: MetadataRoute.Sitemap = Object.keys(BLOG_CATEGORIES).map(
    (cat) => ({
      url: `${BASE_URL}/community?tab=blog&category=${cat}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })
  );

  // All published blog posts — use /community/post/{id} URLs
  const db = createClient();
  const { data: posts } = await db
    .from("blog_posts")
    .select("id, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const postPages: MetadataRoute.Sitemap = (posts || []).map(
    (post: { id: string; updated_at: string }) => ({
      url: `${BASE_URL}/community/post/${post.id}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  return [...staticPages, ...categoryPages, ...postPages];
}
