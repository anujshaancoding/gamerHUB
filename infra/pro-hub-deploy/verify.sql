-- Pro Hub deploy — post-install sanity checks.
-- Run via:
--   sudo -u postgres psql -d gamerhub -f verify.sql

\echo '--- Tables ---'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'pro\_%' ESCAPE '\'
ORDER BY table_name;

\echo
\echo '--- Row counts ---'
SELECT 'pro_teams'        AS table, COUNT(*) AS rows FROM pro_teams
UNION ALL SELECT 'pro_players',        COUNT(*) FROM pro_players
UNION ALL SELECT 'pro_player_stats',   COUNT(*) FROM pro_player_stats
UNION ALL SELECT 'pro_player_gear',    COUNT(*) FROM pro_player_gear
UNION ALL SELECT 'pro_events',         COUNT(*) FROM pro_events
UNION ALL SELECT 'pro_player_follows', COUNT(*) FROM pro_player_follows;

\echo
\echo '--- Per-game player counts ---'
SELECT game, COUNT(*) AS players
FROM pro_players
WHERE is_active = TRUE
GROUP BY game
ORDER BY game;

\echo
\echo '--- Top-3 ranked players per game ---'
SELECT game, national_rank, ign, slug
FROM pro_players
WHERE national_rank IS NOT NULL AND is_active = TRUE
ORDER BY game, national_rank
LIMIT 9;

\echo
\echo '--- Gear platform mix ---'
SELECT platform, COUNT(*) FROM pro_player_gear GROUP BY platform;

\echo
\echo '--- Upcoming events ---'
SELECT game, name, starts_at, region
FROM pro_events
WHERE starts_at >= NOW() - INTERVAL '7 days'
ORDER BY starts_at
LIMIT 10;
