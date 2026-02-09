// @ts-nocheck
// TypeScript checking disabled due to incomplete Supabase type definitions
// TODO: Regenerate types with `supabase gen types typescript`
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const supabase = await createClient();

    const { data: participants, error } = await supabase
      .from("tournament_participants")
      .select(
        `
        *,
        clan:clans(
          id, name, tag, slug, avatar_url, banner_url,
          stats, primary_game_id
        )
      `
      )
      .eq("tournament_id", tournamentId)
      .order("seed", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching participants:", error);
      return NextResponse.json(
        { error: "Failed to fetch participants" },
        { status: 500 }
      );
    }

    return NextResponse.json({ participants: participants || [] });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/participants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clan_id, roster } = body;

    if (!clan_id) {
      return NextResponse.json(
        { error: "Clan ID is required" },
        { status: 400 }
      );
    }

    // Get tournament
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, status, max_teams, team_size")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check tournament is accepting registrations
    if (tournament.status !== "registration") {
      return NextResponse.json(
        { error: "Tournament is not accepting registrations" },
        { status: 400 }
      );
    }

    // Check if user is officer+ of the clan
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clan_id)
      .eq("user_id", user.id)
      .single();

    if (
      !membership ||
      !["leader", "co_leader", "officer"].includes(membership.role)
    ) {
      return NextResponse.json(
        { error: "Must be a clan officer to register for tournaments" },
        { status: 403 }
      );
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("clan_id", clan_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Clan is already registered for this tournament" },
        { status: 400 }
      );
    }

    // Check if tournament is full
    const { count } = await supabase
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    if (count && count >= tournament.max_teams) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Register clan
    const { data: participant, error } = await supabase
      .from("tournament_participants")
      .insert({
        tournament_id: tournamentId,
        clan_id,
        registered_by: user.id,
        roster: roster || [],
        status: "registered",
      })
      .select(
        `
        *,
        clan:clans(id, name, tag, slug, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error("Error registering for tournament:", error);
      return NextResponse.json(
        { error: "Failed to register for tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tournaments/[tournamentId]/participants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
