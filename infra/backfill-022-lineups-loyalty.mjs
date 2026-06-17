// One-off backfill for migration 022: import the legacy JSON stores
// (uploads/data/valorant-lineups.json + uploads/data/loyalty.json) into the new
// Postgres tables `valorant_lineups`, `loyalty_records`, `loyalty_events`.
//
// Run this ONCE on the VPS (where the JSON files + DATABASE_URL both exist),
// AFTER migration 022 has been applied:
//   node infra/backfill-022-lineups-loyalty.mjs            # dry run (prints only)
//   node infra/backfill-022-lineups-loyalty.mjs --apply    # writes to the DB
//
// Idempotent: every insert is ON CONFLICT DO NOTHING, so re-running is safe and
// never double-counts points. Honors UPLOAD_DIR (defaults to ./uploads).

import { readFile } from "fs/promises";
import { resolve } from "path";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./uploads");
const LINEUPS_PATH = resolve(UPLOAD_DIR, "data/valorant-lineups.json");
const LOYALTY_PATH = resolve(UPLOAD_DIR, "data/loyalty.json");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set — aborting.");
  process.exit(1);
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

const sql = postgres(process.env.DATABASE_URL, { max: 4 });

try {
  console.log(`Mode: ${APPLY ? "APPLY (will write)" : "DRY RUN"}\n`);

  // ── Lineups ────────────────────────────────────────────────────────────────
  const lineups = await readJson(LINEUPS_PATH, []);
  const lineupList = Array.isArray(lineups) ? lineups : [];
  console.log(`Lineups: ${lineupList.length} in ${LINEUPS_PATH}`);

  let lineupsInserted = 0;
  if (APPLY) {
    for (const l of lineupList) {
      const res = await sql`
        INSERT INTO valorant_lineups
          (id, map, agent, ability, side, site, from_callout, to_callout,
           title, description, difficulty, video_url, youtube_id, created_at)
        VALUES
          (${l.id}, ${l.map}, ${l.agent}, ${l.ability}, ${l.side}, ${l.site},
           ${l.fromCallout ?? ""}, ${l.toCallout ?? ""}, ${l.title},
           ${l.description ?? ""}, ${l.difficulty ?? 1}, ${l.videoUrl ?? null},
           ${l.youtubeId ?? null}, ${l.createdAt ?? new Date().toISOString()})
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      lineupsInserted += res.length;
    }
  }

  // ── Loyalty ──────────────────────────────────────────────────────────────
  const loyalty = await readJson(LOYALTY_PATH, {});
  const records = loyalty && typeof loyalty === "object" ? Object.values(loyalty) : [];
  console.log(`Loyalty: ${records.length} user record(s) in ${LOYALTY_PATH}`);

  let recordsInserted = 0;
  let eventsInserted = 0;
  if (APPLY) {
    for (const rec of records) {
      if (!rec || !rec.userId) continue;
      // referral_code must be present (NOT NULL). Fall back to the same derived
      // code the app uses if an old record somehow lacks one.
      const referralCode =
        rec.referralCode ||
        (rec.userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase() || "gg");

      const recRes = await sql`
        INSERT INTO loyalty_records
          (user_id, name, image, points, referral_code, referred_by, updated_at)
        VALUES
          (${rec.userId}, ${rec.name ?? ""}, ${rec.image ?? null},
           ${rec.points ?? 0}, ${referralCode}, ${rec.referredBy ?? null},
           ${rec.updatedAt ?? new Date().toISOString()})
        ON CONFLICT (user_id) DO NOTHING
        RETURNING user_id
      `;
      recordsInserted += recRes.length;

      for (const ev of Array.isArray(rec.events) ? rec.events : []) {
        if (!ev || !ev.action || !ev.key) continue;
        const evRes = await sql`
          INSERT INTO loyalty_events (user_id, action, points, at, key)
          VALUES (${rec.userId}, ${ev.action}, ${ev.points ?? 0},
                  ${ev.at ?? new Date().toISOString()}, ${ev.key})
          ON CONFLICT (user_id, key) DO NOTHING
          RETURNING id
        `;
        eventsInserted += evRes.length;
      }
    }
  }

  console.log("");
  if (APPLY) {
    console.log(
      `Inserted: ${lineupsInserted} lineup(s), ${recordsInserted} loyalty record(s), ${eventsInserted} event(s).`
    );
    console.log("(ON CONFLICT DO NOTHING — re-running is safe and idempotent.)");
  } else {
    console.log("Dry run — nothing written. Re-run with --apply to import.");
  }
} catch (err) {
  console.error("Backfill failed:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
