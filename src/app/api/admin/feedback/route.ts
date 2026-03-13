import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check admin access
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = admin
      .from("beta_feedback")
      .select(
        "id, user_id, message, category, image_url, page_url, user_agent, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error("Admin feedback fetch error", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    const rows = (data || []) as Record<string, unknown>[];

    // Fetch profiles for feedback items that have a user_id
    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
    let profileMap = new Map<string, Record<string, unknown>>();

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      if (profiles) {
        for (const p of profiles as Record<string, unknown>[]) {
          profileMap.set(p.id as string, p);
        }
      }
    }

    const feedback = rows.map((row) => ({
      ...row,
      profiles: row.user_id ? profileMap.get(row.user_id as string) ?? null : null,
    }));

    return NextResponse.json({
      feedback,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      page,
    });
  } catch (error) {
    logger.error("Admin feedback API error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
