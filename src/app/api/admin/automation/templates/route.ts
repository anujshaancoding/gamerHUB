import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// GET - List all templates
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    const sql = getPool();

    let templates;
    if (type && category) {
      templates = await sql`
        SELECT * FROM auto_templates
        WHERE type = ${type} AND category = ${category}
        ORDER BY created_at DESC
      `;
    } else if (type) {
      templates = await sql`
        SELECT * FROM auto_templates WHERE type = ${type}
        ORDER BY created_at DESC
      `;
    } else {
      templates = await sql`
        SELECT * FROM auto_templates ORDER BY type, category, created_at DESC
      `;
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Templates GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const VALID_TYPES = ["community_post", "comment", "lfg_post", "news_discussion"];
const VALID_CATEGORIES = ["hot_take", "question", "discussion", "daily", "reaction", "lfg", "hype", "tip", "general"];
const VALID_MOODS = ["neutral", "excited", "frustrated", "chill", "curious", "hyped"];
const VALID_GAMES = ["valorant", "bgmi", "freefire"];
const MAX_CONTENT_LENGTH = 500;

// POST - Create a new template
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { type, category, content, game_slug, mood } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `content must be under ${MAX_CONTENT_LENGTH} characters` }, { status: 400 });
    }
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }
    if (mood && !VALID_MOODS.includes(mood)) {
      return NextResponse.json({ error: `Invalid mood. Must be one of: ${VALID_MOODS.join(", ")}` }, { status: 400 });
    }
    if (game_slug && !VALID_GAMES.includes(game_slug)) {
      return NextResponse.json({ error: `Invalid game. Must be one of: ${VALID_GAMES.join(", ")}` }, { status: 400 });
    }

    const sql = getPool();
    const [template] = await sql`
      INSERT INTO auto_templates (type, category, content, game_slug, mood)
      VALUES (
        ${type || "community_post"},
        ${category || "general"},
        ${content.trim()},
        ${game_slug || null},
        ${mood || "neutral"}
      )
      RETURNING *
    `;

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Templates POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a template
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, type, category, content, game_slug, mood, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (content !== undefined && content.trim().length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `content must be under ${MAX_CONTENT_LENGTH} characters` }, { status: 400 });
    }
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type` }, { status: 400 });
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category` }, { status: 400 });
    }
    if (mood !== undefined && !VALID_MOODS.includes(mood)) {
      return NextResponse.json({ error: `Invalid mood` }, { status: 400 });
    }
    if (game_slug !== undefined && game_slug !== null && game_slug !== "" && !VALID_GAMES.includes(game_slug)) {
      return NextResponse.json({ error: `Invalid game` }, { status: 400 });
    }

    // game_slug uses explicit null handling (COALESCE can't clear to NULL)
    const resolvedGameSlug = game_slug === "" || game_slug === null ? null : (game_slug ?? undefined);

    const sql = getPool();
    const [template] = await sql`
      UPDATE auto_templates SET
        type = COALESCE(${type ?? null}, type),
        category = COALESCE(${category ?? null}, category),
        content = COALESCE(${content ?? null}, content),
        game_slug = ${resolvedGameSlug !== undefined ? resolvedGameSlug : sql`game_slug`},
        mood = COALESCE(${mood ?? null}, mood),
        is_active = COALESCE(${is_active ?? null}, is_active)
      WHERE id = ${id}
      RETURNING *
    `;

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Templates PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a template
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Valid id (UUID) is required" }, { status: 400 });
    }

    const sql = getPool();
    await sql`DELETE FROM auto_templates WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Templates DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
