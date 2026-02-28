import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

interface RouteParams {
  params: Promise<{ clanId: string }>;
}

// GET - List weekly missions (current week by default)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const db = createClient();
    const { searchParams } = new URL(request.url);

    const weekParam = searchParams.get("week"); // "current" | "YYYY-MM-DD"

    // Calculate current week boundaries (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);

    let weekStart: string;
    if (weekParam && weekParam !== "current") {
      weekStart = weekParam;
    } else {
      weekStart = monday.toISOString().split("T")[0];
    }

    const { data, error } = await db
      .from("clan_weekly_missions")
      .select("*")
      .eq("clan_id", clanId)
      .eq("week_start", weekStart)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching missions:", error);
      return NextResponse.json(
        { error: "Failed to fetch missions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      missions: data || [],
      week_start: weekStart,
    });
  } catch (error) {
    console.error("Missions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a weekly mission
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { clanId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is leader/co-leader
    const { data: membership } = await db
      .from("clan_members")
      .select("role")
      .eq("clan_id", clanId)
      .eq("user_id", user.id)
      .single();

    if (
      !membership ||
      !["leader", "co_leader"].includes((membership as any).role)
    ) {
      return NextResponse.json(
        { error: "Only leaders can create missions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, goal_type, goal_target, xp_reward } = body;

    if (!title || !goal_type || !goal_target) {
      return NextResponse.json(
        { error: "Title, goal type, and target are required" },
        { status: 400 }
      );
    }

    const validGoalTypes = [
      "matches_played",
      "wins",
      "members_online",
      "wall_posts",
      "scrims_played",
      "custom",
    ];
    if (!validGoalTypes.includes(goal_type)) {
      return NextResponse.json(
        { error: "Invalid goal type" },
        { status: 400 }
      );
    }

    // Calculate current week
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const weekStart = monday.toISOString().split("T")[0];
    const weekEnd = sunday.toISOString().split("T")[0];

    // Check limit: max 5 missions per week
    const { count } = await db
      .from("clan_weekly_missions")
      .select("*", { count: "exact", head: true })
      .eq("clan_id", clanId)
      .eq("week_start", weekStart);

    if (count && count >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 missions per week" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("clan_weekly_missions")
      .insert({
        clan_id: clanId,
        title: title.trim(),
        description: description?.trim() || null,
        goal_type,
        goal_target: Math.max(1, parseInt(goal_target)),
        xp_reward: Math.max(0, parseInt(xp_reward || "50")),
        week_start: weekStart,
        week_end: weekEnd,
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Failed to create mission:", error);
      return NextResponse.json(
        { error: "Failed to create mission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mission: data }, { status: 201 });
  } catch (error) {
    console.error("Create mission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
