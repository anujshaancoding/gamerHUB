/**
 * Lineups API — dynamic, admin-managed Valorant lineup content.
 *
 *  GET    /api/lineups?map=ascent&agent=viper   public, returns lineups
 *  POST   /api/lineups                          admin only, add a lineup
 *  DELETE /api/lineups?id=<id>                  admin only, remove a lineup
 *
 * Storage is a JSON file on the upload volume so no DB migration is needed;
 * the admin fills videos in over time and they persist across restarts.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { nanoid } from "nanoid";
import { getUser } from "@/lib/auth/get-user";
import type { Lineup, NewLineup } from "@/lib/data/lineup-types";

const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./uploads");
const STORE_PATH = resolve(UPLOAD_DIR, "data/valorant-lineups.json");

async function readStore(): Promise<Lineup[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(items: Lineup[]) {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(items, null, 2), "utf8");
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const user = await getUser();
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { createAdminClient } = await import("@/lib/db/admin");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return { ok: false, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const map = searchParams.get("map");
  const agent = searchParams.get("agent");
  const side = searchParams.get("side");

  let items = await readStore();
  if (map) items = items.filter((l) => l.map === map);
  if (agent) items = items.filter((l) => l.agent === agent);
  if (side) items = items.filter((l) => l.side === side);

  // Newest first
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ lineups: items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  let body: NewLineup;
  try {
    body = (await request.json()) as NewLineup;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["map", "agent", "ability", "side", "site", "title"] as const;
  for (const f of required) {
    if (!body[f as keyof NewLineup]) {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 });
    }
  }

  const items = await readStore();
  const lineup: Lineup = {
    ...body,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
  };
  items.push(lineup);
  await writeStore(items);
  return NextResponse.json({ lineup }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const items = await readStore();
  const next = items.filter((l) => l.id !== id);
  if (next.length === items.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writeStore(next);
  return NextResponse.json({ success: true });
}
