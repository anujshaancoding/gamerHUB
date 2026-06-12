import { getPool } from "@/lib/db/index";
import { AGENTS } from "@/lib/data/valorant-agents";
import { GAMING_STYLES, LANGUAGES, REGIONS } from "@/lib/constants/games";

export interface PassportGalleryItem {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  name: string;
  rank: string;
  peakRank: string;
  agentName: string;
  agentSlug: string;
  role: string;
  region: string;
  language: string;
  style: string;
  submitted: boolean;
  savedAt: string | null;
  updatedAt: string | null;
}

interface PassportRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  game_username: string | null;
  rank: string | null;
  role: string | null;
  stats: unknown;
  profile_region: string | null;
  preferred_language: string | null;
  gaming_style: string | null;
  updated_at: string | null;
}

function labelFor(options: readonly { value: string; label: string }[], value: string | null) {
  if (!value) return null;
  return options.find((item) => item.value === value)?.label ?? value;
}

function asPassportStats(stats: unknown): Record<string, unknown> {
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) return {};
  const passport = (stats as Record<string, unknown>).passport;
  if (!passport || typeof passport !== "object" || Array.isArray(passport)) return {};
  return passport as Record<string, unknown>;
}

export function mapPassportRow(row: PassportRow): PassportGalleryItem {
  const passport = asPassportStats(row.stats);
  const agentSlug =
    typeof passport.main_agent_slug === "string" ? passport.main_agent_slug : "jett";
  const agent = AGENTS.find((item) => item.slug === agentSlug);
  const regionValue =
    typeof passport.region === "string" ? passport.region : row.profile_region;
  const languageValue =
    typeof passport.language === "string" ? passport.language : row.preferred_language;
  const styleValue =
    typeof passport.playstyle === "string" ? passport.playstyle : row.gaming_style;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    name: row.game_username || row.display_name || row.username,
    rank: row.rank || "Unranked",
    peakRank: typeof passport.peak_rank === "string" ? passport.peak_rank : "Not set",
    agentName:
      typeof passport.main_agent_name === "string"
        ? passport.main_agent_name
        : agent?.name ?? "Jett",
    agentSlug,
    role: row.role || (typeof passport.role === "string" ? passport.role : "Duelist"),
    region: labelFor(REGIONS, regionValue) ?? "India",
    language: labelFor(LANGUAGES, languageValue) ?? "Any",
    style: labelFor(GAMING_STYLES, styleValue) ?? "Competitive",
    submitted: passport.feature_submitted === true,
    savedAt: typeof passport.saved_at === "string" ? passport.saved_at : null,
    updatedAt: row.updated_at,
  };
}

export async function getPassportGallery(limit = 48): Promise<PassportGalleryItem[]> {
  const sql = getPool();
  const safeLimit = Math.max(1, Math.min(limit, 96));

  const rows = await sql`
    SELECT
      ug.id,
      ug.game_username,
      ug.rank,
      ug.role,
      ug.stats,
      ug.updated_at,
      p.username,
      p.display_name,
      p.avatar_url,
      p.region AS profile_region,
      p.preferred_language,
      p.gaming_style
    FROM user_games ug
    JOIN profiles p ON p.id = ug.user_id
    JOIN games g ON g.id = ug.game_id
    WHERE
      g.slug = 'valorant'
      AND ug.is_public = true
      AND ug.stats ? 'passport'
    ORDER BY
      CASE WHEN ug.stats->'passport'->>'feature_submitted' = 'true' THEN 0 ELSE 1 END,
      ug.updated_at DESC NULLS LAST
    LIMIT ${safeLimit}
  `;

  return (rows as unknown as PassportRow[]).map(mapPassportRow);
}
