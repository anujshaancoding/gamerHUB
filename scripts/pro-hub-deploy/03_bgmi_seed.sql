-- 008c: Pro Hub seed data — top Indian BGMI teams + players
--
-- PLACEHOLDER DATA: rosters/stats/setups are best-effort approximations for
-- layout testing. Verify everything via team announcements, BMPS broadcasts,
-- Krafton esports site, and player streams before going public.
--
-- Apply via:
--   sudo -u postgres psql -d gamerhub -f /path/to/008c_pro_hub_bgmi_seed.sql
--
-- Safe to re-run: uses ON CONFLICT (slug) DO UPDATE.

-- ─── Teams ──────────────────────────────────────────────────────────────────
INSERT INTO pro_teams (slug, name, short_name, game, region, founded_year, socials, is_active)
VALUES
  ('s8ul-bgmi',        'S8UL Esports',          'S8UL', 'bgmi', 'India', 2017,
    '{"twitter":"S8UL_Esports","instagram":"s8ul_esports","youtube":"S8ULEsports"}'::jsonb, TRUE),
  ('soul-bgmi',        'Team Soul',             'SOUL', 'bgmi', 'India', 2018,
    '{"twitter":"TeamSoulOG","instagram":"teamsoulofficial","youtube":"TeamSoulOfficial"}'::jsonb, TRUE),
  ('godlike-bgmi',     'GodLike Esports',       'GE',   'bgmi', 'India', 2018,
    '{"twitter":"GodLike_GO","instagram":"godlikeesports","youtube":"GodLikeEsports"}'::jsonb, TRUE),
  ('orangutan-bgmi',   'Orangutan Gaming',      'OG',   'bgmi', 'India', 2021,
    '{"twitter":"OrangutanGaming","instagram":"orangutangaming"}'::jsonb, TRUE),
  ('global-esports-bgmi','Global Esports BGMI', 'GE-B', 'bgmi', 'India', 2017,
    '{"twitter":"GlobalEsports","instagram":"globalesports"}'::jsonb, TRUE),
  ('revenant-bgmi',    'Revenant Esports BGMI', 'RVT',  'bgmi', 'India', 2020,
    '{"twitter":"revenantesport"}'::jsonb, TRUE)
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
  ('s8ul-jonathan',   'bgmi', 'Jonathan',     'Jonathan Amaral',
    (SELECT id FROM pro_teams WHERE slug = 's8ul-bgmi'),
    'Assaulter', 'IN', 'Mumbai',
    'One of the most decorated BGMI pros in India — explosive entry fragger, Tier-1 finalist across BMPS/BMOC seasons.',
    'Conqueror', 'Conqueror', 1,
    '{"twitter":"jonathangaming1","instagram":"jonathangaming1","youtube":"JONATHANGAMING"}'::jsonb,
    TRUE, TRUE),

  ('soul-mortal',     'bgmi', 'Mortal',        'Naman Mathur',
    (SELECT id FROM pro_teams WHERE slug = 'soul-bgmi'),
    'IGL',       'IN', 'Mumbai',
    'Founder of Team Soul. Long-time face of Indian battle royale esports; transitioned to org leadership but still streams competitively.',
    'Conqueror', 'Ace Master', 2,
    '{"twitter":"S8ulMortal","instagram":"ig_mortal","youtube":"MortaL"}'::jsonb,
    TRUE, TRUE),

  ('godlike-zgod',    'bgmi', 'ZGOD',          'Pranav R',
    (SELECT id FROM pro_teams WHERE slug = 'godlike-bgmi'),
    'Sniper',    'IN', 'Chennai',
    'Long-range specialist; consistent BMPS performer with high finishes per match.',
    'Conqueror', 'Conqueror', 3,
    '{"instagram":"zgod_yt","youtube":"ZGOD"}'::jsonb,
    TRUE, FALSE),

  ('s8ul-mavi',       'bgmi', 'MaVi',          'Harmandeep Singh',
    (SELECT id FROM pro_teams WHERE slug = 's8ul-bgmi'),
    'Assaulter', 'IN', 'Punjab',
    'Aggressive close-range fragger; partner-in-crime with Jonathan on S8UL rotations.',
    'Conqueror', 'Conqueror', 4,
    '{"instagram":"mavi_om","youtube":"MaViOM"}'::jsonb,
    TRUE, FALSE),

  ('soul-aquanox',    'bgmi', 'AquaNoob',      'Faiyaz Khan',
    (SELECT id FROM pro_teams WHERE slug = 'soul-bgmi'),
    'Support',   'IN', 'Mumbai',
    'Calm, utility-heavy support role; great map awareness in zone-rotations.',
    'Conqueror', 'Ace Master', 5,
    '{"instagram":"aquanoob_07"}'::jsonb,
    TRUE, FALSE),

  ('og-shadow',       'bgmi', 'ShadoW',         'Aakash V',
    (SELECT id FROM pro_teams WHERE slug = 'orangutan-bgmi'),
    'IGL',       'IN', 'Bangalore',
    'Strategy-first IGL; favours late-circle positioning and conservative rotations.',
    'Conqueror', 'Ace', 6,
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

-- ─── Current-season stats (BGMI shape: K/D, Avg DMG via adr, HS, finishes & survival in game_stats) ──
INSERT INTO pro_player_stats (
  player_id, season, is_current, matches_played, wins, losses,
  k_d_ratio, adr, hs_pct, acs, game_stats, source_url
)
SELECT p.id, 'BMPS-2026-S1', TRUE, ms, w, l, kd, dmg, hs, NULL, gs::jsonb, src
FROM (VALUES
  ('s8ul-jonathan',  120, 24, 96, 5.8, 612.4, 22.3,
   '{"avg_damage":612.4,"finishes_per_match":5.1,"survival_rate":61.5,"preferred_mode":"TPP","notes":"Top-tier entry fragger."}',
   'https://liquipedia.net/pubgmobile/Jonathan'),
  ('soul-mortal',    104, 19, 85, 3.2, 488.0, 18.6,
   '{"avg_damage":488.0,"finishes_per_match":3.5,"survival_rate":58.0,"preferred_mode":"TPP","notes":"IGL — calls rotations more than he fragments."}',
   'https://liquipedia.net/pubgmobile/Mortal'),
  ('godlike-zgod',   112, 22, 90, 4.6, 540.2, 20.1,
   '{"avg_damage":540.2,"finishes_per_match":4.2,"survival_rate":60.0,"preferred_mode":"TPP","notes":"Long-range specialist."}',
   NULL),
  ('s8ul-mavi',      118, 23, 95, 5.1, 580.7, 21.4,
   '{"avg_damage":580.7,"finishes_per_match":4.6,"survival_rate":59.4,"preferred_mode":"TPP"}',
   NULL),
  ('soul-aquanox',   100, 18, 82, 3.0, 420.3, 17.0,
   '{"avg_damage":420.3,"finishes_per_match":2.8,"survival_rate":63.2,"preferred_mode":"TPP","notes":"Utility/support role."}',
   NULL),
  ('og-shadow',       96, 16, 80, 2.8, 395.6, 16.4,
   '{"avg_damage":395.6,"finishes_per_match":2.5,"survival_rate":64.8,"preferred_mode":"TPP","notes":"Late-circle specialist."}',
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
  ('s8ul-jonathan',
    'iPhone 15 Pro Max', 120,
    'Apple AirPods Pro 2', '4-finger', 'No triggers (claw + screen taps)',
    '{"ads":{"red_dot":120,"2x":85,"3x":50,"4x":40,"6x":28,"8x":22},"gyro":{"red_dot":300,"3x":250,"4x":180}}',
    '{"graphics_preset":"smooth","fps_cap":120,"hud_notes":"Custom 4-finger layout with separate fire and ADS buttons"}',
    'Plays claw + 4-finger without external triggers. ADS sens tuned around 8x for late-circle plays.',
    NULL),

  ('soul-mortal',
    'iQOO 12', 144,
    'Sony WH-1000XM5', 'thumb', 'GameSir F4 Falcon',
    '{"ads":{"red_dot":110,"2x":80,"3x":48,"4x":38,"6x":26,"8x":20},"gyro":{"red_dot":280,"3x":230,"4x":170}}',
    '{"graphics_preset":"smooth","fps_cap":90}',
    'IGL — comms-heavy player; uses external triggers for sustained DPS.',
    NULL),

  ('godlike-zgod',
    'iQOO 11', 144,
    'Apple AirPods Pro 2', '4-finger', 'BlackShark JS200',
    '{"ads":{"red_dot":105,"2x":75,"3x":45,"4x":36,"6x":24,"8x":18},"gyro":{"red_dot":260,"3x":210,"4x":160}}',
    '{"graphics_preset":"smooth","fps_cap":90}',
    'Lower ADS sens for long-range tracking.',
    NULL),

  ('s8ul-mavi',
    'iPhone 14 Pro', 120,
    'Apple AirPods Pro 2', '4-finger', 'GameSir F4 Falcon',
    '{"ads":{"red_dot":118,"2x":82,"3x":50,"4x":40,"6x":28},"gyro":{"red_dot":290,"3x":240,"4x":175}}',
    '{"graphics_preset":"smooth","fps_cap":120}',
    NULL,
    NULL),

  ('soul-aquanox',
    'iQOO Neo 9 Pro', 144,
    'Realme Buds Air 3', 'thumb', 'No triggers',
    '{"ads":{"red_dot":100,"2x":70,"3x":42,"4x":34,"6x":22},"gyro":{"red_dot":250,"3x":200,"4x":150}}',
    '{"graphics_preset":"smooth","fps_cap":90}',
    NULL,
    NULL),

  ('og-shadow',
    'iQOO 11', 144,
    'Sony WF-1000XM4', 'thumb', 'GameSir F7 Claw',
    '{"ads":{"red_dot":108,"2x":78,"3x":46,"4x":37,"6x":25},"gyro":{"red_dot":270,"3x":220,"4x":165}}',
    '{"graphics_preset":"smooth","fps_cap":90}',
    NULL,
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
