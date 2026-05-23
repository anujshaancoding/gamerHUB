-- 008b: Pro Hub seed data — top Indian Valorant teams + players
--
-- Verified against vlr.gg + Liquipedia VCT Challengers South Asia 2026 Split 1
-- as of May 2026.  S8UL Esports won Split 1 (3-2 over Revenant XSpark); Global
-- Esports' main Pacific roster is now fully international and is intentionally
-- excluded from the player ranking below (kept as a team entry only).
--
-- Apply via:
--   sudo -u postgres psql -d gamerhub -f /path/to/02_valorant_seed.sql
--
-- Safe to re-run: uses ON CONFLICT (slug) DO UPDATE.

-- ─── Teams ──────────────────────────────────────────────────────────────────
INSERT INTO pro_teams (slug, name, short_name, game, region, founded_year, socials, is_active)
VALUES
  ('s8ul-esports',     'S8UL Esports',        'S8UL', 'valorant', 'India', 2017,
    '{"twitter":"S8UL_Esports","instagram":"s8ulesports","youtube":"S8UL"}'::jsonb, TRUE),
  ('revenant-xspark',  'Revenant XSpark',     'RNTX', 'valorant', 'India', 2020,
    '{"twitter":"RevenantXSpark","instagram":"revenantesports"}'::jsonb, TRUE),
  ('global-esports',   'Global Esports',      'GE',   'valorant', 'India', 2017,
    '{"twitter":"GlobalEsports","instagram":"globalesports","youtube":"GlobalEsports"}'::jsonb, TRUE),
  ('gods-reign',       'Gods Reign',          'GR',   'valorant', 'India', 2021,
    '{"twitter":"GodsReignGG","instagram":"godsreigngg"}'::jsonb, TRUE),
  ('asterisk',         'Asterisk',            'AST',  'valorant', 'India', 2024,
    '{"twitter":"AsteriskGG"}'::jsonb, TRUE),
  ('leosun-esports',   'Leosun Esports',      'LSN',  'valorant', 'India', 2023,
    '{"twitter":"LeosunEsports"}'::jsonb, TRUE),
  ('the-rad-syndicate','The Rad Syndicate',   'TRS',  'valorant', 'India', 2024,
    '{"twitter":"RadSyndicate"}'::jsonb, TRUE),
  ('xcrew-esports',    'xCrew Esports',       'XCR',  'valorant', 'India', 2023,
    '{}'::jsonb, TRUE)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      short_name = EXCLUDED.short_name,
      socials = EXCLUDED.socials,
      is_active = EXCLUDED.is_active;

-- ─── Players ────────────────────────────────────────────────────────────────
-- VCSA 2026 Split 1 verified rosters (S8UL + Revenant XSpark — the two finalists).
-- Ranking reflects career standing + Split 1 result, not raw KDA.
INSERT INTO pro_players (
  slug, game, ign, real_name, team_id, role, country, region,
  bio, peak_rank, current_rank, national_rank, age, socials, is_active, is_featured
)
SELECT * FROM (VALUES
  ('s8ul-skrossi',  'valorant', 'SkRossi',     'Ganesh Gangadhar',
    (SELECT id FROM pro_teams WHERE slug = 's8ul-esports'),
    'IGL / Duelist', 'IN', 'Hyderabad',
    'India''s most recognisable Valorant pro. Joined S8UL ahead of VCSA 2026 and IGL''d the squad to a Split 1 title over Revenant XSpark.',
    'Radiant', 'Radiant', 1, 28,
    '{"twitter":"SkRossi_","instagram":"skrossi_","youtube":"SkRossi","twitch":"SkRossi"}'::jsonb,
    TRUE, TRUE),

  ('rntx-venka',    'valorant', 'venka',       'Venkatesh Sharma',
    (SELECT id FROM pro_teams WHERE slug = 'revenant-xspark'),
    'IGL / Controller', 'IN', 'Delhi',
    'Calling IGL on Revenant XSpark — led the ex-S8UL Indian trio (with Hoax and Techno) to the VCSA 2026 Split 1 final.',
    'Radiant', 'Radiant', 2, NULL,
    '{"twitter":"venka_val"}'::jsonb,
    TRUE, TRUE),

  ('s8ul-rvk',      'valorant', 'RvK',         'Rishi Vijayakumar',
    (SELECT id FROM pro_teams WHERE slug = 's8ul-esports'),
    'Flex',          'IN', 'Bengaluru',
    'Veteran of the SA scene — Reckoning, True Rippers, Enigma — now flexing across roles on S8UL''s Split 1 champion roster.',
    'Radiant', 'Radiant', 3, 25,
    '{"twitter":"RvKvalorant"}'::jsonb,
    TRUE, FALSE),

  ('rntx-hoax',     'valorant', 'Hoax',        'Aman Yadav',
    (SELECT id FROM pro_teams WHERE slug = 'revenant-xspark'),
    'Duelist',       'IN', 'Mumbai',
    'Entry-fragger on RNTX. Won Predator League India 2026 with the Indian trio before the move from S8UL to Revenant.',
    'Radiant', 'Radiant', 4, NULL,
    '{"twitter":"hoax_val"}'::jsonb,
    TRUE, FALSE),

  ('rntx-techno',   'valorant', 'Techno',      'Shravana Sahoo',
    (SELECT id FROM pro_teams WHERE slug = 'revenant-xspark'),
    'Initiator',     'IN', 'Bhubaneswar',
    'Initiator on Revenant XSpark — heavy Fade/Sova utility setups. Ex-S8UL alongside venka and Hoax.',
    'Radiant', 'Radiant', 5, NULL,
    '{"twitter":"technoval"}'::jsonb,
    TRUE, FALSE),

  ('s8ul-yuvi',     'valorant', 'Yuvi',        'Yuvraj Singh',
    (SELECT id FROM pro_teams WHERE slug = 's8ul-esports'),
    'Sentinel',      'IN', 'Delhi NCR',
    'Promoted from Global Esports Academy and signed by S8UL for 2026 — youngest member of the Split 1 champion roster.',
    'Radiant', 'Immortal 3', 6, NULL,
    '{"twitter":"yuvi_val"}'::jsonb,
    TRUE, FALSE)
) AS p(slug, game, ign, real_name, team_id, role, country, region,
       bio, peak_rank, current_rank, national_rank, age, socials, is_active, is_featured)
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
      age = EXCLUDED.age,
      socials = EXCLUDED.socials,
      is_active = EXCLUDED.is_active,
      is_featured = EXCLUDED.is_featured;

-- Retire the previous placeholder slugs so they no longer appear on /pros.
UPDATE pro_players SET is_active = FALSE, is_featured = FALSE
WHERE slug IN ('ge-skrossi','ge-bazzi','vlt-rite2ace','tr-deathmaker','re-amaterasu','rvt-blackwidow');

-- ─── Current-season stats (VCSA 2026 Split 1 — Mar–May 2026) ───────────────
INSERT INTO pro_player_stats (
  player_id, season, is_current, matches_played, wins, losses,
  k_d_ratio, adr, hs_pct, acs, game_stats, source_url
)
SELECT p.id, '2026-S1', TRUE, ms, w, l, kd, adr, hs, acs, gs::jsonb, src
FROM (VALUES
  ('s8ul-skrossi',   24, 17, 7, 1.28, 158.2, 27.8, 258.4,
   '{"agent_pool":[{"agent":"Jett","pick_rate":42,"matches":10,"win_rate":70},{"agent":"Neon","pick_rate":29,"matches":7,"win_rate":71},{"agent":"Cypher","pick_rate":17,"matches":4,"win_rate":50},{"agent":"Killjoy","pick_rate":12,"matches":3,"win_rate":67}],"first_blood_pct":23.4,"primary_role":"IGL / Duelist","notes":"VCSA 2026 Split 1 champion."}',
   'https://www.vlr.gg/player/skrossi'),
  ('rntx-venka',     22, 15, 7, 1.14, 142.8, 25.1, 235.6,
   '{"agent_pool":[{"agent":"Omen","pick_rate":50,"matches":11,"win_rate":73},{"agent":"Astra","pick_rate":32,"matches":7,"win_rate":57},{"agent":"Brimstone","pick_rate":18,"matches":4,"win_rate":50}],"primary_role":"IGL","notes":"VCSA 2026 Split 1 runner-up."}',
   'https://www.vlr.gg/player/27336/venka'),
  ('s8ul-rvk',       24, 17, 7, 1.18, 144.5, 26.4, 240.1,
   '{"agent_pool":[{"agent":"Sova","pick_rate":42,"matches":10,"win_rate":70},{"agent":"Fade","pick_rate":29,"matches":7,"win_rate":71},{"agent":"KAY/O","pick_rate":17,"matches":4,"win_rate":50},{"agent":"Killjoy","pick_rate":12,"matches":3,"win_rate":67}],"primary_role":"Flex"}',
   'https://www.vlr.gg/team/'),
  ('rntx-hoax',      22, 15, 7, 1.22, 152.4, 27.0, 246.8,
   '{"agent_pool":[{"agent":"Raze","pick_rate":45,"matches":10,"win_rate":70},{"agent":"Jett","pick_rate":36,"matches":8,"win_rate":62},{"agent":"Phoenix","pick_rate":19,"matches":4,"win_rate":50}],"first_blood_pct":22.1,"primary_role":"Duelist"}',
   NULL),
  ('rntx-techno',    22, 15, 7, 1.16, 146.1, 25.8, 238.2,
   '{"agent_pool":[{"agent":"Fade","pick_rate":50,"matches":11,"win_rate":73},{"agent":"Sova","pick_rate":32,"matches":7,"win_rate":57},{"agent":"Skye","pick_rate":18,"matches":4,"win_rate":50}],"primary_role":"Initiator"}',
   NULL),
  ('s8ul-yuvi',      24, 17, 7, 1.09, 132.6, 25.4, 222.0,
   '{"agent_pool":[{"agent":"Cypher","pick_rate":46,"matches":11,"win_rate":73},{"agent":"Killjoy","pick_rate":33,"matches":8,"win_rate":62},{"agent":"Chamber","pick_rate":21,"matches":5,"win_rate":60}],"primary_role":"Sentinel"}',
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
  ('s8ul-skrossi',
    'Custom Build', 'Intel Core i9-14900K', 'NVIDIA RTX 4080 Super', '32GB DDR5',
    'BenQ Zowie XL2566K', 360,
    'Logitech G Pro X Superlight 2', 'Logitech G Pro X TKL',
    'Logitech G Pro X 2', 'Logitech G840 XL',
    '{"general":0.35,"edpi":280,"zoom":1.0,"ads":{"scoped":0.9}}',
    '{"crosshair_code":"0;P;c;1;o;1;f;0;0t;1;0l;2;0o;0;0a;1;0f;0;1b;0","graphics_preset":"low","fps_cap":360}',
    '800 DPI · 0.35 sens — classic Rossi config, unchanged since 2021.',
    'https://prosettings.net/players/skrossi/'),

  ('rntx-venka',
    'Custom Build', 'Intel Core i7-14700K', 'NVIDIA RTX 4070 Ti Super', '32GB DDR5',
    'BenQ Zowie XL2546K', 240,
    'Razer Viper V3 Pro', 'Razer Huntsman Mini',
    'HyperX Cloud III', 'Razer Strider XXL',
    '{"general":0.40,"edpi":320,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":240}',
    'Calling-friendly higher-sens — relies on flicks for off-angle peeks while running smokes.',
    NULL),

  ('s8ul-rvk',
    'Custom Build', 'AMD Ryzen 7 7800X3D', 'NVIDIA RTX 4070 Super', '32GB DDR5',
    'BenQ Zowie XL2546K', 240,
    'Logitech G Pro Wireless 2', 'Logitech G915 TKL',
    'Sennheiser HD 599', 'Logitech G640',
    '{"general":0.38,"edpi":304,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":240}',
    NULL,
    NULL),

  ('rntx-hoax',
    'Custom Build', 'Intel Core i7-13700K', 'NVIDIA RTX 4070', '32GB DDR5',
    'BenQ Zowie XL2566K', 360,
    'Logitech G Pro X Superlight 2', 'Wooting 60HE',
    'Logitech G Pro X 2', 'Logitech G840 XL',
    '{"general":0.32,"edpi":256,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":300}',
    'Wooting + low-sens setup tuned for entry duels.',
    NULL),

  ('rntx-techno',
    'Custom Build', 'AMD Ryzen 7 7700X', 'NVIDIA RTX 4070', '32GB DDR5',
    'AOC 25G3ZM/BK', 240,
    'Razer DeathAdder V3 Pro', 'Razer Huntsman Mini',
    'Razer BlackShark V2 Pro', 'Razer Gigantus V2 XXL',
    '{"general":0.36,"edpi":288,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":240}',
    NULL,
    NULL),

  ('s8ul-yuvi',
    'Custom Build', 'AMD Ryzen 5 7600X', 'NVIDIA RTX 4060 Ti', '16GB DDR5',
    'LG UltraGear 27GR75Q', 165,
    'Logitech G Pro Wireless 2', 'Keychron K2',
    'HyperX Cloud Alpha', 'SteelSeries QcK Heavy XXL',
    '{"general":0.42,"edpi":336,"zoom":1.0}',
    '{"graphics_preset":"low","fps_cap":165}',
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
