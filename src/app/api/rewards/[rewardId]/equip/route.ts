import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// PATCH - Equip or unequip a reward
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    const db = createClient();

    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { equip } = body;

    if (typeof equip !== "boolean") {
      return NextResponse.json(
        { error: "equip field is required and must be a boolean" },
        { status: 400 }
      );
    }

    // Get the reward
    const { data: rewardData, error: rewardError } = await db
      .from("user_rewards")
      .select("*")
      .eq("id", rewardId)
      .eq("user_id", user.id)
      .single();

    const reward = rewardData as { status: string; reward_type: string } | null;

    if (rewardError || !reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // Check if claimed
    if (reward.status !== "claimed") {
      return NextResponse.json(
        { error: "Reward must be claimed before equipping" },
        { status: 400 }
      );
    }

    // If equipping, unequip other rewards of the same type
    if (equip) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db.from("user_rewards") as any)
        .update({ is_equipped: false })
        .eq("user_id", user.id)
        .eq("reward_type", reward.reward_type)
        .eq("is_equipped", true);
    }

    // Update equip status
    const { data: updatedReward, error: updateError } = await db
      .from("user_rewards")
      .update({ is_equipped: equip } as never)
      .eq("id", rewardId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating reward:", updateError);
      return NextResponse.json(
        { error: "Failed to update reward" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward: updatedReward });
  } catch (error) {
    console.error("Equip reward error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
