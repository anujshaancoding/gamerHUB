import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewsDetailClient } from "./news-detail-client";
import type { NewsArticle } from "@/types/news";

interface Props {
  params: Promise<{ id: string }>;
}

async function getNewsArticle(id: string): Promise<NewsArticle | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news_articles")
    .select(
      `
      id, title, summary, excerpt, original_url, original_content,
      thumbnail_url, game_slug, category, region, tags,
      views_count, published_at, is_featured, is_pinned,
      created_at,
      source:news_sources(name, slug)
    `
    )
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return data as unknown as NewsArticle;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getNewsArticle(id);

  if (!article) {
    return { title: "Article Not Found" };
  }

  const title = article.title;
  const description = article.excerpt || article.summary?.slice(0, 160) || `Read "${article.title}" on ggLobby`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.published_at || undefined,
      images: article.thumbnail_url
        ? [{ url: article.thumbnail_url, width: 1200, height: 630, alt: article.title }]
        : undefined,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.thumbnail_url ? [article.thumbnail_url] : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getNewsArticle(id);

  if (!article) {
    notFound();
  }

  // Increment view in background
  const admin = createAdminClient();
  admin.rpc("increment_news_view", { article_id: id }).then(() => {}, () => {});

  return <NewsDetailClient article={article} />;
}
