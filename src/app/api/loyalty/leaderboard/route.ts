import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/features/loyalty/loyalty";

export const dynamic = "force-dynamic";

export async function GET() {
  const leaderboard = await getLeaderboard(50);
  return NextResponse.json({ leaderboard });
}
