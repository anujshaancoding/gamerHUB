import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

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

// GET - View automation logs
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const actionType = searchParams.get("type");

    const sql = getPool();

    let logs;
    let countResult;

    if (actionType) {
      logs = await sql`
        SELECT al.*, p.username, p.avatar_url
        FROM auto_logs al
        LEFT JOIN profiles p ON p.username = al.persona_username
        WHERE al.action_type = ${actionType}
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*)::int as total FROM auto_logs WHERE action_type = ${actionType}
      `;
    } else {
      logs = await sql`
        SELECT al.*, p.username, p.avatar_url
        FROM auto_logs al
        LEFT JOIN profiles p ON p.username = al.persona_username
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT COUNT(*)::int as total FROM auto_logs
      `;
    }

    // Today's stats + health check (last action time)
    const [todayStats] = await sql`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE action_type = 'post')::int as posts,
        COUNT(*) FILTER (WHERE action_type = 'comment')::int as comments,
        COUNT(*) FILTER (WHERE action_type = 'like')::int as likes
      FROM auto_logs
      WHERE created_at >= CURRENT_DATE
    `;

    const [healthRow] = await sql`
      SELECT MAX(created_at) as last_action_at FROM auto_logs
    `;

    return NextResponse.json({
      logs,
      total: countResult[0]?.total || 0,
      todayStats: todayStats || { total: 0, posts: 0, comments: 0, likes: 0 },
      lastActionAt: healthRow?.last_action_at || null,
    });
  } catch (error) {
    console.error("Logs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
