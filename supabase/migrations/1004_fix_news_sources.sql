-- Deactivate sources that are NOT about our 3 games (Valorant, BGMI, Free Fire)
UPDATE news_sources SET is_active = false WHERE slug IN ('hltv', 'coc-blog');

-- Fix Sportskeeda PUBG Mobile → BGMI
UPDATE news_sources SET game_slug = 'bgmi' WHERE slug = 'sportskeeda-pubg';

-- Add more India-focused sources for our 3 games
INSERT INTO public.news_sources (name, slug, source_type, url, game_slug, region, fetch_interval_minutes, config) VALUES
  ('Sportskeeda Valorant', 'sportskeeda-valorant', 'rss', 'https://www.sportskeeda.com/valorant/feed', 'valorant', 'india', 60, '{}'),
  ('Sportskeeda BGMI', 'sportskeeda-bgmi', 'rss', 'https://www.sportskeeda.com/bgmi/feed', 'bgmi', 'india', 60, '{}')
ON CONFLICT (slug) DO NOTHING;
