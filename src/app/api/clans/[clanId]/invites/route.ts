import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClanMember } from "@/types/database";

interface RouteParams {
  params: Promise<{ clanId: string }>;
}

// GET - List pending invites/requests
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'invite' or 'request'
    const status = searchParams.get("status") || "pending";

    // Check if user has permission to view invites
    const { data: membership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    const member = membership as unknown as Pick<ClanMember, "role"> | null;

    let query = supabase
      .from("clan_invites")
      .select(
        `
        *,
        user:profiles!clan_invites_user_id_fkey(*),
        invited_by_profile:profiles!clan_invites_invited_by_fkey(*)
      `
      )
      .eq("clan_id", clanId)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    // If not an officer, only show own invites
    if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invites:", error);
      return NextResponse.json(
        { error: "Failed to fetch invites" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invites: data || [] });
  } catch (error) {
    console.error("Invites list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create invite or join request
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

    const body = await request.json();
    const { type, user_id, message } = body;

    if (!type || !["invite", "request"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'invite' or 'request'" },
        { status: 400 }
      );
    }

    // Fetch clan settings including join_type
    const { data: clanData } = await supabase
      .from("clans")
      .select("is_recruiting, settings, max_members, join_type")
      .eq("id", clanId)
      .single();

    const clan = clanData as { is_recruiting: boolean; settings: any; max_members: number; join_type: string } | null;

    if (!clan) {
      return NextResponse.json({ error: "Clan not found" }, { status: 404 });
    }

    // Check member count
    const { count: memberCount } = await supabase
      .from("clan_members")
      .select("*", { count: "exact", head: true })
      .eq("clan_id", clanId);

    if (memberCount && memberCount >= clan.max_members) {
      return NextResponse.json(
        { error: "Clan has reached maximum members" },
        { status: 400 }
      );
    }

    if (type === "request") {
      // User is requesting to join or directly joining (open clans)
      const targetUserId = user.id;

      // Check join_type restrictions
      if (clan.join_type === "invite_only") {
        return NextResponse.json(
          { error: "This clan is invite only. You can only join if invited by a clan officer." },
          { status: 400 }
        );
      }

      // Check if user is already a member of THIS clan
      const { data: existingMember } = await supabase
        .from("clan_members")
        .select("id")
        .eq("clan_id", clanId)
        .eq("user_id", targetUserId)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "You are already a member of this clan" },
          { status: 400 }
        );
      }

      // For OPEN clans: directly add the user as a member
      if (clan.join_type === "open") {
        const { data: memberData, error: memberError } = await supabase
          .from("clan_members")
          .insert({
            clan_id: clanId,
            user_id: targetUserId,
            role: "member",
          } as never)
          .select(
            `
            *,
            profile:profiles(*)
          `
          )
          .single();

        if (memberError) {
          console.error("Failed to join open clan:", memberError);
          return NextResponse.json(
            { error: "Failed to join clan" },
            { status: 500 }
          );
        }

        return NextResponse.json({ member: memberData, joined: true }, { status: 201 });
      }

      // For CLOSED clans: create a join request (needs officer approval)
      if (!clan.is_recruiting) {
        return NextResponse.json(
          { error: "Clan is not currently recruiting" },
          { status: 400 }
        );
      }

      // Check for existing pending request
      const { data: existingRequest } = await supabase
        .from("clan_invites")
        .select("id")
        .eq("clan_id", clanId)
        .eq("user_id", targetUserId)
        .eq("type", "request")
        .eq("status", "pending")
        .single();

      if (existingRequest) {
        return NextResponse.json(
          { error: "You already have a pending request" },
          { status: 400 }
        );
      }

      // Create join request
      const { data, error } = await supabase
        .from("clan_invites")
        .insert({
          clan_id: clanId,
          user_id: targetUserId,
          type: "request",
          message: message || null,
        } as never)
        .select(
          `
          *,
          user:profiles!clan_invites_user_id_fkey(*)
        `
        )
        .single();

      if (error) {
        console.error("Failed to create request:", error);
        return NextResponse.json(
          { error: "Failed to create request" },
          { status: 500 }
        );
      }

      return NextResponse.json({ invite: data }, { status: 201 });
    } else {
      // Officers inviting a user
      if (!user_id) {
        return NextResponse.json(
          { error: "user_id is required for invites" },
          { status: 400 }
        );
      }

      // Check if current user has permission
      const { data: membership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .single();

      const member = membership as unknown as Pick<ClanMember, "role"> | null;

      if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
        return NextResponse.json(
          { error: "Only officers can send invites" },
          { status: 403 }
        );
      }

      // Check if target user is already a member of THIS clan
      const { data: existingMember } = await supabase
        .from("clan_members")
        .select("id")
        .eq("clan_id", clanId)
        .eq("user_id", user_id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this clan" },
          { status: 400 }
        );
      }

      // Check for existing pending invite
      const { data: existingInvite } = await supabase
        .from("clan_invites")
        .select("id")
        .eq("clan_id", clanId)
        .eq("user_id", user_id)
        .eq("type", "invite")
        .eq("status", "pending")
        .single();

      if (existingInvite) {
        return NextResponse.json(
          { error: "User already has a pending invite" },
          { status: 400 }
        );
      }

      // Create invite
      const { data, error } = await supabase
        .from("clan_invites")
        .insert({
          clan_id: clanId,
          user_id: user_id,
          invited_by: user.id,
          type: "invite",
          message: message || null,
        } as never)
        .select(
          `
          *,
          user:profiles!clan_invites_user_id_fkey(*),
          invited_by_profile:profiles!clan_invites_invited_by_fkey(*)
        `
        )
        .single();

      if (error) {
        console.error("Failed to create invite:", error);
        return NextResponse.json(
          { error: "Failed to create invite" },
          { status: 500 }
        );
      }

      return NextResponse.json({ invite: data }, { status: 201 });
    }
  } catch (error) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
