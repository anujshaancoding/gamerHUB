import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

// GET - List seasons
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const gameId = searchParams.get("game_id");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("seasons")
      .select(
        `
        *,
        game:games(*),
        rewards:season_rewards(count),
        challenges:community_challenges(count)
      `,
        { count: "exact" }
      )
      .order("season_number", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching seasons:", error);
      return NextResponse.json(
        { error: "Failed to fetch seasons" },
        { status: 500 }
      );
    }

    // Transform to include counts
    const seasons = (data || []).map((season: any) => ({
      ...season,
      rewards_count: season.rewards?.[0]?.count || 0,
      challenges_count: season.challenges?.[0]?.count || 0,
    }));

    return NextResponse.json({
      seasons,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Seasons list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
