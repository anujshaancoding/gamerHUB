import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { CreateRoomRequest } from "@/types/replay";
import { generateRoomCode, detectReplaySource } from "@/types/replay";
import { getUser } from "@/lib/auth/get-user";

// GET - List public rooms or user's rooms
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const publicOnly = searchParams.get("public") === "true";
    const gameId = searchParams.get("game_id");
    const myRooms = searchParams.get("my_rooms") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const user = await getUser();

    let query = db
      .from("replay_rooms")
      .select(`
        *,
        host:users!host_id (
          id,
          username,
          avatar_url
        )
      `)
      .in("status", ["waiting", "playing", "paused"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (publicOnly) {
      query = query.eq("is_public", true);
    }

    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    if (myRooms && user) {
      // Get rooms where user is host or participant
      const { data: participations } = await db
        .from("room_participants")
        .select("room_id")
        .eq("user_id", user.id);

      const roomIds = participations?.map((p) => p.room_id) || [];
      query = query.or(`host_id.eq.${user.id},id.in.(${roomIds.join(",")})`);
    }

    const { data: rooms, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      rooms: rooms || [],
    });
  } catch (error) {
    console.error("List replay rooms error:", error);
    return NextResponse.json(
      { error: "Failed to list rooms" },
      { status: 500 }
    );
  }
}

// POST - Create a new replay room
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateRoomRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length < 3) {
      return NextResponse.json(
        { error: "Room name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!body.replay_url) {
      return NextResponse.json(
        { error: "Replay URL is required" },
        { status: 400 }
      );
    }

    // Generate unique room code
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await db
        .from("replay_rooms")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    // Detect source if not provided
    const source = body.replay_source || detectReplaySource(body.replay_url);

    // Create room
    const { data: room, error } = await db
      .from("replay_rooms")
      .insert({
        code,
        name: body.name.trim(),
        host_id: user.id,
        game_id: body.game_id,
        replay_url: body.replay_url,
        replay_source: source,
        replay_title: body.replay_title || null,
        status: "waiting",
        current_time: 0,
        playback_speed: 1,
        is_public: body.is_public !== false,
        max_participants: body.max_participants || 10,
        participant_count: 1, // Host counts as participant
        allow_reactions: body.allow_reactions !== false,
        allow_drawing: body.allow_drawing !== false,
        chat_enabled: body.chat_enabled !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Create room error:", error);
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      );
    }

    // Add host as participant
    await db.from("room_participants").insert({
      room_id: room.id,
      user_id: user.id,
      role: "host",
      is_ready: true,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
