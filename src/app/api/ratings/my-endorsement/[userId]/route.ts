import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("trait_endorsements")
      .select("*")
      .eq("endorser_id", user.id)
      .eq("endorsed_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // Also get rate limit info
    const { data: rateLimitResult } = await supabase.rpc(
      "check_endorsement_rate_limit",
      { endorser_user_id: user.id }
    );

    const rateLimit = rateLimitResult as unknown as {
      allowed: boolean;
      reason: string | null;
      daily_remaining: number;
      weekly_remaining: number;
    } | null;

    return NextResponse.json({
      endorsement: data || null,
      rateLimit: rateLimit || {
        allowed: true,
        reason: null,
        daily_remaining: 3,
        weekly_remaining: 10,
      },
    });
  } catch (error) {
    console.error("Fetch my endorsement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
