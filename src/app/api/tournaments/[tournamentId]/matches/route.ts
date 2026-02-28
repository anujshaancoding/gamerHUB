import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const round = searchParams.get("round");
    const bracketType = searchParams.get("bracket_type");
    const status = searchParams.get("status");

    let query = db
      .from("tournament_matches")
      .select(
        `
        *,
        team1:tournament_participants!tournament_matches_team1_id_fkey(
          id, seed, status, total_wins, total_losses,
          clan:clans(id, name, tag, slug, avatar_url)
        ),
        team2:tournament_participants!tournament_matches_team2_id_fkey(
          id, seed, status, total_wins, total_losses,
          clan:clans(id, name, tag, slug, avatar_url)
        ),
        winner:tournament_participants!tournament_matches_winner_id_fkey(
          id, seed,
          clan:clans(id, name, tag, avatar_url)
        ),
        games:tournament_match_games(*)
      `
      )
      .eq("tournament_id", tournamentId)
      .order("round")
      .order("match_number");

    if (round) {
      query = query.eq("round", parseInt(round));
    }
    if (bracketType) {
      query = query.eq("bracket_type", bracketType);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: matches, error } = await query;

    if (error) {
      console.error("Error fetching matches:", error);
      return NextResponse.json(
        { error: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    return NextResponse.json({ matches: matches || [] });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
