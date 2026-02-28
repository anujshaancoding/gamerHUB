import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Get active battle pass with rewards
export async function GET() {
  try {
    const db = createClient();

    // Get active battle pass - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: battlePassData, error } = await (db as any)
      .from("battle_passes")
      .select(
        `
        *,
        rewards:battle_pass_rewards(*)
      `
      )
      .eq("status", "active")
      .order("season_number", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching battle pass:", error);
      return NextResponse.json(
        { error: "Failed to fetch battle pass" },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battlePass = battlePassData as any;

    if (!battlePass) {
      return cachedResponse({ battlePass: null }, CACHE_DURATIONS.SEASON);
    }

    // Sort rewards by level
    if (battlePass.rewards) {
      battlePass.rewards.sort((a: { level: number }, b: { level: number }) => a.level - b.level);
    }

    return cachedResponse({ battlePass }, CACHE_DURATIONS.SEASON);
  } catch (error) {
    console.error("Battle pass fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
