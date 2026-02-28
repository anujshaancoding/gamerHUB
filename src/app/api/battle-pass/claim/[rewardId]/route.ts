import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

// POST - Claim a battle pass reward
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rewardId } = await params;

    // Call the claim function - use type cast for RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any).rpc("claim_battle_pass_reward", {
      p_user_id: user.id,
      p_reward_id: rewardId,
    });

    if (error) {
      console.error("Error claiming reward:", error);
      return NextResponse.json(
        { error: "Failed to claim reward" },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "Failed to claim reward" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reward: {
        type: data.reward_type,
        value: data.reward_value,
        name: data.reward_name,
      },
    });
  } catch (error) {
    console.error("Claim reward error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
