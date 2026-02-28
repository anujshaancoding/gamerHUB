import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

export async function GET() {
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

    // Fetch platform stats in parallel
    const [usersResult, postsResult, pendingPostsResult, pendingReportsResult, messagesResult, pendingNewsResult, publishedNewsResult, feedbackResult] = await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      admin
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      admin
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      admin
        .from("user_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("messages")
        .select("id", { count: "exact", head: true }),
      admin
        .from("news_articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("news_articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      admin
        .from("beta_feedback")
        .select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      totalPosts: postsResult.count || 0,
      pendingPosts: pendingPostsResult.count || 0,
      pendingReports: pendingReportsResult.count || 0,
      totalMessages: messagesResult.count || 0,
      pendingNews: pendingNewsResult.count || 0,
      publishedNews: publishedNewsResult.count || 0,
      totalFeedback: feedbackResult.count || 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
