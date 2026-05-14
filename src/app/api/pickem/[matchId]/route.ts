import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pick = body.pick;
  if (!["a", "b"].includes(pick)) return NextResponse.json({ error: "Invalid pick" }, { status: 400 });

  const db = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match, error: mErr } = await (db as any)
    .from("pickem_matches")
    .select("id, winner, locks_at, starts_at")
    .eq("id", matchId)
    .single();
  if (mErr || !match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.winner) return NextResponse.json({ error: "Match already decided" }, { status: 400 });

  const lockTime = match.locks_at ?? match.starts_at;
  if (lockTime && new Date(lockTime).getTime() < Date.now()) {
    return NextResponse.json({ error: "Picks closed" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upErr } = await (db as any)
    .from("pickem_predictions")
    .upsert(
      { user_id: user.id, match_id: matchId, pick },
      { onConflict: "user_id,match_id" }
    );
  if (upErr) {
    console.error("pickem upsert error", upErr);
    return NextResponse.json({ error: "Failed to save pick" }, { status: 500 });
  }
  return NextResponse.json({ pick });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).from("pickem_predictions").delete().eq("user_id", user.id).eq("match_id", matchId);
  return NextResponse.json({ ok: true });
}
