-- Funnel instrumentation (KR1.1) + discovery→signup attribution (Tier 1/2 experiment)
-- Run on VPS: sudo -u postgres psql -d gamerhub -f /path/to/014_funnel_events.sql
--
-- Creates the append-only funnel_events table used for:
--   - signup       (email + google), with session_id + ref in meta for attribution
--   - activation   ("found a teammate": lfg_accept | friend_accept)
--   - cta_click    (anonymous, logged-out signup-CTA clicks; user_id IS NULL)
--
-- Also adds a `ref` column to page_views for first-touch ?ref= capture.
-- Safe to re-run (idempotent).

-- ─── funnel_events ────────────────────────────────────────────
-- NOTE: user_id is nullable so anonymous cta_click events (no signed-in user)
-- can be recorded. signup/activation rows always carry a non-null user_id.
CREATE TABLE IF NOT EXISTS funnel_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID,                    -- the user the event is about; NULL for anonymous cta_click
  event       TEXT        NOT NULL,    -- 'signup' | 'activation' | 'cta_click' (+ room to grow)
  source      TEXT,                    -- 'email' | 'google' | 'lfg_accept' | 'friend_accept' | CTA source enum
  meta        JSONB,                   -- session_id, ref, counterpart_user_id, post_id, page, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_user_event ON funnel_events (user_id, event);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_time ON funnel_events (event, created_at);
-- Join key for visitor→signup attribution (session_id lives in meta JSONB)
CREATE INDEX IF NOT EXISTS idx_funnel_events_session    ON funnel_events ((meta->>'session_id'));

-- ─── page_views.ref (first-touch ?ref= referral param) ────────
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS ref TEXT;

-- ─── Ownership & permissions ──────────────────────────────────
ALTER TABLE funnel_events OWNER TO gamerhub_app;
GRANT ALL ON funnel_events TO gamerhub_app;
GRANT USAGE, SELECT ON SEQUENCE funnel_events_id_seq TO gamerhub_app;

-- ─── RLS (allow all for now — tighten before team expansion) ──
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_funnel_events ON funnel_events;
CREATE POLICY allow_all_funnel_events ON funnel_events FOR ALL USING (true) WITH CHECK (true);
