import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";
import { getUser } from "@/lib/auth/get-user";

// GET - Fetch single listing with winners
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = createClient();

    const { data, error } = await db
      .from("community_listings")
      .select(
        `
        *,
        creator:profiles!community_listings_creator_id_fkey(id, username, display_name, avatar_url),
        game:games!community_listings_game_id_fkey(id, slug, name, icon_url),
        winners:community_listing_winners(*)
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    return cachedResponse({ listing: data }, CACHE_DURATIONS.TOURNAMENTS);
  } catch (error) {
    console.error("Listing fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update listing (creator only)
export async function PATCH(
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

    const body = await request.json();

    // Strip identity / moderation / metric / system columns so a listing owner
    // cannot escalate privileges or tamper with counts via mass-assignment.
    const PROTECTED_FIELDS = new Set([
      "id",
      "creator_id",
      "is_featured",
      "featured",
      "is_pinned",
      "status",
      "moderation_status",
      "vote_count",
      "like_count",
      "comment_count",
      "view_count",
      "views",
      "prize_pool",
      "created_at",
      "updated_at",
    ]);
    const updates = Object.fromEntries(
      Object.entries(body as Record<string, unknown>).filter(
        ([k]) => !PROTECTED_FIELDS.has(k)
      )
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No editable fields provided" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("community_listings")
      .update(updates)
      .eq("id", id)
      .eq("creator_id", user.id)
      .select(
        `
        *,
        creator:profiles!community_listings_creator_id_fkey(id, username, display_name, avatar_url),
        game:games!community_listings_game_id_fkey(id, slug, name, icon_url),
        winners:community_listing_winners(*)
      `
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to update listing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ listing: data });
  } catch (error) {
    console.error("Listing update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete listing (creator only)
export async function DELETE(
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

    const { error } = await db
      .from("community_listings")
      .delete()
      .eq("id", id)
      .eq("creator_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete listing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Listing delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
