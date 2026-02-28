import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Get streamers list (live first, then all)
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const filter = searchParams.get("filter") || "all"; // live, all, featured
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("streamer_profiles")
      .select(`
        id,
        user_id,
        twitch_login,
        twitch_display_name,
        twitch_profile_image_url,
        twitch_broadcaster_type,
        stream_title,
        stream_game_name,
        status,
        current_viewer_count,
        last_stream_started_at,
        is_featured,
        follower_count,
        total_stream_hours,
        profile:profiles!user_id (
          username,
          display_name,
          avatar_url,
          level
        )
      `, { count: "exact" });

    // Apply filters
    if (filter === "live") {
      query = query.eq("status", "live");
    } else if (filter === "featured") {
      query = query.eq("is_featured", true);
    }

    // Sort: live first, then by viewer count, then by follower count
    query = query
      .order("status", { ascending: true }) // 'live' comes before 'offline'
      .order("is_featured", { ascending: false })
      .order("current_viewer_count", { ascending: false })
      .order("follower_count", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: streamers, error, count } = await query;

    if (error) {
      console.error("Error fetching streamers:", error);
      return NextResponse.json(
        { error: "Failed to fetch streamers" },
        { status: 500 }
      );
    }

    // Separate live and offline
    const liveStreamers = streamers?.filter((s) => s.status === "live") || [];
    const offlineStreamers = streamers?.filter((s) => s.status !== "live") || [];

    return cachedResponse(
      {
        streamers: [...liveStreamers, ...offlineStreamers],
        liveCount: liveStreamers.length,
        total: count || 0,
        limit,
        offset,
      },
      CACHE_DURATIONS.LEADERBOARD
    );
  } catch (error) {
    console.error("Streamers fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
