import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getUser } from "@/lib/auth/get-user";
import {
  getSiteSettings,
  setSiteSetting,
  type SiteSettings,
} from "@/lib/db/site-settings";
import { logger } from "@/lib/logger";

async function requireAdmin() {
  const user = await getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return profile?.is_admin ? user : null;
}

// GET - Fetch all site settings (admin only)
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    logger.error("Admin settings GET error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a site setting (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body as { key: string; value: unknown };

    const validKeys: (keyof SiteSettings)[] = ["hide_news"];
    if (!validKeys.includes(key as keyof SiteSettings)) {
      return NextResponse.json(
        { error: `Invalid setting key: ${key}` },
        { status: 400 }
      );
    }

    await setSiteSetting(key as keyof SiteSettings, value as never);
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    logger.error("Admin settings PATCH error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
