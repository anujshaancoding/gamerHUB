import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Clan, ClanMember } from "@/types/database";

interface RouteParams {
  params: Promise<{ clanId: string }>;
}

// GET - Get clan details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clans")
      .select(
        `
        *,
        primary_game:games!clans_primary_game_id_fkey(*),
        clan_members(
          *,
          profile:profiles(*)
        ),
        clan_games(
          *,
          game:games(*)
        ),
        clan_achievements(*)
      `
      )
      .eq("id", clanId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Clan not found" }, { status: 404 });
    }

    const clanData = data as any;
    const clan = {
      ...clanData,
      member_count: clanData.clan_members?.length || 0,
    };

    return NextResponse.json({ clan });
  } catch (error) {
    console.error("Clan fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update clan settings
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is leader or co-leader
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    if (!member || !["leader", "co_leader"].includes(member.role)) {
      return NextResponse.json(
        { error: "Only leaders and co-leaders can update clan settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      "name",
      "description",
      "avatar_url",
      "banner_url",
      "primary_game_id",
      "region",
      "language",
      "min_rank_requirement",
      "max_members",
      "is_public",
      "is_recruiting",
      "join_type",
      "settings",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("clans")
      .update(updates as never)
      .eq("id", clanId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update clan:", error);
      return NextResponse.json(
        { error: "Failed to update clan" },
        { status: 500 }
      );
    }

    // Log settings update
    await supabase.from("clan_activity_log").insert({
      clan_id: clanId,
      user_id: user.id,
      activity_type: "settings_updated",
      description: "Clan settings were updated",
      metadata: { updated_fields: Object.keys(updates) },
    } as never);

    return NextResponse.json({ clan: data });
  } catch (error) {
    console.error("Clan update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete clan (leader only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is leader
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    if (!member || member.role !== "leader") {
      return NextResponse.json(
        { error: "Only the clan leader can delete the clan" },
        { status: 403 }
      );
    }

    // Get conversation ID before deleting clan
    const { data: clanData } = await supabase
      .from("clans")
      .select("conversation_id")
      .eq("id", clanId)
      .single();

    const clan = clanData as unknown as Pick<Clan, "conversation_id"> | null;

    // Delete clan (cascade will handle members, games, etc.)
    const { error } = await supabase.from("clans").delete().eq("id", clanId);

    if (error) {
      console.error("Failed to delete clan:", error);
      return NextResponse.json(
        { error: "Failed to delete clan" },
        { status: 500 }
      );
    }

    // Delete conversation
    if (clan?.conversation_id) {
      await supabase
        .from("conversations")
        .delete()
        .eq("id", clan.conversation_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clan delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
