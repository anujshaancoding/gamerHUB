import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/get-user";
import { getPool } from "@/lib/db/index";
import { GAMING_STYLES, LANGUAGES, REGIONS } from "@/lib/constants/games";
import { AGENTS } from "@/lib/data/valorant-agents";
import { VALORANT_TIERS } from "@/lib/features/tools/valorant-ranks";

const roles = ["Duelist", "Controller", "Initiator", "Sentinel"] as const;
const agentSlugs = AGENTS.map((agent) => agent.slug);
const rankValues: readonly string[] = VALORANT_TIERS;
const regionValues: readonly string[] = REGIONS.map((region) => region.value);
const languageValues: readonly string[] = LANGUAGES.map((language) => language.value);
const styleValues: readonly string[] = GAMING_STYLES.map((style) => style.value);

const passportSchema = z.object({
  name: z.string().trim().min(1).max(24),
  rank: z.string().refine((value) => rankValues.includes(value), "Invalid rank"),
  peakRank: z.string().refine((value) => rankValues.includes(value), "Invalid peak rank"),
  agentSlug: z.string().refine((value) => agentSlugs.includes(value), "Invalid agent"),
  role: z.enum(roles),
  region: z.string().refine((value) => regionValues.includes(value), "Invalid region"),
  language: z.string().refine((value) => languageValues.includes(value), "Invalid language"),
  style: z.string().refine((value) => styleValues.includes(value), "Invalid playstyle"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const passport = passportSchema.parse(body);
    const agent = AGENTS.find((item) => item.slug === passport.agentSlug);
    const sql = getPool();

    const gameRows = await sql`
      SELECT id FROM games WHERE slug = 'valorant' LIMIT 1
    `;
    const game = gameRows[0] as { id?: string } | undefined;
    if (!game?.id) {
      return NextResponse.json({ error: "Valorant game record not found" }, { status: 404 });
    }

    const passportStats = {
      passport: {
        peak_rank: passport.peakRank,
        main_agent_slug: passport.agentSlug,
        main_agent_name: agent?.name ?? passport.agentSlug,
        role: passport.role,
        region: passport.region,
        language: passport.language,
        playstyle: passport.style,
        saved_at: new Date().toISOString(),
      },
    };

    const profileRows = await sql`
      UPDATE profiles
      SET
        display_name = COALESCE(NULLIF(display_name, ''), ${passport.name}),
        gaming_style = ${passport.style},
        region = ${passport.region},
        preferred_language = ${passport.language},
        updated_at = NOW()
      WHERE id = ${user.id}
      RETURNING *
    `;

    const existingRows = await sql`
      SELECT id, is_verified
      FROM user_games
      WHERE user_id = ${user.id} AND game_id = ${game.id}
      LIMIT 1
    `;

    let userGameRows;
    if (existingRows.length > 0) {
      const existing = existingRows[0] as { id: string; is_verified: boolean | null };
      userGameRows = await sql.unsafe(
        `
          UPDATE user_games
          SET
            game_username = $2,
            role = $3,
            rank = CASE WHEN COALESCE(is_verified, false) = false THEN $4 ELSE rank END,
            stats = CASE
              WHEN COALESCE(is_verified, false) = false THEN COALESCE(stats, '{}'::jsonb) || $5::jsonb
              ELSE stats
            END,
            is_public = true,
            updated_at = NOW()
          WHERE id = $1 AND user_id = $6
          RETURNING *
        `,
        [
          existing.id,
          passport.name,
          passport.role,
          passport.rank,
          JSON.stringify(passportStats),
          user.id,
        ],
      );
    } else {
      userGameRows = await sql.unsafe(
        `
          INSERT INTO user_games
            (user_id, game_id, game_username, rank, role, stats, is_verified, is_public, created_at, updated_at)
          VALUES
            ($1, $2, $3, $4, $5, $6::jsonb, false, true, NOW(), NOW())
          RETURNING *
        `,
        [
          user.id,
          game.id,
          passport.name,
          passport.rank,
          passport.role,
          JSON.stringify(passportStats),
        ],
      );
    }

    return NextResponse.json({
      profile: profileRows[0] ?? null,
      userGame: userGameRows[0] ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid passport details", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Passport save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getPool();
    const gameRows = await sql`
      SELECT id FROM games WHERE slug = 'valorant' LIMIT 1
    `;
    const game = gameRows[0] as { id?: string } | undefined;
    if (!game?.id) {
      return NextResponse.json({ error: "Valorant game record not found" }, { status: 404 });
    }

    const rows = await sql`
      UPDATE user_games
      SET
        stats = jsonb_set(
          COALESCE(stats, '{}'::jsonb),
          '{passport,feature_submitted}',
          'true'::jsonb,
          true
        ),
        is_public = true,
        updated_at = NOW()
      WHERE
        user_id = ${user.id}
        AND game_id = ${game.id}
        AND stats ? 'passport'
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Save your Passport before submitting it for feature" },
        { status: 404 },
      );
    }

    return NextResponse.json({ userGame: rows[0] ?? null });
  } catch (error) {
    console.error("Passport feature submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
