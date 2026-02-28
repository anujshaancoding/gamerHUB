// @ts-nocheck
// @ts-nocheck — complex tournament types
// TODO: Regenerate types with `db gen types typescript`
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const db = createClient();

    // Determine if tournamentId is UUID or slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tournamentId
      );

    let query = db
      .from("tournaments")
      .select(
        `
        *,
        organizer_clan:clans!tournaments_organizer_clan_id_fkey(
          id, name, tag, slug, avatar_url, banner_url
        ),
        game:games(id, name, slug, icon_url, banner_url),
        tournament_participants(
          id, clan_id, seed, status, total_wins, total_losses, final_placement,
          clan:clans(id, name, tag, slug, avatar_url)
        )
      `
      );

    if (isUUID) {
      query = query.eq("id", tournamentId);
    } else {
      query = query.eq("slug", tournamentId);
    }

    const { data: tournament, error } = await query.single();

    if (error || !tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tournament: {
        ...tournament,
        participant_count: tournament.tournament_participants?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/tournaments/[tournamentId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const db = createClient();

    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tournament
    const { data: tournament } = await db
      .from("tournaments")
      .select("id, organizer_user_id, organizer_clan_id, status")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check permission
    let hasPermission = tournament.organizer_user_id === user.id;

    if (!hasPermission && tournament.organizer_clan_id) {
      const { data: membership } = await db
        .from("clan_members")
        .select("role")
        .eq("clan_id", tournament.organizer_clan_id)
        .eq("user_id", user.id)
        .single();

      hasPermission =
        membership && ["leader", "co_leader"].includes(membership.role);
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Not authorized to update this tournament" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "name",
      "description",
      "banner_url",
      "game_id",
      "format",
      "team_size",
      "max_teams",
      "min_teams",
      "registration_start",
      "registration_end",
      "start_date",
      "end_date",
      "status",
      "prize_pool",
      "rules",
      "settings",
      "bracket_data",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Special handling for status changes
    if (updates.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["registration", "cancelled"],
        registration: ["seeding", "cancelled"],
        seeding: ["in_progress", "cancelled"],
        in_progress: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };

      if (!validTransitions[tournament.status]?.includes(updates.status as string)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${tournament.status} to ${updates.status}`,
          },
          { status: 400 }
        );
      }
    }

    const { data: updated, error } = await db
      .from("tournaments")
      .update(updates)
      .eq("id", tournamentId)
      .select(
        `
        *,
        organizer_clan:clans!tournaments_organizer_clan_id_fkey(id, name, tag, avatar_url),
        game:games(id, name, slug, icon_url)
      `
      )
      .single();

    if (error) {
      console.error("Error updating tournament:", error);
      return NextResponse.json(
        { error: "Failed to update tournament" },
        { status: 500 }
      );
    }

    // Log activity
    await db.from("tournament_activity_log").insert({
      tournament_id: tournamentId,
      user_id: user.id,
      activity_type: "tournament_updated",
      description: "Tournament settings updated",
      metadata: { updated_fields: Object.keys(updates) },
    });

    return NextResponse.json({ tournament: updated });
  } catch (error) {
    console.error("Error in PATCH /api/tournaments/[tournamentId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = await params;
    const db = createClient();

    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tournament
    const { data: tournament } = await db
      .from("tournaments")
      .select("id, organizer_user_id, organizer_clan_id, status")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Can only delete draft tournaments
    if (tournament.status !== "draft") {
      return NextResponse.json(
        { error: "Can only delete draft tournaments" },
        { status: 400 }
      );
    }

    // Check permission
    let hasPermission = tournament.organizer_user_id === user.id;

    if (!hasPermission && tournament.organizer_clan_id) {
      const { data: membership } = await db
        .from("clan_members")
        .select("role")
        .eq("clan_id", tournament.organizer_clan_id)
        .eq("user_id", user.id)
        .single();

      hasPermission = membership?.role === "leader";
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Not authorized to delete this tournament" },
        { status: 403 }
      );
    }

    const { error } = await db
      .from("tournaments")
      .delete()
      .eq("id", tournamentId);

    if (error) {
      console.error("Error deleting tournament:", error);
      return NextResponse.json(
        { error: "Failed to delete tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/tournaments/[tournamentId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
