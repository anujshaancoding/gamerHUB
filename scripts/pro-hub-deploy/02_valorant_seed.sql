-- 008b: Pro Hub seed data — top Indian Valorant teams + players
--
-- PLACEHOLDER DATA: roster/stat/gear details are best-effort approximations
-- assembled for layout testing. Replace via admin tooling once verified against
-- vlr.gg, team announcements, and player streams before going public.
--
-- Apply via:
--   sudo -u postgres psql -d gamerhub -f /path/to/008b_pro_hub_valorant_seed.sql
--
-- Safe to re-run: uses ON CONFLICT (slug) DO UPDATE.

-- ─── Teams ──────────────────────────────────────────────────────────────────
INSERT INTO pro_teams (slug, name, short_name, game, region, founded_year, socials, is_active)
VALUES
  ('global-esports',  'Global Esports',   'GE',   'valorant', 'India', 2017,
    '{"twitter":"GlobalEsports","instagram":"globalesports","youtube":"GlobalEsports"}'::jsonb, TRUE),
  ('velocity-gaming', 'Velocity Gaming',  'VLT',  'valorant', 'India', 2019,
    '{"twitter":"VelocityGamingg","instagram":"velocitygamingofficial"}'::jsonb, TRUE),
  ('true-rippers',    'True Rippers Esports', 'TR', 'valorant', 'India', 2018,
    '{"twitter":"TrueRippers","instagram":"truerippers"}'::jsonb, TRUE),
  ('reckoning-esports','Reckoning Esports','RE',  'valorant', 'India', 2020,
    '{"twitter":"ReckoningGG"}'::jsonb, TRUE),
  ('revenant-esports','Revenant Esports', 'RVT',  'valorant', 'India', 2020,
    '{"twitter":"revenantesport","instagram":"revenantesports"}'::jsonb, TRUE)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      short_name = EXCLUDED.short_name,
      socials = EXCLUDED.socials,
      is_active = EXCLUDED.is_active;

-- ─── Players ────────────────────────────────────────────────────────────────
-- Order roughly reflects national_rank for now. Update via admin UI when source-verified.
INSERT INTO pro_players (
  slug, game, ign, real_name, team_id, role, country, region,
  bio, peak_rank, current_rank, national_rank, socials, is_active, is_featured
)
SELECT * FROM (VALUES
  ('ge-skrossi',  'valorant', 'SkRossi',     'Ganesh Gangadhar',
    (SELECT id FROM pro_teams WHERE slug = 'global-esports'),
    'Duelist',  'IN', 'Hyderabad',
    'One of India''s most recognisable Valorant pros; long associated with Global Esports'' international roster.',
    'Radiant', 'Radiant', 1,
    '{"twitter":"SkRossi_","instagram":"skrossi_","youtube":"SkRossi","twitch":"SkRossi"}'::jsonb,
    TRUE, TRUE),

  ('ge-bazzi',    'valorant', 'Bazzi',       'Pratik Lohakpure',
    (SELECT id FROM pro_teams WHERE slug = 'global-esports'),
    'IGL',      'IN', 'Mumbai',
    'IGL known for calm mid-rounds and a deep Sage/Killjoy support pool.',
    'Radiant', 'Radiant', 2,
    '{"twitter":"BazziVAL","instagram":"bazzival"}'::jsonb,
    TRUE, TRUE),

  ('vlt-rite2ace','valorant', 'Rite2ace',    'Abhirup Choudhury',
    (SELECT id FROM pro_teams WHERE slug = 'velocity-gaming'),
    'Initiator','IN', 'Kolkata',
    'Veteran initiator player. Strong Sova lineups, frequent VCT Challengers fixture.',
    'Radiant', 'Radiant', 3,
    '{"twitter":"rite2ace","instagram":"rite2ace"}'::jsonb,
    TRUE, FALSE),

  ('tr-deathmaker','valorant','DeathMakeR',  'Saksham Choudhary',
    (SELECT id FROM pro_teams WHERE slug = 'true-rippers'),
    'Sentinel', 'IN', 'Delhi NCR',
    'Sentinel main known for Cypher/Killjoy setups; signature lockdown style on Bind and Split.',
    'Radiant', 'Radiant', 4,
    '{"twitter":"DeathMakeR_","instagram":"deathmaker_"}'::jsonb,
    TRUE, FALSE),

  ('re-amaterasu','valorant', 'Amaterasu',   'Adwitiya Patnaik',
    (SELECT id FROM pro_teams WHERE slug = 'reckoning-esports'),
    'Duelist',  'IN', 'Bhubaneswar',
    'Aggressive Jett/Raze player; one of the rising entry fraggers in the South Asian scene.',
    'Radiant', 'Radiant', 5,
    '{"twitter":"AmaterasuVAL"}'::jsonb,
    TRUE, FALSE),

  ('rvt-blackwidow','valorant','BlackWidoW', 'Sabyasachi Bose',
    (SELECT id FROM pro_teams WHERE slug = 'revenant-esports'),
    'Flex',     'IN', 'Bangalore',
    'Flex player who can swap between Controller and Initiator depending on the comp.',
    'Radiant', 'Immortal 3', 6,
    '{"twitter":"BlackWidoWVAL"}'::jsonb,
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

-- ─── Current-season stats (placeholder shapes) ─────────────────────────────
INSERT INTO pro_player_stats (
  player_id, season, is_current, matches_played, wins, losses,
  k_d_ratio, adr, hs_pct, acs, game_stats, source_url
)
SELECT p.id, '2026-S1', TRUE, ms, w, l, kd, adr, hs, acs, gs::jsonb, src
FROM (VALUES
  ('ge-skrossi',     58, 38, 20, 1.34, 162.3, 28.4, 268.0,
   '{"agent_pool":[{"agent":"Jett","pick_rate":54,"matches":31,"win_rate":61},{"agent":"Raze","pick_rate":31,"matches":18,"win_rate":55},{"agent":"Neon","pick_rate":15,"matches":9,"win_rate":52}],"first_blood_pct":24.1,"primary_role":"Duelist"}',
   'https://www.vlr.gg/player/skrossi'),
  ('ge-bazzi',       54, 33, 21, 1.12, 138.6, 23.1, 232.5,
   '{"agent_pool":[{"agent":"Killjoy","pick_rate":40,"matches":22,"win_rate":63},{"agent":"Sage","pick_rate":33,"matches":18,"win_rate":58},{"agent":"Cypher","pick_rate":27,"matches":14,"win_rate":50}],"primary_role":"IGL"}',
   'https://www.vlr.gg/player/bazzi'),
  ('vlt-rite2ace',   46, 26, 20, 1.18, 145.2, 25.6, 240.8,
   '{"agent_pool":[{"agent":"Sova","pick_rate":48,"matches":22,"win_rate":54},{"agent":"Fade","pick_rate":35,"matches":16,"win_rate":56},{"agent":"KAY/O","pick_rate":17,"matches":8,"win_rate":50}],"primary_role":"Initiator"}',
   'https://www.vlr.gg/player/rite2ace'),
  ('tr-deathmaker',  50, 30, 20, 1.10, 132.0, 26.0, 225.4,
   '{"agent_pool":[{"agent":"Killjoy","pick_rate":50,"matches":25,"win_rate":60},{"agent":"Cypher","pick_rate":36,"matches":18,"win_rate":56},{"agent":"Chamber","pick_rate":14,"matches":7,"win_rate":57}],"primary_role":"Sentinel"}',
   'https://www.vlr.gg/player/deathmaker'),
  ('re-amaterasu',   42, 23, 19, 1.21, 148.7, 27.0, 245.0,
   '{"agent_pool":[{"agent":"Jett","pick_rate":52,"matches":22,"win_rate":55},{"agent":"Raze","pick_rate":33,"matches":14,"win_rate":50},{"agent":"Yoru","pick_rate":15,"matches":6,"win_rate":50}],"first_blood_pct":22.5,"primary_role":"Duelist"}',
   NULL),
  ('rvt-blackwidow', 40, 21, 19, 1.06, 128.4, 24.0, 218.1,
   '{"agent_pool":[{"agent":"Omen","pick_rate":40,"matches":16,"win_rate":56},{"agent":"Sova","pick_rate":35,"matches":14,"win_rate":50},{"agent":"Astra","pick_rate":25,"matches":10,"win_rate":50}],"primary_role":"Flex"}',
   NULL)
) AS s(slug, ms, w, l, kd, adr, hs, acs, gs, src)
JOIN pro_players p ON p.slug = s.slug
ON CONFLICT (player_id, season) DO UPDATE
  SET is_current = EXCLUDED.is_current,
      matches_played = EXCLUDED.matches_played,
      wins = EXCLUDED.wins,
      losses = EXCLUDED.losses,
      k_d_ratio = EXCLUDED.k_d_ratio,
      adr = EXCLUDED.adr,
      hs_pct = EXCLUDED.hs_pct,
      acs = EXCLUDED.acs,
      game_stats = EXCLUDED.game_stats,
      source_url = EXCLUDED.source_url,
      fetched_at = NOW();

-- ─── Gear / setup (PC) ──────────────────────────────────────────────────────
INSERT INTO pro_player_gear (
  player_id, platform, device_model, cpu, gpu, ram,
  monitor, monitor_hz, mouse, keyboard, headphones, mousepad,
  sensitivities, ingame_settings, notes, source_url
)
SELECT p.id, 'pc', dm, cpu, gpu, ram, mon, hz, mouse, kb, hp, mp,
       sens::jsonb, settings::jsonb, notes, src
FROM (VALUES
  ('ge-skrossi',
    'Custom Build', 'Intel Core i9-13900K', 'NVIDIA RTX 4080', '32GB DDR5',
    'BenQ Zowie XL2546K', 240,
    'Logitech G Pro X Superlight', 'Logitech G Pro X TKL',
    'Logitech G Pro X', 'Logitech G840 XL',
    '{"general":0.35,"edpi":280,"zoom":1.0,"ads":{"scoped":0.9}}',
    '{"crosshair_code":"0;P;c;1;o;1;f;0;0t;1;0l;2;0o;0;0a;1;0f;0;1b;0","graphics_preset":"low","fps_cap":300}',
    'Plays at 800 DPI · 0.35 sens — classic Indian Jett config.',
    'https://prosettings.net/players/skrossi/'),

  ('ge-bazzi',
    'Custom Build', 'Intel Core i7-13700K', 'NVIDIA RTX 4070 Ti', '32GB DDR5',
    'BenQ Zowie XL2546', 240,
    'Razer Viper V2 Pro', 'Razer Huntsman Mini',
    'HyperX Cloud II', 'Razer Strider XXL',
    '{"general":0.42,"edpi":336,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":240}',
    'Higher sens for utility-heavy Killjoy/Cypher playstyle.',
    NULL),

  ('vlt-rite2ace',
    'Custom Build', 'Intel Core i7-12700K', 'NVIDIA RTX 3080', '32GB DDR4',
    'ASUS TUF VG259QM', 280,
    'Logitech G Pro Wireless', 'Logitech G915 TKL',
    'Sennheiser HD 599', 'Logitech G640',
    '{"general":0.38,"edpi":304,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":280}',
    NULL,
    NULL),

  ('tr-deathmaker',
    'Custom Build', 'Intel Core i7-12700F', 'NVIDIA RTX 3070', '16GB DDR4',
    'BenQ Zowie XL2411K', 144,
    'Logitech G Pro X Superlight', 'Logitech G Pro X',
    'Logitech G Pro X', 'Logitech G840 XL',
    '{"general":0.45,"edpi":360,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":144}',
    NULL,
    NULL),

  ('re-amaterasu',
    'Custom Build', 'AMD Ryzen 7 5800X', 'NVIDIA RTX 3070', '16GB DDR4',
    'AOC 24G2', 144,
    'Razer DeathAdder V3 Pro', 'Razer Huntsman Mini',
    'Razer BlackShark V2', 'Razer Gigantus V2',
    '{"general":0.32,"edpi":256,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":240}',
    NULL,
    NULL),

  ('rvt-blackwidow',
    'Custom Build', 'AMD Ryzen 5 5600X', 'NVIDIA RTX 3060 Ti', '16GB DDR4',
    'LG UltraGear 27GN800', 144,
    'Logitech G Pro Wireless', 'Keychron K2',
    'HyperX Cloud Alpha', 'SteelSeries QcK Heavy XXL',
    '{"general":0.40,"edpi":320,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":144}',
    NULL,
    NULL)
) AS g(slug, dm, cpu, gpu, ram, mon, hz, mouse, kb, hp, mp,
       sens, settings, notes, src)
JOIN pro_players p ON p.slug = g.slug
ON CONFLICT (player_id) DO UPDATE
  SET device_model = EXCLUDED.device_model,
      cpu = EXCLUDED.cpu,
      gpu = EXCLUDED.gpu,
      ram = EXCLUDED.ram,
      monitor = EXCLUDED.monitor,
      monitor_hz = EXCLUDED.monitor_hz,
      mouse = EXCLUDED.mouse,
      keyboard = EXCLUDED.keyboard,
      headphones = EXCLUDED.headphones,
      mousepad = EXCLUDED.mousepad,
      sensitivities = EXCLUDED.sensitivities,
      ingame_settings = EXCLUDED.ingame_settings,
      notes = EXCLUDED.notes,
      source_url = EXCLUDED.source_url,
      last_verified_at = NOW();
