// @ts-nocheck
// @ts-nocheck — complex tournament types
// TODO: Regenerate types with `db gen types typescript`
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ tournamentId: string; matchId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = await params;
    const db = createClient();

    const { data: match, error } = await db
      .from("tournament_matches")
      .select(
        `
        *,
        team1:tournament_participants!tournament_matches_team1_id_fkey(
          id, seed, status, total_wins, total_losses, roster,
          clan:clans(id, name, tag, slug, avatar_url, banner_url)
        ),
        team2:tournament_participants!tournament_matches_team2_id_fkey(
          id, seed, status, total_wins, total_losses, roster,
          clan:clans(id, name, tag, slug, avatar_url, banner_url)
        ),
        winner:tournament_participants!tournament_matches_winner_id_fkey(
          id, seed,
          clan:clans(id, name, tag, avatar_url)
        ),
        games:tournament_match_games(*)
      `
      )
      .eq("id", matchId)
      .single();

    if (error || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]/matches/[matchId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId, matchId } = await params;
    const db = createClient();

    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get match with tournament info
    const { data: match } = await db
      .from("tournament_matches")
      .select(
        `
        id, tournament_id, status, team1_id, team2_id, best_of,
        tournament:tournaments(
          id, organizer_user_id, organizer_clan_id, status
        )
      `
      )
      .eq("id", matchId)
      .eq("tournament_id", tournamentId)
      .single();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const tournament = match.tournament as {
      id: string;
      organizer_user_id: string | null;
      organizer_clan_id: string | null;
      status: string;
    };

    // Check permission - must be organizer or participant
    let isOrganizer = tournament.organizer_user_id === user.id;
    let isParticipant = false;

    if (!isOrganizer && tournament.organizer_clan_id) {
      const { data: orgMembership } = await db
        .from("clan_members")
        .select("role")
        .eq("clan_id", tournament.organizer_clan_id)
        .eq("user_id", user.id)
        .single();

      isOrganizer =
        orgMembership &&
        ["leader", "co_leader", "officer"].includes(orgMembership.role);
    }

    // Check if user is officer+ of either participating clan
    if (!isOrganizer) {
      const teamIds = [match.team1_id, match.team2_id].filter(Boolean);
      if (teamIds.length > 0) {
        const { data: participants } = await db
          .from("tournament_participants")
          .select("clan_id")
          .in("id", teamIds);

        if (participants) {
          for (const p of participants) {
            const { data: membership } = await db
              .from("clan_members")
              .select("role")
              .eq("clan_id", p.clan_id)
              .eq("user_id", user.id)
              .single();

            if (
              membership &&
              ["leader", "co_leader", "officer"].includes(membership.role)
            ) {
              isParticipant = true;
              break;
            }
          }
        }
      }
    }

    if (!isOrganizer && !isParticipant) {
      return NextResponse.json(
        { error: "Not authorized to update this match" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      status: newStatus,
      scheduled_at,
      team1_score,
      team2_score,
      winner_id,
      result,
      disputed,
      dispute_reason,
    } = body;

    const updates: Record<string, unknown> = {};

    // Handle scheduling
    if (scheduled_at !== undefined) {
      updates.scheduled_at = scheduled_at;
      if (!match.status || match.status === "pending") {
        updates.status = "scheduled";
      }
    }

    // Handle status changes
    if (newStatus) {
      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        pending: ["scheduled", "ready", "bye"],
        scheduled: ["ready", "in_progress", "forfeit"],
        ready: ["in_progress", "forfeit"],
        in_progress: ["completed", "forfeit"],
        completed: [],
        bye: [],
        forfeit: [],
      };

      if (
        match.status &&
        !validTransitions[match.status]?.includes(newStatus)
      ) {
        return NextResponse.json(
          { error: `Invalid status transition from ${match.status} to ${newStatus}` },
          { status: 400 }
        );
      }

      updates.status = newStatus;

      if (newStatus === "in_progress") {
        updates.started_at = new Date().toISOString();
      } else if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      }
    }

    // Handle scores and winner
    if (team1_score !== undefined) updates.team1_score = team1_score;
    if (team2_score !== undefined) updates.team2_score = team2_score;
    if (winner_id !== undefined) updates.winner_id = winner_id;
    if (result !== undefined) updates.result = result;

    // Handle disputes (organizer only)
    if (isOrganizer) {
      if (disputed !== undefined) updates.disputed = disputed;
      if (dispute_reason !== undefined) updates.dispute_reason = dispute_reason;
      if (disputed === false && match.disputed) {
        updates.dispute_resolved_at = new Date().toISOString();
      }
    }

    // If setting winner, auto-complete if not already
    if (winner_id && !updates.status) {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    const { data: updated, error } = await db
      .from("tournament_matches")
      .update(updates)
      .eq("id", matchId)
      .select(
        `
        *,
        team1:tournament_participants!tournament_matches_team1_id_fkey(
          id, seed, clan:clans(id, name, tag, avatar_url)
        ),
        team2:tournament_participants!tournament_matches_team2_id_fkey(
          id, seed, clan:clans(id, name, tag, avatar_url)
        ),
        winner:tournament_participants!tournament_matches_winner_id_fkey(
          id, clan:clans(id, name, tag, avatar_url)
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating match:", error);
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 }
      );
    }

    return NextResponse.json({ match: updated });
  } catch (error) {
    console.error("Error in PATCH /api/tournaments/[tournamentId]/matches/[matchId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
