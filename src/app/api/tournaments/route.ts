// @ts-nocheck
// @ts-nocheck — complex tournament types
// TODO: Regenerate types with `db gen types typescript`
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { cachedResponse, CACHE_DURATIONS } from "@/lib/api/cache-headers";
import { getUser } from "@/lib/auth/get-user";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const gameId = searchParams.get("game_id");
    const organizerClanId = searchParams.get("organizer_clan_id");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("tournaments")
      .select(
        `
        *,
        organizer_clan:clans!tournaments_organizer_clan_id_fkey(id, name, tag, avatar_url),
        game:games(id, name, slug, icon_url),
        tournament_participants(count)
      `,
        { count: "exact" }
      )
      .neq("status", "draft")
      .order("start_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (gameId) {
      query = query.eq("game_id", gameId);
    }
    if (organizerClanId) {
      query = query.eq("organizer_clan_id", organizerClanId);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching tournaments:", error);
      return NextResponse.json(
        { error: "Failed to fetch tournaments" },
        { status: 500 }
      );
    }

    const tournaments = (data || []).map((t) => ({
      ...t,
      participant_count:
        (t.tournament_participants as { count: number }[])?.[0]?.count || 0,
    }));

    return cachedResponse({
      tournaments,
      total: count || 0,
      limit,
      offset,
    }, CACHE_DURATIONS.TOURNAMENTS);
  } catch (error) {
    console.error("Error in GET /api/tournaments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = createClient();

    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      banner_url,
      organizer_clan_id,
      game_id,
      format = "single_elimination",
      team_size = 5,
      max_teams = 16,
      min_teams = 4,
      registration_start,
      registration_end,
      start_date,
      prize_pool,
      rules,
      settings,
    } = body;

    // Validate required fields
    if (!name || !registration_start || !registration_end || !start_date) {
      return NextResponse.json(
        { error: "Name, registration dates, and start date are required" },
        { status: 400 }
      );
    }

    // If organizing as a clan, verify user is officer+
    if (organizer_clan_id) {
      const { data: membership } = await db
        .from("clan_members")
        .select("role")
        .eq("clan_id", organizer_clan_id)
        .eq("user_id", user.id)
        .single();

      if (
        !membership ||
        !["leader", "co_leader", "officer"].includes(membership.role)
      ) {
        return NextResponse.json(
          { error: "Must be a clan officer to create tournament for clan" },
          { status: 403 }
        );
      }
    }

    // Generate unique slug
    let slug = generateSlug(name);
    const { data: existingSlugs } = await db
      .from("tournaments")
      .select("slug")
      .ilike("slug", `${slug}%`);

    if (existingSlugs && existingSlugs.length > 0) {
      slug = `${slug}-${existingSlugs.length + 1}`;
    }

    // Create tournament
    const { data: tournament, error } = await db
      .from("tournaments")
      .insert({
        name,
        slug,
        description,
        banner_url,
        organizer_clan_id,
        organizer_user_id: user.id,
        game_id,
        format,
        team_size,
        max_teams,
        min_teams,
        registration_start,
        registration_end,
        start_date,
        prize_pool: prize_pool || {
          total: 0,
          currency: "points",
          distribution: [
            { place: 1, amount: 0, percentage: 50 },
            { place: 2, amount: 0, percentage: 30 },
            { place: 3, amount: 0, percentage: 20 },
          ],
        },
        rules,
        settings: settings || {
          check_in_required: true,
          check_in_window_minutes: 30,
          allow_substitutes: true,
          max_substitutes: 2,
          seeding_method: "random",
          third_place_match: true,
          matches_best_of: 1,
        },
        status: "draft",
      })
      .select(
        `
        *,
        organizer_clan:clans!tournaments_organizer_clan_id_fkey(id, name, tag, avatar_url),
        game:games(id, name, slug, icon_url)
      `
      )
      .single();

    if (error) {
      console.error("Error creating tournament:", error);
      return NextResponse.json(
        { error: "Failed to create tournament" },
        { status: 500 }
      );
    }

    // Log activity
    await db.from("tournament_activity_log").insert({
      tournament_id: tournament.id,
      user_id: user.id,
      activity_type: "tournament_created",
      description: `Tournament "${name}" created`,
    });

    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tournaments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
