-- 018_game_connections_unique_riot.sql
-- Enforce one Riot/Valorant account <-> one ggLobby account.
--
-- A given Riot puuid (game_connections.provider_user_id where provider='riot')
-- may be linked to at most ONE ggLobby user while the link is active.
--
-- Notes:
--   * game_connections was created directly on the VPS (not via repo migrations),
--     so this file only adds an index — it does NOT create the table.
--   * disconnect() is a soft delete (is_active=false), so the index is PARTIAL on
--     is_active to allow re-linking the same Riot account after an unlink.
--   * Scoped to provider='riot' only — Steam/Discord/Twitch links are untouched,
--     and NULL provider_user_id rows are excluded.

-- 1. Soft-deactivate any pre-existing duplicate active Riot links so the unique
--    index can be created. Keeps the earliest link (by connected_at) per puuid.
--    No rows are deleted.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY provider_user_id
           ORDER BY connected_at ASC, id ASC
         ) AS rn
  FROM game_connections
  WHERE is_active = true
    AND provider = 'riot'
    AND provider_user_id IS NOT NULL
)
UPDATE game_connections gc
SET is_active = false
FROM ranked
WHERE gc.id = ranked.id
  AND ranked.rn > 1;

-- 2. The constraint: at most one ACTIVE riot connection per puuid.
CREATE UNIQUE INDEX IF NOT EXISTS game_connections_riot_account_active_uniq
  ON game_connections (provider_user_id)
  WHERE is_active AND provider = 'riot';
