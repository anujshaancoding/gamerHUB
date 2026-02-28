import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Get a single post with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const db = createClient();
    const user = await getUser();

    // Fetch post
    const { data: post, error } = await db
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
        solved_reply_id,
        view_count,
        reply_count,
        vote_score,
        last_reply_at,
        created_at,
        updated_at,
        author:profiles!author_id (
          id,
          username,
          display_name,
          avatar_url,
          level,
          title
        ),
        category:forum_categories!category_id (
          id,
          slug,
          name,
          icon,
          color
        )
      `)
      .eq("id", postId)
      .eq("is_deleted", false)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get user's vote if authenticated
    let userVote = null;
    if (user) {
      const { data: vote } = await db
        .from("forum_votes")
        .select("vote_type")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

      userVote = vote?.vote_type || null;
    }

    // Increment view count (fire and forget)
    db.rpc("increment_post_views", { p_post_id: postId }).then();

    return NextResponse.json({
      post: {
        ...post,
        user_vote: userVote,
      },
    });
  } catch (error) {
    console.error("Post fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check post ownership
    const { data: post, error: postError } = await db
      .from("forum_posts")
      .select("author_id, is_deleted")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (post.is_deleted) {
      return NextResponse.json(
        { error: "Cannot edit deleted post" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, tags } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (tags) updates.tags = tags;

    const { error: updateError } = await db
      .from("forum_posts")
      .update(updates)
      .eq("id", postId);

    if (updateError) {
      console.error("Error updating post:", updateError);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check post ownership
    const { data: post, error: postError } = await db
      .from("forum_posts")
      .select("author_id, category_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.author_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    const { error: deleteError } = await db
      .from("forum_posts")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    // Decrement category post count
    await db
      .from("forum_categories")
      .update({ post_count: db.rpc("decrement", { x: 1 }) })
      .eq("id", post.category_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
