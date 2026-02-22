import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserPermissionContext } from "@/lib/api/check-permission";
import { getUserTier, can } from "@/lib/permissions";

// GET - List published blog posts with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const game = searchParams.get("game");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const author = searchParams.get("author");
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor"); // ISO date string of last item's published_at

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
      .eq("status", "published");

    // Cursor-based pagination: fetch items older than cursor
    if (cursor) {
      query = query.lt("published_at", cursor);
    }

    query = query
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);

    // Filter by game
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

    // Filter by author
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

    // Search by title or excerpt using ilike for reliable partial matching
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,excerpt.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching blog posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    const posts = data || [];
    // Next cursor is the published_at of the last item (for next page)
    const nextCursor =
      posts.length === limit
        ? posts[posts.length - 1]?.published_at
        : null;

    return NextResponse.json(
      {
        posts,
        total: count || 0,
        limit,
        nextCursor,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Blog list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a blog author
    const { data: author } = await supabase
      .from("blog_authors")
      .select("id, can_publish_directly")
      .eq("user_id", user.id)
      .single();

    if (!author) {
      return NextResponse.json(
        { error: "You are not authorized to create blog posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      content_json,
      excerpt,
      featured_image_url,
      game_id,
      category,
      tags,
      template,
      color_palette,
      status,
      meta_title,
      meta_description,
      allow_comments,
    } = body;

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    // Restrict "news" category to editors and admins only
    if (category === "news") {
      const permCtx = await getUserPermissionContext(supabase);
      const tier = permCtx ? getUserTier(permCtx) : "free";
      if (!can.useNewsCategory(tier)) {
        return NextResponse.json(
          { error: 'The "News" category is restricted to editors and administrators' },
          { status: 403 }
        );
      }
    }

    const postStatus = status || "draft";

    const publishedAt =
      postStatus === "published" ? new Date().toISOString() : null;

    // Generate slug from title as fallback (in case DB trigger is missing)
    const baseSlug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200);
    const slug = baseSlug || `post-${Date.now()}`;

    // Create post (truncate SEO fields to match DB column limits)
    const coreData: Record<string, unknown> = {
      author_id: user.id,
      title: title.trim().slice(0, 200),
      slug,
      content,
      excerpt: excerpt?.trim() || null,
      featured_image_url: featured_image_url || null,
      game_id: game_id || null,
      category,
      tags: tags || [],
      status: postStatus,
      published_at: publishedAt,
      meta_title: meta_title ? meta_title.slice(0, 70) : null,
      meta_description: meta_description ? meta_description.slice(0, 160) : null,
      allow_comments: allow_comments !== false,
    };

    // Optional columns that depend on migrations being applied
    const optionalExtras: Record<string, unknown> = {
      ...(content_json ? { content_json } : {}),
      ...(template ? { template } : {}),
      ...(color_palette ? { color_palette } : {}),
    };

    const selectQuery = `
      *,
      author:profiles!blog_posts_author_id_fkey(
        id, username, display_name, avatar_url
      ),
      game:games!blog_posts_game_id_fkey(
        id, slug, name, icon_url
      )
    `;

    // Try with all optional columns first
    let { data: post, error: postError } = await supabase
      .from("blog_posts")
      .insert({ ...coreData, ...optionalExtras } as never)
      .select(selectQuery)
      .single();

    // If it failed (likely missing columns), retry with core data only
    if (postError) {
      console.error("Blog insert attempt 1 failed:", postError.message);

      // Use a different slug for the retry to avoid unique constraint conflicts
      const retryData = { ...coreData, slug: `${slug}-${Date.now()}` };

      const retry = await supabase
        .from("blog_posts")
        .insert(retryData as never)
        .select(selectQuery)
        .single();

      post = retry.data;
      postError = retry.error;
    }

    if (postError) {
      console.error("Error creating blog post:", postError);
      return NextResponse.json(
        { error: postError.message || "Failed to create post" },
        { status: 500 }
      );
    }

    // Invalidate Next.js Router Cache so /community shows the new post
    revalidatePath("/community");

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Blog creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
