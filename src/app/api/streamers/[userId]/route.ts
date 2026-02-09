import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get a specific streamer's profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch streamer profile
    const { data: streamer, error } = await supabase
      .from("streamer_profiles")
      .select(`
        id,
        user_id,
        twitch_id,
        twitch_login,
        twitch_display_name,
        twitch_profile_image_url,
        twitch_broadcaster_type,
        stream_title,
        stream_game_name,
        stream_language,
        status,
        current_viewer_count,
        last_stream_started_at,
        last_stream_ended_at,
        is_featured,
        embed_enabled,
        total_stream_hours,
        peak_viewer_count,
        follower_count,
        connected_at,
        profile:profiles!user_id (
          username,
          display_name,
          avatar_url,
          level,
          title,
          bio
        )
      `)
      .eq("user_id", userId)
      .single();

    if (error || !streamer) {
      return NextResponse.json(
        { error: "Streamer not found" },
        { status: 404 }
      );
    }

    // Check if current user is following
    let isFollowing = false;
    if (user) {
      const { data: follow } = await supabase
        .from("streamer_follows")
        .select("id")
        .eq("user_id", user.id)
        .eq("streamer_id", streamer.id)
        .single();

      isFollowing = !!follow;
    }

    // Get stream schedule
    const { data: schedule } = await supabase
      .from("stream_schedules")
      .select("*")
      .eq("streamer_id", streamer.id)
      .order("day_of_week")
      .order("start_time");

    // Get recent streams
    const { data: recentStreams } = await supabase
      .from("stream_history")
      .select("*")
      .eq("streamer_id", streamer.id)
      .order("started_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      streamer: {
        ...streamer,
        is_following: isFollowing,
      },
      schedule: schedule || [],
      recentStreams: recentStreams || [],
    });
  } catch (error) {
    console.error("Streamer fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
