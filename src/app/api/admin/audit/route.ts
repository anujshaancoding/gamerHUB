/**
 * Admin audit log — read-only list of recorded admin actions.
 *
 *   GET /api/admin/audit?limit=50&offset=0&action=user.delete_user&actor=foo
 *
 * Viewing is open to any admin (read-only). The privileged ACTIONS that get
 * logged here remain super_admin-gated where they already were.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";

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

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
    const action = searchParams.get("action")?.trim();
    const actor = searchParams.get("actor")?.trim();

    const db = createAdminClient();
    let query = db.from("admin_audit").select("*", { count: "exact" });
    if (action) query = query.eq("action", action);
    if (actor) query = query.ilike("actor_email", `%${actor}%`);
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      logger.error("Admin audit GET error", error);
      return NextResponse.json({ error: "Failed to load audit log" }, { status: 500 });
    }

    return NextResponse.json({ logs: data ?? [], total: count ?? 0, limit, offset });
  } catch (error) {
    logger.error("Admin audit GET error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
