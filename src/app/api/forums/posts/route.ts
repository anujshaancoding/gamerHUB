import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Get forum posts
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get("categoryId");
    const categorySlug = searchParams.get("category");
    const postType = searchParams.get("type");
    const sort = searchParams.get("sort") || "latest"; // latest, popular, unanswered
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    // Build query
    let query = db
      .from("forum_posts")
      .select(`
        id,
        category_id,
        title,
        slug,
        content,
        post_type,
        tags,
        is_pinned,
        is_locked,
        is_solved,
        view_count,
        reply_count,
        vote_score,
        last_reply_at,
        created_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        last_reply_author:profiles!last_reply_by (
          id,
          username,
          display_name
        ),
        category:forum_categories!category_id (
          id,
          slug,
          name,
          icon,
          color
        )
      `, { count: "exact" })
      .eq("is_deleted", false);

    // Filter by category
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    } else if (categorySlug) {
      // Get category ID from slug
      const { data: category } = await db
        .from("forum_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (category) {
        query = query.eq("category_id", category.id);
      }
    }

    // Filter by post type
    if (postType) {
      query = query.eq("post_type", postType);
    }

    // Search
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Sort
    switch (sort) {
      case "popular":
        query = query
          .order("is_pinned", { ascending: false })
          .order("vote_score", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "unanswered":
        query = query
          .eq("post_type", "question")
          .eq("is_solved", false)
          .order("created_at", { ascending: false });
        break;
      case "latest":
      default:
        query = query
          .order("is_pinned", { ascending: false })
          .order("last_reply_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Posts fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new forum post
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, title, content, postType = "discussion", tags = [] } = body;

    // Validate required fields
    if (!categoryId || !title || !content) {
      return NextResponse.json(
        { error: "Category, title, and content are required" },
        { status: 400 }
      );
    }

    if (title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 5 and 200 characters" },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Check if category exists and is not locked
    const { data: category, error: catError } = await db
      .from("forum_categories")
      .select("id, is_locked")
      .eq("id", categoryId)
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category.is_locked) {
      return NextResponse.json(
        { error: "This category is locked" },
        { status: 403 }
      );
    }

    // Create post using function
    const { data: postId, error: postError } = await db.rpc(
      "create_forum_post",
      {
        p_category_id: categoryId,
        p_author_id: user.id,
        p_title: title,
        p_content: content,
        p_post_type: postType,
        p_tags: tags,
      }
    );

    if (postError) {
      console.error("Error creating post:", postError);
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }

    // Fetch the created post
    const { data: post } = await db
      .from("forum_posts")
      .select(`
        id,
        slug,
        title,
        category:forum_categories!category_id (
          slug
        )
      `)
      .eq("id", postId)
      .single();

    return NextResponse.json({
      success: true,
      postId,
      slug: post?.slug,
      categorySlug: post?.category?.slug,
    });
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
