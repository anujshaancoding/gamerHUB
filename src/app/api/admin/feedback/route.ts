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
        "id, user_id, message, category, image_url, page_url, user_agent, created_at, profiles:user_id(username, display_name, avatar_url)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Admin feedback fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      page,
    });
  } catch (error) {
    console.error("Admin feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
