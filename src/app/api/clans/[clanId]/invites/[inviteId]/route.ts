import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClanInvite, ClanMember } from "@/types/database";

interface RouteParams {
  params: Promise<{ clanId: string; inviteId: string }>;
}

// PATCH - Accept/decline invite or request
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, inviteId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    // Get invite details
    const { data: inviteData } = await supabase
      .from("clan_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("clan_id", clanId)
      .single();

    const invite = inviteData as unknown as ClanInvite | null;

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Invite has already been processed" },
        { status: 400 }
      );
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from("clan_invites")
        .update({ status: "expired" } as never)
        .eq("id", inviteId);

      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    // Permission check depends on invite type
    if (invite.type === "invite") {
      // Only the invited user can respond
      if (invite.user_id !== user.id) {
        return NextResponse.json(
          { error: "Only the invited user can respond to this invite" },
          { status: 403 }
        );
      }
    } else {
      // Join request - only officers can respond
      const { data: membership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .single();

      const member = membership as unknown as Pick<ClanMember, "role"> | null;

      if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
        return NextResponse.json(
          { error: "Only officers can respond to join requests" },
          { status: 403 }
        );
      }
    }

    const newStatus = action === "accept" ? "accepted" : "declined";

    // Update invite status
    const { error: updateError } = await supabase
      .from("clan_invites")
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      } as never)
      .eq("id", inviteId);

    if (updateError) {
      console.error("Failed to update invite:", updateError);
      return NextResponse.json(
        { error: "Failed to update invite" },
        { status: 500 }
      );
    }

    // If accepted, add user to clan
    if (action === "accept") {
      // Check if user is already a member of THIS clan
      const { data: existingMember } = await supabase
        .from("clan_members")
        .select("id")
        .eq("clan_id", clanId)
        .eq("user_id", invite.user_id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this clan" },
          { status: 400 }
        );
      }

      // Check clan member limit
      const { data: clanData } = await supabase
        .from("clans")
        .select("max_members")
        .eq("id", clanId)
        .single();

      const clan = clanData as { max_members: number } | null;

      const { count: memberCount } = await supabase
        .from("clan_members")
        .select("*", { count: "exact", head: true })
        .eq("clan_id", clanId);

      if (clan && memberCount && memberCount >= clan.max_members) {
        // Revert invite status
        await supabase
          .from("clan_invites")
          .update({ status: "pending", responded_at: null } as never)
          .eq("id", inviteId);

        return NextResponse.json(
          { error: "Clan has reached maximum members" },
          { status: 400 }
        );
      }

      // Add member
      const { error: memberError } = await supabase
        .from("clan_members")
        .insert({
          clan_id: clanId,
          user_id: invite.user_id,
          role: "member",
        } as never);

      if (memberError) {
        console.error("Failed to add member:", memberError);
        // Revert invite status
        await supabase
          .from("clan_invites")
          .update({ status: "pending", responded_at: null } as never)
          .eq("id", inviteId);

        return NextResponse.json(
          { error: "Failed to add member to clan" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      member_added: action === "accept",
    });
  } catch (error) {
    console.error("Process invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel invite/request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, inviteId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get invite details
    const { data: inviteData } = await supabase
      .from("clan_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("clan_id", clanId)
      .single();

    const invite = inviteData as unknown as ClanInvite | null;

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Permission check
    const canDelete =
      invite.user_id === user.id ||
      invite.invited_by === user.id;

    if (!canDelete) {
      // Check if user is an officer
      const { data: membership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .single();

      const member = membership as unknown as Pick<ClanMember, "role"> | null;

      if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
        return NextResponse.json(
          { error: "Not authorized to delete this invite" },
          { status: 403 }
        );
      }
    }

    // Delete invite
    const { error } = await supabase
      .from("clan_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      console.error("Failed to delete invite:", error);
      return NextResponse.json(
        { error: "Failed to delete invite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
