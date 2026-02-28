import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Assign quests to user
export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quest_type } = body;

    if (!quest_type || !["daily", "weekly"].includes(quest_type)) {
      return NextResponse.json(
        { error: "Invalid quest type. Must be 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    // Call the assign_quests function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db.rpc as any)("assign_quests", {
      p_user_id: user.id,
      p_quest_type: quest_type,
    });

    if (error) {
      console.error("Failed to assign quests:", error);
      return NextResponse.json(
        { error: "Failed to assign quests" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assigned: data || [],
    });
  } catch (error) {
    console.error("Quest assign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
