import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Claim a reward
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  try {
    const { rewardId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the reward
    const { data: rewardData, error: rewardError } = await supabase
      .from("user_rewards")
      .select("*")
      .eq("id", rewardId)
      .eq("user_id", user.id)
      .single();

    const reward = rewardData as { status: string; expires_at: string | null } | null;

    if (rewardError || !reward) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // Check if already claimed
    if (reward.status === "claimed") {
      return NextResponse.json(
        { error: "Reward already claimed" },
        { status: 400 }
      );
    }

    // Check if expired
    if (reward.status === "expired") {
      return NextResponse.json(
        { error: "Reward has expired" },
        { status: 400 }
      );
    }

    if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("user_rewards")
        .update({ status: "expired" } as never)
        .eq("id", rewardId);

      return NextResponse.json(
        { error: "Reward has expired" },
        { status: 400 }
      );
    }

    // Claim the reward
    const { data: updatedReward, error: updateError } = await supabase
      .from("user_rewards")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
      } as never)
      .eq("id", rewardId)
      .select()
      .single();

    if (updateError) {
      console.error("Error claiming reward:", updateError);
      return NextResponse.json(
        { error: "Failed to claim reward" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward: updatedReward });
  } catch (error) {
    console.error("Claim reward error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
