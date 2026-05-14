-- 009b: Seed default forum sections (HLTV-style top-level categories).
-- Idempotent — re-running just updates titles/descriptions.

INSERT INTO forum_categories (slug, name, description, icon, color, game_id, display_order)
VALUES
  ('valorant',       'Valorant',        'Indian Valorant scene — agents, comps, ranked rants.',          'Crosshair',   'red',     'valorant',  10),
  ('bgmi',           'BGMI',            'India''s BGMI community — sens, scrims, BMPS talk.',            'Target',      'orange',  'bgmi',      20),
  ('freefire',       'Free Fire',       'Free Fire India — characters, FFWS picks, mobile setups.',     'Flame',       'purple',  'freefire',  30),
  ('hardware',       'Hardware & Tech', 'PCs, phones, monitors, peripherals — what to buy and avoid.',  'Cpu',         'cyan',    NULL,        40),
  ('lfg-scrims',     'LFG & Scrims',    'Looking for teammates, sparring, scrim partners.',             'Users',       'emerald', NULL,        50),
  ('off-topic',      'Off-topic',       'Banter, memes, sports, anime, whatever.',                       'Coffee',      'amber',   NULL,        60),
  ('feedback',       'Site Feedback',   'Suggest features, report bugs, request data fixes.',           'MessageSquare','blue',   NULL,        70),
  ('announcements',  'Announcements',   'Official updates from the ggLobby team.',                       'Megaphone',   'pink',    NULL,        1)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    game_id = EXCLUDED.game_id,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();
