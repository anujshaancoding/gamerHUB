-- 023_prune_indexes.sql
-- Indexes on created_at for the high-churn operational tables that the prune
-- cron (/api/cron/prune) sweeps, so retention DELETEs use an index range scan
-- instead of a full table scan. Keeps ggLobby comfortably under Neon's free
-- 0.5 GB tier as these log/feed/cache tables grow.
--
-- USER-FACING data (messages, game_match_history) is intentionally NOT pruned
-- and gets no prune index here — auto-deleting it is a product/legal call.
--
-- Idempotent: safe to re-run.

CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at      ON automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at        ON activity_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_clan_activity_log_created_at    ON clan_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_created_at ON leaderboard_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_translations_created_at    ON chat_translations(created_at);
