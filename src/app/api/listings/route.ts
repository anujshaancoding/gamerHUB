import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { noCacheResponse } from "@/lib/api/cache-headers";

// GET - List/search community listings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const gameId = searchParams.get("game_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("community_listings")
      .select(
        `
        *,
        creator:profiles!community_listings_creator_id_fkey(id, username, display_name, avatar_url),
        game:games!community_listings_game_id_fkey(id, slug, name, icon_url),
        winners:community_listing_winners(*)
      `,
        { count: "exact" }
      )
      .in("status", status ? [status] : ["active", "completed"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("listing_type", type);
    }

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching listings:", error);
      return NextResponse.json(
        { error: "Failed to fetch listings" },
        { status: 500 }
      );
    }

    return noCacheResponse({
      listings: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Listings list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new listing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      listing_type,
      game_id,
      game_slug,
      custom_game_name,
      cover_image_url,
      organizer_name,
      organizer_url,
      starts_at,
      ends_at,
      timezone,
      rules,
      external_link,
      prize_description,
      tags,
    } = body;

    if (!title || !description || !listing_type || !starts_at) {
      return NextResponse.json(
        { error: "Title, description, type, and start date are required" },
        { status: 400 }
      );
    }

    if (!["tournament", "giveaway"].includes(listing_type)) {
      return NextResponse.json(
        { error: "Invalid listing type" },
        { status: 400 }
      );
    }

    // Resolve game ID from: direct ID, slug lookup, or custom game name
    let resolvedGameId = game_id || null;

    if (!resolvedGameId && game_slug) {
      const { data: gameBySlug } = await supabase
        .from("games")
        .select("id")
        .eq("slug", game_slug)
        .single();
      if (gameBySlug) resolvedGameId = gameBySlug.id;
    }

    if (!resolvedGameId && custom_game_name) {
      // Try to find existing game by name (case-insensitive)
      const { data: gameByName } = await supabase
        .from("games")
        .select("id")
        .ilike("name", custom_game_name)
        .single();

      if (gameByName) {
        resolvedGameId = gameByName.id;
      } else {
        // Create a new game entry for the custom game
        const customSlug = custom_game_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const { data: newGame } = await supabase
          .from("games")
          .insert({
            name: custom_game_name,
            slug: customSlug,
          } as never)
          .select("id")
          .single();

        if (newGame) resolvedGameId = newGame.id;
      }
    }

    const { data, error } = await supabase
      .from("community_listings")
      .insert({
        creator_id: user.id,
        title,
        description,
        listing_type,
        game_id: resolvedGameId,
        cover_image_url: cover_image_url || null,
        organizer_name: organizer_name || null,
        organizer_url: organizer_url || null,
        starts_at: new Date(starts_at).toISOString(),
        ends_at: ends_at ? new Date(ends_at).toISOString() : null,
        timezone: timezone || "Asia/Kolkata",
        rules: rules || null,
        external_link: external_link || null,
        prize_description: prize_description || null,
        tags: tags || [],
      } as never)
      .select(
        `
        *,
        creator:profiles!community_listings_creator_id_fkey(id, username, display_name, avatar_url),
        game:games!community_listings_game_id_fkey(id, slug, name, icon_url)
      `
      )
      .single();

    if (error) {
      console.error("Error creating listing:", error);
      return NextResponse.json(
        { error: "Failed to create listing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ listing: data }, { status: 201 });
  } catch (error) {
    console.error("Listing creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
