import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";

// GET - Fetch single listing with winners
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("community_listings")
      .update(body)
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
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
