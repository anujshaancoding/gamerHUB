import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const db = createClient();

    // trust_badges is a view that derives public badges from private trust data
    const { data, error } = await db
      .from("trust_badges")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // If no trust data calculated yet, return defaults
    const badges = data || {
      is_veteran: false,
      is_active: false,
      is_trusted: false,
      is_verified: false,
      is_community_pillar: false,
      is_established: false,
    };

    return NextResponse.json({
      badges: {
        isVeteran: badges.is_veteran,
        isActive: badges.is_active,
        isTrusted: badges.is_trusted,
        isVerified: badges.is_verified,
        isCommunityPillar: badges.is_community_pillar,
        isEstablished: badges.is_established,
      },
    });
  } catch (error) {
    console.error("Fetch trust badges error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
