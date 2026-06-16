-- Add privacy_settings JSONB column to profiles table
-- Run this migration to enable the Privacy Settings feature

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_settings JSONB NOT NULL DEFAULT '{
  "profile_visible": true,
  "show_online_status": true,
  "show_game_stats": true,
  "show_achievements": true
}'::jsonb;
