import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
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

    const range = parseInt(request.nextUrl.searchParams.get("range") || "30", 10);
    const daysBack = [7, 30, 90].includes(range) ? range : 30;

    // Fetch daily views and top pages in parallel
    const [dailyResult, topPagesResult] = await Promise.all([
      admin.rpc("get_daily_page_views", { days_back: daysBack }),
      admin.rpc("get_top_pages", { days_back: daysBack, page_limit: 10 }),
    ]);

    const daily = dailyResult.data || [];
    const topPages = topPagesResult.data || [];

    // Compute summary stats
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const todayData = daily.find((d: { date: string }) => d.date === today);
    const yesterdayData = daily.find((d: { date: string }) => d.date === yesterday);

    const totalViews = daily.reduce(
      (sum: number, d: { total_views: number }) => sum + Number(d.total_views),
      0
    );
    const avgDailyViews = daily.length > 0 ? Math.round(totalViews / daily.length) : 0;

    return NextResponse.json({
      daily,
      topPages,
      summary: {
        todayViews: Number(todayData?.total_views || 0),
        todayUnique: Number(todayData?.unique_visitors || 0),
        yesterdayViews: Number(yesterdayData?.total_views || 0),
        totalViews,
        avgDailyViews,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
