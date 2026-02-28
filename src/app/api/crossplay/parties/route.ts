import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { CreateCrossplayPartyRequest } from "@/types/console";
import { getUser } from "@/lib/auth/get-user";

// Generate a 6-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing characters
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - List crossplay parties
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("game_id");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status") || "open";
    const myParties = searchParams.get("my_parties") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .from("crossplay_parties")
      .select(`
        *,
        creator:profiles!crossplay_parties_creator_id_fkey(
          id,
          username,
          avatar_url
        ),
        game:games(
          id,
          slug,
          name,
          icon_url
        ),
        members:crossplay_party_members(
          id,
          user_id,
          platform,
          platform_username,
          is_leader,
          status,
          user:profiles!crossplay_party_members_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `, { count: "exact" });

    // Apply filters
    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (platform) {
      query = query.contains("platforms_allowed", [platform]);
    }

    if (myParties && user) {
      query = query.eq("creator_id", user.id);
    }

    // Only show non-expired parties
    query = query.gt("expires_at", new Date().toISOString());

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: parties, error, count } = await query;

    if (error) {
      console.error("Fetch parties error:", error);
      return NextResponse.json(
        { error: "Failed to fetch parties" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      parties,
      total: count,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Fetch parties error:", error);
    return NextResponse.json(
      { error: "Failed to fetch parties" },
      { status: 500 }
    );
  }
}

// POST - Create a new crossplay party
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateCrossplayPartyRequest = await request.json();

    if (!body.game_id) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Verify game exists
    const { data: game } = await db
      .from("games")
      .select("id, name")
      .eq("id", body.game_id)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if user already has an active party for this game
    const { data: existingParty } = await db
      .from("crossplay_parties")
      .select("id")
      .eq("creator_id", user.id)
      .eq("game_id", body.game_id)
      .in("status", ["open", "full", "in_game"])
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingParty) {
      return NextResponse.json(
        { error: "You already have an active party for this game" },
        { status: 400 }
      );
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;

    while (attempts < 5) {
      const { data: existingCode } = await db
        .from("crossplay_parties")
        .select("id")
        .eq("invite_code", inviteCode)
        .single();

      if (!existingCode) break;

      inviteCode = generateInviteCode();
      attempts++;
    }

    // Create the party
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4); // 4-hour expiry

    const { data: party, error: partyError } = await db
      .from("crossplay_parties")
      .insert({
        creator_id: user.id,
        game_id: body.game_id,
        title: body.title || `${game.name} Crossplay Party`,
        description: body.description,
        platforms_allowed: body.platforms_allowed || ["pc", "playstation", "xbox", "switch", "mobile"],
        voice_platform: body.voice_platform || "discord",
        voice_channel_link: body.voice_channel_link,
        invite_code: inviteCode,
        max_members: body.max_members || 5,
        status: "open",
        current_members: 1,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (partyError) {
      console.error("Create party error:", partyError);
      return NextResponse.json(
        { error: "Failed to create party" },
        { status: 500 }
      );
    }

    // Add creator as first member and leader
    const { error: memberError } = await db
      .from("crossplay_party_members")
      .insert({
        party_id: party.id,
        user_id: user.id,
        platform: "pc", // Default, can be updated
        is_leader: true,
        can_invite: true,
        status: "joined",
      });

    if (memberError) {
      console.error("Add member error:", memberError);
      // Clean up the party if member creation fails
      await db.from("crossplay_parties").delete().eq("id", party.id);
      return NextResponse.json(
        { error: "Failed to create party" },
        { status: 500 }
      );
    }

    // Fetch the complete party with relations
    const { data: fullParty } = await db
      .from("crossplay_parties")
      .select(`
        *,
        creator:profiles!crossplay_parties_creator_id_fkey(
          id,
          username,
          avatar_url
        ),
        game:games(
          id,
          slug,
          name,
          icon_url
        ),
        members:crossplay_party_members(
          id,
          user_id,
          platform,
          is_leader,
          status,
          user:profiles!crossplay_party_members_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq("id", party.id)
      .single();

    return NextResponse.json({
      success: true,
      party: fullParty,
    });
  } catch (error) {
    console.error("Create party error:", error);
    return NextResponse.json(
      { error: "Failed to create party" },
      { status: 500 }
    );
  }
}
