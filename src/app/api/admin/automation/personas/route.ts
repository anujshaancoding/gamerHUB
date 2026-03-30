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

// GET - List all personas with profile info
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sql = getPool();
    const personas = await sql`
      SELECT
        ap.*,
        p.username,
        p.display_name,
        p.avatar_url,
        p.is_verified,
        (SELECT COUNT(*)::int FROM auto_logs al WHERE al.persona_id = ap.id) as total_actions,
        (SELECT MAX(al.created_at) FROM auto_logs al WHERE al.persona_id = ap.id) as last_action_at
      FROM auto_personas ap
      JOIN profiles p ON p.id = ap.profile_id
      ORDER BY ap.created_at DESC
    `;

    return NextResponse.json({ personas });
  } catch (error) {
    console.error("Personas GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new persona (link a profile)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { profile_id, persona_style, preferred_games, posting_style, bio_note } = body;

    if (!profile_id || !UUID_REGEX.test(profile_id)) {
      return NextResponse.json({ error: "Valid profile_id (UUID) is required" }, { status: 400 });
    }

    const sql = getPool();

    // Verify the profile exists
    const [profile] = await sql`SELECT id, username FROM profiles WHERE id = ${profile_id}`;
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const [persona] = await sql`
      INSERT INTO auto_personas (profile_id, persona_style, preferred_games, posting_style, bio_note)
      VALUES (
        ${profile_id},
        ${persona_style || "casual"},
        ${preferred_games || []},
        ${posting_style || "mixed"},
        ${bio_note || null}
      )
      ON CONFLICT (profile_id) DO UPDATE SET
        persona_style = EXCLUDED.persona_style,
        preferred_games = EXCLUDED.preferred_games,
        posting_style = EXCLUDED.posting_style,
        bio_note = EXCLUDED.bio_note,
        updated_at = now()
      RETURNING *
    `;

    return NextResponse.json({ persona });
  } catch (error) {
    console.error("Personas POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a persona
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, persona_style, preferred_games, posting_style, bio_note, is_active } = body;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Valid id (UUID) is required" }, { status: 400 });
    }

    const sql = getPool();
    const [persona] = await sql`
      UPDATE auto_personas SET
        persona_style = COALESCE(${persona_style ?? null}, persona_style),
        preferred_games = COALESCE(${preferred_games ?? null}, preferred_games),
        posting_style = COALESCE(${posting_style ?? null}, posting_style),
        bio_note = COALESCE(${bio_note ?? null}, bio_note),
        is_active = COALESCE(${is_active ?? null}, is_active),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    return NextResponse.json({ persona });
  } catch (error) {
    console.error("Personas PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a persona
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
    await sql`DELETE FROM auto_personas WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Personas DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
