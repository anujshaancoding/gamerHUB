-- Update game roster: Remove old games, add PUBG Mobile, COD Mobile, Other
-- Migration 020

-- Remove old/unsupported games
DELETE FROM games WHERE slug IN ('dota2', 'dota-2', 'lol', 'league-of-legends', 'apex', 'apex-legends', 'fortnite', 'pubg');

-- Add PUBG Mobile (replacing old PUBG)
INSERT INTO games (slug, name, icon_url, has_api, ranks, roles) VALUES
  ('pubg-mobile', 'PUBG Mobile', '/images/games/pubg-mobile.png', false,
   '["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Ace Master","Ace Dominator","Conqueror"]',
   '["Fragger","Support","Scout","IGL"]')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon_url = EXCLUDED.icon_url,
  ranks = EXCLUDED.ranks,
  roles = EXCLUDED.roles;

-- Add Clash of Clans
INSERT INTO games (slug, name, icon_url, has_api, ranks, roles) VALUES
  ('coc', 'Clash of Clans', '/images/games/coc.png', false,
   '["Bronze League","Silver League","Gold League","Crystal League","Master League","Champion League","Titan League","Legend League"]',
   '["War Specialist","Donator","Clan Leader","Base Builder"]')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon_url = EXCLUDED.icon_url,
  ranks = EXCLUDED.ranks,
  roles = EXCLUDED.roles;

-- Add COD Mobile
INSERT INTO games (slug, name, icon_url, has_api, ranks, roles) VALUES
  ('cod-mobile', 'COD Mobile', '/images/games/cod-mobile.png', false,
   '["Rookie","Veteran","Elite","Pro","Master","Grand Master","Legendary"]',
   '["Slayer","OBJ","Anchor","Support"]')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon_url = EXCLUDED.icon_url,
  ranks = EXCLUDED.ranks,
  roles = EXCLUDED.roles;

-- Add Other (catch-all for unlisted games)
INSERT INTO games (slug, name, icon_url, has_api, ranks, roles) VALUES
  ('other', 'Other', '/images/games/other.png', false,
   '[]',
   '[]')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon_url = EXCLUDED.icon_url,
  ranks = EXCLUDED.ranks,
  roles = EXCLUDED.roles;

-- Update game categories for better organization
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS platform_support TEXT[] DEFAULT ARRAY['pc'],
ADD COLUMN IF NOT EXISTS max_party_size INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing games with categories
UPDATE games SET category = 'fps', platform_support = ARRAY['pc'], max_party_size = 5, description = 'Tactical 5v5 character-based shooter' WHERE slug = 'valorant';
UPDATE games SET category = 'fps', platform_support = ARRAY['pc'], max_party_size = 5, description = 'Premier competitive FPS' WHERE slug = 'cs2';
UPDATE games SET category = 'battle_royale', platform_support = ARRAY['mobile'], max_party_size = 4, description = 'Mobile tactical battle royale' WHERE slug = 'pubg-mobile';
UPDATE games SET category = 'battle_royale', platform_support = ARRAY['mobile', 'pc'], max_party_size = 4, description = 'Mobile battle royale' WHERE slug = 'freefire';
UPDATE games SET category = 'strategy', platform_support = ARRAY['mobile'], max_party_size = 50, description = 'Strategic clan-based mobile game' WHERE slug = 'coc';
UPDATE games SET category = 'fps', platform_support = ARRAY['mobile'], max_party_size = 5, description = 'Mobile first-person shooter' WHERE slug = 'cod-mobile';
UPDATE games SET category = 'other', platform_support = ARRAY['pc', 'mobile'], max_party_size = 5, description = 'Other games not listed' WHERE slug = 'other';
