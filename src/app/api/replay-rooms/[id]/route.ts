import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UpdateRoomRequest } from "@/types/replay";

// GET - Get room details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if ID is a code or UUID
    const isCode = id.length === 6 && !id.includes("-");

    let query = supabase
      .from("replay_rooms")
      .select(`
        *,
        host:users!host_id (
          id,
          username,
          avatar_url
        ),
        participants:room_participants (
          id,
          user_id,
          role,
          is_ready,
          joined_at,
          users!user_id (
            username,
            avatar_url
          )
        ),
        markers:replay_markers (
          id,
          user_id,
          timestamp,
          type,
          label,
          created_at,
          users!user_id (
            username
          )
        )
      `);

    if (isCode) {
      query = query.eq("code", id.toUpperCase());
    } else {
      query = query.eq("id", id);
    }

    const { data: room, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Room not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    // Check if user can access private room
    if (!room.is_public && room.host_id !== user?.id) {
      const isParticipant = room.participants.some(
        (p: any) => p.user_id === user?.id
      );
      if (!isParticipant) {
        return NextResponse.json(
          { error: "Room is private" },
          { status: 403 }
        );
      }
    }

    // Map participants with user info
    const mappedParticipants = room.participants.map((p: any) => ({
      ...p,
      username: p.users?.username,
      avatar_url: p.users?.avatar_url,
    }));

    // Map markers with user info
    const mappedMarkers = room.markers.map((m: any) => ({
      ...m,
      username: m.users?.username,
    }));

    return NextResponse.json({
      room: {
        ...room,
        participants: mappedParticipants,
        markers: mappedMarkers,
      },
      isHost: room.host_id === user?.id,
      isParticipant: mappedParticipants.some((p: any) => p.user_id === user?.id),
    });
  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { error: "Failed to get room" },
      { status: 500 }
    );
  }
}

// PATCH - Update room (host only for most actions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get room
    const { data: room } = await supabase
      .from("replay_rooms")
      .select("host_id, status")
      .eq("id", id)
      .single();

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const body: UpdateRoomRequest = await request.json();
    const updates: Record<string, unknown> = {};

    // Only host can update most fields
    const isHost = room.host_id === user.id;

    if (body.status !== undefined && isHost) {
      if (body.status === "playing" && !room.status) {
        updates.started_at = new Date().toISOString();
      }
      if (body.status === "ended") {
        updates.ended_at = new Date().toISOString();
      }
      updates.status = body.status;
    }

    if (body.current_time !== undefined && isHost) {
      updates.current_time = body.current_time;
    }

    if (body.playback_speed !== undefined && isHost) {
      if ([0.5, 0.75, 1, 1.25, 1.5, 2].includes(body.playback_speed)) {
        updates.playback_speed = body.playback_speed;
      }
    }

    if (body.name !== undefined && isHost) {
      updates.name = body.name.trim();
    }

    if (body.is_public !== undefined && isHost) {
      updates.is_public = body.is_public;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { data: updatedRoom, error } = await supabase
      .from("replay_rooms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE - End/delete room (host only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify host
    const { data: room } = await supabase
      .from("replay_rooms")
      .select("host_id")
      .eq("id", id)
      .single();

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    if (room.host_id !== user.id) {
      return NextResponse.json(
        { error: "Only the host can delete the room" },
        { status: 403 }
      );
    }

    // Mark as ended instead of deleting
    const { error } = await supabase
      .from("replay_rooms")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
