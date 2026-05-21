import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/logger";

/** GET /api/pro/follow/me — list of pros the current user follows. */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ players: [] });

  const admin = createAdminClient();
  const { data: follows, error: followsErr } = await admin
    .from("pro_player_follows")
    .select("player_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (followsErr) {
    logger.error("Followed pros fetch error", followsErr);
    return NextResponse.json({ players: [] });
  }
  const ids = (follows || []).map(
    (f) => (f as { player_id: string }).player_id
  );
  if (ids.length === 0) return NextResponse.json({ players: [] });

  const { data: players, error: playersErr } = await admin
    .from("pro_players")
    .select(
      `id, slug, game, ign, real_name, role, region, photo_url, peak_rank,
       current_rank, national_rank, is_active, is_featured,
       team:pro_teams!team_id(id, name, short_name)`
    )
    .in("id", ids)
    .eq("is_active", true);

  if (playersErr) {
    logger.error("Followed pros enrich error", playersErr);
    return NextResponse.json({ players: [] });
  }

  // Preserve follow order (most recent first)
  const byId = new Map(((players || []) as Array<{ id: string }>).map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

  return NextResponse.json({ players: ordered });
}
