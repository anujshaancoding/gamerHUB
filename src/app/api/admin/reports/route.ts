import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const reportType = searchParams.get("report_type");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = admin
      .from("user_reports")
      .select(
        `
        *,
        reporter:profiles!user_reports_reporter_id_fkey(
          id, username, display_name, avatar_url
        ),
        reported_user:profiles!user_reports_reported_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (reportType) {
      query = query.eq("report_type", reportType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Admin reports list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reports: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { report_id, status, resolution_note, resolution_action } = body;

    if (!report_id || !status) {
      return NextResponse.json(
        { error: "report_id and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "investigating",
      "resolved",
      "dismissed",
      "escalated",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (["resolved", "dismissed"].includes(status)) {
      updates.resolved_by = user.id;
      updates.resolved_at = new Date().toISOString();
    }

    if (resolution_note) {
      updates.resolution_note = resolution_note;
    }
    if (resolution_action) {
      updates.resolution_action = resolution_action;
    }

    const { data, error } = await admin
      .from("user_reports")
      .update(updates)
      .eq("id", report_id)
      .select(
        `
        *,
        reporter:profiles!user_reports_reporter_id_fkey(
          id, username, display_name, avatar_url
        ),
        reported_user:profiles!user_reports_reported_user_id_fkey(
          id, username, display_name, avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error("Admin report update error:", error);
      return NextResponse.json(
        { error: "Failed to update report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    console.error("Admin report patch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
