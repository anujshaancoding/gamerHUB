import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ clanId: string }>;
}

// GET - List scrims
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const status = searchParams.get("status"); // upcoming, live, completed, cancelled
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("clan_scrims")
      .select(
        `
        *,
        game:games(id, name, slug, image_url),
        creator:profiles(id, username, display_name, avatar_url),
        participants:clan_scrim_participants(
          *,
          profile:profiles(id, username, display_name, avatar_url)
        )
      `,
        { count: "exact" }
      )
      .eq("clan_id", clanId)
      .order("scheduled_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching scrims:", error);
      return NextResponse.json(
        { error: "Failed to fetch scrims" },
        { status: 500 }
      );
    }

    // Check if user has RSVP'd to each scrim (to determine room visibility)
    const scrims = (data || []).map((scrim: any) => {
      const userParticipant = scrim.participants?.find(
        (p: any) => p.user_id === user?.id && p.status === "confirmed"
      );
      const hasRsvp = !!userParticipant;

      return {
        ...scrim,
        // Only show room details to users who have RSVP'd
        room_id: hasRsvp ? scrim.room_id : null,
        room_password: hasRsvp ? scrim.room_password : null,
        participant_count: scrim.participants?.filter(
          (p: any) => p.status === "confirmed"
        ).length || 0,
        has_rsvp: hasRsvp,
      };
    });

    return NextResponse.json({
      scrims,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Scrims error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create scrim
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is officer+
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    if (
      !membership ||
      !["leader", "co_leader", "officer"].includes((membership as any).role)
    ) {
      return NextResponse.json(
        { error: "Only officers can create scrims" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      game_id,
      scheduled_at,
      max_slots,
      room_id,
      room_password,
    } = body;

    if (!title || !scheduled_at) {
      return NextResponse.json(
        { error: "Title and scheduled time are required" },
        { status: 400 }
      );
    }

    // Scheduled time must be in the future
    if (new Date(scheduled_at) <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clan_scrims")
      .insert({
        clan_id: clanId,
        created_by: user.id,
        game_id: game_id || null,
        title: title.trim(),
        description: description?.trim() || null,
        scheduled_at,
        max_slots: Math.max(1, Math.min(100, parseInt(max_slots || "10"))),
        room_id: room_id || null,
        room_password: room_password || null,
      } as never)
      .select(
        `
        *,
        game:games(id, name, slug, image_url),
        creator:profiles(id, username, display_name, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error("Failed to create scrim:", error);
      return NextResponse.json(
        { error: "Failed to create scrim" },
        { status: 500 }
      );
    }

    // Auto-RSVP creator
    await supabase.from("clan_scrim_participants").insert({
      scrim_id: data.id,
      user_id: user.id,
      status: "confirmed",
    } as never);

    return NextResponse.json(
      { scrim: { ...data, participant_count: 1, has_rsvp: true, participants: [] } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create scrim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
