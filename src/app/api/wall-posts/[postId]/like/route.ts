import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

// POST toggles the current user's like on a wall post.
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const sql = getPool();

    // Ensure the post exists
    const posts = await sql`
      SELECT id FROM profile_wall_posts WHERE id = ${postId}
    `;
    if (posts.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle: delete if already liked, otherwise insert
    const existing = await sql`
      SELECT id FROM profile_wall_post_likes
      WHERE post_id = ${postId} AND user_id = ${user.id}
    `;

    let liked: boolean;
    if (existing.length > 0) {
      await sql`
        DELETE FROM profile_wall_post_likes
        WHERE post_id = ${postId} AND user_id = ${user.id}
      `;
      liked = false;
    } else {
      await sql`
        INSERT INTO profile_wall_post_likes (post_id, user_id)
        VALUES (${postId}, ${user.id})
        ON CONFLICT (post_id, user_id) DO NOTHING
      `;
      liked = true;
    }

    const countRows = await sql`
      SELECT COUNT(*)::int AS like_count
      FROM profile_wall_post_likes
      WHERE post_id = ${postId}
    `;

    return NextResponse.json({
      liked,
      like_count: countRows[0]?.like_count ?? 0,
    });
  } catch (error) {
    console.error("Wall post like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
