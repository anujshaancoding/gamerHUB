import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { UserBadgeWithDetails } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// GET - Get current user's earned badges
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const rarity = searchParams.get("rarity");

    const query = db
      .from("user_badges")
      .select(
        `
        *,
        badge:badge_definitions(*)
      `
      )
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    const { data: badges, error } = await query;

    if (error) {
      console.error("Error fetching user badges:", error);
      return NextResponse.json(
        { error: "Failed to fetch badges" },
        { status: 500 }
      );
    }

    // Filter by category/rarity if needed
    let filteredBadges = (badges as UserBadgeWithDetails[] | null) || [];
    if (category) {
      filteredBadges = filteredBadges.filter(
        (b) => b.badge?.category === category
      );
    }
    if (rarity) {
      filteredBadges = filteredBadges.filter((b) => b.badge?.rarity === rarity);
    }

    return NextResponse.json({ badges: filteredBadges });
  } catch (error) {
    console.error("User badges fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
