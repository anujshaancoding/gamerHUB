import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// GET - List winners for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = createClient();

    const { data, error } = await db
      .from("community_listing_winners")
      .select("*")
      .eq("listing_id", id)
      .order("placement", { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch winners" },
        { status: 500 }
      );
    }

    return NextResponse.json({ winners: data || [] });
  } catch (error) {
    console.error("Winners fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a winner (listing creator only)
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

    // Verify the user is the listing creator
    const { data: listing } = await db
      .from("community_listings")
      .select("id, creator_id")
      .eq("id", id)
      .single();

    if (!listing || listing.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { display_name, user_id, placement, prize_awarded } = body;

    if (!display_name) {
      return NextResponse.json(
        { error: "Winner display name is required" },
        { status: 400 }
      );
    }

    const { data: winner, error } = await db
      .from("community_listing_winners")
      .insert({
        listing_id: id,
        display_name,
        user_id: user_id || null,
        placement: placement || null,
        prize_awarded: prize_awarded || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Error adding winner:", error);
      return NextResponse.json(
        { error: "Failed to add winner" },
        { status: 500 }
      );
    }

    // Mark listing as completed when winners are added
    await db
      .from("community_listings")
      .update({ status: "completed" } as never)
      .eq("id", id);

    return NextResponse.json({ winner }, { status: 201 });
  } catch (error) {
    console.error("Winner add error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a winner (listing creator only)
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

    const body = await request.json();
    const { winner_id } = body;

    if (!winner_id) {
      return NextResponse.json(
        { error: "Winner ID is required" },
        { status: 400 }
      );
    }

    // RLS handles the creator check via the policy
    const { error } = await db
      .from("community_listing_winners")
      .delete()
      .eq("id", winner_id)
      .eq("listing_id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove winner" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Winner delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
