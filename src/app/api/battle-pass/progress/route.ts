import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { noCacheResponse } from "@/lib/api/cache-headers";

// GET - Get user's battle pass progress
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active battle pass ID - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeBPData } = await (supabase as any)
      .from("battle_passes")
      .select("id")
      .eq("status", "active")
      .single();

    const activeBP = activeBPData as { id: string } | null;

    if (!activeBP) {
      return noCacheResponse({ progress: null });
    }

    // Get user's progress - eslint-disable for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: progress, error } = await (supabase as any)
      .from("user_battle_passes")
      .select("*")
      .eq("user_id", user.id)
      .eq("battle_pass_id", activeBP.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching progress:", error);
      return NextResponse.json(
        { error: "Failed to fetch progress" },
        { status: 500 }
      );
    }

    // If no progress, return default values
    if (!progress) {
      return noCacheResponse({
        progress: {
          current_level: 1,
          current_xp: 0,
          is_premium: false,
          claimed_rewards: [],
        },
        enrolled: false,
      });
    }

    return noCacheResponse({
      progress,
      enrolled: true,
    });
  } catch (error) {
    console.error("Battle pass progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
