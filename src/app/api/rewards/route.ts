import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - Get user's rewards
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seasonId = searchParams.get("season_id");
    const status = searchParams.get("status");
    const equipped = searchParams.get("equipped");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("user_rewards")
      .select(
        `
        *,
        season:seasons(id, name, slug),
        season_reward:season_rewards(*)
      `,
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (seasonId) {
      query = query.eq("season_id", seasonId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (equipped === "true") {
      query = query.eq("is_equipped", true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching rewards:", error);
      return NextResponse.json(
        { error: "Failed to fetch rewards" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rewards: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Rewards list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
