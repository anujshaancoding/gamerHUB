-- 06: Pro Hub seed — sample upcoming Indian tournaments
--
-- Placeholder dates and prize pools. Update via /admin/pro/events once live.

INSERT INTO pro_events (
  slug, game, name, short_name, region, status,
  starts_at, ends_at, venue, prize_pool, prize_currency,
  description, official_url, stream_url, is_featured
)
VALUES
  ('bmps-2026-s2', 'bgmi', 'BGMI Masters Series 2026 Season 2', 'BMPS S2', 'India', 'upcoming',
   '2026-06-15 14:00:00+05:30', '2026-08-10 22:00:00+05:30',
   'KDJW Stadium, Mumbai', 5000000, 'INR',
   'India''s flagship BGMI esports league returns with 24 invited and qualified teams. League stage at Mumbai studio, finals on-stage.',
   'https://esports.battlegroundsmobileindia.com', 'https://www.youtube.com/@BGMIESPORTS', TRUE),

  ('bmoc-2026', 'bgmi', 'BGMI Mobile Open Challenge 2026', 'BMOC 2026', 'India', 'upcoming',
   '2026-09-01 14:00:00+05:30', '2026-10-20 22:00:00+05:30',
   'Online + LAN finals', 1500000, 'INR',
   'Open qualifier circuit feeding into BMPS — the path for amateur teams to reach Tier 1.',
   'https://esports.battlegroundsmobileindia.com', NULL, FALSE),

  ('vct-challengers-sa-2026-s2', 'valorant', 'VCT Challengers South Asia 2026 Split 2', 'VCT Challengers SA S2', 'South Asia', 'upcoming',
   '2026-07-01 18:00:00+05:30', '2026-09-15 22:00:00+05:30',
   'Online', 2500000, 'INR',
   'South Asia Tier 2 Valorant league. Top finishers earn promotion shots to VCT Pacific Ascension.',
   'https://valorantesports.com/news/', 'https://www.twitch.tv/valorant_southasia', TRUE),

  ('vct-game-changers-sa-2026', 'valorant', 'VCT Game Changers South Asia 2026', 'GC SA 2026', 'South Asia', 'upcoming',
   '2026-08-12 18:00:00+05:30', '2026-09-30 22:00:00+05:30',
   'Online', 800000, 'INR',
   'Womens'' Valorant circuit for South Asia. Indian rosters compete with regional teams for a Pacific GC slot.',
   'https://valorantesports.com/news/', NULL, FALSE),

  ('ffws-india-2026-s2', 'freefire', 'Free Fire World Series India Qualifiers 2026 S2', 'FFWS India S2', 'India', 'upcoming',
   '2026-07-20 17:00:00+05:30', '2026-09-08 22:00:00+05:30',
   'Online + LAN finals (Delhi)', 1200000, 'INR',
   'Garena''s flagship Indian Free Fire qualifier feeding into the FFWS global finals.',
   'https://ff.garena.com/in/', 'https://www.youtube.com/@GarenaFreeFireIN', TRUE),

  ('skyesports-championship-2026', 'valorant', 'Skyesports Championship 2026', 'Skyesports Champ 2026', 'India', 'upcoming',
   '2026-06-25 19:00:00+05:30', '2026-07-15 22:00:00+05:30',
   'LAN, Hyderabad', 1000000, 'INR',
   'Mid-tier LAN circuit organised by Skyesports — historically a kingmaker for the Indian Valorant scene.',
   'https://skyesports.com', NULL, FALSE)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      short_name = EXCLUDED.short_name,
      region = EXCLUDED.region,
      status = EXCLUDED.status,
      starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at,
      venue = EXCLUDED.venue,
      prize_pool = EXCLUDED.prize_pool,
      prize_currency = EXCLUDED.prize_currency,
      description = EXCLUDED.description,
      official_url = EXCLUDED.official_url,
      stream_url = EXCLUDED.stream_url,
      is_featured = EXCLUDED.is_featured;
