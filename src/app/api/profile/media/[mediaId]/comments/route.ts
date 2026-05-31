/**
 * Flat comments on a showcase media item.
 *
 *   GET    /api/profile/media/<mediaId>/comments        public list (+ can_delete per viewer)
 *   POST   /api/profile/media/<mediaId>/comments        auth — add a comment
 *   DELETE /api/profile/media/<mediaId>/comments?id=<c> auth — delete (author, media owner, or admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ mediaId: string }>;
}

const MAX_COMMENT_LENGTH = 500;

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { mediaId } = await params;
    const viewer = await getUser();
    const viewerId = viewer?.id ?? null;
    const sql = getPool();

    // The media owner (and admins) can moderate any comment on this item.
    const mediaRows = await sql`SELECT user_id FROM media WHERE id = ${mediaId}`;
    if (mediaRows.length === 0) {
      return NextResponse.json({ comments: [] });
    }
    const ownerId = mediaRows[0].user_id as string;

    let isAdmin = false;
    if (viewerId) {
      const p = await sql`SELECT is_admin FROM profiles WHERE id = ${viewerId}`;
      isAdmin = p[0]?.is_admin === true;
    }

    const rows = await sql`
      SELECT c.id, c.content, c.created_at, c.author_id,
             p.username, p.display_name, p.avatar_url
      FROM profile_media_comments c
      LEFT JOIN profiles p ON p.id = c.author_id
      WHERE c.media_id = ${mediaId}
      ORDER BY c.created_at ASC
      LIMIT 300
    `;

    const comments = rows.map((r) => ({
      ...r,
      can_delete:
        !!viewerId &&
        (viewerId === r.author_id || viewerId === ownerId || isAdmin),
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Media comments fetch error:", error);
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaId } = await params;
    const body = await request.json();
    const content = (body.content ?? "").toString().trim();

    if (!content) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment too long (max ${MAX_COMMENT_LENGTH} characters)` },
        { status: 400 }
      );
    }

    const sql = getPool();
    const media = await sql`SELECT id FROM media WHERE id = ${mediaId}`;
    if (media.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const inserted = await sql`
      INSERT INTO profile_media_comments (media_id, author_id, content)
      VALUES (${mediaId}, ${user.id}, ${content})
      RETURNING id, content, created_at, author_id
    `;
    const p = await sql`
      SELECT username, display_name, avatar_url FROM profiles WHERE id = ${user.id}
    `;

    const comment = {
      ...inserted[0],
      username: p[0]?.username ?? null,
      display_name: p[0]?.display_name ?? null,
      avatar_url: p[0]?.avatar_url ?? null,
      can_delete: true,
    };

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Media comment create error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaId } = await params;
    const commentId = request.nextUrl.searchParams.get("id");
    if (!commentId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const sql = getPool();

    // Load the comment with its media owner so we can authorize the delete.
    const rows = await sql`
      SELECT c.id, c.author_id, m.user_id AS media_owner_id
      FROM profile_media_comments c
      JOIN media m ON m.id = c.media_id
      WHERE c.id = ${commentId} AND c.media_id = ${mediaId}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { author_id, media_owner_id } = rows[0];
    let allowed = user.id === author_id || user.id === media_owner_id;
    if (!allowed) {
      const p = await sql`SELECT is_admin FROM profiles WHERE id = ${user.id}`;
      allowed = p[0]?.is_admin === true;
    }
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await sql`DELETE FROM profile_media_comments WHERE id = ${commentId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media comment delete error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
