import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

const VALID_REACTIONS = ["gg", "respect", "carry", "legend", "wholesome"] as const;

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    const sql = getPool();
    const posts = await sql`
      SELECT
        wp.*,
        p.avatar_url   AS author_avatar_url,
        p.username      AS author_username,
        p.display_name  AS author_display_name
      FROM profile_wall_posts wp
      LEFT JOIN profiles p ON p.id = wp.author_id
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

    const body = await request.json();
    const { profileId, content, reaction } = body;

    if (!profileId || typeof profileId !== "string") {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.trim().length > 500) {
      return NextResponse.json(
        { error: "Content must be 500 characters or less" },
        { status: 400 }
      );
    }

    if (reaction !== undefined && reaction !== null) {
      if (!VALID_REACTIONS.includes(reaction)) {
        return NextResponse.json(
          { error: `Invalid reaction. Must be one of: ${VALID_REACTIONS.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const sql = getPool();
    const rows = await sql`
      INSERT INTO profile_wall_posts (profile_id, author_id, content, reaction)
      VALUES (${profileId}, ${user.id}, ${content.trim()}, ${reaction || null})
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
