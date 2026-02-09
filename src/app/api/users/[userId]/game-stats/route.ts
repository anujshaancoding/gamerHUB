import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get a user's public game stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    // Fetch user's game stats (public)
    let query = supabase
      .from("game_stats")
      .select(`
        id,
        game_id,
        game_mode,
        season,
        stats,
        rank_info,
        synced_at,
        game_connections!inner (
          provider,
          provider_username,
          is_active
        )
      `)
      .eq("user_id", userId)
      .eq("game_connections.is_active", true);

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data: stats, error } = await query;

    if (error) {
      console.error("Error fetching user game stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch game stats" },
        { status: 500 }
      );
    }

    // Also fetch recent match history
    let matchQuery = supabase
      .from("game_match_history")
      .select("*")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(10);

    if (gameId) {
      matchQuery = matchQuery.eq("game_id", gameId);
    }

    const { data: matches } = await matchQuery;

    return NextResponse.json({
      stats: stats || [],
      matches: matches || [],
    });
  } catch (error) {
    console.error("User game stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
