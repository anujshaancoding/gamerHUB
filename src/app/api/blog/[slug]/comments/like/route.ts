import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST - Toggle like on a blog comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json({ error: "comment_id is required" }, { status: 400 });
    }

    // Get post ID from slug
    const { data: post } = await db
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify comment exists and belongs to this post
    const { data: comment } = await db
      .from("blog_comments")
      .select("id, likes_count")
      .eq("id", comment_id)
      .eq("post_id", post.id)
      .single();

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike } = await db
      .from("blog_comment_likes")
      .select("id")
      .eq("comment_id", comment_id)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Unlike
      await db
        .from("blog_comment_likes")
        .delete()
        .eq("comment_id", comment_id)
        .eq("user_id", user.id);

      // Decrement likes count
      await db
        .from("blog_comments")
        .update({ likes_count: Math.max(0, (comment.likes_count || 1) - 1) } as never)
        .eq("id", comment_id);

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.from("blog_comment_likes").insert({
        comment_id,
        user_id: user.id,
      } as never);

      // Increment likes count
      await db
        .from("blog_comments")
        .update({ likes_count: (comment.likes_count || 0) + 1 } as never)
        .eq("id", comment_id);

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Blog comment like toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
