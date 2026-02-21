import type { Metadata } from "next";
import { getBlogPosts, getGames } from "@/lib/data/blog";
import { BLOG_CATEGORIES } from "@/types/blog";
import type { BlogCategory } from "@/types/blog";
import { BlogListContent } from "./blog-list-content";
import { JsonLd, BASE_URL, SITE_NAME } from "@/lib/seo";

interface Props {
  searchParams: Promise<{
    game?: string;
    category?: string;
    search?: string;
    tag?: string;
    featured?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;

  const parts: string[] = [];
  if (params.game) {
    parts.push(params.game.charAt(0).toUpperCase() + params.game.slice(1));
  }
  if (params.category && BLOG_CATEGORIES[params.category as BlogCategory]) {
    parts.push(BLOG_CATEGORIES[params.category as BlogCategory].label);
  }

  const title = parts.length > 0 ? `${parts.join(" ")} Articles` : "Gaming Blog";
  const description = parts.length > 0
    ? `Browse ${parts.join(" ").toLowerCase()} articles on ggLobby`
    : "The latest gaming guides, news, and analysis for Valorant, BGMI, Free Fire and more.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ggLobby`,
      description,
      type: "website",
      url: `${BASE_URL}/blog`,
    },
    alternates: {
      canonical: "/blog",
    },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 12;
  const offset = (page - 1) * limit;

  // Parallel data fetching
  const [blogData, games] = await Promise.all([
    getBlogPosts({
      game: params.game,
      category: params.category as BlogCategory | undefined,
      search: params.search,
      tag: params.tag,
      featured: params.featured === "true" ? true : undefined,
      limit,
      offset,
    }),
    getGames(),
  ]);

  return (
    <div>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: "ggLobby Blog",
          description: "Gaming news, guides, and analysis from the community",
          url: `${BASE_URL}/blog`,
          isPartOf: {
            "@type": "WebSite",
            name: SITE_NAME,
            url: BASE_URL,
          },
        }}
      />
      <JsonLd
        data={{
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: BASE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: `${BASE_URL}/blog`,
            },
          ],
        }}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Blog</h1>
        <p className="text-text-muted">
          Gaming news, guides, and analysis from the community
        </p>
      </div>

      <BlogListContent
        initialPosts={blogData.posts}
        totalPosts={blogData.total}
        currentPage={page}
        limit={limit}
        games={games}
        currentFilters={{
          game: params.game,
          category: params.category,
          search: params.search,
          tag: params.tag,
          featured: params.featured,
        }}
      />
    </div>
  );
}
