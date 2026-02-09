import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserBadgeWithDetails } from "@/types/database";

// GET - Get specific user's earned badges
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const rarity = searchParams.get("rarity");

    const { data: badges, error } = await supabase
      .from("user_badges")
      .select(
        `
        *,
        badge:badge_definitions(*)
      `
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

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
