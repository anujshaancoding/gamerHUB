import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

// GET - Get season details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const db = createClient();

    const { data, error } = await db
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
      .eq("id", seasonId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Season not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching season:", error);
      return NextResponse.json(
        { error: "Failed to fetch season" },
        { status: 500 }
      );
    }

    // Get participant count
    const { count: participantCount } = await db
      .from("season_points")
      .select("*", { count: "exact", head: true })
      .eq("season_id", seasonId);

    return NextResponse.json({
      season: {
        ...(data as any),
        participant_count: participantCount || 0,
      },
    });
  } catch (error) {
    console.error("Season detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
