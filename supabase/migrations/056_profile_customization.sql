-- Profile customization fields for stat trackers and player card
-- Adds pinned_stats (which 3 stats to showcase) and card_style (player card theme)

ALTER TABLE user_progression
  ADD COLUMN IF NOT EXISTS pinned_stats text[] DEFAULT ARRAY['matches_played', 'matches_won', 'games_linked'],
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'auto';
