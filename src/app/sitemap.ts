import type { MetadataRoute } from "next";
import { getAllPublishedSlugs } from "@/lib/data/blog";
import { BLOG_CATEGORIES } from "@/types/blog";
import { BASE_URL } from "@/lib/seo";

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
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
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

  // Category filter pages
  const categoryPages: MetadataRoute.Sitemap = Object.keys(BLOG_CATEGORIES).map(
    (cat) => ({
      url: `${BASE_URL}/blog?category=${cat}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })
  );

  // All published blog posts
  const slugs = await getAllPublishedSlugs();
  const postPages: MetadataRoute.Sitemap = slugs.map(({ slug, updated_at }) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...postPages];
}
