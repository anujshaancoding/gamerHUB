/**
 * Profile media gallery API — screenshots, clips/GIFs, score shots, skin/asset
 * showcase. DB-backed (media table) to integrate with the real profile.
 *
 *  GET    /api/profile/media?userId=<id>   public items (owner sees all)
 *  POST   /api/profile/media               auth — add an item
 *  DELETE /api/profile/media?id=<id>       auth — remove own item
 */

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";
import { deleteUploadedFileByUrl } from "@/lib/services/uploads/delete-file";

const ALLOWED_TYPES = ["image", "video"] as const;

// Max showcase items per user — prevents one account from filling the disk.
// Keep in sync with MEDIA_LIMIT in profile-media-gallery.tsx.
const MEDIA_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const viewer = await getUser();
    const isOwner = viewer?.id === userId;
    const viewerId = viewer?.id ?? null;
    const sql = getPool();

    // Owners see everything; everyone else sees only public items. Each row is
    // enriched with like/comment counts and whether the viewer has liked it.
    const rows = await sql`
      SELECT
        m.*,
        COALESCE(lc.like_count, 0)::int    AS like_count,
        COALESCE(cc.comment_count, 0)::int AS comment_count,
        (${viewerId}::uuid IS NOT NULL AND ml.user_id IS NOT NULL) AS liked_by_me
      FROM media m
      LEFT JOIN (
        SELECT media_id, COUNT(*) AS like_count
        FROM profile_media_likes GROUP BY media_id
      ) lc ON lc.media_id = m.id
      LEFT JOIN (
        SELECT media_id, COUNT(*) AS comment_count
        FROM profile_media_comments GROUP BY media_id
      ) cc ON cc.media_id = m.id
      LEFT JOIN profile_media_likes ml
        ON ml.media_id = m.id AND ml.user_id = ${viewerId}
      WHERE m.user_id = ${userId}
        AND (m.is_public = true OR ${isOwner})
      ORDER BY m.created_at DESC
      LIMIT 60
    `;

    // Owner needs the true total (rows are capped at 60) to enforce the limit.
    let total = rows.length;
    if (isOwner) {
      const totalRows = await sql`SELECT COUNT(*)::int AS n FROM media WHERE user_id = ${userId}`;
      total = totalRows[0]?.n ?? rows.length;
    }

    return NextResponse.json({ media: rows, total, limit: MEDIA_LIMIT });
  } catch (error) {
    console.error("Media fetch error:", error);
    return NextResponse.json({ media: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const type = ALLOWED_TYPES.includes(body.type) ? body.type : "image";
    const url = typeof body.url === "string" ? body.url : null;
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const sqlPool = getPool();

    // Enforce the per-user showcase cap (disk-fill protection).
    const countRows = await sqlPool`
      SELECT COUNT(*)::int AS n FROM media WHERE user_id = ${user.id}`;
    if ((countRows[0]?.n ?? 0) >= MEDIA_LIMIT) {
      return NextResponse.json(
        {
          error: `You've reached the ${MEDIA_LIMIT}-item showcase limit. Delete something to add more.`,
        },
        { status: 403 }
      );
    }
    const title = (body.title ?? "").toString().slice(0, 120) || null;
    const description = (body.description ?? "").toString().slice(0, 500) || null;
    const thumbnail_url =
      typeof body.thumbnail_url === "string" ? body.thumbnail_url : null;
    const is_public = body.is_public !== false;

    const rows = await sqlPool`
      INSERT INTO media (user_id, type, url, thumbnail_url, title, description, is_public)
      VALUES (${user.id}, ${type}, ${url}, ${thumbnail_url}, ${title}, ${description}, ${is_public})
      RETURNING *`;

    return NextResponse.json({ media: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Media create error:", error);
    return NextResponse.json(
      { error: "Failed to add media" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Only the title and visibility are editable; build the SET from whatever
    // was provided so an empty title can be cleared (null) but omitted fields
    // are left untouched.
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) {
      const t = (body.title ?? "").toString().slice(0, 120).trim();
      updates.title = t || null;
    }
    if (typeof body.is_public === "boolean") {
      updates.is_public = body.is_public;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const sql = getPool();
    const rows = await sql`
      UPDATE media SET ${sql(updates)}
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ media: rows[0] });
  } catch (error) {
    console.error("Media update error:", error);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const sql = getPool();
    const rows = await sql`
      DELETE FROM media WHERE id = ${id} AND user_id = ${user.id}
      RETURNING url, thumbnail_url`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove the underlying files so they don't orphan on disk. Likes and
    // comments are cleaned up automatically by ON DELETE CASCADE.
    await deleteUploadedFileByUrl(rows[0].url);
    await deleteUploadedFileByUrl(rows[0].thumbnail_url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
