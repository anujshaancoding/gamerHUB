import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { CreateHuntRequest, HuntStatus } from "@/types/achievement-hunting";
import { getUser } from "@/lib/auth/get-user";

// GET - List achievement hunts
export async function GET(request: NextRequest) {
  try {
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const gameId = searchParams.get("game_id");
    const status = searchParams.get("status") as HuntStatus | null;
    const achievementId = searchParams.get("achievement_id");
    const myHunts = searchParams.get("my_hunts") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const user = await getUser();

    let query = db
      .from("achievement_hunts")
      .select(`
        *,
        achievement:achievements!achievement_id (
          id,
          name,
          description,
          difficulty,
          players_required,
          rarity_percent,
          icon_url,
          game_id
        ),
        members:hunt_members (
          id,
          user_id,
          role,
          has_achievement,
          ready,
          users!user_id (
            username,
            avatar_url
          )
        ),
        creator:users!creator_id (
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (gameId) {
      query = query.eq("achievements.game_id", gameId);
    }

    if (status) {
      query = query.eq("status", status);
    } else {
      query = query.in("status", ["recruiting", "active"]);
    }

    if (achievementId) {
      query = query.eq("achievement_id", achievementId);
    }

    if (myHunts && user) {
      // Get hunts user is part of
      const { data: memberships } = await db
        .from("hunt_members")
        .select("hunt_id")
        .eq("user_id", user.id);

      const huntIds = memberships?.map((m) => m.hunt_id) || [];
      if (huntIds.length > 0) {
        query = query.in("id", huntIds);
      } else {
        return NextResponse.json({ hunts: [] });
      }
    }

    const { data: hunts, error } = await query;

    if (error) {
      throw error;
    }

    // Map members with user info
    const mappedHunts = (hunts || []).map((hunt: any) => ({
      ...hunt,
      members: (hunt.members || []).map((m: any) => ({
        ...m,
        username: m.users?.username,
        avatar_url: m.users?.avatar_url,
      })),
      current_members: hunt.members?.length || 0,
    }));

    return NextResponse.json({ hunts: mappedHunts });
  } catch (error) {
    console.error("List hunts error:", error);
    return NextResponse.json(
      { error: "Failed to list hunts" },
      { status: 500 }
    );
  }
}

// POST - Create a new hunt
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateHuntRequest = await request.json();

    // Validate
    if (!body.achievement_id) {
      return NextResponse.json(
        { error: "Achievement is required" },
        { status: 400 }
      );
    }

    if (!body.title || body.title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Verify achievement exists
    const { data: achievement } = await db
      .from("achievements")
      .select("id, players_required")
      .eq("id", body.achievement_id)
      .single();

    if (!achievement) {
      return NextResponse.json(
        { error: "Achievement not found" },
        { status: 404 }
      );
    }

    // Ensure max_members is at least the required players
    const maxMembers = Math.max(
      body.max_members || achievement.players_required,
      achievement.players_required
    );

    // Create hunt
    const { data: hunt, error: huntError } = await db
      .from("achievement_hunts")
      .insert({
        achievement_id: body.achievement_id,
        creator_id: user.id,
        title: body.title.trim(),
        description: body.description || null,
        status: "recruiting",
        max_members: maxMembers,
        requires_mic: body.requires_mic || false,
        min_level: body.min_level || null,
        language: body.language || null,
        scheduled_time: body.scheduled_time || null,
        timezone: body.timezone || null,
        estimated_duration_minutes: body.estimated_duration_minutes || null,
        attempts: 0,
      })
      .select()
      .single();

    if (huntError) {
      throw huntError;
    }

    // Add creator as leader
    const { error: memberError } = await db
      .from("hunt_members")
      .insert({
        hunt_id: hunt.id,
        user_id: user.id,
        role: "leader",
        has_achievement: false,
        ready: false,
      });

    if (memberError) {
      // Rollback hunt creation
      await db.from("achievement_hunts").delete().eq("id", hunt.id);
      throw memberError;
    }

    return NextResponse.json({ hunt }, { status: 201 });
  } catch (error) {
    console.error("Create hunt error:", error);
    return NextResponse.json(
      { error: "Failed to create hunt" },
      { status: 500 }
    );
  }
}
