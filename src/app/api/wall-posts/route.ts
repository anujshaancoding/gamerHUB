import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";
import { validateBody } from "@/lib/security/validate-body";

const VALID_REACTIONS = ["gg", "respect", "carry", "legend", "wholesome"] as const;

const WallPostSchema = z.object({
  profileId: z.string().uuid("must be a valid UUID"),
  content: z.string().trim().min(1, "content is required").max(500, "max 500 chars"),
  reaction: z.enum(VALID_REACTIONS).nullish(),
});

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    const viewer = await getUser();
    const viewerId = viewer?.id ?? null;

    const sql = getPool();
    const posts = await sql`
      SELECT
        wp.*,
        p.avatar_url   AS author_avatar_url,
        p.username      AS author_username,
        p.display_name  AS author_display_name,
        COALESCE(lc.like_count, 0)::int AS like_count,
        ${viewerId}::uuid IS NOT NULL AND ml.user_id IS NOT NULL AS liked_by_me
      FROM profile_wall_posts wp
      LEFT JOIN profiles p ON p.id = wp.author_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS like_count
        FROM profile_wall_post_likes
        GROUP BY post_id
      ) lc ON lc.post_id = wp.id
      LEFT JOIN profile_wall_post_likes ml
        ON ml.post_id = wp.id AND ml.user_id = ${viewerId}
      WHERE wp.profile_id = ${profileId}
      ORDER BY wp.is_pinned DESC, wp.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Wall posts fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await validateBody(request, WallPostSchema);
    if (!parsed.ok) return parsed.response;
    const { profileId, content, reaction } = parsed.data;

    const sql = getPool();
    const rows = await sql`
      INSERT INTO profile_wall_posts (profile_id, author_id, content, reaction)
      VALUES (${profileId}, ${user.id}, ${content}, ${reaction ?? null})
      RETURNING *
    `;

    const post = rows[0];

    // Fetch the author profile data to include in the response
    const authorRows = await sql`
      SELECT avatar_url, username, display_name
      FROM profiles
      WHERE id = ${user.id}
    `;

    const author = authorRows[0];
    const enrichedPost = {
      ...post,
      author_avatar_url: author?.avatar_url ?? null,
      author_username: author?.username ?? null,
      author_display_name: author?.display_name ?? null,
      like_count: 0,
      liked_by_me: false,
    };

    return NextResponse.json({ post: enrichedPost }, { status: 201 });
  } catch (error) {
    console.error("Wall post create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
