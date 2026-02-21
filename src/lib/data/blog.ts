import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import type { BlogPost, BlogFilters, BlogCategory } from "@/types/blog";

// Cookie-free client for build-time use (generateStaticParams, sitemap)
// These functions run outside a request context where cookies() isn't available
function createBuildClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface GetBlogPostsOptions extends BlogFilters {
  limit?: number;
  offset?: number;
}

interface BlogListItem {
  posts: BlogPost[];
  total: number;
}

// Fetch published blog posts with optional filters
export async function getBlogPosts(
  options: GetBlogPostsOptions = {}
): Promise<BlogListItem> {
  const supabase = await createClient();
  const { limit = 12, offset = 0, game, category, tag, author, featured, search } = options;

  let query = supabase
    .from("blog_posts")
    .select(
      `
      id, title, slug, excerpt, featured_image_url, category, tags,
      published_at, views_count, likes_count, comments_count,
      is_featured, is_pinned, template, color_palette,
      author:profiles!blog_posts_author_id_fkey(
        id, username, display_name, avatar_url
      ),
      game:games!blog_posts_game_id_fkey(
        id, slug, name, icon_url
      )
    `,
      { count: "exact" }
    )
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by game slug
  if (game) {
    const { data: gameData } = await supabase
      .from("games")
      .select("id")
      .eq("slug", game)
      .single();

    if (gameData) {
      query = query.eq("game_id", gameData.id);
    }
  }

  // Filter by category
  if (category) {
    query = query.eq("category", category);
  }

  // Filter by tag
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  // Filter by author username
  if (author) {
    const { data: authorData } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", author)
      .single();

    if (authorData) {
      query = query.eq("author_id", authorData.id);
    }
  }

  // Filter featured only
  if (featured) {
    query = query.eq("is_featured", true);
  }

  // Full-text search using tsvector + GIN index
  if (search) {
    query = query.textSearch("search_vector", search, {
      type: "websearch",
      config: "english",
    });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching blog posts:", error);
    return { posts: [], total: 0 };
  }

  return {
    posts: (data as unknown as BlogPost[]) || [],
    total: count || 0,
  };
}

// Fetch a single published blog post by slug
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(
      `
      *,
      author:profiles!blog_posts_author_id_fkey(
        id, username, display_name, avatar_url, bio
      ),
      game:games!blog_posts_game_id_fkey(
        id, slug, name, icon_url, banner_url
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !post) {
    return null;
  }

  // Get blog author role info
  const { data: blogAuthor } = await supabase
    .from("blog_authors")
    .select("*")
    .eq("user_id", post.author_id)
    .single();

  // View counting is handled client-side with sessionStorage dedup

  return {
    ...post,
    author: {
      ...post.author,
      blog_author: blogAuthor,
    },
  } as unknown as BlogPost;
}

// Fetch all published slugs (for generateStaticParams and sitemap)
// Uses cookie-free client since this runs at build time outside request scope
export async function getAllPublishedSlugs(): Promise<
  { slug: string; updated_at: string }[]
> {
  const supabase = createBuildClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching published slugs:", error);
    return [];
  }

  return data || [];
}

// Fetch available games for filter dropdowns
export async function getGames(): Promise<
  { id: string; slug: string; name: string; icon_url: string | null }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("id, slug, name, icon_url")
    .order("name");

  if (error) {
    console.error("Error fetching games:", error);
    return [];
  }

  return data || [];
}
