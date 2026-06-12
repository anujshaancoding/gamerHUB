/**
 * Admin forum moderation.
 *
 *   GET   /api/admin/forum?view=posts|replies|categories&search=&category=&status=
 *   PATCH /api/admin/forum   body: { entity, id, action, value? }
 *
 * Lets an admin moderate ANY post/reply regardless of author (the public forum
 * routes are owner-only). Every mutating action is written to the audit log.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";
import { sanitizeSearchQuery } from "@/lib/utils/sanitize-search";
import { logAdminAction, getRequestIp } from "@/lib/admin/audit";

async function requireAdmin() {
  const user = await getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return profile?.is_admin ? user : null;
}

// ── GET: lists for the moderation UI ────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = createAdminClient();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "posts";

    if (view === "categories") {
      const { data, error } = await db
        .from("forum_categories")
        .select("id, slug, name, parent_id, post_count, is_locked, is_hidden, display_order")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return NextResponse.json({ categories: data ?? [] });
    }

    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("category")?.trim();
    const status = searchParams.get("status") || "all"; // all | active | deleted | locked | pinned

    if (view === "replies") {
      let q = db
        .from("forum_replies")
        .select(
          `id, post_id, content, vote_score, is_solution, is_deleted, created_at,
           author:profiles!author_id ( id, username, display_name, avatar_url ),
           post:forum_posts!post_id ( id, title, slug )`,
          { count: "exact" }
        );
      if (status === "deleted") q = q.eq("is_deleted", true);
      else if (status === "active") q = q.eq("is_deleted", false);
      if (search) q = q.ilike("content", `%${sanitizeSearchQuery(search)}%`);
      q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return NextResponse.json({ replies: data ?? [], total: count ?? 0, limit, offset });
    }

    // view === "posts"
    let q = db
      .from("forum_posts")
      .select(
        `id, category_id, title, slug, post_type, tags, is_pinned, is_locked, is_solved,
         is_deleted, view_count, reply_count, vote_score, created_at,
         author:profiles!author_id ( id, username, display_name, avatar_url ),
         category:forum_categories!category_id ( id, slug, name )`,
        { count: "exact" }
      );
    if (categoryId) q = q.eq("category_id", categoryId);
    if (status === "deleted") q = q.eq("is_deleted", true);
    else if (status === "active") q = q.eq("is_deleted", false);
    else if (status === "locked") q = q.eq("is_locked", true);
    else if (status === "pinned") q = q.eq("is_pinned", true);
    if (search) q = q.ilike("title", `%${sanitizeSearchQuery(search)}%`);
    q = q
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    const { data, error, count } = await q;
    if (error) throw error;
    return NextResponse.json({ posts: data ?? [], total: count ?? 0, limit, offset });
  } catch (error) {
    logger.error("Admin forum GET error", error);
    return NextResponse.json({ error: "Failed to load forum data" }, { status: 500 });
  }
}

// ── PATCH: moderation actions ───────────────────────────────────────────────

const POST_ACTIONS: Record<string, Record<string, unknown>> = {
  pin: { is_pinned: true },
  unpin: { is_pinned: false },
  lock: { is_locked: true },
  unlock: { is_locked: false },
};

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = createAdminClient();
    const body = await request.json();
    const { entity, id, action, value } = body as {
      entity: "post" | "reply" | "category";
      id: string;
      action: string;
      value?: number;
    };
    if (!entity || !id || !action) {
      return NextResponse.json({ error: "entity, id and action are required" }, { status: 400 });
    }

    let table: string;
    let update: Record<string, unknown>;

    if (entity === "post") {
      table = "forum_posts";
      if (action === "delete") update = { is_deleted: true, deleted_by: user.id };
      else if (action === "restore") update = { is_deleted: false, deleted_by: null };
      else if (POST_ACTIONS[action]) update = POST_ACTIONS[action]!;
      else return NextResponse.json({ error: `Invalid post action: ${action}` }, { status: 400 });
    } else if (entity === "reply") {
      table = "forum_replies";
      if (action === "delete") update = { is_deleted: true };
      else if (action === "restore") update = { is_deleted: false };
      else return NextResponse.json({ error: `Invalid reply action: ${action}` }, { status: 400 });
    } else if (entity === "category") {
      table = "forum_categories";
      if (action === "lock") update = { is_locked: true };
      else if (action === "unlock") update = { is_locked: false };
      else if (action === "hide") update = { is_hidden: true };
      else if (action === "unhide") update = { is_hidden: false };
      else if (action === "reorder") update = { display_order: Number(value) || 0 };
      else return NextResponse.json({ error: `Invalid category action: ${action}` }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const { error } = await db.from(table).update(update).eq("id", id);
    if (error) {
      logger.error("Admin forum PATCH error", error);
      return NextResponse.json({ error: "Failed to apply moderation action" }, { status: 500 });
    }

    await logAdminAction(
      { id: user.id, email: user.email },
      {
        action: `forum.${entity}.${action}`,
        targetType: `forum_${entity}`,
        targetId: id,
        metadata: value != null ? { value } : null,
        ip: getRequestIp(request),
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin forum PATCH error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
