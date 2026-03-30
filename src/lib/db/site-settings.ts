/**
 * Site-wide settings stored in a `site_settings` table.
 *
 * The table is auto-created on first access. Settings are cached in-memory
 * with a short TTL so API routes / server components don't hit the DB on
 * every request.
 */

import { getPool } from "./index";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SiteSettings {
  hide_news: boolean;
  // Automation settings
  automation_enabled: boolean;
  automation_posts_per_day: number;        // target posts per day (3-15)
  automation_comments_per_day: number;     // target comments per day (2-10)
  automation_active_hours_start: number;   // IST hour (0-23), e.g. 10
  automation_active_hours_end: number;     // IST hour (0-23), e.g. 23
  automation_min_gap_minutes: number;      // minimum minutes between actions
  automation_weekend_boost: boolean;       // post more on weekends
}

const DEFAULTS: SiteSettings = {
  hide_news: true,
  automation_enabled: false,
  automation_posts_per_day: 5,
  automation_comments_per_day: 4,
  automation_active_hours_start: 10,
  automation_active_hours_end: 23,
  automation_min_gap_minutes: 25,
  automation_weekend_boost: true,
};

// ── In-memory cache ──────────────────────────────────────────────────────────

let cachedSettings: SiteSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

/** Bust the in-memory cache so the next read hits the DB. */
export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}

// ── Ensure table exists ──────────────────────────────────────────────────────

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  const sql = getPool();
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT 'null'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  tableEnsured = true;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Read all site settings (uses cache). */
export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    await ensureTable();
    const sql = getPool();
    const rows = await sql`SELECT key, value FROM site_settings`;

    const settings: SiteSettings = { ...DEFAULTS };
    for (const row of rows) {
      if (row.key in settings) {
        (settings as unknown as Record<string, unknown>)[row.key] = row.value;
      }
    }

    cachedSettings = settings;
    cacheTimestamp = now;
    return settings;
  } catch (err) {
    console.error("Failed to read site_settings, using defaults:", err);
    return { ...DEFAULTS };
  }
}

/** Read a single setting. */
export async function getSiteSetting<K extends keyof SiteSettings>(
  key: K
): Promise<SiteSettings[K]> {
  const settings = await getSiteSettings();
  return settings[key];
}

/** Write a single setting (upsert). Busts cache automatically. */
export async function setSiteSetting<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<void> {
  await ensureTable();
  const sql = getPool();
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key)
    DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, updated_at = now()
  `;
  invalidateSettingsCache();
}
