import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const sql = getPool();
    const rows = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ profile: null });
    }

    const profile = rows[0] as Record<string, unknown>;

    // The owner gets their full profile; everyone else gets an explicit public
    // projection — never expose admin flags, privacy_settings, or other
    // internal columns to third parties (or unauthenticated callers).
    const viewer = await getUser();
    if (viewer?.id === userId) {
      return NextResponse.json({ profile });
    }

    const PUBLIC_FIELDS = [
      "id", "username", "display_name", "avatar_url", "banner_url", "bio",
      "gaming_style", "region", "preferred_language", "status", "status_until",
      "social_links", "favorite_games", "looking_for", "availability",
      "custom_theme", "profile_effect", "profile_background", "profile_music_url",
      "widget_layout", "profile_skin", "easter_egg_config", "hover_card_config",
      "custom_css", "is_online", "last_seen", "created_at",
    ];
    const publicProfile: Record<string, unknown> = {};
    for (const f of PUBLIC_FIELDS) {
      if (f in profile) publicProfile[f] = profile[f];
    }

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();
    const sql = getPool();

    // Only allow updating own profile
    const allowedFields = [
      "username", "display_name", "avatar_url", "banner_url", "bio",
      "gaming_style", "region", "preferred_language", "status", "status_until",
      "social_links", "favorite_games", "looking_for", "availability",
      "username_changed_at", "privacy_settings",
      // Profile customization features
      "custom_theme", "profile_effect", "profile_background", "profile_music_url",
      "widget_layout", "profile_skin", "easter_egg_config", "hover_card_config", "custom_css",
    ];

    const filtered: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        filtered[key] = updates[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Build dynamic SET clause
    const setClauses = Object.keys(filtered)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(", ");
    const values = Object.values(filtered);

    const rows = await sql.unsafe(
      `UPDATE profiles SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [user.id, ...values]
    );

    return NextResponse.json({ profile: rows[0] || null });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
