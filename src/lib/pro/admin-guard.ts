import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";

export async function requireAdmin(): Promise<
  | { user: { id: string }; admin: ReturnType<typeof createAdminClient> }
  | { error: NextResponse }
> {
  const user = await getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!(profile as { is_admin?: boolean } | null)?.is_admin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, admin };
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length >= 2 && slug.length <= 60 && SLUG_RE.test(slug);
}

export const PRO_GAMES = ["valorant", "bgmi", "freefire"] as const;
export type ProGameValue = (typeof PRO_GAMES)[number];
export function isValidGame(g: unknown): g is ProGameValue {
  return typeof g === "string" && (PRO_GAMES as readonly string[]).includes(g);
}
