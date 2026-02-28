import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { ClanMember } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// GET - List clan challenges
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const clanId = searchParams.get("clan_id");
    const gameId = searchParams.get("game_id");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("clan_challenges")
      .select(
        `
        *,
        challenger_clan:clans!clan_challenges_challenger_clan_id_fkey(
          id, name, tag, slug, avatar_url
        ),
        challenged_clan:clans!clan_challenges_challenged_clan_id_fkey(
          id, name, tag, slug, avatar_url
        ),
        winner_clan:clans!clan_challenges_winner_clan_id_fkey(
          id, name, tag, slug, avatar_url
        ),
        game:games(*)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (clanId) {
      query = query.or(
        `challenger_clan_id.eq.${clanId},challenged_clan_id.eq.${clanId}`
      );
    }

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching clan challenges:", error);
      return NextResponse.json(
        { error: "Failed to fetch challenges" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      challenges: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Clan challenges list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create clan challenge
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      challenger_clan_id,
      challenged_clan_id,
      game_id,
      title,
      description,
      rules,
      format,
      team_size,
      scheduled_at,
    } = body;

    if (!challenger_clan_id || !title) {
      return NextResponse.json(
        { error: "challenger_clan_id and title are required" },
        { status: 400 }
      );
    }

    // Check if user is an officer in the challenger clan
    const { data: membership } = await db
      .from("clan_members")
      .select("role")
      .eq("clan_id", challenger_clan_id)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
      return NextResponse.json(
        { error: "Only clan officers can create challenges" },
        { status: 403 }
      );
    }

    // Validate challenged clan exists if specified
    if (challenged_clan_id) {
      const { data: challengedClan } = await db
        .from("clans")
        .select("id")
        .eq("id", challenged_clan_id)
        .single();

      if (!challengedClan) {
        return NextResponse.json(
          { error: "Challenged clan not found" },
          { status: 404 }
        );
      }

      if (challenged_clan_id === challenger_clan_id) {
        return NextResponse.json(
          { error: "Cannot challenge your own clan" },
          { status: 400 }
        );
      }
    }

    // Create challenge
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = (await db
      .from("clan_challenges")
      .insert({
        challenger_clan_id,
        challenged_clan_id: challenged_clan_id || null,
        game_id: game_id || null,
        title,
        description: description || null,
        rules: rules || null,
        format: format || "best_of_1",
        team_size: team_size || 5,
        scheduled_at: scheduled_at || null,
        status: challenged_clan_id ? "pending" : "open",
      } as any)
      .select(
        `
        *,
        challenger_clan:clans!clan_challenges_challenger_clan_id_fkey(
          id, name, tag, slug, avatar_url
        ),
        challenged_clan:clans!clan_challenges_challenged_clan_id_fkey(
          id, name, tag, slug, avatar_url
        ),
        game:games(*)
      `
      )
      .single()) as { data: any; error: any };

    if (error) {
      console.error("Failed to create challenge:", error);
      return NextResponse.json(
        { error: "Failed to create challenge" },
        { status: 500 }
      );
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.from("clan_activity_log").insert({
      clan_id: challenger_clan_id,
      user_id: user.id,
      activity_type: "challenge_created",
      description: `Created challenge: ${title}`,
      metadata: { challenge_id: data.id },
    } as any);

    return NextResponse.json({ challenge: data }, { status: 201 });
  } catch (error) {
    console.error("Create challenge error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
