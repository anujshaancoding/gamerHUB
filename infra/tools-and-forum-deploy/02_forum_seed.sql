-- 009b: Seed default forum sections (top-level categories).
-- Idempotent — re-running just updates titles/descriptions.
--
-- ggLobby V2 is Valorant-only, so the forum carries a single Valorant section
-- plus the pinned Announcements category. The pre-V2 multi-game sections
-- (BGMI, Free Fire, Hardware, LFG, Off-topic, Feedback) are removed from any
-- existing deployment by scripts/migrations/009_forum_valorant_only.sql.

INSERT INTO forum_categories (slug, name, description, icon, color, game_id, display_order)
VALUES
  ('valorant',       'Valorant',        'Indian Valorant scene — agents, comps, ranked rants.',          'Crosshair',   'red',     'valorant',  10),
  ('announcements',  'Announcements',   'Official updates from the ggLobby team.',                       'Megaphone',   'pink',    NULL,        1)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    game_id = EXCLUDED.game_id,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();
