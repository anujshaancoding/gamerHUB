import { createAdminClient } from "@/lib/db/admin";
import type {
  ProGame,
  ProPlayerWithTeam,
  ProPlayerStats,
  ProPlayerGear,
  ProPlayerDetail,
  ProEvent,
} from "./types";

export async function listProPlayers(game: ProGame): Promise<ProPlayerWithTeam[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pro_players")
    .select(
      `
      id, slug, game, ign, real_name, team_id, role, country, region,
      photo_url, bio, age, date_of_birth, total_earnings, earnings_currency,
      peak_rank, current_rank, national_rank, socials, is_active, is_featured,
      created_at, updated_at,
      team:pro_teams!team_id(id, slug, name, short_name, logo_url, region,
        founded_year, socials, is_active, created_at, updated_at, game)
      `
    )
    .eq("game", game)
    .eq("is_active", true)
    .order("national_rank", { ascending: true, nullsFirst: false })
    .order("ign", { ascending: true });

  if (error) {
    console.error("listProPlayers error:", error);
    return [];
  }
  return (data || []) as unknown as ProPlayerWithTeam[];
}

export async function getProPlayerDetail(
  game: ProGame,
  slug: string
): Promise<ProPlayerDetail | null> {
  const admin = createAdminClient();
  const { data: player, error } = await admin
    .from("pro_players")
    .select(
      `
      id, slug, game, ign, real_name, team_id, role, country, region,
      photo_url, bio, age, date_of_birth, total_earnings, earnings_currency,
      peak_rank, current_rank, national_rank, socials, is_active, is_featured,
      created_at, updated_at,
      team:pro_teams!team_id(id, slug, name, short_name, logo_url, region,
        founded_year, socials, is_active, created_at, updated_at, game)
      `
    )
    .eq("game", game)
    .eq("slug", slug)
    .single();

  if (error || !player) return null;

  const typed = player as unknown as ProPlayerWithTeam;

  const [{ data: statsRows }, { data: gearRow }] = await Promise.all([
    admin
      .from("pro_player_stats")
      .select("*")
      .eq("player_id", typed.id)
      .order("is_current", { ascending: false })
      .order("season", { ascending: false }),
    admin
      .from("pro_player_gear")
      .select("*")
      .eq("player_id", typed.id)
      .single(),
  ]);

  const stats = ((statsRows || []) as unknown as ProPlayerStats[]);
  return {
    player: typed,
    current_stats: stats.find((s) => s.is_current) || null,
    past_seasons: stats.filter((s) => !s.is_current),
    gear: (gearRow as ProPlayerGear | null) || null,
  };
}

export async function listProEvents(options: {
  game?: ProGame;
  status?: "upcoming" | "live" | "completed";
  limit?: number;
} = {}): Promise<ProEvent[]> {
  const admin = createAdminClient();
  let q = admin
    .from("pro_events")
    .select("*")
    .order("starts_at", { ascending: true });
  if (options.game) q = q.eq("game", options.game);
  if (options.status) q = q.eq("status", options.status);
  if (options.limit) q = q.range(0, options.limit - 1);
  const { data, error } = await q;
  if (error) {
    console.error("listProEvents error:", error);
    return [];
  }
  return (data || []) as unknown as ProEvent[];
}

export async function getProPlayerBySlug(
  game: ProGame,
  slug: string
): Promise<ProPlayerDetail | null> {
  return getProPlayerDetail(game, slug);
}

export interface CrosshairEntry {
  player_id: string;
  player_slug: string;
  ign: string;
  team_name: string | null;
  team_short: string | null;
  role: string | null;
  photo_url: string | null;
  crosshair_code: string;
  notes: string | null;
}

// Pulls every Valorant pro that has a crosshair code in their gear blob.
// Used by /crosshairs.
export async function listValorantCrosshairs(): Promise<CrosshairEntry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pro_players")
    .select(
      `
      id, slug, ign, role, photo_url, is_active,
      team:pro_teams!team_id(name, short_name),
      gear:pro_player_gear!player_id(ingame_settings, notes)
      `
    )
    .eq("game", "valorant")
    .eq("is_active", true);

  if (error) {
    console.error("listValorantCrosshairs error:", error);
    return [];
  }

  type Row = {
    id: string;
    slug: string;
    ign: string;
    role: string | null;
    photo_url: string | null;
    team: { name: string; short_name: string | null } | null;
    gear: { ingame_settings: Record<string, unknown> | null; notes: string | null } | null;
  };

  return ((data || []) as unknown as Row[])
    .map((p) => {
      const code = (p.gear?.ingame_settings?.["crosshair_code"] as string | undefined) ?? null;
      if (!code) return null;
      return {
        player_id: p.id,
        player_slug: p.slug,
        ign: p.ign,
        team_name: p.team?.name ?? null,
        team_short: p.team?.short_name ?? null,
        role: p.role,
        photo_url: p.photo_url,
        crosshair_code: code,
        notes: p.gear?.notes ?? null,
      } as CrosshairEntry;
    })
    .filter((x): x is CrosshairEntry => x !== null)
    .sort((a, b) => a.ign.localeCompare(b.ign));
}
