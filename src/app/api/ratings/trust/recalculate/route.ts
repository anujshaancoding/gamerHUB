import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

export async function POST(request: NextRequest) {
  try {
    const db = createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const targetUserId = body.userId || user.id;

    // Call the database function to recalculate trust score
    const { data, error } = await db.rpc("calculate_trust_score", {
      target_user_id: targetUserId,
    });

    if (error) throw error;

    return NextResponse.json({ recalculated: true, trustScore: data });
  } catch (error) {
    console.error("Trust recalculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
