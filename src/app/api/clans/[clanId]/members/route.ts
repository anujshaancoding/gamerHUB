import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClanMember } from "@/types/database";

interface RouteParams {
  params: Promise<{ clanId: string }>;
}

// GET - List clan members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const role = searchParams.get("role");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("clan_members")
      .select(
        `
        *,
        profile:profiles(*)
      `,
        { count: "exact" }
      )
      .eq("clan_id", clanId)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Sort by role hierarchy
    const roleOrder = { leader: 0, co_leader: 1, officer: 2, member: 3 };
    const members = (data || []).sort((a: any, b: any) => {
      const aRole = a.role as keyof typeof roleOrder;
      const bRole = b.role as keyof typeof roleOrder;
      return (roleOrder[aRole] || 4) - (roleOrder[bRole] || 4);
    });

    return NextResponse.json({
      members,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Members list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add member (after invite acceptance or direct add by officers)
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
    const { user_id, role = "member" } = body;

    const targetUserId = user_id || user.id;

    // Check if user is already a member of THIS clan
    const { data: existingMember } = await supabase
      .from("clan_members")
      .select("id")
      .eq("clan_id", clanId)
      .eq("user_id", targetUserId)
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
      return NextResponse.json(
        { error: "Clan has reached maximum members" },
        { status: 400 }
      );
    }

    // If adding another user, check permissions
    if (user_id && user_id !== user.id) {
      const { data: membership } = await supabase
        .from("clan_members")
        .select("role")
        .eq("clan_id", clanId)
        .eq("user_id", user.id)
        .single();

      const member = membership as unknown as Pick<ClanMember, "role"> | null;

      if (!member || !["leader", "co_leader", "officer"].includes(member.role)) {
        return NextResponse.json(
          { error: "Only officers can add members directly" },
          { status: 403 }
        );
      }
    }

    // Add member
    const { data, error } = await supabase
      .from("clan_members")
      .insert({
        clan_id: clanId,
        user_id: targetUserId,
        role: role === "member" ? "member" : role,
      } as never)
      .select(
        `
        *,
        profile:profiles(*)
      `
      )
      .single();

    if (error) {
      console.error("Failed to add member:", error);
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
