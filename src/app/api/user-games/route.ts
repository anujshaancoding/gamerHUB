import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch current user's games
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_games")
      .select("*, game:games(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ userGames: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new user game profile (self-reported)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { game_slug, game_username, rank, role, stats, is_public } = body;

    if (!game_slug || typeof game_slug !== "string") {
      return NextResponse.json(
        { error: "game_slug is required" },
        { status: 400 }
      );
    }

    // Validate fields
    if (game_username && game_username.length > 50) {
      return NextResponse.json(
        { error: "In-game name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (stats && typeof stats === "object") {
      if (stats.kd_ratio != null && (stats.kd_ratio < 0 || stats.kd_ratio > 99.99)) {
        return NextResponse.json(
          { error: "K/D ratio must be between 0 and 99.99" },
          { status: 400 }
        );
      }
      if (stats.win_rate != null && (stats.win_rate < 0 || stats.win_rate > 100)) {
        return NextResponse.json(
          { error: "Win rate must be between 0 and 100" },
          { status: 400 }
        );
      }
      if (stats.hours_played != null && stats.hours_played < 0) {
        return NextResponse.json(
          { error: "Hours played must be non-negative" },
          { status: 400 }
        );
      }
      if (stats.matches_played != null && stats.matches_played < 0) {
        return NextResponse.json(
          { error: "Matches played must be non-negative" },
          { status: 400 }
        );
      }
    }

    // Resolve game_slug to game_id
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("slug", game_slug)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("user_games")
      .select("id")
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already linked this game" },
        { status: 409 }
      );
    }

    // Clean stats — only include non-null values
    const cleanStats: Record<string, number> = {};
    if (stats && typeof stats === "object") {
      if (stats.kd_ratio != null) cleanStats.kd_ratio = Number(stats.kd_ratio);
      if (stats.win_rate != null) cleanStats.win_rate = Number(stats.win_rate);
      if (stats.hours_played != null) cleanStats.hours_played = Number(stats.hours_played);
      if (stats.matches_played != null) cleanStats.matches_played = Number(stats.matches_played);
    }

    const { data: created, error: insertError } = await supabase
      .from("user_games")
      .insert({
        user_id: user.id,
        game_id: game.id,
        game_username: game_username || null,
        rank: rank || null,
        role: role || null,
        stats: Object.keys(cleanStats).length > 0 ? cleanStats : null,
        is_verified: false,
        is_public: is_public ?? true,
      } as never)
      .select("*, game:games(*)")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ userGame: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing user game profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, game_username, rank, role, stats, is_public } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("user_games")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Game profile not found" },
        { status: 404 }
      );
    }

    // Validate fields
    if (game_username && game_username.length > 50) {
      return NextResponse.json(
        { error: "In-game name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (stats && typeof stats === "object") {
      if (stats.kd_ratio != null && (stats.kd_ratio < 0 || stats.kd_ratio > 99.99)) {
        return NextResponse.json(
          { error: "K/D ratio must be between 0 and 99.99" },
          { status: 400 }
        );
      }
      if (stats.win_rate != null && (stats.win_rate < 0 || stats.win_rate > 100)) {
        return NextResponse.json(
          { error: "Win rate must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // Build update payload
    // If verified via API, only allow non-stat fields to be updated
    const isVerified = existing.is_verified === true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (game_username !== undefined) updatePayload.game_username = game_username || null;
    if (role !== undefined) updatePayload.role = role || null;
    if (is_public !== undefined) updatePayload.is_public = is_public;

    // Only allow rank/stats changes for self-reported (unverified) profiles
    if (!isVerified) {
      if (rank !== undefined) updatePayload.rank = rank || null;
      if (stats !== undefined) {
        const cleanStats: Record<string, number> = {};
        if (stats && typeof stats === "object") {
          if (stats.kd_ratio != null) cleanStats.kd_ratio = Number(stats.kd_ratio);
          if (stats.win_rate != null) cleanStats.win_rate = Number(stats.win_rate);
          if (stats.hours_played != null) cleanStats.hours_played = Number(stats.hours_played);
          if (stats.matches_played != null) cleanStats.matches_played = Number(stats.matches_played);
        }
        updatePayload.stats = Object.keys(cleanStats).length > 0 ? cleanStats : null;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("user_games")
      .update(updatePayload as never)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, game:games(*)")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ userGame: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a user game profile
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_games")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
