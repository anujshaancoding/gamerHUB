-- 009: Forum — strip to Valorant only
-- Run on VPS: sudo -u postgres psql -d gamerhub -f /path/to/009_forum_valorant_only.sql
--
-- ggLobby V2 is a Valorant-only platform, but the forum was seeded back when
-- the site was multi-game. This removes the leftover non-Valorant sections so
-- the board carries just 'valorant' (+ the pinned 'announcements' category).
--
-- Deleting a category cascades to its forum_posts → forum_replies → forum_votes
-- (ON DELETE CASCADE in 01_forum_schema.sql), so any threads under the removed
-- sections are dropped too. Re-runnable: deleting already-gone slugs is a no-op.

DELETE FROM forum_categories
WHERE slug IN ('bgmi', 'freefire', 'hardware', 'lfg-scrims', 'off-topic', 'feedback');

-- Sanity check — should list only 'valorant' and 'announcements'.
SELECT slug, name, display_order FROM forum_categories ORDER BY display_order;
