-- 04: Pro Hub seed — top Indian Free Fire teams + players
--
-- PLACEHOLDER DATA: rosters/stats/setups are best-effort approximations for
-- layout testing. Verify via FFWS India broadcasts, Garena tournament pages,
-- AFK Gaming and player streams before going public.
--
-- Safe to re-run: ON CONFLICT (slug) DO UPDATE.

-- ─── Teams ──────────────────────────────────────────────────────────────────
INSERT INTO pro_teams (slug, name, short_name, game, region, founded_year, socials, is_active)
VALUES
  ('total-gaming-ff',  'Total Gaming Esports',  'TG',   'freefire', 'India', 2021,
    '{"twitter":"AjjuBhai94","instagram":"ajjubhai94","youtube":"TotalGaming"}'::jsonb, TRUE),
  ('nonstop-gaming-ff','Nonstop Gaming',        'NG',   'freefire', 'India', 2020,
    '{"instagram":"nonstop_gaming","youtube":"NonstopGaming"}'::jsonb, TRUE),
  ('chemin-esports-ff','Chemin Esports',        'CE',   'freefire', 'India', 2020,
    '{"twitter":"CheminEsports","instagram":"cheminesports"}'::jsonb, TRUE),
  ('headhunters-ff',   'HeadHunters Esports',   'HH',   'freefire', 'India', 2021,
    '{"instagram":"headhunters.esports"}'::jsonb, TRUE)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      short_name = EXCLUDED.short_name,
      socials = EXCLUDED.socials,
      is_active = EXCLUDED.is_active;

-- ─── Players ────────────────────────────────────────────────────────────────
INSERT INTO pro_players (
  slug, game, ign, real_name, team_id, role, country, region,
  bio, peak_rank, current_rank, national_rank, socials, is_active, is_featured
)
SELECT * FROM (VALUES
  ('tg-ajjubhai',     'freefire', 'AjjuBhai',     'Ajay Sharma',
    (SELECT id FROM pro_teams WHERE slug = 'total-gaming-ff'),
    'IGL',       'IN', 'Pune',
    'India''s most-watched Free Fire creator and the face of Total Gaming. Pivoted from solo content into building a competitive roster.',
    'Grandmaster', 'Grandmaster', 1,
    '{"instagram":"ajjubhai94","youtube":"TotalGaming","twitter":"AjjuBhai94"}'::jsonb,
    TRUE, TRUE),

  ('ng-gyan-sujoy',   'freefire', 'Gyan Sujoy',   'Sujoy Goswami',
    (SELECT id FROM pro_teams WHERE slug = 'nonstop-gaming-ff'),
    'Assaulter', 'IN', 'Kolkata',
    'Aggressive entry fragger known for booyah-rate consistency in clash-squad and BR formats.',
    'Grandmaster', 'Grandmaster', 2,
    '{"instagram":"gyangaming.in","youtube":"GyanGaming"}'::jsonb,
    TRUE, TRUE),

  ('ce-romeo',        'freefire', 'Romeo',        'Naufal Khan',
    (SELECT id FROM pro_teams WHERE slug = 'chemin-esports-ff'),
    'Support',   'IN', 'Mumbai',
    'Mature utility-role player. Strong rotations and clutch positioning on Bermuda.',
    'Grandmaster', 'Heroic', 3,
    '{}'::jsonb,
    TRUE, FALSE),

  ('hh-jash',         'freefire', 'JASH',         'Jash Dhokia',
    (SELECT id FROM pro_teams WHERE slug = 'headhunters-ff'),
    'Sniper',    'IN', 'Ahmedabad',
    'Long-range specialist. Consistent finishes-per-match over the last two FFWS qualifiers.',
    'Grandmaster', 'Heroic', 4,
    '{}'::jsonb,
    TRUE, FALSE),

  ('tg-laksh',        'freefire', 'Laksh',        'Laksh Khurana',
    (SELECT id FROM pro_teams WHERE slug = 'total-gaming-ff'),
    'Assaulter', 'IN', 'Delhi NCR',
    'Rising fragger on Total Gaming roster. High-volume content creator.',
    'Grandmaster', 'Heroic', 5,
    '{"instagram":"lakshxff","youtube":"Laksh"}'::jsonb,
    TRUE, FALSE),

  ('ng-rocky',        'freefire', 'Rocky',        'Rakesh Singh',
    (SELECT id FROM pro_teams WHERE slug = 'nonstop-gaming-ff'),
    'IGL',       'IN', 'Lucknow',
    'IGL who shines on Kalahari and Purgatory — favours rotation-heavy play.',
    'Heroic', 'Heroic', 6,
    '{}'::jsonb,
    TRUE, FALSE)
) AS p(slug, game, ign, real_name, team_id, role, country, region,
       bio, peak_rank, current_rank, national_rank, socials, is_active, is_featured)
ON CONFLICT (slug) DO UPDATE
  SET ign = EXCLUDED.ign,
      real_name = EXCLUDED.real_name,
      team_id = EXCLUDED.team_id,
      role = EXCLUDED.role,
      region = EXCLUDED.region,
      bio = EXCLUDED.bio,
      peak_rank = EXCLUDED.peak_rank,
      current_rank = EXCLUDED.current_rank,
      national_rank = EXCLUDED.national_rank,
      socials = EXCLUDED.socials,
      is_active = EXCLUDED.is_active,
      is_featured = EXCLUDED.is_featured;

-- ─── Current-season stats (FF shape: K/D, avg damage via adr, HS%, booyah rate + character pool in game_stats) ─
INSERT INTO pro_player_stats (
  player_id, season, is_current, matches_played, wins, losses,
  k_d_ratio, adr, hs_pct, acs, game_stats, source_url
)
SELECT p.id, 'FFWS-2026-S1', TRUE, ms, w, l, kd, dmg, hs, NULL, gs::jsonb, src
FROM (VALUES
  ('tg-ajjubhai',
   90, 22, 68, 4.8, 1820, 31.5,
   '{"booyah_rate":24.4,"character_usage":[{"character":"K","pick_rate":48},{"character":"Alok","pick_rate":35},{"character":"Chrono","pick_rate":17}],"preferred_mode":"BR Squad","notes":"Famous for late-circle 1v3 clutches."}',
   NULL),

  ('ng-gyan-sujoy',
   95, 25, 70, 5.1, 1955, 34.2,
   '{"booyah_rate":26.3,"character_usage":[{"character":"Alok","pick_rate":52},{"character":"K","pick_rate":33},{"character":"Skyler","pick_rate":15}],"preferred_mode":"Clash Squad","notes":"High DMG per match — entry-fragger numbers."}',
   NULL),

  ('ce-romeo',
   88, 19, 69, 3.6, 1480, 27.8,
   '{"booyah_rate":21.5,"character_usage":[{"character":"Skyler","pick_rate":45},{"character":"Alok","pick_rate":40},{"character":"Wukong","pick_rate":15}],"preferred_mode":"BR Squad"}',
   NULL),

  ('hh-jash',
   84, 17, 67, 3.4, 1395, 38.5,
   '{"booyah_rate":20.2,"character_usage":[{"character":"Hayato","pick_rate":50},{"character":"Kelly","pick_rate":35},{"character":"Andrew","pick_rate":15}],"preferred_mode":"BR Squad","notes":"Long-range / sniper specialist (HS% reflects it)."}',
   NULL),

  ('tg-laksh',
   78, 16, 62, 3.8, 1525, 28.4,
   '{"booyah_rate":20.5,"character_usage":[{"character":"K","pick_rate":42},{"character":"Alok","pick_rate":38},{"character":"Chrono","pick_rate":20}],"preferred_mode":"BR Squad"}',
   NULL),

  ('ng-rocky',
   80, 15, 65, 3.2, 1410, 26.0,
   '{"booyah_rate":18.7,"character_usage":[{"character":"Alok","pick_rate":50},{"character":"Skyler","pick_rate":30},{"character":"K","pick_rate":20}],"preferred_mode":"BR Squad"}',
   NULL)
) AS s(slug, ms, w, l, kd, dmg, hs, gs, src)
JOIN pro_players p ON p.slug = s.slug
ON CONFLICT (player_id, season) DO UPDATE
  SET is_current = EXCLUDED.is_current,
      matches_played = EXCLUDED.matches_played,
      wins = EXCLUDED.wins,
      losses = EXCLUDED.losses,
      k_d_ratio = EXCLUDED.k_d_ratio,
      adr = EXCLUDED.adr,
      hs_pct = EXCLUDED.hs_pct,
      game_stats = EXCLUDED.game_stats,
      source_url = EXCLUDED.source_url,
      fetched_at = NOW();

-- ─── Gear / setup (mobile) ──────────────────────────────────────────────────
INSERT INTO pro_player_gear (
  player_id, platform, device_model, monitor_hz,
  headphones, grip_style, controllers,
  sensitivities, ingame_settings, notes, source_url
)
SELECT p.id, 'mobile', dev, hz, hp, grip, ctrl,
       sens::jsonb, settings::jsonb, notes, src
FROM (VALUES
  ('tg-ajjubhai',
    'iPhone 15 Pro Max', 120,
    'Apple AirPods Pro 2', '2-finger', 'No triggers',
    '{"general":90,"red_dot":85,"2x":78,"4x":70,"awm":50,"fire_button":80}',
    '{"graphics_preset":"standard","fps_cap":120,"hud_notes":"Standard 2-finger layout"}',
    'Plays 2-finger on iPhone — atypical for the pro scene; relies on snap-aim more than tracking.',
    NULL),

  ('ng-gyan-sujoy',
    'iQOO 12', 144,
    'Sony WH-1000XM5', '4-finger', 'GameSir F4 Falcon',
    '{"general":95,"red_dot":90,"2x":80,"4x":72,"awm":52,"fire_button":85}',
    '{"graphics_preset":"high","fps_cap":120}',
    NULL,
    NULL),

  ('ce-romeo',
    'iQOO Neo 9 Pro', 144,
    'Realme Buds Air 5 Pro', '4-finger', 'No triggers',
    '{"general":88,"red_dot":82,"2x":75,"4x":68,"awm":48,"fire_button":78}',
    '{"graphics_preset":"high","fps_cap":120}',
    NULL,
    NULL),

  ('hh-jash',
    'iPhone 14 Pro', 120,
    'Apple AirPods Pro 2', '4-finger', 'BlackShark JS200',
    '{"general":85,"red_dot":80,"2x":74,"4x":65,"awm":42,"fire_button":75}',
    '{"graphics_preset":"standard","fps_cap":120}',
    'Lower scope sens for sniper plays.',
    NULL),

  ('tg-laksh',
    'iQOO 11', 144,
    'OnePlus Buds Pro 2', '4-finger', 'GameSir F4 Falcon',
    '{"general":92,"red_dot":86,"2x":78,"4x":70,"awm":50,"fire_button":82}',
    '{"graphics_preset":"high","fps_cap":120}',
    NULL,
    NULL),

  ('ng-rocky',
    'iPhone 13', 60,
    'Apple AirPods (3rd gen)', 'thumb', 'No triggers',
    '{"general":80,"red_dot":75,"2x":70,"4x":65,"awm":48,"fire_button":72}',
    '{"graphics_preset":"standard","fps_cap":60}',
    'Thumb player on a 60Hz device — wins on game-sense not raw speed.',
    NULL)
) AS g(slug, dev, hz, hp, grip, ctrl, sens, settings, notes, src)
JOIN pro_players p ON p.slug = g.slug
ON CONFLICT (player_id) DO UPDATE
  SET platform = EXCLUDED.platform,
      device_model = EXCLUDED.device_model,
      monitor_hz = EXCLUDED.monitor_hz,
      headphones = EXCLUDED.headphones,
      grip_style = EXCLUDED.grip_style,
      controllers = EXCLUDED.controllers,
      sensitivities = EXCLUDED.sensitivities,
      ingame_settings = EXCLUDED.ingame_settings,
      notes = EXCLUDED.notes,
      source_url = EXCLUDED.source_url,
      last_verified_at = NOW();
