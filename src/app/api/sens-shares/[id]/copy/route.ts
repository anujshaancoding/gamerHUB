import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";

// Increments copy_count when someone copies a sens share's settings.
// No auth required — this is anti-spam-only counted by IP rate-limit upstream.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).rpc("increment_sens_share_copies", { p_share_id: id }).catch(() => null);
  // Fallback: raw update if RPC missing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("sens_shares")
    .select("copy_count")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const newCount = (data?.copy_count ?? 0) + 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).from("sens_shares").update({ copy_count: newCount }).eq("id", id);
  return NextResponse.json({ copy_count: newCount });
}
