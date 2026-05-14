import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { logger } from "@/lib/logger";

/**
 * GET /api/pro/featured — Player of the Week.
 * Picks one featured active pro. Rotates deterministically by week-of-year
 * so the same pro shows for everyone on a given week.
 */
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pro_players")
    .select(
      `id, slug, game, ign, real_name, role, region, photo_url, bio,
       peak_rank, current_rank, national_rank,
       team:pro_teams!team_id(id, name, short_name)`
    )
    .eq("is_featured", true)
    .eq("is_active", true);

  if (error) {
    logger.error("Featured player fetch error", error);
    return NextResponse.json({ player: null });
  }
  const players = (data || []) as Array<{ id: string }>;
  if (players.length === 0) return NextResponse.json({ player: null });

  // Pick deterministically: weekIndex modulo featured list length
  const weekIdx = isoWeekIndex(new Date());
  const chosen = players[weekIdx % players.length];

  return NextResponse.json(
    { player: chosen },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } }
  );
}

function isoWeekIndex(d: Date): number {
  // Simple year × 100 + week — gives a strictly increasing integer per ISO week
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return date.getUTCFullYear() * 100 + week;
}
