import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Toggle like on a community listing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify listing exists and is visible
    const { data: listing } = await db
      .from("community_listings")
      .select("id")
      .eq("id", id)
      .in("status", ["active", "completed"])
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if already liked
    const { data: existingLike } = await db
      .from("community_listing_likes")
      .select("id")
      .eq("listing_id", id)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Unlike
      await db
        .from("community_listing_likes")
        .delete()
        .eq("listing_id", id)
        .eq("user_id", user.id);

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.from("community_listing_likes").insert({
        listing_id: id,
        user_id: user.id,
      } as never);

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Listing like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
