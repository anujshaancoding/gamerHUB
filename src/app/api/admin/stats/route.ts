import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // Fetch basic platform stats
    const [usersResult, postsResult] = await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      admin
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
    ]);

    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      totalPosts: postsResult.count || 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
