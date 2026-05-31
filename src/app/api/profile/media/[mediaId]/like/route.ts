/**
 * Toggle the current user's like on a showcase media item.
 *
 *   POST /api/profile/media/<mediaId>/like   auth — like/unlike toggle
 *
 * Mirrors the wall-post like pattern (profile_wall_post_likes).
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ mediaId: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaId } = await params;
    const sql = getPool();

    // Ensure the media item exists
    const media = await sql`SELECT id FROM media WHERE id = ${mediaId}`;
    if (media.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Toggle: delete if already liked, otherwise insert
    const existing = await sql`
      SELECT id FROM profile_media_likes
      WHERE media_id = ${mediaId} AND user_id = ${user.id}
    `;

    let liked: boolean;
    if (existing.length > 0) {
      await sql`
        DELETE FROM profile_media_likes
        WHERE media_id = ${mediaId} AND user_id = ${user.id}
      `;
      liked = false;
    } else {
      await sql`
        INSERT INTO profile_media_likes (media_id, user_id)
        VALUES (${mediaId}, ${user.id})
        ON CONFLICT (media_id, user_id) DO NOTHING
      `;
      liked = true;
    }

    const countRows = await sql`
      SELECT COUNT(*)::int AS like_count
      FROM profile_media_likes
      WHERE media_id = ${mediaId}
    `;

    return NextResponse.json({
      liked,
      like_count: countRows[0]?.like_count ?? 0,
    });
  } catch (error) {
    console.error("Media like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
