import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { noCacheResponse } from "@/lib/api/cache-headers";

// GET - Get pending news articles for moderation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin/editor role
    const admin = createAdminClient();
    const { data: authorRole } = await admin
      .from("blog_authors")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!authorRole || !["admin", "editor"].includes(authorRole.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "approved"; // approved = AI-approved, waiting for human
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: articles, error, count } = await (admin as ReturnType<typeof createAdminClient>)
      .from("news_articles" as never)
      .select("*", { count: "exact" })
      .in("status", status === "all" ? ["pending", "approved"] : [status])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching pending articles:", error);
      return NextResponse.json(
        { error: "Failed to fetch pending articles" },
        { status: 500 }
      );
    }

    return noCacheResponse({
      articles: articles || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Pending news error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
