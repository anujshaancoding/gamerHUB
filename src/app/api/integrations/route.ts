import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get all user's game connections
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get connections with their stats
    const { data: connections, error } = await supabase
      .from("game_connections")
      .select(`
        id,
        provider,
        provider_user_id,
        provider_username,
        provider_avatar_url,
        connected_at,
        last_synced_at,
        is_active,
        metadata,
        game_stats (
          id,
          game_id,
          game_mode,
          season,
          stats,
          rank_info,
          synced_at
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("connected_at", { ascending: false });

    if (error) {
      console.error("Error fetching connections:", error);
      return NextResponse.json(
        { error: "Failed to fetch connections" },
        { status: 500 }
      );
    }

    // Get supported games for reference
    const { data: supportedGames } = await supabase
      .from("supported_games")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    return NextResponse.json({
      connections: connections || [],
      supportedGames: supportedGames || [],
    });
  } catch (error) {
    console.error("Integrations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
