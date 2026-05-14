import { createAdminClient } from "@/lib/db/admin";
import type { ProEvent } from "./types";

export interface PickemMatch {
  id: string;
  event_id: string;
  stage: string;
  match_label: string;
  team_a: string;
  team_b: string;
  team_a_logo: string | null;
  team_b_logo: string | null;
  starts_at: string | null;
  is_final: boolean;
  winner: "a" | "b" | null;
  locks_at: string | null;
  display_order: number;
}

export interface PickemPrediction {
  match_id: string;
  pick: "a" | "b";
  updated_at: string;
}

export interface PickemLeaderRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  correct_picks: number;
  points: number;
}

export async function getEventBySlug(slug: string): Promise<ProEvent | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("pro_events").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  return data as unknown as ProEvent;
}

export async function listPickemMatches(eventId: string): Promise<PickemMatch[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pickem_matches")
    .select("*")
    .eq("event_id", eventId)
    .order("display_order", { ascending: true })
    .order("starts_at", { ascending: true, nullsFirst: false });
  if (error) {
    console.error("listPickemMatches error", error);
    return [];
  }
  return (data || []) as unknown as PickemMatch[];
}

export async function listUserPredictions(userId: string, eventId: string): Promise<PickemPrediction[]> {
  const admin = createAdminClient();
  // Fetch match IDs for this event, then preds for the user.
  const { data: matchRows } = await admin
    .from("pickem_matches")
    .select("id")
    .eq("event_id", eventId);
  const ids = ((matchRows || []) as { id: string }[]).map((m) => m.id);
  if (ids.length === 0) return [];
  const { data, error } = await admin
    .from("pickem_predictions")
    .select("match_id, pick, updated_at")
    .eq("user_id", userId)
    .in("match_id", ids);
  if (error) return [];
  return (data || []) as unknown as PickemPrediction[];
}

export async function pickemLeaderboard(eventId: string, limit = 30): Promise<PickemLeaderRow[]> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("pickem_leaderboard")
    .select(`
      user_id, correct_picks, points,
      profile:profiles!user_id (id, username, display_name, avatar_url)
    `)
    .eq("event_id", eventId)
    .order("points", { ascending: false })
    .order("correct_picks", { ascending: false })
    .range(0, limit - 1);
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => ({
    user_id: r.user_id,
    username: r.profile?.username ?? null,
    display_name: r.profile?.display_name ?? null,
    avatar_url: r.profile?.avatar_url ?? null,
    correct_picks: r.correct_picks,
    points: r.points,
  }));
}
