import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClanMember } from "@/types/database";

interface RouteParams {
  params: Promise<{ clanId: string; userId: string }>;
}

// PATCH - Update member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's role
    const { data: currentMembership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    const currentMember = currentMembership as unknown as Pick<ClanMember, "role"> | null;

    if (!currentMember || !["leader", "co_leader"].includes(currentMember.role)) {
      return NextResponse.json(
        { error: "Only leaders and co-leaders can update member roles" },
        { status: 403 }
      );
    }

    // Get target member's current role
    const { data: targetMembership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", userId)
      .single();

    const targetMember = targetMembership as unknown as Pick<ClanMember, "role"> | null;

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["leader", "co_leader", "officer", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Role change restrictions
    if (currentMember.role === "co_leader") {
      // Co-leaders can only promote/demote officers and members
      if (targetMember.role === "leader" || targetMember.role === "co_leader") {
        return NextResponse.json(
          { error: "Co-leaders cannot change leader or co-leader roles" },
          { status: 403 }
        );
      }
      if (role === "leader" || role === "co_leader") {
        return NextResponse.json(
          { error: "Co-leaders cannot promote to leader or co-leader" },
          { status: 403 }
        );
      }
    }

    // Leader transfer
    if (role === "leader") {
      if (currentMember.role !== "leader") {
        return NextResponse.json(
          { error: "Only the leader can transfer leadership" },
          { status: 403 }
        );
      }

      // Demote current leader to co-leader
      await supabase
        .from("clan_members")
        .update({ role: "co_leader", promoted_at: new Date().toISOString() } as never)
        .eq("clan_id", clanId)
        .eq("user_id", user.id);
    }

    // Update target member's role
    const { data, error } = await supabase
      .from("clan_members")
      .update({ role, promoted_at: new Date().toISOString() } as never)
      .eq("clan_id", clanId)
      .eq("user_id", userId)
      .select(
        `
        *,
        profile:profiles(*)
      `
      )
      .single();

    if (error) {
      console.error("Failed to update member role:", error);
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error("Update member role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove member or leave clan
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSelfLeaving = user.id === userId;

    // Get target member info
    const { data: targetMembership } = await supabase
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", userId)
      .single();

    const targetMember = targetMembership as unknown as Pick<ClanMember, "role"> | null;

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Leader cannot leave without transferring leadership
    if (isSelfLeaving && targetMember.role === "leader") {
      // Check if there are other members
      const { count } = await supabase
        .from("clan_members")
        .select("*", { count: "exact", head: true })
        .eq("clan_id", clanId);

      if (count && count > 1) {
        return NextResponse.json(
          { error: "Leader must transfer leadership before leaving" },
          { status: 400 }
        );
      }

      // If leader is the only member, delete the clan
      const { data: clanData } = await supabase
        .from("clans")
        .select("conversation_id")
        .eq("id", clanId)
        .single();

      const clan = clanData as { conversation_id: string | null } | null;

      await supabase.from("clans").delete().eq("id", clanId);

      if (clan?.conversation_id) {
        await supabase
          .from("conversations")
          .delete()
          .eq("id", clan.conversation_id);
      }

      return NextResponse.json({ success: true, clan_deleted: true });
    }

    // If kicking someone else, check permissions
    if (!isSelfLeaving) {
      const { data: currentMembership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .single();

      const currentMember = currentMembership as unknown as Pick<ClanMember, "role"> | null;

      if (!currentMember || !["leader", "co_leader"].includes(currentMember.role)) {
        return NextResponse.json(
          { error: "Only leaders and co-leaders can remove members" },
          { status: 403 }
        );
      }

      // Cannot kick someone with equal or higher role
      const roleHierarchy = { leader: 0, co_leader: 1, officer: 2, member: 3 };
      if (roleHierarchy[targetMember.role as keyof typeof roleHierarchy] <= roleHierarchy[currentMember.role as keyof typeof roleHierarchy]) {
        return NextResponse.json(
          { error: "Cannot remove a member with equal or higher rank" },
          { status: 403 }
        );
      }

      // Log kick activity
      await supabase.from("clan_activity_log").insert({
        clan_id: clanId,
        user_id: userId,
        activity_type: "member_kicked",
        description: "Was removed from the clan",
        metadata: { kicked_by: user.id },
      } as never);
    }

    // Remove member
    const { error } = await supabase
      .from("clan_members")
      .delete()
      .eq("clan_id", clanId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to remove member:", error);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
