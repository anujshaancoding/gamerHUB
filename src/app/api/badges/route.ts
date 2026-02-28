import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { privateCachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";
import type { BadgeDefinition } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// GET - List all badge definitions
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const rarity = searchParams.get("rarity");
    const gameId = searchParams.get("game_id");

    let query = db
      .from("badge_definitions")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    if (rarity) {
      query = query.eq("rarity", rarity);
    }

    if (gameId) {
      query = query.or(`game_id.eq.${gameId},game_id.is.null`);
    }

    const { data: badges, error } = await query;

    if (error) {
      console.error("Error fetching badges:", error);
      return NextResponse.json(
        { error: "Failed to fetch badges" },
        { status: 500 }
      );
    }

    // Filter out secret badges that user hasn't earned
    const user = await getUser();

    let earnedBadgeIds: Set<string> = new Set();
    if (user) {
      const { data: userBadges } = await db
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);
      earnedBadgeIds = new Set(
        (userBadges as { badge_id: string }[] | null)?.map((b) => b.badge_id) || []
      );
    }

    const typedBadges = badges as BadgeDefinition[] | null;
    const visibleBadges = typedBadges?.filter(
      (badge) => !badge.is_secret || earnedBadgeIds.has(badge.id)
    );

    return privateCachedResponse({ badges: visibleBadges || [] }, CACHE_DURATIONS.BADGES);
  } catch (error) {
    console.error("Badges list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
