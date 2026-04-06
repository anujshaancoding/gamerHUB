import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db/admin";
import { getPool } from "@/lib/db/index";
import { getUser } from "@/lib/auth/get-user";
import { hash } from "bcryptjs";

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

// GET - List all personas with full profile info
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
        p.banner_url,
        p.bio,
        p.gaming_style,
        p.region,
        p.is_verified,
        p.is_premium,
        p.status,
        p.social_links,
        u.email,
        (SELECT COUNT(*)::int FROM auto_logs al WHERE al.persona_id = ap.id) as total_actions,
        (SELECT MAX(al.created_at) FROM auto_logs al WHERE al.persona_id = ap.id) as last_action_at
      FROM auto_personas ap
      JOIN profiles p ON p.id = ap.profile_id
      LEFT JOIN users u ON u.id = ap.profile_id
      ORDER BY ap.created_at DESC
    `;

    return NextResponse.json({ personas });
  } catch (error) {
    console.error("Personas GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new persona (link existing profile OR create new bot account)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const sql = getPool();

    // Mode 1: Create a brand new bot account + persona
    if (body.create_account) {
      const { username, display_name, email, password, avatar_url, bio, gaming_style, region, persona_style, preferred_games, posting_style, bio_note } = body;

      if (!username || !email || !password) {
        return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      // Check if email already exists
      const existingEmail = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingEmail.length > 0) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      // Check if username already exists
      const existingUsername = await sql`SELECT id FROM profiles WHERE username = ${username}`;
      if (existingUsername.length > 0) {
        return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
      }

      const passwordHash = await hash(password, 12);
      const userId = crypto.randomUUID();

      // Create user + profile + persona in a transaction
      const result = await sql.begin(async (tx) => {
        await tx`
          INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
          VALUES (${userId}, ${email}, ${passwordHash}, NOW(), 'email')
        `;

        await tx`
          INSERT INTO profiles (id, username, display_name, avatar_url, bio, gaming_style, region)
          VALUES (
            ${userId},
            ${username},
            ${display_name || username},
            ${avatar_url || null},
            ${bio || null},
            ${gaming_style || null},
            ${region || null}
          )
        `;

        const [persona] = await tx`
          INSERT INTO auto_personas (profile_id, persona_style, preferred_games, posting_style, bio_note)
          VALUES (
            ${userId},
            ${persona_style || "casual"},
            ${preferred_games || []},
            ${posting_style || "mixed"},
            ${bio_note || null}
          )
          RETURNING *
        `;

        return persona;
      });

      return NextResponse.json({ persona: result, created_account: true }, { status: 201 });
    }

    // Mode 2: Link an existing profile as persona (original behavior)
    const { profile_id, persona_style, preferred_games, posting_style, bio_note } = body;

    if (!profile_id || !UUID_REGEX.test(profile_id)) {
      return NextResponse.json({ error: "Valid profile_id (UUID) is required" }, { status: 400 });
    }

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

// PATCH - Update persona AND/OR profile fields
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, persona_style, preferred_games, posting_style, bio_note, is_active,
            // Profile fields
            username, display_name, avatar_url, banner_url, bio, gaming_style, region, is_verified } = body;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Valid id (UUID) is required" }, { status: 400 });
    }

    const sql = getPool();

    // Get the persona to find profile_id
    const [existing] = await sql`SELECT profile_id FROM auto_personas WHERE id = ${id}`;
    if (!existing) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    // Check username uniqueness if changing
    if (username !== undefined) {
      const existingUsername = await sql`
        SELECT id FROM profiles WHERE username = ${username} AND id != ${existing.profile_id}
      `;
      if (existingUsername.length > 0) {
        return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
      }
    }

    // Update both persona and profile in a transaction
    const result = await sql.begin(async (tx) => {
      // Update persona fields
      const [persona] = await tx`
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

      // Update profile fields if any were provided
      const hasProfileUpdates = [username, display_name, avatar_url, banner_url, bio, gaming_style, region, is_verified]
        .some(v => v !== undefined);

      if (hasProfileUpdates) {
        await tx`
          UPDATE profiles SET
            username = COALESCE(${username ?? null}, username),
            display_name = COALESCE(${display_name ?? null}, display_name),
            avatar_url = COALESCE(${avatar_url ?? null}, avatar_url),
            banner_url = COALESCE(${banner_url ?? null}, banner_url),
            bio = COALESCE(${bio ?? null}, bio),
            gaming_style = COALESCE(${gaming_style ?? null}, gaming_style),
            region = COALESCE(${region ?? null}, region),
            is_verified = COALESCE(${is_verified ?? null}, is_verified),
            updated_at = now()
          WHERE id = ${existing.profile_id}
        `;
      }

      return persona;
    });

    return NextResponse.json({ persona: result });
  } catch (error) {
    console.error("Personas PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove persona, optionally delete full account
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteAccount = searchParams.get("delete_account") === "true";

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "Valid id (UUID) is required" }, { status: 400 });
    }

    const sql = getPool();

    if (deleteAccount) {
      // Get profile_id before deleting
      const [persona] = await sql`SELECT profile_id FROM auto_personas WHERE id = ${id}`;
      if (!persona) {
        return NextResponse.json({ error: "Persona not found" }, { status: 404 });
      }

      // Don't allow deleting admin accounts
      const [profile] = await sql`SELECT is_admin FROM profiles WHERE id = ${persona.profile_id}`;
      if (profile?.is_admin) {
        return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });
      }

      // Delete everything in the right order (persona -> profile -> user)
      await sql.begin(async (tx) => {
        // Delete automation logs for this persona
        await tx`DELETE FROM auto_logs WHERE persona_id = ${id}`;
        // Delete the persona
        await tx`DELETE FROM auto_personas WHERE id = ${id}`;
        // Delete the profile
        await tx`DELETE FROM profiles WHERE id = ${persona.profile_id}`;
        // Delete the user account
        await tx`DELETE FROM users WHERE id = ${persona.profile_id}`;
      });

      return NextResponse.json({ success: true, deleted_account: true });
    }

    // Just remove the persona link (original behavior)
    await sql`DELETE FROM auto_personas WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Personas DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
