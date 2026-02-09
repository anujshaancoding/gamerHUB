import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AnalyticsTimeRange } from "@/types/creator";

// GET - Get creator analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get("range") || "30d") as AnalyticsTimeRange;

    // Get creator profile
    const { data: profile, error: profileError } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
        previousStartDate = new Date(0);
    }

    // Get current period analytics
    const { data: currentAnalytics } = await supabase
      .from("creator_analytics")
      .select("*")
      .eq("creator_id", profile.id)
      .gte("date", startDate.toISOString().split("T")[0]);

    // Get previous period analytics for comparison
    const { data: previousAnalytics } = await supabase
      .from("creator_analytics")
      .select("*")
      .eq("creator_id", profile.id)
      .gte("date", previousStartDate.toISOString().split("T")[0])
      .lt("date", startDate.toISOString().split("T")[0]);

    // Calculate totals
    const currentTotals = {
      views: 0,
      profileViews: 0,
      clipViews: 0,
      newFollowers: 0,
      engagements: 0,
    };

    const previousTotals = {
      views: 0,
      newFollowers: 0,
      engagements: 0,
    };

    currentAnalytics?.forEach(day => {
      currentTotals.views += (day.profile_views || 0) + (day.clip_views || 0);
      currentTotals.profileViews += day.profile_views || 0;
      currentTotals.clipViews += day.clip_views || 0;
      currentTotals.newFollowers += day.new_followers || 0;
      currentTotals.engagements += day.engagements || 0;
    });

    previousAnalytics?.forEach(day => {
      previousTotals.views += (day.profile_views || 0) + (day.clip_views || 0);
      previousTotals.newFollowers += day.new_followers || 0;
      previousTotals.engagements += day.engagements || 0;
    });

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Get total follower count
    const { count: totalFollowers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id);

    // Get total clip count
    const { count: totalClips } = await supabase
      .from("creator_clips")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", profile.id);

    // Get total likes on clips
    const { data: clipLikes } = await supabase
      .from("creator_clips")
      .select("likes_count")
      .eq("creator_id", profile.id);

    const totalLikes = clipLikes?.reduce((sum, clip) => sum + (clip.likes_count || 0), 0) || 0;

    // Calculate engagement rate
    const engagementRate = currentTotals.views > 0
      ? Math.round((currentTotals.engagements / currentTotals.views) * 100 * 10) / 10
      : 0;

    // Build chart data (daily breakdown)
    const chartData = (currentAnalytics || []).map(day => ({
      date: day.date,
      views: (day.profile_views || 0) + (day.clip_views || 0),
      followers: day.new_followers || 0,
      engagements: day.engagements || 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Get top performing content
    const { data: topClips } = await supabase
      .from("creator_clips")
      .select("id, title, thumbnail_url, views_count, likes_count")
      .eq("creator_id", profile.id)
      .order("views_count", { ascending: false })
      .limit(5);

    const topContent = (topClips || []).map(clip => ({
      id: clip.id,
      title: clip.title,
      type: "clip" as const,
      views: clip.views_count || 0,
      likes: clip.likes_count || 0,
      thumbnail: clip.thumbnail_url,
    }));

    // Get audience insights
    const { data: followerGames } = await supabase
      .from("follows")
      .select(`
        follower:users!follows_follower_id_fkey(
          game_stats(games(name))
        )
      `)
      .eq("following_id", user.id)
      .limit(100);

    // Count game preferences
    const gameCount: Record<string, number> = {};
    followerGames?.forEach(f => {
      (f.follower as any)?.game_stats?.forEach((gs: any) => {
        const gameName = gs.games?.name;
        if (gameName) {
          gameCount[gameName] = (gameCount[gameName] || 0) + 1;
        }
      });
    });

    const totalGameEntries = Object.values(gameCount).reduce((a, b) => a + b, 0);
    const audienceGames = Object.entries(gameCount)
      .map(([label, value]) => ({
        label,
        value,
        percentage: totalGameEntries > 0 ? Math.round((value / totalGameEntries) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalViews: currentTotals.views,
        totalFollowers: totalFollowers || 0,
        totalClips: totalClips || 0,
        totalLikes,
        viewsTrend: calculateTrend(currentTotals.views, previousTotals.views),
        followersTrend: calculateTrend(currentTotals.newFollowers, previousTotals.newFollowers),
        engagementRate,
      },
      chartData,
      topContent,
      audienceInsights: [
        {
          metric: "Top Games",
          breakdown: audienceGames,
        },
      ],
      breakdown: {
        profileViews: currentTotals.profileViews,
        clipViews: currentTotals.clipViews,
        newFollowers: currentTotals.newFollowers,
      },
    });
  } catch (error) {
    console.error("Get creator analytics error:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}

// POST - Record analytics event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { creator_id, event_type, metadata } = body;

    if (!creator_id || !event_type) {
      return NextResponse.json(
        { error: "creator_id and event_type are required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Get or create today's analytics record
    const { data: existing } = await supabase
      .from("creator_analytics")
      .select("*")
      .eq("creator_id", creator_id)
      .eq("date", today)
      .single();

    if (existing) {
      // Update existing record
      const updates: Record<string, number> = {};

      switch (event_type) {
        case "profile_view":
          updates.profile_views = (existing.profile_views || 0) + 1;
          break;
        case "clip_view":
          updates.clip_views = (existing.clip_views || 0) + 1;
          break;
        case "new_follower":
          updates.new_followers = (existing.new_followers || 0) + 1;
          break;
        case "engagement":
          updates.engagements = (existing.engagements || 0) + 1;
          break;
      }

      await supabase
        .from("creator_analytics")
        .update(updates)
        .eq("id", existing.id);
    } else {
      // Create new record
      const newRecord: Record<string, unknown> = {
        creator_id,
        date: today,
        profile_views: event_type === "profile_view" ? 1 : 0,
        clip_views: event_type === "clip_view" ? 1 : 0,
        new_followers: event_type === "new_follower" ? 1 : 0,
        engagements: event_type === "engagement" ? 1 : 0,
      };

      await supabase.from("creator_analytics").insert(newRecord);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Record analytics error:", error);
    return NextResponse.json(
      { error: "Failed to record analytics" },
      { status: 500 }
    );
  }
}
