import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get current active season
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("seasons")
      .select(
        `
        *,
        game:games(*),
        rewards:season_rewards(*),
        challenges:community_challenges(
          *,
          game:games(*)
        )
      `
      )
      .eq("status", "active")
      .order("season_number", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "No active season found" },
          { status: 404 }
        );
      }
      console.error("Error fetching current season:", error);
      return NextResponse.json(
        { error: "Failed to fetch current season" },
        { status: 500 }
      );
    }

    // Get participant count
    const seasonData = data as any;
    const { count: participantCount } = await supabase
      .from("season_points")
      .select("*", { count: "exact", head: true })
      .eq("season_id", seasonData.id);

    return NextResponse.json({
      season: {
        ...seasonData,
        participant_count: participantCount || 0,
      },
    });
  } catch (error) {
    console.error("Current season error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
