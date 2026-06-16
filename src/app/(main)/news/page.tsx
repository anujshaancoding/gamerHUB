import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";
import { createAdminClient } from "@/lib/db/admin";
import { isNewsHidden } from "@/lib/features/news/visibility";
import { NewsArticleCard } from "@/components/content/news/NewsArticleCard";
import { BASE_URL } from "@/lib/features/seo/constants";
import type { NewsArticle } from "@/types/news";

// Content listing — serve cached HTML and refresh in the background so the
// page stays fast (it was previously dynamic, rendering against the DB on
// every request). News is admin-published and changes infrequently.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Valorant News — Patches, Tournaments & Roster Moves",
  description:
    "The latest Valorant news for India and beyond — patch notes, tournament results, roster changes, and meta updates, curated by ggLobby.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "Valorant News | ggLobby",
    description:
      "Patch notes, tournament results, roster moves and meta updates — curated by ggLobby.",
    type: "website",
    url: `${BASE_URL}/news`,
    siteName: "ggLobby",
  },
  twitter: {
    card: "summary_large_image",
    title: "Valorant News | ggLobby",
    description:
      "Patch notes, tournament results, roster moves and meta updates — curated by ggLobby.",
  },
};

async function getNewsArticles(): Promise<NewsArticle[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("news_articles")
      .select(
        `
        id, title, summary, excerpt, original_url, original_content,
        thumbnail_url, game_slug, category, region, tags,
        views_count, published_at, is_featured, is_pinned, created_at,
        source:news_sources(name, slug)
        `
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(60);

    if (error || !data) return [];
    return data as unknown as NewsArticle[];
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  // Respect the global "hide news" site setting (same gate as the article page).
  if (await isNewsHidden()) notFound();

  const articles = await getNewsArticles();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text sm:text-3xl">Valorant News</h1>
            <p className="mt-1 text-sm text-text-muted">
              Patch notes, tournaments, roster moves and meta updates — curated for India.
            </p>
          </div>
        </div>
      </header>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-20 text-center">
          <Newspaper className="h-10 w-10 text-text-muted" />
          <p className="text-base font-semibold text-text">No news yet</p>
          <p className="max-w-sm text-sm text-text-muted">
            Fresh Valorant news is on the way. Check back soon, or browse our{" "}
            <a href="/blog" className="text-primary hover:underline">
              guides and blog
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <NewsArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
