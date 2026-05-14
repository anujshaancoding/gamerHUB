import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const voteType = body.voteType;
  if (![1, -1].includes(voteType)) return NextResponse.json({ error: "Invalid voteType" }, { status: 400 });

  const db = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).rpc("toggle_sens_share_vote", {
    p_user_id: user.id,
    p_share_id: id,
    p_vote_type: voteType,
  });
  if (error) {
    console.error("sens-share vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const score = Array.isArray(data) ? (data[0] as any)?.score : (data as any)?.score;
  return NextResponse.json({ score });
}
