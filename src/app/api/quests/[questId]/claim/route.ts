import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import type { UserQuestWithDetails } from "@/types/database";
import { getUser } from "@/lib/auth/get-user";

// POST - Claim quest rewards
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  try {
    const { questId } = await params;
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user quest
    const { data: userQuestData, error: questError } = await db
      .from("user_quests")
      .select(
        `
        *,
        quest:quest_definitions(*)
      `
      )
      .eq("id", questId)
      .eq("user_id", user.id)
      .single();

    if (questError || !userQuestData) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    const userQuest = userQuestData as UserQuestWithDetails;

    if (userQuest.status !== "completed") {
      return NextResponse.json(
        { error: "Quest is not completed" },
        { status: 400 }
      );
    }

    if (userQuest.claimed_at) {
      return NextResponse.json(
        { error: "Quest already claimed" },
        { status: 400 }
      );
    }

    // Award XP
    const xpReward = userQuest.quest?.xp_reward || 0;
    let xpResult = null;

    if (xpReward > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: xpError } = await (db.rpc as any)("award_xp", {
        p_user_id: user.id,
        p_amount: xpReward,
        p_source_type: "quest",
        p_source_id: userQuest.quest_id,
        p_description: `Quest completed: ${userQuest.quest?.name}`,
        p_game_id: userQuest.quest?.game_id || null,
      });

      if (xpError) {
        console.error("Failed to award XP:", xpError);
      } else {
        xpResult = data;
      }
    }

    // Update quest status to claimed
    const { error: updateError } = await db
      .from("user_quests")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
      } as never)
      .eq("id", questId);

    if (updateError) {
      console.error("Failed to update quest:", updateError);
      return NextResponse.json(
        { error: "Failed to claim quest" },
        { status: 500 }
      );
    }

    // Update user progression stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.rpc as any)("update_progression_stats", {
      p_user_id: user.id,
      p_stat_key: "quests_completed",
      p_increment: 1,
    }).catch(() => {
      // Stats update is non-critical, ignore errors
    });

    return NextResponse.json({
      success: true,
      rewards: {
        xp: xpReward,
        xp_result: xpResult,
        bonus_rewards: userQuest.quest?.bonus_rewards || {},
      },
    });
  } catch (error) {
    console.error("Quest claim error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
