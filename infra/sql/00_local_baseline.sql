-- LOCAL TEST baseline — reconstructed from code queries, NOT for production.
-- Reconstructs the Supabase-pg_dump-origin tables that are NOT defined by in-repo migrations.
-- Foreign keys intentionally omitted to avoid load-ordering issues. Types are approximate.
-- Load this BEFORE infra/migrations/*.sql, infra/tools-and-forum-deploy/*.sql, infra/pro-hub-deploy/*.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frozen TEXT,
  frozen_reason TEXT,
  is_frozen BOOLEAN,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_verified TEXT,
  flag_reason TEXT,
  flagged_at TIMESTAMPTZ,
  flagged_by TEXT,
  is_flagged BOOLEAN,
  is_restricted BOOLEAN,
  phone_verified TEXT,
  restriction_expires_at TIMESTAMPTZ,
  restriction_reason TEXT,
  trust_score TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  verification_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievement_hunts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement TEXT,
  achievement_id UUID,
  attempts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creator TEXT,
  creator_id UUID,
  description TEXT,
  estimated_duration_minutes TEXT,
  language TEXT,
  max_members TEXT,
  min_level TEXT,
  requires_mic TEXT,
  scheduled_time TEXT,
  status TEXT,
  timezone TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  game_id UUID,
  description TEXT,
  badge_url TEXT,
  achievement_date TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  players_required TEXT
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID,
  reaction_type TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ,
  rule_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_profile TEXT,
  description TEXT,
  trigger_conditions TEXT,
  trigger_type TEXT
);

CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  name TEXT,
  description TEXT,
  icon_url TEXT,
  category TEXT,
  rarity TEXT,
  unlock_criteria JSONB,
  xp_reward INTEGER,
  game_id UUID,
  is_active BOOLEAN,
  is_secret BOOLEAN,
  available_from TEXT,
  available_until TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_premium TEXT,
  price_standard TEXT,
  rewards TEXT,
  season_number TEXT,
  status TEXT,
  stripe_price_id_premium TEXT,
  stripe_price_id_standard TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS behavioral_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID,
  reporter_id UUID,
  signal_data TEXT,
  signal_type TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID,
  blocked_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_user TEXT
);

CREATE TABLE IF NOT EXISTS blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT,
  bio TEXT,
  can_publish_directly BOOLEAN,
  is_verified BOOLEAN,
  articles_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  author_id UUID,
  parent_id UUID,
  content TEXT,
  likes_count INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID,
  slug TEXT,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  game_id UUID,
  category TEXT,
  tags JSONB,
  status TEXT,
  published_at TIMESTAMPTZ,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  views_count INTEGER,
  likes_count INTEGER,
  comments_count INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  is_featured BOOLEAN,
  is_pinned BOOLEAN,
  allow_comments BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts (status);

CREATE TABLE IF NOT EXISTS call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID,
  user_id UUID,
  status TEXT,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN,
  is_video_enabled BOOLEAN,
  is_screen_sharing BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  initiator_id UUID,
  type TEXT,
  status TEXT,
  room_name TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  conversation TEXT,
  initiator TEXT
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID,
  user_id UUID,
  status TEXT,
  progress JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  points_awarded INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID,
  game_id UUID,
  description TEXT,
  rules TEXT,
  rank_requirement TEXT,
  reward TEXT,
  status TEXT,
  accepted_by TEXT,
  match_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confidence TEXT,
  context TEXT,
  original_text TEXT,
  source_language TEXT,
  target_language TEXT,
  translated_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  description TEXT,
  badge_url TEXT,
  achievement_type TEXT,
  achievement_date TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  user_id UUID,
  activity_type TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  challenge TEXT,
  kicked_by TEXT,
  updated_fields TEXT
);

CREATE TABLE IF NOT EXISTS clan_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_clan_id UUID,
  challenged_clan_id UUID,
  game_id UUID,
  description TEXT,
  rules TEXT,
  format TEXT,
  team_size NUMERIC,
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  winner_clan_id UUID,
  result JSONB,
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  challenged_clan TEXT,
  challenger_clan TEXT,
  conversation TEXT,
  winner_clan TEXT
);

CREATE TABLE IF NOT EXISTS clan_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  game_id UUID,
  is_primary BOOLEAN,
  min_rank TEXT,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  user_id UUID,
  invited_by TEXT,
  type TEXT,
  status TEXT,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  invited_by_profile TEXT
);

CREATE TABLE IF NOT EXISTS clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  promoted_at TIMESTAMPTZ,
  contribution_points INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clan_members_clan_id ON clan_members (clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user_id ON clan_members (user_id);

CREATE TABLE IF NOT EXISTS clan_mission_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_recruitment_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  created_by TEXT,
  game_id UUID,
  description TEXT,
  requirements JSONB,
  positions_available INTEGER,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  views_count INTEGER,
  applications_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_profile TEXT
);

CREATE TABLE IF NOT EXISTS clan_scrim_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id UUID,
  status TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_scrims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  created_by TEXT,
  creator TEXT,
  description TEXT,
  game_id UUID,
  max_slots TEXT,
  room_id UUID,
  room_password TEXT,
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_wall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  is_pinned BOOLEAN,
  reactions TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID
);

CREATE TABLE IF NOT EXISTS clan_weekly_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  goal_target TEXT,
  week_end TEXT,
  week_start TEXT,
  xp_reward TEXT
);

CREATE TABLE IF NOT EXISTS clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  tag TEXT,
  slug TEXT,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  primary_game_id UUID,
  region TEXT,
  language TEXT,
  min_rank_requirement TEXT,
  max_members INTEGER,
  is_public BOOLEAN,
  is_recruiting BOOLEAN,
  conversation_id UUID,
  settings JSONB,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  allow_member_invites TEXT,
  clan_achievements TEXT,
  clan_games TEXT,
  clan_members TEXT,
  clan_xp TEXT,
  join_approval_required TEXT,
  join_type TEXT,
  primary_game TEXT
);

CREATE TABLE IF NOT EXISTS commitment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_verify TEXT,
  check_ins TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creator_id UUID,
  current_count TEXT,
  description TEXT,
  end_date TEXT,
  frequency TEXT,
  game_id UUID,
  has_stakes BOOLEAN,
  require_photo_proof TEXT,
  stakes_description TEXT,
  start_date TEXT,
  status TEXT,
  target_count TEXT,
  type TEXT
);

CREATE TABLE IF NOT EXISTS commitment_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT,
  rules TEXT,
  challenge_type TEXT,
  difficulty TEXT,
  season_id UUID,
  game_id UUID,
  period_type TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT,
  objectives JSONB,
  points_reward INTEGER,
  bonus_rewards JSONB,
  max_participants INTEGER,
  icon_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  progress TEXT,
  season TEXT
);

CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_image_url TEXT,
  description TEXT,
  ends_at TIMESTAMPTZ,
  event_type TEXT,
  external_link TEXT,
  game_id UUID,
  is_featured BOOLEAN,
  location_details TEXT,
  location_type TEXT,
  max_attendees TEXT,
  organizer TEXT,
  organizer_id UUID,
  rsvp_count TEXT,
  slug TEXT,
  starts_at TIMESTAMPTZ,
  status TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_listing_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_listing_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_listing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  likes_count TEXT,
  listing_id UUID,
  parent_id UUID,
  status TEXT
);

CREATE TABLE IF NOT EXISTS community_listing_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_listing_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID,
  placement TEXT,
  prize_awarded TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_count TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creator TEXT,
  creator_id UUID,
  ends_at TIMESTAMPTZ,
  external_link TEXT,
  game_id UUID,
  listing_type TEXT,
  organizer_name TEXT,
  organizer_url TEXT,
  prize_description TEXT,
  rules TEXT,
  starts_at TIMESTAMPTZ,
  status TEXT,
  tags TEXT,
  timezone TEXT,
  winners TEXT
);

CREATE TABLE IF NOT EXISTS community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allow_multiple TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creator TEXT,
  creator_id UUID,
  description TEXT,
  ends_at TIMESTAMPTZ,
  game_id UUID,
  is_active BOOLEAN,
  is_anonymous BOOLEAN,
  options TEXT,
  poll_type TEXT,
  question TEXT,
  total_votes TEXT
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  user_id UUID,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants (user_id);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  match_id UUID,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS currency_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN,
  sort_order TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discord_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_username TEXT,
  is_active BOOLEAN,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discord_guild_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  guild_id UUID,
  guild_name TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  response_message TEXT,
  status TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID,
  following_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activity_type TEXT,
  visibility TEXT
);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);

CREATE TABLE IF NOT EXISTS friend_post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friend_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  post_id UUID,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS friend_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friend_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comments_count TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  likes_count TEXT,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID,
  recipient_id UUID,
  message TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  recipient TEXT,
  sender TEXT
);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient_id ON friend_requests (recipient_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests (sender_id);

CREATE TABLE IF NOT EXISTS game_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  provider TEXT,
  provider_user_id UUID,
  provider_username TEXT,
  provider_avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes JSONB,
  metadata JSONB,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  badge_url TEXT,
  best_trophies TEXT,
  country TEXT,
  exp_level TEXT,
  game_stats TEXT,
  level TEXT,
  name TEXT,
  persona_state TEXT,
  profile_url TEXT,
  tag TEXT,
  time_created TEXT,
  town_hall_level TEXT,
  trophies TEXT,
  visibility TEXT,
  war_stars TEXT
);

CREATE TABLE IF NOT EXISTS game_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  connection_id UUID,
  game_id UUID,
  external_match_id UUID,
  game_mode TEXT,
  map_name TEXT,
  agent_or_champion TEXT,
  result TEXT,
  score JSONB,
  stats JSONB,
  duration_seconds INTEGER,
  played_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assists TEXT,
  deaths TEXT,
  enemy_score TEXT,
  kills TEXT,
  party_size TEXT,
  team_kills TEXT,
  team_score TEXT
);

CREATE TABLE IF NOT EXISTS game_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID,
  name TEXT,
  display_name TEXT,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  connection_id UUID,
  game_id UUID,
  game_mode TEXT,
  season TEXT,
  stats JSONB,
  rank_info JSONB,
  last_match_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  connection_id UUID,
  sync_type TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  stats_synced NUMERIC,
  matches_synced NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  message TEXT
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  name TEXT,
  icon_url TEXT,
  banner_url TEXT,
  has_api BOOLEAN,
  api_config JSONB,
  ranks JSONB,
  roles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  category TEXT,
  game_id UUID,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID,
  cover_image_url TEXT,
  difficulty TEXT,
  estimated_read_minutes TEXT,
  excerpt TEXT,
  game_id UUID,
  guide_type TEXT,
  is_featured BOOLEAN,
  is_published BOOLEAN,
  published_at TIMESTAMPTZ,
  section_order TEXT,
  sections TEXT,
  slug TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hunt_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  has_achievement BOOLEAN,
  hunt_id UUID,
  ready TEXT,
  role TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID,
  game_id UUID,
  region TEXT,
  snapshot_type TEXT,
  snapshot_date TEXT,
  rankings JSONB,
  total_participants INTEGER,
  average_points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS level_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER,
  xp_required INTEGER,
  total_xp_required INTEGER,
  rewards JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID,
  user_id UUID,
  status TEXT,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID,
  creator_id UUID,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  max_players INTEGER,
  status TEXT,
  match_type TEXT,
  requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  game_id UUID,
  type TEXT,
  url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  file_size NUMERIC,
  duration_seconds INTEGER,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meme_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caption TEXT,
  comment_count TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  creator TEXT,
  creator_id UUID,
  game_id UUID,
  image_url TEXT,
  is_approved BOOLEAN,
  is_nsfw BOOLEAN,
  like_count TEXT,
  tags TEXT,
  template_name TEXT,
  view_count TEXT
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji TEXT,
  message_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  type TEXT,
  is_edited BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);

CREATE TABLE IF NOT EXISTS mood_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  game_id UUID,
  mood TEXT,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS news_article_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID,
  author_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  likes_count TEXT,
  parent_id UUID,
  status TEXT
);

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_processed TEXT,
  ai_relevance_score TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  excerpt TEXT,
  external_id UUID,
  game_slug TEXT,
  is_featured BOOLEAN,
  is_pinned BOOLEAN,
  moderated_at TIMESTAMPTZ,
  moderated_by TEXT,
  original_content TEXT,
  original_published_at TIMESTAMPTZ,
  original_title TEXT,
  original_url TEXT,
  published_at TIMESTAMPTZ,
  region TEXT,
  source TEXT,
  source_id UUID,
  status TEXT,
  summary TEXT,
  tags TEXT,
  thumbnail_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  views_count TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles (status);
CREATE INDEX IF NOT EXISTS idx_news_articles_game_slug ON news_articles (game_slug);

CREATE TABLE IF NOT EXISTS news_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  articles_found TEXT,
  articles_new TEXT,
  articles_processed TEXT,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata TEXT,
  source_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN,
  last_fetched_at TIMESTAMPTZ,
  name TEXT,
  region TEXT,
  slug TEXT,
  url TEXT
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  subscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channels TEXT,
  frequency TEXT,
  is_enabled BOOLEAN,
  notification_type TEXT,
  quiet_hours_end TEXT,
  quiet_hours_start TEXT,
  settings TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN,
  is_read BOOLEAN,
  type TEXT,
  user_id UUID
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT,
  referrer TEXT,
  session_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ,
  token TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount TEXT,
  currency TEXT,
  failure_message TEXT,
  invoice_id UUID,
  metadata TEXT,
  payment_type TEXT,
  status TEXT,
  stripe_charge_id UUID,
  stripe_customer_id UUID,
  stripe_payment_intent_id UUID,
  subscription_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempts TEXT,
  code_expires_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  phone_number TEXT,
  user_id UUID,
  verification_code TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  from_user TEXT,
  from_user_id UUID,
  game_id UUID,
  note TEXT,
  session_id UUID,
  to_user_id UUID,
  type TEXT
);

CREATE TABLE IF NOT EXISTS player_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  reason TEXT,
  reported_user TEXT,
  reported_user_id UUID,
  reporter_id UUID,
  status TEXT
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_points_id UUID,
  user_id UUID,
  season_id UUID,
  points INTEGER,
  transaction_type TEXT,
  source_type TEXT,
  source_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_count TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID,
  poll_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  name TEXT,
  description TEXT,
  image_url TEXT,
  unlock_type TEXT,
  unlock_value JSONB,
  rarity TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  name TEXT,
  description TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background_gradient JSONB,
  unlock_type TEXT,
  unlock_value JSONB,
  rarity TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID,
  source TEXT,
  viewer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_wall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID,
  author_id UUID,
  content TEXT,
  reaction TEXT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  gaming_style TEXT,
  preferred_language TEXT,
  region TEXT,
  timezone TEXT,
  online_hours JSONB,
  social_links JSONB,
  is_online BOOLEAN,
  last_seen TIMESTAMPTZ,
  status TEXT,
  status_until TEXT,
  is_premium BOOLEAN,
  premium_until TEXT,
  is_verified BOOLEAN,
  privacy_settings JSONB,
  username_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN,
  admin_role TEXT,
  author_id UUID,
  is_featured BOOLEAN,
  level TEXT,
  user_games TEXT
);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

CREATE TABLE IF NOT EXISTS quest_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  name TEXT,
  description TEXT,
  icon_url TEXT,
  quest_type TEXT,
  requirements JSONB,
  xp_reward INTEGER,
  bonus_rewards JSONB,
  weight INTEGER,
  game_id UUID,
  is_active BOOLEAN,
  min_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rating_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence TEXT,
  flag_type TEXT,
  status TEXT,
  target_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rating_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_count TEXT,
  daily_remaining TEXT,
  date TEXT,
  last_rating_at TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID,
  rated_id UUID,
  match_id UUID,
  politeness NUMERIC,
  fair_play NUMERIC,
  communication NUMERIC,
  skill_consistency NUMERIC,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regional_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN,
  name TEXT,
  primary_language TEXT,
  region_code TEXT,
  regional_community_members TEXT
);

CREATE TABLE IF NOT EXISTS regional_community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID,
  last_active TEXT,
  preferred_language TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID,
  reporter_id UUID,
  severity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduling_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  available_times TEXT,
  cross_region_matching TEXT,
  language_preferences TEXT,
  preferred_regions TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID,
  user_id UUID,
  game_id UUID,
  total_points INTEGER,
  match_points INTEGER,
  challenge_points INTEGER,
  rating_points INTEGER,
  bonus_points INTEGER,
  matches_played NUMERIC,
  matches_won NUMERIC,
  current_win_streak INTEGER,
  best_win_streak INTEGER,
  challenges_completed NUMERIC,
  ratings_received NUMERIC,
  average_rating NUMERIC,
  login_streak_days INTEGER,
  last_login_date TIMESTAMPTZ,
  last_match_date TIMESTAMPTZ,
  region TEXT,
  current_rank INTEGER,
  peak_rank INTEGER,
  previous_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID,
  name TEXT,
  description TEXT,
  reward_type TEXT,
  reward_value JSONB,
  rank_requirement INTEGER,
  points_requirement INTEGER,
  percentile_requirement INTEGER,
  max_recipients INTEGER,
  current_recipients INTEGER,
  auto_grant BOOLEAN,
  claim_deadline TEXT,
  icon_url TEXT,
  rarity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  slug TEXT,
  description TEXT,
  season_number INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT,
  game_id UUID,
  point_config JSONB,
  banner_url TEXT,
  theme_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  challenges TEXT,
  rewards TEXT
);

CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN,
  item_type TEXT,
  rarity TEXT,
  sort_order TEXT
);

CREATE TABLE IF NOT EXISTS squad_dna_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID,
  traits TEXT,
  user_id UUID,
  weights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ,
  streamer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT,
  start_time TEXT,
  streamer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streamer_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streamer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT,
  connected_at TIMESTAMPTZ,
  current_viewer_count TEXT,
  embed_enabled TEXT,
  follower_count TEXT,
  is_featured BOOLEAN,
  last_stream_ended_at TIMESTAMPTZ,
  last_stream_started_at TIMESTAMPTZ,
  peak_viewer_count TEXT,
  refresh_token TEXT,
  scopes TEXT,
  status TEXT,
  stream_game_id UUID,
  stream_game_name TEXT,
  stream_language TEXT,
  stream_title TEXT,
  token_expires_at TIMESTAMPTZ,
  total_stream_hours TEXT,
  twitch_broadcaster_type TEXT,
  twitch_display_name TEXT,
  twitch_id UUID,
  twitch_login TEXT,
  twitch_profile_image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  stripe_customer_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message TEXT,
  event_type TEXT,
  message TEXT,
  payload TEXT,
  processed TEXT,
  stripe_event_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supported_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  provider TEXT,
  icon_url TEXT,
  banner_url TEXT,
  description TEXT,
  stat_fields JSONB,
  rank_system JSONB,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT,
  name TEXT,
  description TEXT,
  unlock_type TEXT,
  unlock_value JSONB,
  rarity TEXT,
  color TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  match_id UUID,
  user_id UUID,
  activity_type TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_fields TEXT
);

CREATE TABLE IF NOT EXISTS tournament_match_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID,
  game_number INTEGER,
  winner_id UUID,
  team1_score INTEGER,
  team2_score INTEGER,
  map TEXT,
  duration_seconds INTEGER,
  stats JSONB,
  screenshot_url TEXT,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  round NUMERIC,
  match_number INTEGER,
  bracket_type TEXT,
  team1_id UUID,
  team2_id UUID,
  winner_advances_to TEXT,
  loser_advances_to TEXT,
  team1_from_match TEXT,
  team2_from_match TEXT,
  team1_is_winner BOOLEAN,
  team2_is_winner BOOLEAN,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT,
  winner_id UUID,
  team1_score INTEGER,
  team2_score INTEGER,
  result JSONB,
  best_of NUMERIC,
  disputed BOOLEAN,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  team1 TEXT,
  team2 TEXT,
  tournament TEXT,
  winner TEXT
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  clan_id UUID,
  registered_by TEXT,
  seed INTEGER,
  status TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  final_placement INTEGER,
  total_wins INTEGER,
  total_losses INTEGER,
  roster JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  slug TEXT,
  description TEXT,
  banner_url TEXT,
  organizer_clan_id UUID,
  organizer_user_id UUID,
  game_id UUID,
  format TEXT,
  team_size NUMERIC,
  max_teams INTEGER,
  min_teams INTEGER,
  registration_start TEXT,
  registration_end TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT,
  prize_pool JSONB,
  rules TEXT,
  settings JSONB,
  bracket_data JSONB,
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  amount TEXT,
  currency TEXT,
  distribution TEXT,
  generated_at TIMESTAMPTZ,
  organizer_clan TEXT,
  participant_count TEXT,
  percentage TEXT,
  place TEXT,
  total TEXT,
  total_matches TEXT,
  total_rounds TEXT,
  tournament_participants TEXT
);

CREATE TABLE IF NOT EXISTS trait_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communicative TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  endorsed_id UUID,
  endorser_id UUID,
  friendly TEXT,
  leader TEXT,
  reliable TEXT,
  team_player TEXT
);

CREATE TABLE IF NOT EXISTS trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS twitch_eventsub_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT,
  twitch_subscription_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  badge_id UUID,
  earned_at TIMESTAMPTZ,
  progress JSONB,
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_pass_id UUID,
  is_premium BOOLEAN,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  frame_id UUID,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_game_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  game_id UUID,
  xp INTEGER,
  level INTEGER,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  game_id UUID,
  game_username TEXT,
  game_id_external TEXT,
  rank TEXT,
  role TEXT,
  stats JSONB,
  is_verified BOOLEAN,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON user_games (user_id);

CREATE TABLE IF NOT EXISTS user_mood (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  game_id UUID,
  intensity TEXT,
  mood TEXT,
  note TEXT,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS user_profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  earned_at TIMESTAMPTZ,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  total_xp INTEGER,
  level INTEGER,
  current_level_xp INTEGER,
  xp_to_next_level INTEGER,
  prestige_level INTEGER,
  active_title_id UUID,
  active_frame_id UUID,
  active_theme_id UUID,
  showcase_badges JSONB,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  active_frame TEXT,
  active_theme TEXT,
  active_title TEXT
);

CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  quest_id UUID,
  status TEXT,
  progress JSONB,
  assigned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  period_type TEXT,
  period_key TEXT,
  quest TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evidence_urls TEXT,
  priority TEXT,
  report_type TEXT,
  reported_user TEXT,
  reported_user_id UUID,
  reporter TEXT,
  reporter_id UUID,
  status TEXT
);

CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  season_reward_id UUID,
  reward_name TEXT,
  reward_type TEXT,
  reward_value JSONB,
  season_id UUID,
  earned_rank INTEGER,
  earned_points INTEGER,
  status TEXT,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_equipped BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  season TEXT,
  season_reward TEXT
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_cycle TEXT,
  cancel_at_period_end TEXT,
  canceled_at TIMESTAMPTZ,
  current_period_end TEXT,
  current_period_start TEXT,
  plan_id UUID,
  status TEXT,
  stripe_price_id UUID,
  stripe_subscription_id UUID,
  trial_end TEXT,
  trial_start TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  theme_id UUID,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title_id UUID,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verified_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_type TEXT,
  is_active BOOLEAN,
  user_id UUID,
  verification_method TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verified_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_strikes TEXT,
  behavior_rating TEXT,
  behavior_score TEXT,
  email_verified TEXT,
  games_played TEXT,
  last_behavior_update TEXT,
  negative_reports TEXT,
  phone_verified TEXT,
  platform_linked TEXT,
  playtime_hours TEXT,
  positive_endorsements TEXT,
  status TEXT,
  user_id UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verified_queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  game_id UUID,
  min_behavior_score TEXT,
  region TEXT,
  status TEXT,
  user_id UUID,
  verified_profile TEXT
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  currency_type TEXT,
  user_id UUID
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  amount INTEGER,
  source_type TEXT,
  source_id UUID,
  description TEXT,
  game_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

