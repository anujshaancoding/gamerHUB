import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Toggle bookmark on a listing
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

    // Check if already bookmarked
    const { data: existing } = await db
      .from("community_listing_bookmarks")
      .select("id")
      .eq("listing_id", id)
      .eq("user_id", user.id)
      .single();

    let bookmarked: boolean;

    if (existing) {
      // Remove bookmark
      await db
        .from("community_listing_bookmarks")
        .delete()
        .eq("id", existing.id);

      await db.rpc("increment_field" as never, {
        table_name: "community_listings",
        field_name: "bookmark_count",
        row_id: id,
        amount: -1,
      } as never).then(() => {
        // Fallback: direct update if RPC doesn't exist
      }).catch(async () => {
        const { data: listing } = await db
          .from("community_listings")
          .select("bookmark_count")
          .eq("id", id)
          .single();
        if (listing) {
          await db
            .from("community_listings")
            .update({ bookmark_count: Math.max(0, (listing.bookmark_count || 0) - 1) } as never)
            .eq("id", id);
        }
      });

      bookmarked = false;
    } else {
      // Add bookmark
      await db
        .from("community_listing_bookmarks")
        .insert({
          listing_id: id,
          user_id: user.id,
        } as never);

      await db.rpc("increment_field" as never, {
        table_name: "community_listings",
        field_name: "bookmark_count",
        row_id: id,
        amount: 1,
      } as never).catch(async () => {
        const { data: listing } = await db
          .from("community_listings")
          .select("bookmark_count")
          .eq("id", id)
          .single();
        if (listing) {
          await db
            .from("community_listings")
            .update({ bookmark_count: (listing.bookmark_count || 0) + 1 } as never)
            .eq("id", id);
        }
      });

      bookmarked = true;
    }

    return NextResponse.json({ bookmarked });
  } catch (error) {
    console.error("Bookmark toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
