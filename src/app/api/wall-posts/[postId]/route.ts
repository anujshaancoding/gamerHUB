import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const sql = getPool();

    // Fetch the post to check ownership
    const posts = await sql`
      SELECT id, author_id, profile_id
      FROM profile_wall_posts
      WHERE id = ${postId}
    `;

    if (posts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = posts[0];

    // Only allow the post author or the wall owner to delete
    if (post.author_id !== user.id && post.profile_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await sql`
      DELETE FROM profile_wall_posts WHERE id = ${postId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Wall post delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const sql = getPool();

    // Fetch the post to check wall ownership
    const posts = await sql`
      SELECT id, profile_id
      FROM profile_wall_posts
      WHERE id = ${postId}
    `;

    if (posts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = posts[0];

    // Only the wall owner can pin/unpin posts
    if (post.profile_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { is_pinned } = body;

    if (typeof is_pinned !== "boolean") {
      return NextResponse.json(
        { error: "is_pinned must be a boolean" },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE profile_wall_posts
      SET is_pinned = ${is_pinned}
      WHERE id = ${postId}
      RETURNING *
    `;

    return NextResponse.json({ post: rows[0] });
  } catch (error) {
    console.error("Wall post update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
