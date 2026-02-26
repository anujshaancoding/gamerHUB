-- GamerHub Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  gaming_style VARCHAR(20) CHECK (gaming_style IN ('casual', 'competitive', 'pro')),
  preferred_language VARCHAR(10) DEFAULT 'en',
  region VARCHAR(50),
  timezone VARCHAR(50),
  online_hours JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Games (supported games catalog)
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon_url TEXT,
  banner_url TEXT,
  has_api BOOLEAN DEFAULT false,
  api_config JSONB DEFAULT '{}',
  ranks JSONB DEFAULT '[]',
  roles JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Games (linked game accounts)
CREATE TABLE public.user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  game_username VARCHAR(100),
  game_id_external VARCHAR(200),
  rank VARCHAR(50),
  role VARCHAR(50),
  stats JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 4. Achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  badge_url TEXT,
  achievement_date DATE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Matches (scheduled games)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(100),
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  max_players INT DEFAULT 10,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  match_type VARCHAR(20) DEFAULT 'casual' CHECK (match_type IN ('casual', 'competitive', 'tournament')),
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Match Participants
CREATE TABLE public.match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  team VARCHAR(10),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- 7. Challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  rules TEXT,
  rank_requirement VARCHAR(50),
  reward TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'in_progress', 'completed')),
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ratings
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  politeness INT CHECK (politeness BETWEEN 1 AND 5),
  fair_play INT CHECK (fair_play BETWEEN 1 AND 5),
  communication INT CHECK (communication BETWEEN 1 AND 5),
  skill_consistency INT CHECK (skill_consistency BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rater_id, rated_id, match_id)
);

-- 9. Media
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(100),
  description TEXT,
  file_size INT,
  duration_seconds INT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'match')),
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Conversation Participants
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 12. Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Follows
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_region ON profiles(region);
CREATE INDEX idx_profiles_gaming_style ON profiles(gaming_style);
CREATE INDEX idx_profiles_online ON profiles(is_online);
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen DESC);

CREATE INDEX idx_user_games_user ON user_games(user_id);
CREATE INDEX idx_user_games_game ON user_games(game_id);
CREATE INDEX idx_user_games_rank ON user_games(rank);

CREATE INDEX idx_achievements_user ON achievements(user_id);
CREATE INDEX idx_achievements_game ON achievements(game_id);

CREATE INDEX idx_matches_creator ON matches(creator_id);
CREATE INDEX idx_matches_game ON matches(game_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);

CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_user ON match_participants(user_id);

CREATE INDEX idx_challenges_creator ON challenges(creator_id);
CREATE INDEX idx_challenges_game ON challenges(game_id);
CREATE INDEX idx_challenges_status ON challenges(status);

CREATE INDEX idx_ratings_rated ON ratings(rated_id);
CREATE INDEX idx_ratings_match ON ratings(match_id);

CREATE INDEX idx_media_user ON media(user_id);
CREATE INDEX idx_media_game ON media(game_id);
CREATE INDEX idx_media_created ON media(created_at DESC);

CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Games (public read)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

-- User Games
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public user games are viewable"
  ON user_games FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own games"
  ON user_games FOR ALL
  USING (user_id = auth.uid());

-- Achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public achievements are viewable"
  ON achievements FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own achievements"
  ON achievements FOR ALL
  USING (user_id = auth.uid());

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their matches"
  ON matches FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their matches"
  ON matches FOR DELETE
  USING (auth.uid() = creator_id);

-- Match Participants
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants are viewable by everyone"
  ON match_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join matches"
  ON match_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON match_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave matches"
  ON match_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open challenges are viewable by everyone"
  ON challenges FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = accepted_by);

-- Ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

-- Media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public media is viewable"
  ON media FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own media"
  ON media FOR ALL
  USING (user_id = auth.uid());

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation Participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their participation"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_games_updated_at
  BEFORE UPDATE ON user_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA: Games
-- ============================================

INSERT INTO games (slug, name, icon_url, has_api, ranks, roles) VALUES
  ('valorant', 'Valorant', '/images/games/valorant.png', true,
   '["Iron 1","Iron 2","Iron 3","Bronze 1","Bronze 2","Bronze 3","Silver 1","Silver 2","Silver 3","Gold 1","Gold 2","Gold 3","Platinum 1","Platinum 2","Platinum 3","Diamond 1","Diamond 2","Diamond 3","Ascendant 1","Ascendant 2","Ascendant 3","Immortal 1","Immortal 2","Immortal 3","Radiant"]',
   '["Duelist","Controller","Initiator","Sentinel"]'),

  ('cs2', 'Counter-Strike 2', '/images/games/cs2.png', true,
   '["Silver I","Silver II","Silver III","Silver IV","Silver Elite","Silver Elite Master","Gold Nova I","Gold Nova II","Gold Nova III","Gold Nova Master","Master Guardian I","Master Guardian II","Master Guardian Elite","Distinguished Master Guardian","Legendary Eagle","Legendary Eagle Master","Supreme Master First Class","Global Elite"]',
   '["Entry Fragger","AWPer","Support","Lurker","IGL"]'),

  ('pubg-mobile', 'PUBG Mobile', '/images/games/pubg-mobile.png', false,
   '["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Ace Master","Ace Dominator","Conqueror"]',
   '["Fragger","Support","Scout","IGL"]'),

  ('freefire', 'Free Fire', '/images/games/freefire.png', false,
   '["Bronze","Silver","Gold","Platinum","Diamond","Heroic","Grandmaster"]',
   '["Rusher","Support","Sniper","Defuser"]'),

  ('coc', 'Clash of Clans', '/images/games/coc.png', false,
   '["Bronze League","Silver League","Gold League","Crystal League","Master League","Champion League","Titan League","Legend League"]',
   '["War Specialist","Donator","Clan Leader","Base Builder"]'),

  ('cod-mobile', 'COD Mobile', '/images/games/cod-mobile.png', false,
   '["Rookie","Veteran","Elite","Pro","Master","Grandmaster","Legendary"]',
   '["Slayer","OBJ","Anchor","Support"]'),

  ('other', 'Other', '/images/games/other.png', false,
   '[]',
   '[]');

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
-- Voice/Video Calls Schema
-- Track call sessions and participants for LiveKit integration

-- Calls table - tracks call sessions
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  initiator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('voice', 'video')),
  status VARCHAR(20) DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined', 'failed')),
  room_name VARCHAR(100) UNIQUE NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for calls
CREATE INDEX idx_calls_conversation ON calls(conversation_id);
CREATE INDEX idx_calls_initiator ON calls(initiator_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_room ON calls(room_name);
CREATE INDEX idx_calls_created ON calls(created_at DESC);

-- Call participants table - tracks individual participant states
CREATE TABLE public.call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'ringing', 'joined', 'left', 'declined')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_video_enabled BOOLEAN DEFAULT true,
  is_screen_sharing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(call_id, user_id)
);

-- Indexes for call participants
CREATE INDEX idx_call_participants_call ON call_participants(call_id);
CREATE INDEX idx_call_participants_user ON call_participants(user_id);
CREATE INDEX idx_call_participants_status ON call_participants(status);

-- Enable RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view calls in their conversations"
  ON calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = calls.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can initiate calls in their conversations"
  ON calls FOR INSERT
  WITH CHECK (
    auth.uid() = initiator_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = calls.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update call status"
  ON calls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = calls.conversation_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for call_participants
CREATE POLICY "Users can view call participants"
  ON call_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls c
      JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
      WHERE c.id = call_participants.call_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Call initiator can add participants"
  ON call_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT initiator_id FROM calls WHERE id = call_participants.call_id
    )
  );

CREATE POLICY "Users can update their own participation"
  ON call_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Trigger for updated_at on calls
CREATE OR REPLACE FUNCTION update_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_calls_updated_at();

-- Enable realtime for calls and call_participants
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_participants;
-- GamerHub Clans System Schema
-- Migration: 003_clans.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Clans (core clan table)
CREATE TABLE public.clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  tag VARCHAR(6) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  primary_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  region VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  min_rank_requirement VARCHAR(50),
  max_members INT DEFAULT 50,
  is_public BOOLEAN DEFAULT true,
  is_recruiting BOOLEAN DEFAULT true,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{"join_approval_required": true, "allow_member_invites": false}',
  stats JSONB DEFAULT '{"total_wins": 0, "total_matches": 0, "challenges_won": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clan Members (membership and roles)
CREATE TABLE public.clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'co_leader', 'officer', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  promoted_at TIMESTAMPTZ,
  contribution_points INT DEFAULT 0,
  notes TEXT,
  UNIQUE(clan_id, user_id)
);

-- 3. Clan Invites (invitations and join requests)
CREATE TABLE public.clan_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('invite', 'request')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- 4. Clan Games (games the clan competes in)
CREATE TABLE public.clan_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  min_rank VARCHAR(50),
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clan_id, game_id)
);

-- 5. Clan Achievements
CREATE TABLE public.clan_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  badge_url TEXT,
  achievement_type VARCHAR(30) CHECK (achievement_type IN ('tournament_win', 'challenge_milestone', 'member_milestone', 'custom')),
  achievement_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Clan Challenges (clan vs clan)
CREATE TABLE public.clan_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  challenged_clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  rules TEXT,
  format VARCHAR(30) CHECK (format IN ('best_of_1', 'best_of_3', 'best_of_5', 'round_robin', 'custom')),
  team_size INT DEFAULT 5,
  scheduled_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  winner_clan_id UUID REFERENCES public.clans(id) ON DELETE SET NULL,
  result JSONB DEFAULT '{}',
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Clan Recruitment Posts
CREATE TABLE public.clan_recruitment_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '{}',
  positions_available INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  views_count INT DEFAULT 0,
  applications_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Clan Activity Log
CREATE TABLE public.clan_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
    'member_joined', 'member_left', 'member_kicked', 'member_promoted', 'member_demoted',
    'challenge_created', 'challenge_won', 'challenge_lost',
    'achievement_earned', 'settings_updated', 'clan_created'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Clans indexes
CREATE INDEX idx_clans_tag ON clans(tag);
CREATE INDEX idx_clans_slug ON clans(slug);
CREATE INDEX idx_clans_primary_game ON clans(primary_game_id);
CREATE INDEX idx_clans_region ON clans(region);
CREATE INDEX idx_clans_recruiting ON clans(is_recruiting) WHERE is_recruiting = true;
CREATE INDEX idx_clans_public ON clans(is_public) WHERE is_public = true;
CREATE INDEX idx_clans_created ON clans(created_at DESC);

-- Clan members indexes
CREATE INDEX idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX idx_clan_members_user ON clan_members(user_id);
CREATE INDEX idx_clan_members_role ON clan_members(role);

-- Clan invites indexes
CREATE INDEX idx_clan_invites_clan ON clan_invites(clan_id);
CREATE INDEX idx_clan_invites_user ON clan_invites(user_id);
CREATE INDEX idx_clan_invites_status ON clan_invites(status) WHERE status = 'pending';
CREATE INDEX idx_clan_invites_type ON clan_invites(type);

-- Clan games indexes
CREATE INDEX idx_clan_games_clan ON clan_games(clan_id);
CREATE INDEX idx_clan_games_game ON clan_games(game_id);

-- Clan achievements indexes
CREATE INDEX idx_clan_achievements_clan ON clan_achievements(clan_id);
CREATE INDEX idx_clan_achievements_date ON clan_achievements(achievement_date DESC);

-- Clan challenges indexes
CREATE INDEX idx_clan_challenges_challenger ON clan_challenges(challenger_clan_id);
CREATE INDEX idx_clan_challenges_challenged ON clan_challenges(challenged_clan_id);
CREATE INDEX idx_clan_challenges_status ON clan_challenges(status);
CREATE INDEX idx_clan_challenges_game ON clan_challenges(game_id);
CREATE INDEX idx_clan_challenges_scheduled ON clan_challenges(scheduled_at);

-- Clan recruitment indexes
CREATE INDEX idx_clan_recruitment_clan ON clan_recruitment_posts(clan_id);
CREATE INDEX idx_clan_recruitment_game ON clan_recruitment_posts(game_id);
CREATE INDEX idx_clan_recruitment_active ON clan_recruitment_posts(is_active) WHERE is_active = true;
CREATE INDEX idx_clan_recruitment_created ON clan_recruitment_posts(created_at DESC);

-- Clan activity indexes
CREATE INDEX idx_clan_activity_clan ON clan_activity_log(clan_id);
CREATE INDEX idx_clan_activity_created ON clan_activity_log(created_at DESC);
CREATE INDEX idx_clan_activity_type ON clan_activity_log(activity_type);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_recruitment_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_activity_log ENABLE ROW LEVEL SECURITY;

-- CLANS POLICIES
CREATE POLICY "Public clans are viewable by everyone"
  ON clans FOR SELECT
  USING (is_public = true OR EXISTS (
    SELECT 1 FROM clan_members WHERE clan_id = clans.id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create clans"
  ON clans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Leaders and co-leaders can update clan"
  ON clans FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clans.id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader')
  ));

CREATE POLICY "Only leader can delete clan"
  ON clans FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clans.id
    AND user_id = auth.uid()
    AND role = 'leader'
  ));

-- CLAN_MEMBERS POLICIES
CREATE POLICY "Clan members are viewable by everyone"
  ON clan_members FOR SELECT
  USING (true);

CREATE POLICY "System can add members"
  ON clan_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Leaders and co-leaders can update members"
  ON clan_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members cm
    WHERE cm.clan_id = clan_members.clan_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('leader', 'co_leader')
  ) OR user_id = auth.uid());

CREATE POLICY "Members can leave or leaders can remove"
  ON clan_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_members.clan_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('leader', 'co_leader')
    )
  );

-- CLAN_INVITES POLICIES
CREATE POLICY "Users can view their own invites or clan officers can view requests"
  ON clan_invites FOR SELECT
  USING (
    user_id = auth.uid() OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    )
  );

CREATE POLICY "Officers can create invites, users can request"
  ON clan_invites FOR INSERT
  WITH CHECK (
    (type = 'request' AND user_id = auth.uid()) OR
    (type = 'invite' AND EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    ))
  );

CREATE POLICY "Users can respond to their invites, officers to requests"
  ON clan_invites FOR UPDATE
  USING (
    (type = 'invite' AND user_id = auth.uid()) OR
    (type = 'request' AND EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    ))
  );

CREATE POLICY "Users can delete their own invites or requests"
  ON clan_invites FOR DELETE
  USING (
    user_id = auth.uid() OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    )
  );

-- CLAN_GAMES POLICIES
CREATE POLICY "Clan games are viewable by everyone"
  ON clan_games FOR SELECT
  USING (true);

CREATE POLICY "Officers can manage clan games"
  ON clan_games FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_games.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

CREATE POLICY "Officers can update clan games"
  ON clan_games FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_games.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

CREATE POLICY "Officers can delete clan games"
  ON clan_games FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_games.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

-- CLAN_ACHIEVEMENTS POLICIES
CREATE POLICY "Clan achievements are viewable by everyone"
  ON clan_achievements FOR SELECT
  USING (true);

CREATE POLICY "Leaders can manage achievements"
  ON clan_achievements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_achievements.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader')
  ));

CREATE POLICY "Leaders can update achievements"
  ON clan_achievements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_achievements.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader')
  ));

CREATE POLICY "Leaders can delete achievements"
  ON clan_achievements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_achievements.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader')
  ));

-- CLAN_CHALLENGES POLICIES
CREATE POLICY "Clan challenges are viewable by everyone"
  ON clan_challenges FOR SELECT
  USING (true);

CREATE POLICY "Clan officers can create challenges"
  ON clan_challenges FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_challenges.challenger_clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

CREATE POLICY "Involved clans officers can update challenges"
  ON clan_challenges FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE (clan_id = clan_challenges.challenger_clan_id OR clan_id = clan_challenges.challenged_clan_id)
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

CREATE POLICY "Challenger clan officers can delete challenges"
  ON clan_challenges FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_challenges.challenger_clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

-- CLAN_RECRUITMENT_POSTS POLICIES
CREATE POLICY "Active recruitment posts are viewable by everyone"
  ON clan_recruitment_posts FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_recruitment_posts.clan_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Officers can create recruitment posts"
  ON clan_recruitment_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_recruitment_posts.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

CREATE POLICY "Officers can update recruitment posts"
  ON clan_recruitment_posts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_recruitment_posts.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

CREATE POLICY "Officers can delete recruitment posts"
  ON clan_recruitment_posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_recruitment_posts.clan_id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader', 'officer')
  ));

-- CLAN_ACTIVITY_LOG POLICIES
CREATE POLICY "Clan members can view activity"
  ON clan_activity_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clan_activity_log.clan_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "System can insert activity logs"
  ON clan_activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated_at triggers (reuse existing function)
CREATE TRIGGER update_clans_updated_at
  BEFORE UPDATE ON clans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clan_challenges_updated_at
  BEFORE UPDATE ON clan_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clan_recruitment_updated_at
  BEFORE UPDATE ON clan_recruitment_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle member join (add to clan conversation)
CREATE OR REPLACE FUNCTION handle_clan_member_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Add member to clan conversation
  INSERT INTO conversation_participants (conversation_id, user_id)
  SELECT c.conversation_id, NEW.user_id
  FROM clans c
  WHERE c.id = NEW.clan_id AND c.conversation_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- Log activity
  INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description)
  VALUES (NEW.clan_id, NEW.user_id, 'member_joined', 'Joined the clan');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_clan_member_join
  AFTER INSERT ON clan_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_clan_member_join();

-- Function to handle member leave (remove from clan conversation)
CREATE OR REPLACE FUNCTION handle_clan_member_leave()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove from clan conversation
  DELETE FROM conversation_participants
  WHERE user_id = OLD.user_id
  AND conversation_id = (SELECT conversation_id FROM clans WHERE id = OLD.clan_id);

  -- Log activity
  INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description)
  VALUES (OLD.clan_id, OLD.user_id, 'member_left', 'Left the clan');

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_clan_member_leave
  AFTER DELETE ON clan_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_clan_member_leave();

-- Function to handle role changes
CREATE OR REPLACE FUNCTION handle_clan_member_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role THEN
    IF NEW.role IN ('leader', 'co_leader', 'officer') AND OLD.role = 'member' THEN
      INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description, metadata)
      VALUES (NEW.clan_id, NEW.user_id, 'member_promoted',
              'Promoted to ' || NEW.role,
              jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
    ELSIF OLD.role IN ('leader', 'co_leader', 'officer') AND NEW.role = 'member' THEN
      INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description, metadata)
      VALUES (NEW.clan_id, NEW.user_id, 'member_demoted',
              'Demoted to ' || NEW.role,
              jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
    END IF;
    NEW.promoted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_clan_member_role_change
  BEFORE UPDATE ON clan_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_clan_member_role_change();

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE clan_members;
ALTER PUBLICATION supabase_realtime ADD TABLE clan_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE clan_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE clan_challenges;
-- Fix infinite recursion in conversation_participants RLS policy
-- The issue is that the SELECT policy on conversation_participants
-- queries conversation_participants itself, causing infinite recursion.

-- Step 1: Create a security definer function to check membership
-- This bypasses RLS when checking if a user is in a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a function to create direct conversations atomically
-- This handles creating the conversation AND adding participants in one transaction
CREATE OR REPLACE FUNCTION public.create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  existing_conv_id UUID;
  new_conv_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Check if direct conversation already exists between these users
  SELECT c.id INTO existing_conv_id
  FROM conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = current_user_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp3
    WHERE cp3.conversation_id = c.id
  ) = 2
  LIMIT 1;

  IF existing_conv_id IS NOT NULL THEN
    RETURN existing_conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (type)
  VALUES ('direct')
  RETURNING id INTO new_conv_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (new_conv_id, current_user_id),
    (new_conv_id, other_user_id);

  RETURN new_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;

-- Step 4: Recreate policies using the security definer function

-- Conversation participants: users can view if they are a member
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- Conversations: users can view if they are a participant
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    public.is_conversation_member(id, auth.uid())
  );

-- Messages: users can view if they are in the conversation
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- Messages: users can send if they are in the conversation
CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_conversation_member(conversation_id, auth.uid())
  );
-- GamerHub Gamification & Progression System
-- Migration: 004_gamification.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Titles (unlockable display titles)
CREATE TABLE public.titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('level', 'badge', 'achievement', 'purchase', 'special')),
  unlock_value JSONB,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profile Frames (avatar border decorations)
CREATE TABLE public.profile_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('level', 'badge', 'achievement', 'purchase', 'special', 'default')),
  unlock_value JSONB,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profile Themes (profile color schemes)
CREATE TABLE public.profile_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20),
  accent_color VARCHAR(20),
  background_gradient JSONB,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('level', 'badge', 'achievement', 'purchase', 'special', 'default')),
  unlock_value JSONB,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Level Thresholds (XP requirements per level)
CREATE TABLE public.level_thresholds (
  level INT PRIMARY KEY,
  xp_required BIGINT NOT NULL,
  total_xp_required BIGINT NOT NULL,
  rewards JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Progression (core XP and level tracking)
CREATE TABLE public.user_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_xp BIGINT DEFAULT 0,
  level INT DEFAULT 1,
  current_level_xp INT DEFAULT 0,
  xp_to_next_level INT DEFAULT 100,
  prestige_level INT DEFAULT 0,
  active_title_id UUID REFERENCES public.titles(id) ON DELETE SET NULL,
  active_frame_id UUID REFERENCES public.profile_frames(id) ON DELETE SET NULL,
  active_theme_id UUID REFERENCES public.profile_themes(id) ON DELETE SET NULL,
  showcase_badges JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{"matches_played": 0, "matches_won": 0, "challenges_completed": 0, "quests_completed": 0, "current_win_streak": 0, "best_win_streak": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Game Progression (per-game XP tracking)
CREATE TABLE public.user_game_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  xp BIGINT DEFAULT 0,
  level INT DEFAULT 1,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 7. Badge Definitions (achievement/badge catalog)
CREATE TABLE public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(30) NOT NULL CHECK (category IN ('skill', 'social', 'milestone', 'seasonal', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_criteria JSONB NOT NULL,
  xp_reward INT DEFAULT 0,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. User Badges (earned badges)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badge_definitions(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}',
  season VARCHAR(20),
  UNIQUE(user_id, badge_id)
);

-- 9. Quest Definitions (quest templates)
CREATE TABLE public.quest_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  quest_type VARCHAR(20) NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'special')),
  requirements JSONB NOT NULL,
  xp_reward INT NOT NULL,
  bonus_rewards JSONB DEFAULT '{}',
  weight INT DEFAULT 100,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  min_level INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. User Quests (active/completed quests)
CREATE TABLE public.user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES public.quest_definitions(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'claimed')),
  progress JSONB DEFAULT '{}',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  period_type VARCHAR(20) NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  UNIQUE(user_id, quest_id, period_key)
);

-- 11. User Titles (unlocked titles)
CREATE TABLE public.user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title_id UUID REFERENCES public.titles(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

-- 12. User Frames (unlocked frames)
CREATE TABLE public.user_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  frame_id UUID REFERENCES public.profile_frames(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, frame_id)
);

-- 13. User Themes (unlocked themes)
CREATE TABLE public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  theme_id UUID REFERENCES public.profile_themes(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, theme_id)
);

-- 14. XP Transactions (audit log)
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('match', 'challenge', 'quest', 'badge', 'clan_activity', 'rating', 'bonus', 'admin')),
  source_id UUID,
  description TEXT,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Titles indexes
CREATE INDEX idx_titles_unlock_type ON titles(unlock_type);
CREATE INDEX idx_titles_active ON titles(is_active) WHERE is_active = true;
CREATE INDEX idx_titles_rarity ON titles(rarity);

-- Profile frames indexes
CREATE INDEX idx_profile_frames_active ON profile_frames(is_active) WHERE is_active = true;
CREATE INDEX idx_profile_frames_unlock_type ON profile_frames(unlock_type);

-- Profile themes indexes
CREATE INDEX idx_profile_themes_active ON profile_themes(is_active) WHERE is_active = true;
CREATE INDEX idx_profile_themes_unlock_type ON profile_themes(unlock_type);

-- User progression indexes
CREATE INDEX idx_user_progression_user ON user_progression(user_id);
CREATE INDEX idx_user_progression_level ON user_progression(level DESC);
CREATE INDEX idx_user_progression_xp ON user_progression(total_xp DESC);

-- User game progression indexes
CREATE INDEX idx_user_game_progression_user ON user_game_progression(user_id);
CREATE INDEX idx_user_game_progression_game ON user_game_progression(game_id);
CREATE INDEX idx_user_game_progression_level ON user_game_progression(level DESC);
CREATE INDEX idx_user_game_progression_xp ON user_game_progression(xp DESC);

-- Badge definitions indexes
CREATE INDEX idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX idx_badge_definitions_rarity ON badge_definitions(rarity);
CREATE INDEX idx_badge_definitions_game ON badge_definitions(game_id);
CREATE INDEX idx_badge_definitions_active ON badge_definitions(is_active) WHERE is_active = true;

-- User badges indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);

-- Quest definitions indexes
CREATE INDEX idx_quest_definitions_type ON quest_definitions(quest_type);
CREATE INDEX idx_quest_definitions_active ON quest_definitions(is_active) WHERE is_active = true;
CREATE INDEX idx_quest_definitions_game ON quest_definitions(game_id);

-- User quests indexes
CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE INDEX idx_user_quests_period ON user_quests(period_type, period_key);
CREATE INDEX idx_user_quests_expires ON user_quests(expires_at) WHERE status = 'active';

-- User titles indexes
CREATE INDEX idx_user_titles_user ON user_titles(user_id);
CREATE INDEX idx_user_titles_title ON user_titles(title_id);

-- User frames indexes
CREATE INDEX idx_user_frames_user ON user_frames(user_id);
CREATE INDEX idx_user_frames_frame ON user_frames(frame_id);

-- User themes indexes
CREATE INDEX idx_user_themes_user ON user_themes(user_id);
CREATE INDEX idx_user_themes_theme ON user_themes(theme_id);

-- XP transactions indexes
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created ON xp_transactions(created_at DESC);
CREATE INDEX idx_xp_transactions_source ON xp_transactions(source_type);
CREATE INDEX idx_xp_transactions_game ON xp_transactions(game_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- TITLES POLICIES
CREATE POLICY "Titles are viewable by everyone"
  ON titles FOR SELECT USING (is_active = true);

-- PROFILE_FRAMES POLICIES
CREATE POLICY "Profile frames are viewable by everyone"
  ON profile_frames FOR SELECT USING (is_active = true);

-- PROFILE_THEMES POLICIES
CREATE POLICY "Profile themes are viewable by everyone"
  ON profile_themes FOR SELECT USING (is_active = true);

-- LEVEL_THRESHOLDS POLICIES
CREATE POLICY "Level thresholds are viewable by everyone"
  ON level_thresholds FOR SELECT USING (true);

-- USER_PROGRESSION POLICIES
CREATE POLICY "User progression is viewable by everyone"
  ON user_progression FOR SELECT USING (true);

CREATE POLICY "Users can insert their own progression"
  ON user_progression FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progression"
  ON user_progression FOR UPDATE
  USING (auth.uid() = user_id);

-- USER_GAME_PROGRESSION POLICIES
CREATE POLICY "Game progression is viewable by everyone"
  ON user_game_progression FOR SELECT USING (true);

CREATE POLICY "Users can manage their own game progression"
  ON user_game_progression FOR ALL
  USING (auth.uid() = user_id);

-- BADGE_DEFINITIONS POLICIES
CREATE POLICY "Active badges are viewable by everyone"
  ON badge_definitions FOR SELECT
  USING (is_active = true AND (is_secret = false OR EXISTS (
    SELECT 1 FROM user_badges WHERE badge_id = badge_definitions.id AND user_id = auth.uid()
  )));

-- USER_BADGES POLICIES
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT USING (true);

CREATE POLICY "System can award badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- QUEST_DEFINITIONS POLICIES
CREATE POLICY "Quest definitions are viewable by everyone"
  ON quest_definitions FOR SELECT USING (is_active = true);

-- USER_QUESTS POLICIES
CREATE POLICY "Users can view their own quests"
  ON user_quests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own quests"
  ON user_quests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quests"
  ON user_quests FOR UPDATE
  USING (user_id = auth.uid());

-- USER_TITLES POLICIES
CREATE POLICY "User titles are viewable by everyone"
  ON user_titles FOR SELECT USING (true);

CREATE POLICY "System can grant titles"
  ON user_titles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- USER_FRAMES POLICIES
CREATE POLICY "User frames are viewable by everyone"
  ON user_frames FOR SELECT USING (true);

CREATE POLICY "System can grant frames"
  ON user_frames FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- USER_THEMES POLICIES
CREATE POLICY "User themes are viewable by everyone"
  ON user_themes FOR SELECT USING (true);

CREATE POLICY "System can grant themes"
  ON user_themes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- XP_TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own XP transactions"
  ON xp_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create XP transactions"
  ON xp_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to calculate XP required for a level
CREATE OR REPLACE FUNCTION calculate_xp_for_level(p_level INT)
RETURNS BIGINT AS $$
BEGIN
  RETURN FLOOR(100 * POWER(p_level, 1.5));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award XP and handle level ups
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INT,
  p_source_type VARCHAR(30),
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_game_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_progression user_progression%ROWTYPE;
  v_new_level INT;
  v_level_ups INT := 0;
  v_rewards JSONB := '[]'::jsonb;
  v_threshold level_thresholds%ROWTYPE;
  v_xp_for_next INT;
BEGIN
  -- Get or create user progression
  INSERT INTO user_progression (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_progression FROM user_progression WHERE user_id = p_user_id FOR UPDATE;

  -- Record XP transaction
  INSERT INTO xp_transactions (user_id, amount, source_type, source_id, description, game_id)
  VALUES (p_user_id, p_amount, p_source_type, p_source_id, p_description, p_game_id);

  -- Update total XP and current level XP
  v_progression.total_xp := v_progression.total_xp + p_amount;
  v_progression.current_level_xp := v_progression.current_level_xp + p_amount;

  -- Check for level ups
  WHILE v_progression.current_level_xp >= v_progression.xp_to_next_level LOOP
    v_progression.current_level_xp := v_progression.current_level_xp - v_progression.xp_to_next_level;
    v_progression.level := v_progression.level + 1;
    v_level_ups := v_level_ups + 1;

    -- Get next level threshold
    SELECT * INTO v_threshold FROM level_thresholds WHERE level = v_progression.level + 1;
    IF FOUND THEN
      v_progression.xp_to_next_level := v_threshold.xp_required;
    ELSE
      -- Default formula if no threshold defined
      v_progression.xp_to_next_level := calculate_xp_for_level(v_progression.level + 1);
    END IF;

    -- Collect level rewards
    SELECT rewards INTO v_threshold FROM level_thresholds WHERE level = v_progression.level;
    IF v_threshold.rewards IS NOT NULL AND v_threshold.rewards != '{}'::jsonb THEN
      v_rewards := v_rewards || jsonb_build_object('level', v_progression.level, 'rewards', v_threshold.rewards);
    END IF;
  END LOOP;

  -- Update progression
  UPDATE user_progression
  SET total_xp = v_progression.total_xp,
      level = v_progression.level,
      current_level_xp = v_progression.current_level_xp,
      xp_to_next_level = v_progression.xp_to_next_level,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Also update game-specific progression if game_id provided
  IF p_game_id IS NOT NULL THEN
    INSERT INTO user_game_progression (user_id, game_id, xp)
    VALUES (p_user_id, p_game_id, p_amount)
    ON CONFLICT (user_id, game_id)
    DO UPDATE SET
      xp = user_game_progression.xp + p_amount,
      level = GREATEST(1, FLOOR(POWER(user_game_progression.xp + p_amount, 0.4))::INT),
      updated_at = NOW();
  END IF;

  RETURN jsonb_build_object(
    'xp_awarded', p_amount,
    'new_total_xp', v_progression.total_xp,
    'new_level', v_progression.level,
    'current_level_xp', v_progression.current_level_xp,
    'xp_to_next_level', v_progression.xp_to_next_level,
    'level_ups', v_level_ups,
    'rewards', v_rewards
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign daily/weekly quests
CREATE OR REPLACE FUNCTION assign_quests(p_user_id UUID, p_quest_type VARCHAR(20))
RETURNS JSONB AS $$
DECLARE
  v_period_key VARCHAR(20);
  v_expires_at TIMESTAMPTZ;
  v_quest_count INT;
  v_target_count INT;
  v_quest quest_definitions%ROWTYPE;
  v_assigned_quests JSONB := '[]'::jsonb;
  v_user_level INT;
BEGIN
  -- Get user level
  SELECT level INTO v_user_level FROM user_progression WHERE user_id = p_user_id;
  v_user_level := COALESCE(v_user_level, 1);

  -- Calculate period key and expiration
  IF p_quest_type = 'daily' THEN
    v_period_key := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
    v_expires_at := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day';
    v_target_count := 3;
  ELSIF p_quest_type = 'weekly' THEN
    v_period_key := TO_CHAR(CURRENT_DATE, 'IYYY-"W"IW');
    v_expires_at := DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 week';
    v_target_count := 3;
  ELSE
    RETURN '[]'::jsonb;
  END IF;

  -- Count existing quests for this period
  SELECT COUNT(*) INTO v_quest_count
  FROM user_quests
  WHERE user_id = p_user_id
  AND period_type = p_quest_type
  AND period_key = v_period_key;

  -- Assign missing quests
  IF v_quest_count < v_target_count THEN
    FOR v_quest IN
      SELECT * FROM quest_definitions
      WHERE quest_type = p_quest_type
      AND is_active = true
      AND min_level <= v_user_level
      AND id NOT IN (
        SELECT quest_id FROM user_quests
        WHERE user_id = p_user_id
        AND period_type = p_quest_type
        AND period_key = v_period_key
      )
      ORDER BY RANDOM()
      LIMIT (v_target_count - v_quest_count)
    LOOP
      INSERT INTO user_quests (user_id, quest_id, status, progress, expires_at, period_type, period_key)
      VALUES (p_user_id, v_quest.id, 'active',
              jsonb_build_object('current', 0, 'target', COALESCE((v_quest.requirements->>'count')::INT, 1)),
              v_expires_at, p_quest_type, v_period_key);

      v_assigned_quests := v_assigned_quests || jsonb_build_object(
        'quest_id', v_quest.id,
        'name', v_quest.name,
        'xp_reward', v_quest.xp_reward
      );
    END LOOP;
  END IF;

  RETURN v_assigned_quests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update quest progress
CREATE OR REPLACE FUNCTION update_quest_progress(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_event_data JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_quest RECORD;
  v_new_progress INT;
  v_target INT;
  v_completed_quests JSONB := '[]'::jsonb;
BEGIN
  -- Find active quests that match this event type
  FOR v_quest IN
    SELECT uq.*, qd.requirements, qd.xp_reward, qd.name as quest_name
    FROM user_quests uq
    JOIN quest_definitions qd ON uq.quest_id = qd.id
    WHERE uq.user_id = p_user_id
    AND uq.status = 'active'
    AND uq.expires_at > NOW()
    AND qd.requirements->>'type' = p_event_type
  LOOP
    -- Check if event matches quest requirements (game filter, etc.)
    IF v_quest.requirements ? 'game_id' AND
       v_quest.requirements->>'game_id' IS NOT NULL AND
       v_quest.requirements->>'game_id' != COALESCE(p_event_data->>'game_id', '') THEN
      CONTINUE;
    END IF;

    -- Update progress
    v_target := COALESCE((v_quest.progress->>'target')::INT, 1);
    v_new_progress := COALESCE((v_quest.progress->>'current')::INT, 0) + 1;

    IF v_new_progress >= v_target THEN
      -- Quest completed
      UPDATE user_quests
      SET progress = jsonb_set(progress, '{current}', to_jsonb(v_target)),
          status = 'completed',
          completed_at = NOW()
      WHERE id = v_quest.id;

      v_completed_quests := v_completed_quests || jsonb_build_object(
        'quest_id', v_quest.quest_id,
        'name', v_quest.quest_name,
        'xp_reward', v_quest.xp_reward
      );
    ELSE
      -- Update progress
      UPDATE user_quests
      SET progress = jsonb_set(progress, '{current}', to_jsonb(v_new_progress))
      WHERE id = v_quest.id;
    END IF;
  END LOOP;

  RETURN v_completed_quests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create user_progression on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile_gamification()
RETURNS TRIGGER AS $$
DECLARE
  v_default_theme_id UUID;
  v_default_frame_id UUID;
BEGIN
  -- Get default theme and frame
  SELECT id INTO v_default_theme_id FROM profile_themes WHERE slug = 'default' LIMIT 1;
  SELECT id INTO v_default_frame_id FROM profile_frames WHERE slug = 'default' LIMIT 1;

  -- Create progression record
  INSERT INTO user_progression (user_id, active_theme_id, active_frame_id)
  VALUES (NEW.id, v_default_theme_id, v_default_frame_id);

  -- Unlock default theme and frame
  IF v_default_theme_id IS NOT NULL THEN
    INSERT INTO user_themes (user_id, theme_id) VALUES (NEW.id, v_default_theme_id);
  END IF;
  IF v_default_frame_id IS NOT NULL THEN
    INSERT INTO user_frames (user_id, frame_id) VALUES (NEW.id, v_default_frame_id);
  END IF;

  -- Assign initial quests
  PERFORM assign_quests(NEW.id, 'daily');
  PERFORM assign_quests(NEW.id, 'weekly');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_gamification
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile_gamification();

-- Trigger: Award XP on match completion
CREATE OR REPLACE FUNCTION handle_match_completion_xp()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_xp_amount INT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Award XP to all participants
    FOR v_participant IN
      SELECT user_id FROM match_participants
      WHERE match_id = NEW.id AND status = 'accepted'
    LOOP
      -- Base XP: 50 for casual, 75 for competitive, 100 for tournament
      v_xp_amount := CASE NEW.match_type
        WHEN 'casual' THEN 50
        WHEN 'competitive' THEN 75
        WHEN 'tournament' THEN 100
        ELSE 50
      END;

      PERFORM award_xp(v_participant.user_id, v_xp_amount, 'match', NEW.id,
                       'Completed ' || NEW.match_type || ' match', NEW.game_id);

      -- Update quest progress
      PERFORM update_quest_progress(v_participant.user_id, 'play_match',
                                    jsonb_build_object('match_id', NEW.id, 'match_type', NEW.match_type, 'game_id', NEW.game_id));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_completed_xp
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_match_completion_xp();

-- Trigger: Award XP on challenge completion
CREATE OR REPLACE FUNCTION handle_challenge_completion_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Award XP to creator
    PERFORM award_xp(NEW.creator_id, 100, 'challenge', NEW.id, 'Challenge completed', NEW.game_id);
    PERFORM update_quest_progress(NEW.creator_id, 'challenge_complete', jsonb_build_object('challenge_id', NEW.id));

    -- Award XP to acceptor
    IF NEW.accepted_by IS NOT NULL THEN
      PERFORM award_xp(NEW.accepted_by, 100, 'challenge', NEW.id, 'Challenge completed', NEW.game_id);
      PERFORM update_quest_progress(NEW.accepted_by, 'challenge_complete', jsonb_build_object('challenge_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_challenge_completed_xp
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION handle_challenge_completion_xp();

-- Updated_at triggers
CREATE TRIGGER update_user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_progression_updated_at
  BEFORE UPDATE ON user_game_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE user_progression;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE user_quests;
ALTER PUBLICATION supabase_realtime ADD TABLE xp_transactions;

-- ============================================
-- SEED DATA
-- ============================================

-- Level thresholds (1-100)
INSERT INTO level_thresholds (level, xp_required, total_xp_required, rewards) VALUES
(1, 0, 0, '{}'),
(2, 100, 100, '{}'),
(3, 150, 250, '{}'),
(4, 200, 450, '{}'),
(5, 250, 700, '{"title": "newcomer"}'),
(6, 300, 1000, '{}'),
(7, 350, 1350, '{}'),
(8, 400, 1750, '{}'),
(9, 450, 2200, '{}'),
(10, 500, 2700, '{"title": "rising_star", "frame": "bronze"}'),
(15, 800, 6200, '{}'),
(20, 1100, 11500, '{"title": "veteran", "frame": "silver"}'),
(25, 1400, 18700, '{}'),
(30, 1700, 28000, '{"title": "elite", "frame": "gold"}'),
(40, 2400, 52000, '{"title": "champion"}'),
(50, 3100, 83000, '{"title": "legend", "frame": "platinum"}'),
(75, 5500, 180000, '{"title": "mythic", "theme": "mythic"}'),
(100, 8000, 320000, '{"title": "immortal", "frame": "diamond", "theme": "immortal"}');

-- Titles
INSERT INTO titles (slug, name, description, unlock_type, unlock_value, rarity, color, sort_order) VALUES
('newcomer', 'Newcomer', 'Welcome to GamerHub!', 'level', '{"level": 5}', 'common', NULL, 1),
('rising_star', 'Rising Star', 'Making progress!', 'level', '{"level": 10}', 'common', '#FFD700', 2),
('veteran', 'Veteran', 'A seasoned player', 'level', '{"level": 20}', 'rare', '#4169E1', 3),
('elite', 'Elite', 'Among the best', 'level', '{"level": 30}', 'rare', '#9400D3', 4),
('champion', 'Champion', 'A true champion', 'level', '{"level": 40}', 'epic', '#FF4500', 5),
('legend', 'Legend', 'Legendary status achieved', 'level', '{"level": 50}', 'epic', '#FF1493', 6),
('mythic', 'Mythic', 'Mythical prowess', 'level', '{"level": 75}', 'legendary', '#00CED1', 7),
('immortal', 'Immortal', 'Beyond mortal limits', 'level', '{"level": 100}', 'legendary', '#DC143C', 8),
('social_butterfly', 'Social Butterfly', 'Made 50 friends', 'achievement', '{"type": "follows", "count": 50}', 'rare', '#FF69B4', 10),
('streak_master', 'Streak Master', 'Win 10 matches in a row', 'achievement', '{"type": "win_streak", "count": 10}', 'epic', '#FF8C00', 11);

-- Profile Frames
INSERT INTO profile_frames (slug, name, description, image_url, unlock_type, unlock_value, rarity, sort_order) VALUES
('default', 'Default', 'Standard profile frame', '/images/frames/default.png', 'default', '{}', 'common', 0),
('bronze', 'Bronze Frame', 'A bronze border for your avatar', '/images/frames/bronze.png', 'level', '{"level": 10}', 'common', 1),
('silver', 'Silver Frame', 'A silver border for your avatar', '/images/frames/silver.png', 'level', '{"level": 20}', 'rare', 2),
('gold', 'Gold Frame', 'A golden border for your avatar', '/images/frames/gold.png', 'level', '{"level": 30}', 'rare', 3),
('platinum', 'Platinum Frame', 'A platinum border for your avatar', '/images/frames/platinum.png', 'level', '{"level": 50}', 'epic', 4),
('diamond', 'Diamond Frame', 'A diamond border for your avatar', '/images/frames/diamond.png', 'level', '{"level": 100}', 'legendary', 5);

-- Profile Themes
INSERT INTO profile_themes (slug, name, description, primary_color, secondary_color, accent_color, background_gradient, unlock_type, unlock_value, rarity, sort_order) VALUES
('default', 'Default', 'Standard dark theme', '#1a1a2e', '#16213e', '#0f3460', NULL, 'default', '{}', 'common', 0),
('ocean', 'Ocean', 'Deep blue ocean vibes', '#0077b6', '#00b4d8', '#90e0ef', '{"from": "#023e8a", "to": "#0077b6"}', 'level', '{"level": 15}', 'common', 1),
('sunset', 'Sunset', 'Warm sunset colors', '#ff6b6b', '#feca57', '#ff9ff3', '{"from": "#ff6b6b", "to": "#feca57"}', 'level', '{"level": 25}', 'rare', 2),
('forest', 'Forest', 'Nature-inspired greens', '#2d6a4f', '#40916c', '#95d5b2', '{"from": "#1b4332", "to": "#40916c"}', 'level', '{"level": 35}', 'rare', 3),
('mythic', 'Mythic', 'Ethereal cosmic theme', '#7400b8', '#6930c3', '#5390d9', '{"from": "#240046", "to": "#7400b8"}', 'level', '{"level": 75}', 'epic', 4),
('immortal', 'Immortal', 'Legendary crimson aura', '#9d0208', '#dc2f02', '#f48c06', '{"from": "#370617", "to": "#9d0208"}', 'level', '{"level": 100}', 'legendary', 5);

-- Badge Definitions
INSERT INTO badge_definitions (slug, name, description, category, rarity, unlock_criteria, xp_reward, sort_order) VALUES
-- Milestone badges
('first_match', 'First Blood', 'Complete your first match', 'milestone', 'common', '{"type": "matches_completed", "count": 1}', 25, 1),
('matches_10', 'Getting Started', 'Complete 10 matches', 'milestone', 'common', '{"type": "matches_completed", "count": 10}', 50, 2),
('matches_50', 'Regular Player', 'Complete 50 matches', 'milestone', 'rare', '{"type": "matches_completed", "count": 50}', 100, 3),
('matches_100', 'Dedicated Gamer', 'Complete 100 matches', 'milestone', 'rare', '{"type": "matches_completed", "count": 100}', 200, 4),
('matches_500', 'Veteran Player', 'Complete 500 matches', 'milestone', 'epic', '{"type": "matches_completed", "count": 500}', 500, 5),
('matches_1000', 'Legendary Grinder', 'Complete 1000 matches', 'milestone', 'legendary', '{"type": "matches_completed", "count": 1000}', 1000, 6),
-- Skill badges
('first_win', 'Victor', 'Win your first match', 'skill', 'common', '{"type": "matches_won", "count": 1}', 25, 10),
('wins_10', 'Rising Competitor', 'Win 10 matches', 'skill', 'common', '{"type": "matches_won", "count": 10}', 75, 11),
('wins_50', 'Skilled Player', 'Win 50 matches', 'skill', 'rare', '{"type": "matches_won", "count": 50}', 150, 12),
('wins_100', 'Master Competitor', 'Win 100 matches', 'skill', 'epic', '{"type": "matches_won", "count": 100}', 300, 13),
('streak_3', 'On a Roll', 'Win 3 matches in a row', 'skill', 'common', '{"type": "win_streak", "count": 3}', 50, 20),
('streak_5', 'Hot Streak', 'Win 5 matches in a row', 'skill', 'rare', '{"type": "win_streak", "count": 5}', 100, 21),
('streak_10', 'Unstoppable', 'Win 10 matches in a row', 'skill', 'epic', '{"type": "win_streak", "count": 10}', 250, 22),
-- Social badges
('first_friend', 'Friendly', 'Follow your first player', 'social', 'common', '{"type": "follows_given", "count": 1}', 10, 30),
('friends_10', 'Networker', 'Follow 10 players', 'social', 'common', '{"type": "follows_given", "count": 10}', 25, 31),
('friends_50', 'Popular', 'Follow 50 players', 'social', 'rare', '{"type": "follows_given", "count": 50}', 75, 32),
('followers_10', 'Rising Star', 'Get 10 followers', 'social', 'common', '{"type": "followers", "count": 10}', 50, 33),
('followers_100', 'Influencer', 'Get 100 followers', 'social', 'epic', '{"type": "followers", "count": 100}', 200, 34),
('clan_joined', 'Team Player', 'Join a clan', 'social', 'common', '{"type": "clan_joined", "count": 1}', 50, 35),
-- Challenge badges
('first_challenge', 'Challenger', 'Complete your first challenge', 'milestone', 'common', '{"type": "challenges_completed", "count": 1}', 50, 40),
('challenges_10', 'Serial Challenger', 'Complete 10 challenges', 'milestone', 'rare', '{"type": "challenges_completed", "count": 10}', 150, 41),
('challenges_50', 'Challenge Master', 'Complete 50 challenges', 'milestone', 'epic', '{"type": "challenges_completed", "count": 50}', 400, 42);

-- Quest Definitions
INSERT INTO quest_definitions (slug, name, description, quest_type, requirements, xp_reward, weight) VALUES
-- Daily quests
('daily_play_1', 'Play a Match', 'Participate in any match', 'daily', '{"type": "play_match", "count": 1}', 25, 100),
('daily_play_2', 'Double Feature', 'Participate in 2 matches', 'daily', '{"type": "play_match", "count": 2}', 40, 80),
('daily_play_3', 'Active Player', 'Participate in 3 matches', 'daily', '{"type": "play_match", "count": 3}', 60, 60),
('daily_win_1', 'Daily Victor', 'Win a match', 'daily', '{"type": "win_match", "count": 1}', 35, 90),
('daily_challenge', 'Daily Challenger', 'Complete a challenge', 'daily', '{"type": "challenge_complete", "count": 1}', 50, 50),
('daily_social', 'Social Hour', 'Send 5 messages', 'daily', '{"type": "send_message", "count": 5}', 20, 70),
-- Weekly quests
('weekly_play_10', 'Weekly Warrior', 'Complete 10 matches this week', 'weekly', '{"type": "play_match", "count": 10}', 150, 100),
('weekly_play_20', 'Dedicated Grinder', 'Complete 20 matches this week', 'weekly', '{"type": "play_match", "count": 20}', 250, 60),
('weekly_win_5', 'Weekly Winner', 'Win 5 matches this week', 'weekly', '{"type": "win_match", "count": 5}', 125, 80),
('weekly_win_10', 'Dominator', 'Win 10 matches this week', 'weekly', '{"type": "win_match", "count": 10}', 200, 50),
('weekly_challenge_3', 'Challenge Seeker', 'Complete 3 challenges this week', 'weekly', '{"type": "challenge_complete", "count": 3}', 175, 70),
('weekly_social', 'Community Member', 'Be active in chat (20 messages)', 'weekly', '{"type": "send_message", "count": 20}', 75, 60);
-- GamerHub Leaderboards & Seasons System
-- Migration: 004_leaderboards.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. SEASONS - Track seasonal periods
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  season_number INT NOT NULL,

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),

  -- Configuration
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  point_config JSONB DEFAULT '{
    "match_win_casual": 10,
    "match_win_competitive": 25,
    "match_win_tournament": 50,
    "challenge_base": 20,
    "rating_bonus": 5,
    "daily_first_match": 5,
    "streak_bonus_per_day": 10,
    "max_streak_days": 7
  }',

  -- Display
  banner_url TEXT,
  theme_config JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_season_dates CHECK (ends_at > starts_at)
);

-- 2. SEASON_POINTS - Track user points per season per game
CREATE TABLE public.season_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,

  -- Points breakdown
  total_points INT DEFAULT 0,
  match_points INT DEFAULT 0,
  challenge_points INT DEFAULT 0,
  rating_points INT DEFAULT 0,
  bonus_points INT DEFAULT 0,

  -- Stats
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  current_win_streak INT DEFAULT 0,
  best_win_streak INT DEFAULT 0,
  challenges_completed INT DEFAULT 0,
  ratings_received INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,

  -- Streak tracking
  login_streak_days INT DEFAULT 0,
  last_login_date DATE,
  last_match_date DATE,

  -- Region snapshot
  region VARCHAR(50),

  -- Rank tracking
  current_rank INT,
  peak_rank INT,
  previous_rank INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(season_id, user_id, game_id)
);

-- 3. POINT_TRANSACTIONS - Audit log for all point changes
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_points_id UUID REFERENCES public.season_points(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,

  -- Transaction details
  points INT NOT NULL,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'match_win', 'match_loss', 'challenge_complete', 'rating_bonus',
    'daily_bonus', 'streak_bonus', 'admin_adjustment', 'decay', 'refund'
  )),

  -- Source reference
  source_type VARCHAR(30) CHECK (source_type IN ('match', 'challenge', 'rating', 'system', 'admin')),
  source_id UUID,

  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMUNITY_CHALLENGES - Weekly/monthly challenges
CREATE TABLE public.community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title VARCHAR(100) NOT NULL,
  description TEXT,
  rules TEXT,

  -- Categorization
  challenge_type VARCHAR(30) NOT NULL CHECK (challenge_type IN (
    'match_count', 'win_count', 'win_streak', 'rating_average',
    'game_specific', 'clan_participation', 'social', 'composite'
  )),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),

  -- Scoping
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,

  -- Timing
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'seasonal', 'event')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),

  -- Objectives (flexible JSONB structure)
  objectives JSONB NOT NULL DEFAULT '[]',

  -- Rewards
  points_reward INT DEFAULT 0,
  bonus_rewards JSONB DEFAULT '[]',

  -- Limits
  max_participants INT,

  -- Display
  icon_url TEXT,
  banner_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_challenge_dates CHECK (ends_at > starts_at)
);

-- 5. CHALLENGE_PROGRESS - Track user progress on challenges
CREATE TABLE public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.community_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Progress tracking
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'expired')),

  -- Objective progress
  progress JSONB NOT NULL DEFAULT '[]',

  -- Completion
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  points_awarded INT DEFAULT 0,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(challenge_id, user_id)
);

-- 6. SEASON_REWARDS - Define rewards available per season
CREATE TABLE public.season_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,

  -- Reward info
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Type and value
  reward_type VARCHAR(30) NOT NULL CHECK (reward_type IN (
    'badge', 'title', 'avatar_frame', 'banner', 'currency', 'exclusive_item', 'early_access'
  )),
  reward_value JSONB NOT NULL,

  -- Eligibility
  rank_requirement INT,
  points_requirement INT,
  percentile_requirement DECIMAL(5,2),

  -- Limits
  max_recipients INT,
  current_recipients INT DEFAULT 0,

  -- Settings
  auto_grant BOOLEAN DEFAULT true,
  claim_deadline TIMESTAMPTZ,

  -- Display
  icon_url TEXT,
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER_REWARDS - Track rewards earned by users
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  season_reward_id UUID REFERENCES public.season_rewards(id) ON DELETE SET NULL,

  -- Reward snapshot
  reward_name VARCHAR(100) NOT NULL,
  reward_type VARCHAR(30) NOT NULL,
  reward_value JSONB NOT NULL,

  -- Context
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  earned_rank INT,
  earned_points INT,

  -- Claim status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'revoked')),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Equipped state
  is_equipped BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, season_reward_id)
);

-- 8. LEADERBOARD_SNAPSHOTS - Historical leaderboard data
CREATE TABLE public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  region VARCHAR(50),

  -- Snapshot timing
  snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('hourly', 'daily', 'weekly', 'final')),
  snapshot_date TIMESTAMPTZ NOT NULL,

  -- Rankings data
  rankings JSONB NOT NULL,

  -- Aggregate stats
  total_participants INT DEFAULT 0,
  average_points DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIEWS
-- ============================================

-- Real-time global leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_global AS
SELECT
  sp.id,
  sp.season_id,
  sp.user_id,
  sp.game_id,
  sp.total_points,
  sp.matches_played,
  sp.matches_won,
  sp.challenges_completed,
  sp.average_rating,
  sp.current_rank,
  sp.peak_rank,
  sp.region,
  p.username,
  p.display_name,
  p.avatar_url,
  g.name as game_name,
  g.slug as game_slug,
  s.name as season_name,
  s.status as season_status,
  RANK() OVER (
    PARTITION BY sp.season_id, sp.game_id
    ORDER BY sp.total_points DESC, sp.matches_won DESC, sp.average_rating DESC
  ) as computed_rank
FROM season_points sp
JOIN profiles p ON sp.user_id = p.id
JOIN seasons s ON sp.season_id = s.id
LEFT JOIN games g ON sp.game_id = g.id
WHERE s.status IN ('active', 'completed');

-- Regional leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_regional AS
SELECT
  sp.*,
  p.username,
  p.display_name,
  p.avatar_url,
  g.name as game_name,
  RANK() OVER (
    PARTITION BY sp.season_id, sp.game_id, sp.region
    ORDER BY sp.total_points DESC
  ) as regional_rank
FROM season_points sp
JOIN profiles p ON sp.user_id = p.id
JOIN seasons s ON sp.season_id = s.id
LEFT JOIN games g ON sp.game_id = g.id
WHERE s.status IN ('active', 'completed')
  AND sp.region IS NOT NULL;

-- Active challenges view
CREATE OR REPLACE VIEW public.active_challenges AS
SELECT
  cc.*,
  g.name as game_name,
  g.slug as game_slug,
  s.name as season_name,
  (SELECT COUNT(*) FROM challenge_progress cp WHERE cp.challenge_id = cc.id) as participant_count,
  (SELECT COUNT(*) FROM challenge_progress cp WHERE cp.challenge_id = cc.id AND cp.status = 'completed') as completion_count
FROM community_challenges cc
LEFT JOIN games g ON cc.game_id = g.id
LEFT JOIN seasons s ON cc.season_id = s.id
WHERE cc.status = 'active'
  AND cc.starts_at <= NOW()
  AND cc.ends_at > NOW();

-- ============================================
-- INDEXES
-- ============================================

-- Seasons indexes
CREATE INDEX idx_seasons_status ON seasons(status);
CREATE INDEX idx_seasons_game ON seasons(game_id);
CREATE INDEX idx_seasons_dates ON seasons(starts_at, ends_at);
CREATE INDEX idx_seasons_slug ON seasons(slug);
CREATE INDEX idx_seasons_active ON seasons(status) WHERE status = 'active';

-- Season points indexes (critical for leaderboard performance)
CREATE INDEX idx_season_points_season ON season_points(season_id);
CREATE INDEX idx_season_points_user ON season_points(user_id);
CREATE INDEX idx_season_points_game ON season_points(game_id);
CREATE INDEX idx_season_points_region ON season_points(region);
CREATE INDEX idx_season_points_ranking ON season_points(season_id, game_id, total_points DESC);
CREATE INDEX idx_season_points_regional_ranking ON season_points(season_id, game_id, region, total_points DESC);

-- Point transactions indexes
CREATE INDEX idx_point_transactions_season_points ON point_transactions(season_points_id);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_season ON point_transactions(season_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);

-- Community challenges indexes
CREATE INDEX idx_community_challenges_season ON community_challenges(season_id);
CREATE INDEX idx_community_challenges_game ON community_challenges(game_id);
CREATE INDEX idx_community_challenges_status ON community_challenges(status);
CREATE INDEX idx_community_challenges_dates ON community_challenges(starts_at, ends_at);
CREATE INDEX idx_community_challenges_period ON community_challenges(period_type);
CREATE INDEX idx_community_challenges_active ON community_challenges(status) WHERE status = 'active';

-- Challenge progress indexes
CREATE INDEX idx_challenge_progress_challenge ON challenge_progress(challenge_id);
CREATE INDEX idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX idx_challenge_progress_status ON challenge_progress(status);
CREATE INDEX idx_challenge_progress_user_active ON challenge_progress(user_id, status) WHERE status = 'in_progress';

-- Season rewards indexes
CREATE INDEX idx_season_rewards_season ON season_rewards(season_id);
CREATE INDEX idx_season_rewards_type ON season_rewards(reward_type);

-- User rewards indexes
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_season ON user_rewards(season_id);
CREATE INDEX idx_user_rewards_status ON user_rewards(status);
CREATE INDEX idx_user_rewards_equipped ON user_rewards(user_id, is_equipped) WHERE is_equipped = true;

-- Leaderboard snapshots indexes
CREATE INDEX idx_leaderboard_snapshots_season ON leaderboard_snapshots(season_id);
CREATE INDEX idx_leaderboard_snapshots_date ON leaderboard_snapshots(snapshot_date DESC);
CREATE INDEX idx_leaderboard_snapshots_type ON leaderboard_snapshots(snapshot_type);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- SEASONS POLICIES
CREATE POLICY "Seasons are viewable by everyone"
  ON seasons FOR SELECT
  USING (true);

-- SEASON_POINTS POLICIES
CREATE POLICY "Season points are viewable by everyone"
  ON season_points FOR SELECT
  USING (true);

CREATE POLICY "System can insert season points"
  ON season_points FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update season points"
  ON season_points FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- POINT_TRANSACTIONS POLICIES
CREATE POLICY "Users can view their own transactions"
  ON point_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- COMMUNITY_CHALLENGES POLICIES
CREATE POLICY "Challenges are viewable by everyone"
  ON community_challenges FOR SELECT
  USING (true);

-- CHALLENGE_PROGRESS POLICIES
CREATE POLICY "Users can view their own progress"
  ON challenge_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Completed progress is public for leaderboards"
  ON challenge_progress FOR SELECT
  USING (status = 'completed');

CREATE POLICY "Users can start challenges"
  ON challenge_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON challenge_progress FOR UPDATE
  USING (user_id = auth.uid());

-- SEASON_REWARDS POLICIES
CREATE POLICY "Season rewards are viewable by everyone"
  ON season_rewards FOR SELECT
  USING (true);

-- USER_REWARDS POLICIES
CREATE POLICY "Users can view their own rewards"
  ON user_rewards FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Equipped rewards are publicly visible"
  ON user_rewards FOR SELECT
  USING (is_equipped = true);

CREATE POLICY "Users can update their rewards"
  ON user_rewards FOR UPDATE
  USING (user_id = auth.uid());

-- LEADERBOARD_SNAPSHOTS POLICIES
CREATE POLICY "Leaderboard snapshots are viewable by everyone"
  ON leaderboard_snapshots FOR SELECT
  USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_season_points_updated_at
  BEFORE UPDATE ON season_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_challenges_updated_at
  BEFORE UPDATE ON community_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at
  BEFORE UPDATE ON challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize season points for a user
CREATE OR REPLACE FUNCTION initialize_season_points(
  p_user_id UUID,
  p_season_id UUID,
  p_game_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_season_points_id UUID;
  v_user_region VARCHAR(50);
BEGIN
  -- Get user's region
  SELECT region INTO v_user_region FROM profiles WHERE id = p_user_id;

  -- Create season_points entry if not exists
  INSERT INTO season_points (season_id, user_id, game_id, region)
  VALUES (p_season_id, p_user_id, p_game_id, v_user_region)
  ON CONFLICT (season_id, user_id, game_id) DO NOTHING
  RETURNING id INTO v_season_points_id;

  -- If already exists, get the ID
  IF v_season_points_id IS NULL THEN
    SELECT id INTO v_season_points_id
    FROM season_points
    WHERE season_id = p_season_id AND user_id = p_user_id AND game_id IS NOT DISTINCT FROM p_game_id;
  END IF;

  RETURN v_season_points_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_season_id UUID,
  p_game_id UUID,
  p_points INT,
  p_transaction_type VARCHAR(30),
  p_source_type VARCHAR(30),
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_season_points_id UUID;
  v_point_category VARCHAR(20);
BEGIN
  -- Initialize season points if needed
  v_season_points_id := initialize_season_points(p_user_id, p_season_id, p_game_id);

  -- Determine point category
  v_point_category := CASE
    WHEN p_transaction_type IN ('match_win', 'match_loss') THEN 'match'
    WHEN p_transaction_type = 'challenge_complete' THEN 'challenge'
    WHEN p_transaction_type = 'rating_bonus' THEN 'rating'
    ELSE 'bonus'
  END;

  -- Insert transaction
  INSERT INTO point_transactions (
    season_points_id, user_id, season_id, points,
    transaction_type, source_type, source_id, description
  ) VALUES (
    v_season_points_id, p_user_id, p_season_id, p_points,
    p_transaction_type, p_source_type, p_source_id, p_description
  );

  -- Update season_points totals
  UPDATE season_points
  SET
    total_points = total_points + p_points,
    match_points = match_points + CASE WHEN v_point_category = 'match' THEN p_points ELSE 0 END,
    challenge_points = challenge_points + CASE WHEN v_point_category = 'challenge' THEN p_points ELSE 0 END,
    rating_points = rating_points + CASE WHEN v_point_category = 'rating' THEN p_points ELSE 0 END,
    bonus_points = bonus_points + CASE WHEN v_point_category = 'bonus' THEN p_points ELSE 0 END,
    matches_won = matches_won + CASE WHEN p_transaction_type = 'match_win' THEN 1 ELSE 0 END,
    matches_played = matches_played + CASE WHEN p_transaction_type IN ('match_win', 'match_loss') THEN 1 ELSE 0 END,
    challenges_completed = challenges_completed + CASE WHEN p_transaction_type = 'challenge_complete' THEN 1 ELSE 0 END
  WHERE id = v_season_points_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress(
  p_user_id UUID,
  p_challenge_id UUID,
  p_objective_index INT,
  p_increment INT DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_progress RECORD;
  v_challenge RECORD;
  v_current_progress JSONB;
  v_objective JSONB;
  v_new_current INT;
  v_target INT;
  v_all_complete BOOLEAN;
  i INT;
BEGIN
  -- Get challenge and progress
  SELECT * INTO v_challenge FROM community_challenges WHERE id = p_challenge_id;
  SELECT * INTO v_progress FROM challenge_progress WHERE challenge_id = p_challenge_id AND user_id = p_user_id;

  IF v_challenge IS NULL OR v_challenge.status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- Initialize progress if not exists
  IF v_progress IS NULL THEN
    v_current_progress := '[]'::JSONB;
    FOR i IN 0..jsonb_array_length(v_challenge.objectives) - 1 LOOP
      v_objective := v_challenge.objectives->i;
      v_current_progress := v_current_progress || jsonb_build_object(
        'objective_index', i,
        'current', 0,
        'target', (v_objective->>'target')::INT,
        'completed', false
      );
    END LOOP;

    INSERT INTO challenge_progress (challenge_id, user_id, progress)
    VALUES (p_challenge_id, p_user_id, v_current_progress);

    SELECT * INTO v_progress FROM challenge_progress WHERE challenge_id = p_challenge_id AND user_id = p_user_id;
  END IF;

  -- Update specific objective progress
  v_current_progress := v_progress.progress;
  v_objective := v_current_progress->p_objective_index;
  v_new_current := LEAST((v_objective->>'current')::INT + p_increment, (v_objective->>'target')::INT);
  v_target := (v_objective->>'target')::INT;

  v_current_progress := jsonb_set(
    v_current_progress,
    ARRAY[p_objective_index::TEXT],
    jsonb_build_object(
      'objective_index', p_objective_index,
      'current', v_new_current,
      'target', v_target,
      'completed', v_new_current >= v_target
    )
  );

  -- Check if all objectives complete
  v_all_complete := TRUE;
  FOR i IN 0..jsonb_array_length(v_current_progress) - 1 LOOP
    IF NOT (v_current_progress->i->>'completed')::BOOLEAN THEN
      v_all_complete := FALSE;
      EXIT;
    END IF;
  END LOOP;

  -- Update progress
  UPDATE challenge_progress
  SET
    progress = v_current_progress,
    status = CASE WHEN v_all_complete THEN 'completed' ELSE status END,
    completed_at = CASE WHEN v_all_complete THEN NOW() ELSE completed_at END,
    points_awarded = CASE WHEN v_all_complete THEN v_challenge.points_reward ELSE 0 END
  WHERE id = v_progress.id;

  -- Award points if completed
  IF v_all_complete AND v_challenge.points_reward > 0 THEN
    PERFORM award_points(
      p_user_id,
      v_challenge.season_id,
      v_challenge.game_id,
      v_challenge.points_reward,
      'challenge_complete',
      'challenge',
      p_challenge_id,
      'Completed challenge: ' || v_challenge.title
    );
  END IF;

  RETURN v_all_complete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh leaderboard rankings
CREATE OR REPLACE FUNCTION refresh_leaderboard_rankings(p_season_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT
      id,
      RANK() OVER (
        PARTITION BY game_id
        ORDER BY total_points DESC, matches_won DESC, average_rating DESC
      ) as new_rank
    FROM season_points
    WHERE season_id = p_season_id
  )
  UPDATE season_points sp
  SET
    previous_rank = current_rank,
    current_rank = r.new_rank,
    peak_rank = LEAST(COALESCE(peak_rank, r.new_rank), r.new_rank)
  FROM ranked r
  WHERE sp.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant season rewards
CREATE OR REPLACE FUNCTION grant_season_rewards(p_season_id UUID)
RETURNS INT AS $$
DECLARE
  v_reward RECORD;
  v_user RECORD;
  v_granted_count INT := 0;
  v_total_participants INT;
BEGIN
  -- Get total participants
  SELECT COUNT(*) INTO v_total_participants FROM season_points WHERE season_id = p_season_id;

  -- Process each reward definition
  FOR v_reward IN
    SELECT * FROM season_rewards
    WHERE season_id = p_season_id AND auto_grant = true
  LOOP
    -- Find eligible users
    FOR v_user IN
      SELECT sp.user_id, sp.current_rank, sp.total_points
      FROM season_points sp
      WHERE sp.season_id = p_season_id
        AND (v_reward.rank_requirement IS NULL OR sp.current_rank <= v_reward.rank_requirement)
        AND (v_reward.points_requirement IS NULL OR sp.total_points >= v_reward.points_requirement)
        AND (v_reward.percentile_requirement IS NULL OR
             (sp.current_rank::DECIMAL / NULLIF(v_total_participants, 0) * 100) <= v_reward.percentile_requirement)
        AND (v_reward.max_recipients IS NULL OR v_reward.current_recipients < v_reward.max_recipients)
        AND NOT EXISTS (
          SELECT 1 FROM user_rewards ur
          WHERE ur.user_id = sp.user_id AND ur.season_reward_id = v_reward.id
        )
      ORDER BY sp.current_rank
      LIMIT COALESCE(v_reward.max_recipients - v_reward.current_recipients, 1000000)
    LOOP
      -- Grant reward
      INSERT INTO user_rewards (
        user_id, season_reward_id, reward_name, reward_type, reward_value,
        season_id, earned_rank, earned_points, status
      ) VALUES (
        v_user.user_id, v_reward.id, v_reward.name, v_reward.reward_type, v_reward.reward_value,
        p_season_id, v_user.current_rank, v_user.total_points,
        CASE WHEN v_reward.auto_grant THEN 'claimed' ELSE 'pending' END
      );

      v_granted_count := v_granted_count + 1;

      UPDATE season_rewards
      SET current_recipients = current_recipients + 1
      WHERE id = v_reward.id;
    END LOOP;
  END LOOP;

  RETURN v_granted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE season_points;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE user_rewards;

-- ============================================
-- SEED DATA
-- ============================================

-- Create first season
INSERT INTO seasons (name, slug, description, season_number, starts_at, ends_at, status) VALUES
('Season 1: Origins', 'season-1-origins', 'The inaugural GamerHub competitive season. Prove your worth and climb the ranks!', 1,
 NOW(), NOW() + INTERVAL '3 months', 'active');

-- Create sample weekly challenge
INSERT INTO community_challenges (
  title, description, challenge_type, difficulty, season_id,
  period_type, starts_at, ends_at, status, objectives, points_reward
)
SELECT
  'Weekly Warrior',
  'Win 10 matches this week in any game mode',
  'win_count',
  'medium',
  s.id,
  'weekly',
  NOW(),
  NOW() + INTERVAL '7 days',
  'active',
  '[{"type": "win_count", "target": 10}]'::JSONB,
  100
FROM seasons s WHERE s.slug = 'season-1-origins';

-- Create sample monthly challenge
INSERT INTO community_challenges (
  title, description, challenge_type, difficulty, season_id,
  period_type, starts_at, ends_at, status, objectives, points_reward
)
SELECT
  'Community Champion',
  'Rate 5 players after matches and maintain a 4.0+ average rating',
  'composite',
  'hard',
  s.id,
  'monthly',
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  '[{"type": "social", "action": "rate_players", "target": 5}, {"type": "rating_average", "target": 4.0, "min_ratings": 3}]'::JSONB,
  150
FROM seasons s WHERE s.slug = 'season-1-origins';

-- Create legendary challenge
INSERT INTO community_challenges (
  title, description, challenge_type, difficulty, season_id,
  period_type, starts_at, ends_at, status, objectives, points_reward
)
SELECT
  'Winning Streak',
  'Achieve a 5-game winning streak in competitive matches',
  'win_streak',
  'legendary',
  s.id,
  'seasonal',
  NOW(),
  NOW() + INTERVAL '3 months',
  'active',
  '[{"type": "win_streak", "target": 5, "match_type": "competitive"}]'::JSONB,
  500
FROM seasons s WHERE s.slug = 'season-1-origins';

-- Create season rewards
INSERT INTO season_rewards (season_id, name, description, reward_type, reward_value, rank_requirement, rarity, icon_url)
SELECT
  s.id,
  'Season 1 Champion',
  'Awarded to the #1 ranked player of Season 1',
  'title',
  '{"title_text": "Season 1 Champion", "color": "#FFD700"}'::JSONB,
  1,
  'legendary',
  '/images/rewards/champion-crown.png'
FROM seasons s WHERE s.slug = 'season-1-origins';

INSERT INTO season_rewards (season_id, name, description, reward_type, reward_value, percentile_requirement, rarity, icon_url)
SELECT
  s.id,
  'Top 10% Badge',
  'Finished in the top 10% of Season 1',
  'badge',
  '{"badge_url": "/images/badges/season1-top10.png", "badge_id": "s1-top10"}'::JSONB,
  10.00,
  'epic',
  '/images/rewards/top10-badge.png'
FROM seasons s WHERE s.slug = 'season-1-origins';

INSERT INTO season_rewards (season_id, name, description, reward_type, reward_value, points_requirement, rarity, icon_url)
SELECT
  s.id,
  'Season 1 Participant',
  'Participated in Season 1 with at least 100 points',
  'badge',
  '{"badge_url": "/images/badges/season1-participant.png", "badge_id": "s1-participant"}'::JSONB,
  100,
  'common',
  '/images/rewards/participant-badge.png'
FROM seasons s WHERE s.slug = 'season-1-origins';
-- GamerHub Tournament System Schema
-- Migration: 004_tournaments.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Tournaments (core tournament table)
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  banner_url TEXT,

  -- Organization
  organizer_clan_id UUID REFERENCES public.clans(id) ON DELETE SET NULL,
  organizer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,

  -- Format
  format VARCHAR(30) NOT NULL DEFAULT 'single_elimination' CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin')),
  team_size INT DEFAULT 5,
  max_teams INT DEFAULT 16 CHECK (max_teams IN (4, 8, 16, 32, 64, 128)),
  min_teams INT DEFAULT 4,

  -- Scheduling
  registration_start TIMESTAMPTZ NOT NULL,
  registration_end TIMESTAMPTZ NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'registration', 'seeding', 'in_progress', 'completed', 'cancelled'
  )),

  -- Prize Pool (virtual currency/points)
  prize_pool JSONB DEFAULT '{
    "total": 0,
    "currency": "points",
    "distribution": [
      {"place": 1, "amount": 0, "percentage": 50},
      {"place": 2, "amount": 0, "percentage": 30},
      {"place": 3, "amount": 0, "percentage": 20}
    ]
  }',

  -- Rules & Settings
  rules TEXT,
  settings JSONB DEFAULT '{
    "check_in_required": true,
    "check_in_window_minutes": 30,
    "allow_substitutes": true,
    "max_substitutes": 2,
    "seeding_method": "random",
    "third_place_match": true,
    "matches_best_of": 1
  }',

  -- Bracket Data (generated structure)
  bracket_data JSONB DEFAULT '{}',

  -- Communication
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tournament Participants (clan registrations)
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,

  -- Registration
  registered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  seed INT,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN (
    'pending', 'registered', 'checked_in', 'eliminated', 'winner', 'withdrawn', 'disqualified'
  )),

  -- Check-in
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Results
  final_placement INT,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,

  -- Roster (array of {user_id, role, is_substitute})
  roster JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, clan_id)
);

-- 3. Tournament Matches (bracket matches)
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,

  -- Bracket Position
  round INT NOT NULL,
  match_number INT NOT NULL,
  bracket_type VARCHAR(20) DEFAULT 'winners' CHECK (bracket_type IN ('winners', 'losers', 'finals', 'grand_finals')),

  -- Teams
  team1_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,

  -- Advancement (for bracket generation)
  winner_advances_to UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  loser_advances_to UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  team1_from_match UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  team2_from_match UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  team1_is_winner BOOLEAN,
  team2_is_winner BOOLEAN,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'scheduled', 'ready', 'in_progress', 'completed', 'bye', 'forfeit'
  )),

  -- Results
  winner_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
  team1_score INT,
  team2_score INT,
  result JSONB DEFAULT '{}',

  -- Match Best-of setting (can override tournament default)
  best_of INT DEFAULT 1 CHECK (best_of IN (1, 3, 5, 7)),

  -- Disputes
  disputed BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, bracket_type, round, match_number)
);

-- 4. Tournament Match Games (for best-of-X series)
CREATE TABLE public.tournament_match_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.tournament_matches(id) ON DELETE CASCADE NOT NULL,
  game_number INT NOT NULL,

  winner_id UUID REFERENCES public.tournament_participants(id) ON DELETE SET NULL,
  team1_score INT,
  team2_score INT,

  -- Game-specific data
  map VARCHAR(100),
  duration_seconds INT,
  stats JSONB DEFAULT '{}',
  screenshot_url TEXT,

  played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, game_number)
);

-- 5. Tournament Activity Log
CREATE TABLE public.tournament_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES public.tournament_matches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN (
    'tournament_created', 'tournament_updated', 'registration_opened', 'registration_closed',
    'team_registered', 'team_withdrawn', 'team_disqualified', 'team_checked_in',
    'bracket_generated', 'match_scheduled', 'match_started', 'match_completed',
    'result_submitted', 'result_disputed', 'dispute_resolved',
    'tournament_started', 'tournament_completed', 'tournament_cancelled'
  )),

  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Tournament indexes
CREATE INDEX idx_tournaments_slug ON tournaments(slug);
CREATE INDEX idx_tournaments_organizer_clan ON tournaments(organizer_clan_id);
CREATE INDEX idx_tournaments_organizer_user ON tournaments(organizer_user_id);
CREATE INDEX idx_tournaments_game ON tournaments(game_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_status_active ON tournaments(status) WHERE status IN ('registration', 'in_progress');
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, registration_end);
CREATE INDEX idx_tournaments_created ON tournaments(created_at DESC);

-- Participant indexes
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_clan ON tournament_participants(clan_id);
CREATE INDEX idx_tournament_participants_status ON tournament_participants(status);
CREATE INDEX idx_tournament_participants_seed ON tournament_participants(tournament_id, seed);

-- Match indexes
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX idx_tournament_matches_bracket ON tournament_matches(tournament_id, bracket_type, round);
CREATE INDEX idx_tournament_matches_teams ON tournament_matches(team1_id, team2_id);
CREATE INDEX idx_tournament_matches_scheduled ON tournament_matches(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_tournament_matches_winner ON tournament_matches(winner_id);

-- Match games indexes
CREATE INDEX idx_tournament_match_games_match ON tournament_match_games(match_id);

-- Activity log indexes
CREATE INDEX idx_tournament_activity_tournament ON tournament_activity_log(tournament_id);
CREATE INDEX idx_tournament_activity_match ON tournament_activity_log(match_id);
CREATE INDEX idx_tournament_activity_created ON tournament_activity_log(created_at DESC);
CREATE INDEX idx_tournament_activity_type ON tournament_activity_log(activity_type);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_match_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_activity_log ENABLE ROW LEVEL SECURITY;

-- TOURNAMENTS POLICIES
CREATE POLICY "Published tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (status != 'draft' OR
    organizer_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = tournaments.organizer_clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    )
  );

CREATE POLICY "Authenticated users can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can update tournaments"
  ON tournaments FOR UPDATE
  USING (
    organizer_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = tournaments.organizer_clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader')
    )
  );

CREATE POLICY "Only organizers can delete draft tournaments"
  ON tournaments FOR DELETE
  USING (
    status = 'draft' AND (
      organizer_user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM clan_members
        WHERE clan_id = tournaments.organizer_clan_id
        AND user_id = auth.uid()
        AND role = 'leader'
      )
    )
  );

-- TOURNAMENT_PARTICIPANTS POLICIES
CREATE POLICY "Participants are viewable by everyone"
  ON tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Clan officers can register their clan"
  ON tournament_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = tournament_participants.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    )
  );

CREATE POLICY "Clan officers or tournament organizers can update participants"
  ON tournament_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = tournament_participants.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    ) OR
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_participants.tournament_id
      AND (t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader')
        )
      )
    )
  );

CREATE POLICY "Clan officers can withdraw their clan"
  ON tournament_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = tournament_participants.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    ) OR
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_participants.tournament_id
      AND (t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader')
        )
      )
    )
  );

-- TOURNAMENT_MATCHES POLICIES
CREATE POLICY "Matches are viewable by everyone"
  ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Tournament organizers can insert matches"
  ON tournament_matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_matches.tournament_id
      AND (t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader', 'officer')
        )
      )
    )
  );

CREATE POLICY "Organizers and participants can update matches"
  ON tournament_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_matches.tournament_id
      AND (t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader', 'officer')
        )
      )
    ) OR
    EXISTS (
      SELECT 1 FROM tournament_participants tp
      JOIN clan_members cm ON cm.clan_id = tp.clan_id
      WHERE tp.id IN (tournament_matches.team1_id, tournament_matches.team2_id)
      AND cm.user_id = auth.uid()
      AND cm.role IN ('leader', 'co_leader', 'officer')
    )
  );

CREATE POLICY "Tournament organizers can delete matches"
  ON tournament_matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_matches.tournament_id
      AND (t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader')
        )
      )
    )
  );

-- TOURNAMENT_MATCH_GAMES POLICIES
CREATE POLICY "Match games are viewable by everyone"
  ON tournament_match_games FOR SELECT
  USING (true);

CREATE POLICY "Participants and organizers can submit game results"
  ON tournament_match_games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournament_matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = tournament_match_games.match_id
      AND (
        t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader', 'officer')
        ) OR
        EXISTS (
          SELECT 1 FROM tournament_participants tp
          JOIN clan_members cm ON cm.clan_id = tp.clan_id
          WHERE tp.id IN (m.team1_id, m.team2_id)
          AND cm.user_id = auth.uid()
          AND cm.role IN ('leader', 'co_leader', 'officer')
        )
      )
    )
  );

CREATE POLICY "Organizers can update game results"
  ON tournament_match_games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tournament_matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = tournament_match_games.match_id
      AND (t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader')
        )
      )
    )
  );

CREATE POLICY "Organizers can delete game results"
  ON tournament_match_games FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tournament_matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = tournament_match_games.match_id
      AND (t.organizer_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM clan_members
          WHERE clan_id = t.organizer_clan_id
          AND user_id = auth.uid()
          AND role IN ('leader', 'co_leader')
        )
      )
    )
  );

-- TOURNAMENT_ACTIVITY_LOG POLICIES
CREATE POLICY "Activity logs are viewable by everyone"
  ON tournament_activity_log FOR SELECT
  USING (true);

CREATE POLICY "System can insert activity logs"
  ON tournament_activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_participants_updated_at
  BEFORE UPDATE ON tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-advance winner to next match
CREATE OR REPLACE FUNCTION advance_tournament_winner()
RETURNS TRIGGER AS $$
DECLARE
  next_match RECORD;
  loser_id UUID;
BEGIN
  -- Only process when match becomes completed with a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
    -- Update winner's record
    UPDATE tournament_participants
    SET total_wins = total_wins + 1
    WHERE id = NEW.winner_id;

    -- Determine loser
    loser_id := CASE WHEN NEW.team1_id = NEW.winner_id THEN NEW.team2_id ELSE NEW.team1_id END;

    -- Update loser's record
    IF loser_id IS NOT NULL THEN
      UPDATE tournament_participants
      SET total_losses = total_losses + 1,
          status = CASE
            WHEN NEW.bracket_type = 'losers' OR
                 (SELECT format FROM tournaments WHERE id = NEW.tournament_id) = 'single_elimination'
            THEN 'eliminated'
            ELSE status
          END
      WHERE id = loser_id;
    END IF;

    -- Advance winner to next match
    IF NEW.winner_advances_to IS NOT NULL THEN
      SELECT * INTO next_match FROM tournament_matches WHERE id = NEW.winner_advances_to;

      IF next_match.team1_from_match = NEW.id THEN
        UPDATE tournament_matches SET team1_id = NEW.winner_id WHERE id = NEW.winner_advances_to;
      ELSIF next_match.team2_from_match = NEW.id THEN
        UPDATE tournament_matches SET team2_id = NEW.winner_id WHERE id = NEW.winner_advances_to;
      END IF;
    END IF;

    -- Advance loser to losers bracket (double elimination only)
    IF NEW.loser_advances_to IS NOT NULL AND loser_id IS NOT NULL THEN
      SELECT * INTO next_match FROM tournament_matches WHERE id = NEW.loser_advances_to;

      IF next_match.team1_from_match = NEW.id THEN
        UPDATE tournament_matches SET team1_id = loser_id WHERE id = NEW.loser_advances_to;
      ELSIF next_match.team2_from_match = NEW.id THEN
        UPDATE tournament_matches SET team2_id = loser_id WHERE id = NEW.loser_advances_to;
      END IF;
    END IF;

    -- Check if tournament is complete (finals match completed)
    IF NEW.bracket_type IN ('finals', 'grand_finals') THEN
      -- Mark winner as tournament winner
      UPDATE tournament_participants
      SET status = 'winner', final_placement = 1
      WHERE id = NEW.winner_id;

      -- Mark loser as runner-up
      IF loser_id IS NOT NULL THEN
        UPDATE tournament_participants
        SET final_placement = 2
        WHERE id = loser_id;
      END IF;

      -- Update tournament status
      UPDATE tournaments
      SET status = 'completed', end_date = NOW()
      WHERE id = NEW.tournament_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tournament_match_completed
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION advance_tournament_winner();

-- Function to log tournament activity
CREATE OR REPLACE FUNCTION log_tournament_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log team registration
  IF TG_TABLE_NAME = 'tournament_participants' AND TG_OP = 'INSERT' THEN
    INSERT INTO tournament_activity_log (tournament_id, user_id, activity_type, description, metadata)
    VALUES (
      NEW.tournament_id,
      NEW.registered_by,
      'team_registered',
      'Team registered for tournament',
      jsonb_build_object('participant_id', NEW.id, 'clan_id', NEW.clan_id)
    );
  END IF;

  -- Log match completion
  IF TG_TABLE_NAME = 'tournament_matches' AND TG_OP = 'UPDATE' THEN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      INSERT INTO tournament_activity_log (tournament_id, match_id, activity_type, description, metadata)
      VALUES (
        NEW.tournament_id,
        NEW.id,
        'match_completed',
        'Match completed',
        jsonb_build_object(
          'winner_id', NEW.winner_id,
          'team1_score', NEW.team1_score,
          'team2_score', NEW.team2_score,
          'round', NEW.round
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tournament_participant_created
  AFTER INSERT ON tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION log_tournament_activity();

CREATE TRIGGER on_tournament_match_updated
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION log_tournament_activity();

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_match_games;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_activity_log;
-- Create storage bucket for media uploads (avatars, banners, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN ('avatars', 'banners') AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update their own media
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own media
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access to all media (avatars and banners should be public)
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
-- GamerHub Friends System Schema
-- Migration: 006_friends.sql
--
-- Friend system logic:
-- - When you send a friend request, you automatically follow the person
-- - If they accept (follow back), you become friends
-- - Friends = mutual follows (both follow each other)
-- - Following/Followers lists exclude mutual follows (those are friends)

-- ============================================
-- TABLES
-- ============================================

-- 1. Friend Requests (pending friend requests)
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, recipient_id),
  CHECK (sender_id != recipient_id)
);

-- 2. Blocked Users (for blocking functionality)
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_recipient ON friend_requests(recipient_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friend_requests_pending ON friend_requests(recipient_id, status) WHERE status = 'pending';

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

-- ============================================
-- VIEWS
-- ============================================

-- View to get friends (mutual follows)
CREATE OR REPLACE VIEW public.friends_view AS
SELECT
  f1.follower_id AS user_id,
  f1.following_id AS friend_id,
  GREATEST(f1.created_at, f2.created_at) AS friends_since
FROM public.follows f1
INNER JOIN public.follows f2
  ON f1.follower_id = f2.following_id
  AND f1.following_id = f2.follower_id
WHERE f1.follower_id < f1.following_id; -- Avoid duplicates

-- View to get following (one-way, excludes friends)
CREATE OR REPLACE VIEW public.following_only_view AS
SELECT
  f.follower_id AS user_id,
  f.following_id,
  f.created_at
FROM public.follows f
WHERE NOT EXISTS (
  SELECT 1 FROM public.follows f2
  WHERE f2.follower_id = f.following_id
  AND f2.following_id = f.follower_id
);

-- View to get followers (one-way, excludes friends)
CREATE OR REPLACE VIEW public.followers_only_view AS
SELECT
  f.following_id AS user_id,
  f.follower_id,
  f.created_at
FROM public.follows f
WHERE NOT EXISTS (
  SELECT 1 FROM public.follows f2
  WHERE f2.follower_id = f.following_id
  AND f2.following_id = f.follower_id
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if two users are friends (mutual follow)
CREATE OR REPLACE FUNCTION public.are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = user1_id AND f1.following_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get relationship status between two users
CREATE OR REPLACE FUNCTION public.get_relationship_status(current_user_id UUID, target_user_id UUID)
RETURNS TABLE (
  is_friend BOOLEAN,
  is_following BOOLEAN,
  is_follower BOOLEAN,
  has_pending_request_sent BOOLEAN,
  has_pending_request_received BOOLEAN,
  is_blocked BOOLEAN,
  is_blocked_by BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Is friend (mutual follow)
    EXISTS (
      SELECT 1 FROM public.follows f1
      INNER JOIN public.follows f2
        ON f1.follower_id = f2.following_id
        AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = current_user_id AND f1.following_id = target_user_id
    ) AS is_friend,
    -- Is following
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = current_user_id AND following_id = target_user_id
    ) AS is_following,
    -- Is follower
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = target_user_id AND following_id = current_user_id
    ) AS is_follower,
    -- Has pending request sent
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = current_user_id AND recipient_id = target_user_id AND status = 'pending'
    ) AS has_pending_request_sent,
    -- Has pending request received
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = target_user_id AND recipient_id = current_user_id AND status = 'pending'
    ) AS has_pending_request_received,
    -- Is blocked
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = current_user_id AND blocked_id = target_user_id
    ) AS is_blocked,
    -- Is blocked by
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = target_user_id AND blocked_id = current_user_id
    ) AS is_blocked_by;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send friend request (also auto-follows)
CREATE OR REPLACE FUNCTION public.send_friend_request(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_already_friends BOOLEAN;
  v_is_blocked BOOLEAN;
BEGIN
  -- Check if blocked
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = p_sender_id AND blocked_id = p_recipient_id)
       OR (blocker_id = p_recipient_id AND blocked_id = p_sender_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'Cannot send friend request to this user';
  END IF;

  -- Check if already friends
  SELECT public.are_friends(p_sender_id, p_recipient_id) INTO v_already_friends;

  IF v_already_friends THEN
    RAISE EXCEPTION 'Already friends with this user';
  END IF;

  -- Auto-follow the recipient
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_sender_id, p_recipient_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  -- Create or update friend request
  INSERT INTO public.friend_requests (sender_id, recipient_id, message, status)
  VALUES (p_sender_id, p_recipient_id, p_message, 'pending')
  ON CONFLICT (sender_id, recipient_id)
  DO UPDATE SET
    status = 'pending',
    message = EXCLUDED.message,
    created_at = NOW(),
    responded_at = NULL
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept friend request (creates mutual follow)
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
BEGIN
  -- Get sender and verify recipient
  SELECT sender_id INTO v_sender_id
  FROM public.friend_requests
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  -- Update request status
  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;

  -- Create follow back (making them friends)
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_recipient_id, v_sender_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decline friend request
CREATE OR REPLACE FUNCTION public.decline_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.friend_requests
  SET status = 'declined', responded_at = NOW()
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel friend request
CREATE OR REPLACE FUNCTION public.cancel_friend_request(
  p_request_id UUID,
  p_sender_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.friend_requests
  SET status = 'cancelled', responded_at = NOW()
  WHERE id = p_request_id
    AND sender_id = p_sender_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove friend (removes mutual follow)
CREATE OR REPLACE FUNCTION public.remove_friend(
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove both follow relationships
  DELETE FROM public.follows
  WHERE (follower_id = p_user_id AND following_id = p_friend_id)
     OR (follower_id = p_friend_id AND following_id = p_user_id);

  -- Clean up any friend requests between them
  DELETE FROM public.friend_requests
  WHERE (sender_id = p_user_id AND recipient_id = p_friend_id)
     OR (sender_id = p_friend_id AND recipient_id = p_user_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friends list with profiles
CREATE OR REPLACE FUNCTION public.get_friends(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  friends_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f1.follower_id = p_user_id THEN f1.following_id
      ELSE f1.follower_id
    END AS friend_id,
    GREATEST(f1.created_at, f2.created_at) AS friends_since
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.follower_id = f2.following_id
    AND f1.following_id = f2.follower_id
  WHERE f1.follower_id = p_user_id OR f1.following_id = p_user_id
  GROUP BY f1.follower_id, f1.following_id, f1.created_at, f2.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friend count
CREATE OR REPLACE FUNCTION public.get_friend_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get followers count (excluding friends)
CREATE OR REPLACE FUNCTION public.get_followers_only_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f
    WHERE f.following_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = p_user_id
      AND f2.following_id = f.follower_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count (excluding friends)
CREATE OR REPLACE FUNCTION public.get_following_only_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f
    WHERE f.follower_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = f.following_id
      AND f2.following_id = p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
CREATE POLICY "Anyone can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own sent requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id);

-- Blocked Users Policies
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_requests TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;

GRANT EXECUTE ON FUNCTION public.are_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relationship_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_friend TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_followers_only_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_only_count TO authenticated;
-- GamerHub Social Suggestions Schema
-- Migration: 007_social_suggestions.sql
--
-- Features:
-- - Mutual friends suggestions (friends of friends)
-- - Similar rank player suggestions
-- - Pro players in user's games
-- - Public social lists (followers, following, friends)

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_games_game_rank ON public.user_games(game_id, rank) WHERE rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_pro ON public.profiles(gaming_style) WHERE gaming_style = 'pro';
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get mutual friends (friends of friends)
-- Returns users who are friends with current user's friends but not the current user
CREATE OR REPLACE FUNCTION public.get_mutual_friends(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  mutual_friend_count INT,
  mutual_friend_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH user_friends AS (
    -- Get current user's friends (mutual follows)
    SELECT f1.following_id AS friend_id
    FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = p_user_id
  ),
  friends_of_friends AS (
    -- Get friends of those friends (also mutual follows)
    SELECT
      f1.following_id AS potential_friend_id,
      uf.friend_id AS through_friend_id
    FROM user_friends uf
    INNER JOIN public.follows f1 ON f1.follower_id = uf.friend_id
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.following_id != p_user_id
  )
  SELECT
    fof.potential_friend_id AS user_id,
    COUNT(DISTINCT fof.through_friend_id)::INT AS mutual_friend_count,
    ARRAY_AGG(DISTINCT fof.through_friend_id) AS mutual_friend_ids
  FROM friends_of_friends fof
  WHERE
    -- Not already friends with user
    fof.potential_friend_id NOT IN (SELECT friend_id FROM user_friends)
    -- Not blocked
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = p_user_id AND blocked_id = fof.potential_friend_id)
         OR (blocker_id = fof.potential_friend_id AND blocked_id = p_user_id)
    )
  GROUP BY fof.potential_friend_id
  ORDER BY mutual_friend_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get similar rank players
-- Returns users who play the same games with similar ranks (within tolerance)
CREATE OR REPLACE FUNCTION public.get_similar_rank_players(
  p_user_id UUID,
  p_rank_tolerance INT DEFAULT 2,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  common_games_count INT,
  matching_games JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_games_with_ranks AS (
    -- Get user's games with rank info
    SELECT
      ug.game_id,
      ug.rank,
      g.name AS game_name,
      g.ranks AS game_ranks
    FROM public.user_games ug
    JOIN public.games g ON g.id = ug.game_id
    WHERE ug.user_id = p_user_id AND ug.rank IS NOT NULL
  ),
  user_rank_positions AS (
    -- Calculate rank positions for user's games
    SELECT
      ugr.game_id,
      ugr.rank,
      ugr.game_name,
      ugr.game_ranks,
      (
        SELECT idx - 1
        FROM jsonb_array_elements_text(ugr.game_ranks) WITH ORDINALITY AS t(rank_name, idx)
        WHERE t.rank_name = ugr.rank
        LIMIT 1
      ) AS rank_position
    FROM user_games_with_ranks ugr
  ),
  other_users_with_positions AS (
    -- Get other users' games with rank positions
    SELECT
      ug.user_id,
      ug.game_id,
      ug.rank,
      g.name AS game_name,
      (
        SELECT idx - 1
        FROM jsonb_array_elements_text(g.ranks) WITH ORDINALITY AS t(rank_name, idx)
        WHERE t.rank_name = ug.rank
        LIMIT 1
      ) AS rank_position
    FROM public.user_games ug
    JOIN public.games g ON g.id = ug.game_id
    WHERE ug.user_id != p_user_id AND ug.rank IS NOT NULL
  )
  SELECT
    oup.user_id,
    COUNT(DISTINCT oup.game_id)::INT AS common_games_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', oup.game_id,
        'game_name', oup.game_name,
        'user_rank', urp.rank,
        'their_rank', oup.rank
      )
    ) AS matching_games
  FROM other_users_with_positions oup
  JOIN user_rank_positions urp ON urp.game_id = oup.game_id
  WHERE
    -- Rank within tolerance
    ABS(COALESCE(oup.rank_position, 0) - COALESCE(urp.rank_position, 0)) <= p_rank_tolerance
    -- Not already friends
    AND NOT public.are_friends(p_user_id, oup.user_id)
    -- Not blocked
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = p_user_id AND blocked_id = oup.user_id)
         OR (blocker_id = oup.user_id AND blocked_id = p_user_id)
    )
  GROUP BY oup.user_id
  ORDER BY common_games_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pro players who play user's games
-- Returns pro/verified players ordered by follower count
CREATE OR REPLACE FUNCTION public.get_pro_players_by_games(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  follower_count INT,
  common_games JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_game_ids AS (
    SELECT game_id FROM public.user_games WHERE user_id = p_user_id
  ),
  pro_player_followers AS (
    SELECT
      p.id AS user_id,
      (SELECT COUNT(*)::INT FROM public.follows WHERE following_id = p.id) AS follower_count
    FROM public.profiles p
    WHERE p.gaming_style = 'pro'
      AND p.id != p_user_id
      -- Not blocked
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE (blocker_id = p_user_id AND blocked_id = p.id)
           OR (blocker_id = p.id AND blocked_id = p_user_id)
      )
  )
  SELECT
    ppf.user_id,
    ppf.follower_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', ug.game_id,
        'game_name', g.name,
        'rank', ug.rank
      )
    ) AS common_games
  FROM pro_player_followers ppf
  JOIN public.user_games ug ON ug.user_id = ppf.user_id
  JOIN public.games g ON g.id = ug.game_id
  WHERE ug.game_id IN (SELECT game_id FROM user_game_ids)
  GROUP BY ppf.user_id, ppf.follower_count
  ORDER BY ppf.follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular pro players (no user context required)
-- Useful for anonymous users or users without games
CREATE OR REPLACE FUNCTION public.get_popular_pro_players(
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  follower_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    (SELECT COUNT(*)::INT FROM public.follows WHERE following_id = p.id) AS follower_count
  FROM public.profiles p
  WHERE p.gaming_style = 'pro'
  ORDER BY follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's friends list (public)
CREATE OR REPLACE FUNCTION public.get_user_friends_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  friend_id UUID,
  friends_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f1.following_id AS friend_id,
    GREATEST(f1.created_at, f2.created_at) AS friends_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f1.following_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f1.following_id
      )
    END AS is_viewer_following
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.follower_id = f2.following_id
    AND f1.following_id = f2.follower_id
  WHERE f1.follower_id = p_user_id
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f1.following_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY friends_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's followers list (public, excludes friends)
CREATE OR REPLACE FUNCTION public.get_user_followers_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  follower_id UUID,
  followed_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.follower_id,
    f.created_at AS followed_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.follower_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.follower_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.following_id = p_user_id
    -- Exclude mutual follows (friends)
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = p_user_id AND f2.following_id = f.follower_id
    )
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.follower_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY followed_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's following list (public, excludes friends)
CREATE OR REPLACE FUNCTION public.get_user_following_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  following_id UUID,
  following_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.following_id,
    f.created_at AS following_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.following_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.following_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.follower_id = p_user_id
    -- Exclude mutual follows (friends)
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = f.following_id AND f2.following_id = p_user_id
    )
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.following_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY following_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total counts for a user's social lists
CREATE OR REPLACE FUNCTION public.get_user_social_counts(p_user_id UUID)
RETURNS TABLE (
  friends_count INT,
  followers_count INT,
  following_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    public.get_friend_count(p_user_id) AS friends_count,
    public.get_followers_only_count(p_user_id) AS followers_count,
    public.get_following_only_count(p_user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_mutual_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_similar_rank_players TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pro_players_by_games TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_pro_players TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_friends_list TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_followers_list TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_following_list TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_social_counts TO authenticated, anon;
-- Migration: 008_payments.sql
-- Payment system for Stripe integration, subscriptions, and virtual currency

-- ============================================
-- STRIPE CUSTOMER MAPPING
-- ============================================
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  price_monthly INT NOT NULL, -- cents
  price_yearly INT NOT NULL, -- cents
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(30) NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_customer_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  amount INT NOT NULL, -- in cents
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('subscription', 'battle_pass', 'currency_pack', 'one_time')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STRIPE WEBHOOK EVENTS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT false,
  payload JSONB NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD PREMIUM FLAGS TO PROFILES
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium) WHERE is_premium = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Stripe Customers RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe customer" ON public.stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage stripe customers" ON public.stripe_customers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription Plans RLS (publicly readable)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User Subscriptions RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payment Transactions RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions" ON public.payment_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Stripe Webhook Events RLS (service role only)
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events" ON public.stripe_webhook_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update user premium status based on subscription
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET is_premium = true, premium_until = NEW.current_period_end
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'unpaid', 'paused') THEN
    UPDATE public.profiles
    SET is_premium = false, premium_until = NULL
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync premium status
DROP TRIGGER IF EXISTS sync_premium_status ON public.user_subscriptions;
CREATE TRIGGER sync_premium_status
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_premium_status();

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT
    CASE
      WHEN is_premium = true AND (premium_until IS NULL OR premium_until > NOW()) THEN true
      ELSE false
    END INTO v_is_premium
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_premium, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA: Default Subscription Plans
-- ============================================
INSERT INTO public.subscription_plans (slug, name, description, price_monthly, price_yearly, features, sort_order)
VALUES
  ('premium', 'GamerHub Premium', 'Unlock exclusive features and stand out from the crowd', 999, 9999,
   '["Exclusive titles, frames, and themes", "Priority matchmaking queue", "100MB media uploads (vs 20MB)", "Advanced stats dashboard", "See who viewed your profile", "Unlimited follows", "Early access to new features", "Premium badge on profile"]'::jsonb,
   1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;
-- Migration: 009_battle_pass.sql
-- Battle Pass system with seasonal passes, rewards, and progression

-- ============================================
-- BATTLE PASS DEFINITIONS (SEASONS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  season_number INT NOT NULL,
  description TEXT,
  banner_url TEXT,

  -- Pricing
  price_standard INT NOT NULL, -- cents
  price_premium INT, -- cents (includes level skips)
  stripe_price_id_standard VARCHAR(255),
  stripe_price_id_premium VARCHAR(255),

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Configuration
  max_level INT DEFAULT 100,
  xp_per_level INT DEFAULT 1000,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BATTLE PASS REWARDS PER LEVEL
-- ============================================
CREATE TABLE IF NOT EXISTS public.battle_pass_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_pass_id UUID REFERENCES public.battle_passes(id) ON DELETE CASCADE NOT NULL,
  level INT NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'premium')),
  reward_type VARCHAR(30) NOT NULL CHECK (reward_type IN ('coins', 'gems', 'title', 'frame', 'theme', 'badge', 'xp_boost', 'cosmetic')),
  reward_value JSONB NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  sort_order INT DEFAULT 0,
  UNIQUE(battle_pass_id, level, tier)
);

-- ============================================
-- USER BATTLE PASS PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  battle_pass_id UUID REFERENCES public.battle_passes(id) ON DELETE CASCADE NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  current_level INT DEFAULT 1,
  current_xp INT DEFAULT 0,
  claimed_rewards JSONB DEFAULT '[]', -- array of reward IDs
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, battle_pass_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_battle_passes_status ON battle_passes(status);
CREATE INDEX IF NOT EXISTS idx_battle_passes_dates ON battle_passes(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_battle_pass_rewards_pass ON battle_pass_rewards(battle_pass_id);
CREATE INDEX IF NOT EXISTS idx_battle_pass_rewards_level ON battle_pass_rewards(level);
CREATE INDEX IF NOT EXISTS idx_battle_pass_rewards_tier ON battle_pass_rewards(tier);
CREATE INDEX IF NOT EXISTS idx_user_battle_passes_user ON user_battle_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_battle_passes_pass ON user_battle_passes(battle_pass_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Battle Passes RLS (publicly readable)
ALTER TABLE public.battle_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view battle passes" ON public.battle_passes
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage battle passes" ON public.battle_passes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Battle Pass Rewards RLS (publicly readable)
ALTER TABLE public.battle_pass_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view battle pass rewards" ON public.battle_pass_rewards
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage rewards" ON public.battle_pass_rewards
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User Battle Passes RLS
ALTER TABLE public.user_battle_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own battle pass progress" ON public.user_battle_passes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own battle pass progress" ON public.user_battle_passes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user battle passes" ON public.user_battle_passes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get active battle pass
CREATE OR REPLACE FUNCTION get_active_battle_pass()
RETURNS UUID AS $$
DECLARE
  v_battle_pass_id UUID;
BEGIN
  SELECT id INTO v_battle_pass_id
  FROM public.battle_passes
  WHERE status = 'active'
    AND NOW() BETWEEN starts_at AND ends_at
  ORDER BY season_number DESC
  LIMIT 1;

  RETURN v_battle_pass_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award battle pass XP
CREATE OR REPLACE FUNCTION award_battle_pass_xp(
  p_user_id UUID,
  p_amount INT
) RETURNS JSONB AS $$
DECLARE
  v_battle_pass_id UUID;
  v_user_bp RECORD;
  v_xp_per_level INT;
  v_max_level INT;
  v_new_xp INT;
  v_new_level INT;
  v_levels_gained INT := 0;
BEGIN
  -- Get active battle pass
  v_battle_pass_id := get_active_battle_pass();
  IF v_battle_pass_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active battle pass');
  END IF;

  -- Get battle pass config
  SELECT xp_per_level, max_level INTO v_xp_per_level, v_max_level
  FROM public.battle_passes WHERE id = v_battle_pass_id;

  -- Get or create user battle pass progress
  INSERT INTO public.user_battle_passes (user_id, battle_pass_id, current_level, current_xp)
  VALUES (p_user_id, v_battle_pass_id, 1, 0)
  ON CONFLICT (user_id, battle_pass_id) DO NOTHING;

  SELECT * INTO v_user_bp
  FROM public.user_battle_passes
  WHERE user_id = p_user_id AND battle_pass_id = v_battle_pass_id;

  -- Calculate new XP and levels
  v_new_xp := v_user_bp.current_xp + p_amount;
  v_new_level := v_user_bp.current_level;

  -- Level up loop
  WHILE v_new_xp >= v_xp_per_level AND v_new_level < v_max_level LOOP
    v_new_xp := v_new_xp - v_xp_per_level;
    v_new_level := v_new_level + 1;
    v_levels_gained := v_levels_gained + 1;
  END LOOP;

  -- Cap XP at level max
  IF v_new_level >= v_max_level THEN
    v_new_level := v_max_level;
    v_new_xp := LEAST(v_new_xp, v_xp_per_level);
  END IF;

  -- Update user progress
  UPDATE public.user_battle_passes
  SET
    current_xp = v_new_xp,
    current_level = v_new_level,
    updated_at = NOW()
  WHERE user_id = p_user_id AND battle_pass_id = v_battle_pass_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_level', v_new_level,
    'new_xp', v_new_xp,
    'levels_gained', v_levels_gained,
    'xp_to_next_level', v_xp_per_level - v_new_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim battle pass reward
CREATE OR REPLACE FUNCTION claim_battle_pass_reward(
  p_user_id UUID,
  p_reward_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_reward RECORD;
  v_user_bp RECORD;
  v_claimed_rewards JSONB;
BEGIN
  -- Get reward details
  SELECT * INTO v_reward
  FROM public.battle_pass_rewards
  WHERE id = p_reward_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found');
  END IF;

  -- Get user's battle pass progress
  SELECT * INTO v_user_bp
  FROM public.user_battle_passes
  WHERE user_id = p_user_id AND battle_pass_id = v_reward.battle_pass_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enrolled in battle pass');
  END IF;

  -- Check if level requirement met
  IF v_user_bp.current_level < v_reward.level THEN
    RETURN jsonb_build_object('success', false, 'error', 'Level requirement not met');
  END IF;

  -- Check if premium required
  IF v_reward.tier = 'premium' AND NOT v_user_bp.is_premium THEN
    RETURN jsonb_build_object('success', false, 'error', 'Premium battle pass required');
  END IF;

  -- Check if already claimed
  IF v_user_bp.claimed_rewards ? p_reward_id::text THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward already claimed');
  END IF;

  -- Add to claimed rewards
  v_claimed_rewards := v_user_bp.claimed_rewards || to_jsonb(p_reward_id::text);

  UPDATE public.user_battle_passes
  SET
    claimed_rewards = v_claimed_rewards,
    updated_at = NOW()
  WHERE user_id = p_user_id AND battle_pass_id = v_reward.battle_pass_id;

  -- TODO: Grant the actual reward (coins, gems, title, etc.) based on reward_type

  RETURN jsonb_build_object(
    'success', true,
    'reward_type', v_reward.reward_type,
    'reward_value', v_reward.reward_value,
    'reward_name', v_reward.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_battle_passes;

-- ============================================
-- SEED DATA: Sample Battle Pass
-- ============================================
INSERT INTO public.battle_passes (
  name, slug, season_number, description,
  price_standard, price_premium,
  starts_at, ends_at, max_level, xp_per_level, status
)
VALUES (
  'Season 1: Rise of Champions',
  'season-1',
  1,
  'Embark on your journey to become a champion with exclusive rewards and cosmetics.',
  999, -- $9.99
  1999, -- $19.99 with level skips
  NOW(),
  NOW() + INTERVAL '90 days',
  100,
  1000,
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- Seed some rewards for the battle pass
DO $$
DECLARE
  v_bp_id UUID;
BEGIN
  SELECT id INTO v_bp_id FROM public.battle_passes WHERE slug = 'season-1';

  IF v_bp_id IS NOT NULL THEN
    -- Level 1 rewards
    INSERT INTO battle_pass_rewards (battle_pass_id, level, tier, reward_type, reward_value, name, rarity)
    VALUES
      (v_bp_id, 1, 'free', 'coins', '{"amount": 100}', '100 Coins', 'common'),
      (v_bp_id, 1, 'premium', 'coins', '{"amount": 200}', '200 Coins', 'common'),

      -- Level 5 rewards
      (v_bp_id, 5, 'free', 'coins', '{"amount": 150}', '150 Coins', 'common'),
      (v_bp_id, 5, 'premium', 'frame', '{"frame_id": "bronze_champion"}', 'Bronze Champion Frame', 'uncommon'),

      -- Level 10 rewards
      (v_bp_id, 10, 'free', 'xp_boost', '{"multiplier": 1.25, "duration_hours": 24}', '25% XP Boost (24h)', 'uncommon'),
      (v_bp_id, 10, 'premium', 'title', '{"title_id": "rising_star"}', 'Rising Star Title', 'rare'),

      -- Level 25 rewards
      (v_bp_id, 25, 'free', 'coins', '{"amount": 500}', '500 Coins', 'uncommon'),
      (v_bp_id, 25, 'premium', 'theme', '{"theme_id": "neon_nights"}', 'Neon Nights Theme', 'rare'),

      -- Level 50 rewards
      (v_bp_id, 50, 'free', 'badge', '{"badge_id": "halfway_hero"}', 'Halfway Hero Badge', 'rare'),
      (v_bp_id, 50, 'premium', 'frame', '{"frame_id": "silver_champion"}', 'Silver Champion Frame', 'epic'),

      -- Level 75 rewards
      (v_bp_id, 75, 'free', 'coins', '{"amount": 1000}', '1000 Coins', 'rare'),
      (v_bp_id, 75, 'premium', 'title', '{"title_id": "veteran_warrior"}', 'Veteran Warrior Title', 'epic'),

      -- Level 100 rewards (final)
      (v_bp_id, 100, 'free', 'badge', '{"badge_id": "season_1_complete"}', 'Season 1 Completionist', 'epic'),
      (v_bp_id, 100, 'premium', 'frame', '{"frame_id": "golden_champion"}', 'Golden Champion Frame', 'legendary'),
      (v_bp_id, 100, 'premium', 'title', '{"title_id": "champion_of_champions"}', 'Champion of Champions', 'legendary')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
-- Migration: 010_virtual_currency.sql
-- Virtual currency system with wallets, shop items, and transactions

-- ============================================
-- USER WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  coins INT DEFAULT 0 CHECK (coins >= 0), -- free currency (earned)
  gems INT DEFAULT 0 CHECK (gems >= 0), -- premium currency (purchased)
  lifetime_coins_earned BIGINT DEFAULT 0,
  lifetime_gems_purchased BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CURRENCY PACKS FOR PURCHASE
-- ============================================
CREATE TABLE IF NOT EXISTS public.currency_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('gems')),
  amount INT NOT NULL,
  bonus_amount INT DEFAULT 0,
  price_cents INT NOT NULL,
  stripe_price_id VARCHAR(255),
  icon_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP ITEMS (COSMETICS PURCHASABLE WITH CURRENCY)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('title', 'frame', 'theme', 'badge', 'emote', 'avatar_decoration', 'clan_banner', 'xp_boost')),
  item_reference_id UUID, -- FK to titles/frames/themes tables
  price_coins INT,
  price_gems INT,
  original_price_coins INT, -- for sales
  original_price_gems INT,
  icon_url TEXT,
  preview_url TEXT,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  is_limited BOOLEAN DEFAULT false,
  available_until TIMESTAMPTZ,
  max_purchases INT, -- null for unlimited
  current_purchases INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  category VARCHAR(50),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP PURCHASES (USER PURCHASE HISTORY)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shop_items(id) ON DELETE SET NULL,
  item_name VARCHAR(100) NOT NULL, -- denormalized for history
  currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('coins', 'gems', 'real_money')),
  amount_paid INT NOT NULL,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WALLET TRANSACTIONS (AUDIT LOG)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('coins', 'gems')),
  amount INT NOT NULL, -- positive for credit, negative for debit
  balance_after INT NOT NULL,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'purchase', 'earn_match', 'earn_quest', 'earn_challenge', 'earn_battle_pass',
    'spend_shop', 'spend_battle_pass', 'refund', 'admin_adjustment', 'gift_received', 'gift_sent', 'daily_bonus'
  )),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_packs_active ON currency_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shop_items_active ON shop_items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shop_items_type ON shop_items(item_type);
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user ON shop_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_item ON shop_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- User Wallets RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallets" ON public.user_wallets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Currency Packs RLS (publicly readable)
ALTER TABLE public.currency_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active currency packs" ON public.currency_packs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage currency packs" ON public.currency_packs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Shop Items RLS (publicly readable)
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shop items" ON public.shop_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage shop items" ON public.shop_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Shop Purchases RLS
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.shop_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases" ON public.shop_purchases
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Wallet Transactions RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions" ON public.wallet_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get or create user wallet
CREATE OR REPLACE FUNCTION get_or_create_wallet(p_user_id UUID)
RETURNS public.user_wallets AS $$
DECLARE
  v_wallet public.user_wallets;
BEGIN
  -- Try to get existing wallet
  SELECT * INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id;

  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO public.user_wallets (user_id, coins, gems)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add currency to wallet
CREATE OR REPLACE FUNCTION add_currency(
  p_user_id UUID,
  p_currency_type VARCHAR(20),
  p_amount INT,
  p_transaction_type VARCHAR(30),
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_wallet public.user_wallets;
  v_new_balance INT;
BEGIN
  -- Get or create wallet
  v_wallet := get_or_create_wallet(p_user_id);

  -- Update wallet
  IF p_currency_type = 'coins' THEN
    UPDATE public.user_wallets
    SET
      coins = coins + p_amount,
      lifetime_coins_earned = CASE WHEN p_amount > 0 THEN lifetime_coins_earned + p_amount ELSE lifetime_coins_earned END,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING coins INTO v_new_balance;
  ELSIF p_currency_type = 'gems' THEN
    UPDATE public.user_wallets
    SET
      gems = gems + p_amount,
      lifetime_gems_purchased = CASE WHEN p_amount > 0 THEN lifetime_gems_purchased + p_amount ELSE lifetime_gems_purchased END,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING gems INTO v_new_balance;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid currency type');
  END IF;

  -- Check for negative balance
  IF v_new_balance < 0 THEN
    -- Rollback by subtracting the amount we added
    IF p_currency_type = 'coins' THEN
      UPDATE public.user_wallets SET coins = coins - p_amount WHERE user_id = p_user_id;
    ELSE
      UPDATE public.user_wallets SET gems = gems - p_amount WHERE user_id = p_user_id;
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Log transaction
  INSERT INTO public.wallet_transactions (
    user_id, currency_type, amount, balance_after, transaction_type, reference_id, description
  ) VALUES (
    p_user_id, p_currency_type, p_amount, v_new_balance, p_transaction_type, p_reference_id, p_description
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purchase shop item
CREATE OR REPLACE FUNCTION purchase_shop_item(
  p_user_id UUID,
  p_item_id UUID,
  p_currency_type VARCHAR(20)
) RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_wallet RECORD;
  v_price INT;
  v_result JSONB;
BEGIN
  -- Get item details
  SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  -- Check availability
  IF v_item.is_limited AND v_item.available_until IS NOT NULL AND v_item.available_until < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is no longer available');
  END IF;

  IF v_item.max_purchases IS NOT NULL AND v_item.current_purchases >= v_item.max_purchases THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is sold out');
  END IF;

  -- Get price
  IF p_currency_type = 'coins' THEN
    v_price := v_item.price_coins;
  ELSIF p_currency_type = 'gems' THEN
    v_price := v_item.price_gems;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid currency type');
  END IF;

  IF v_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item cannot be purchased with this currency');
  END IF;

  -- Check if user already owns this item (for cosmetics)
  IF v_item.item_type IN ('title', 'frame', 'theme') THEN
    -- Check existing purchase
    IF EXISTS (SELECT 1 FROM public.shop_purchases WHERE user_id = p_user_id AND item_id = p_item_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You already own this item');
    END IF;
  END IF;

  -- Deduct currency
  v_result := add_currency(p_user_id, p_currency_type, -v_price, 'spend_shop', p_item_id, 'Purchased: ' || v_item.name);

  IF NOT (v_result->>'success')::boolean THEN
    RETURN v_result;
  END IF;

  -- Record purchase
  INSERT INTO public.shop_purchases (user_id, item_id, item_name, currency_type, amount_paid)
  VALUES (p_user_id, p_item_id, v_item.name, p_currency_type, v_price);

  -- Update item purchase count
  UPDATE public.shop_items
  SET current_purchases = current_purchases + 1
  WHERE id = p_item_id;

  -- TODO: Grant the actual item (title, frame, theme, etc.)

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item.name,
    'item_type', v_item.item_type,
    'amount_paid', v_price,
    'currency_type', p_currency_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- ============================================
-- SEED DATA: Currency Packs
-- ============================================
INSERT INTO public.currency_packs (name, description, currency_type, amount, bonus_amount, price_cents, sort_order)
VALUES
  ('Starter Pack', '100 Gems to get started', 'gems', 100, 0, 99, 1),
  ('Small Bundle', '500 Gems + 50 bonus', 'gems', 500, 50, 499, 2),
  ('Medium Bundle', '1,100 Gems + 150 bonus', 'gems', 1100, 150, 999, 3),
  ('Large Bundle', '2,500 Gems + 500 bonus', 'gems', 2500, 500, 1999, 4),
  ('Mega Bundle', '6,500 Gems + 1,500 bonus', 'gems', 6500, 1500, 4999, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Shop Items
-- ============================================
INSERT INTO public.shop_items (name, description, item_type, price_coins, price_gems, icon_url, rarity, category)
VALUES
  -- Titles
  ('The Champion', 'A prestigious title for champions', 'title', 5000, 500, NULL, 'epic', 'titles'),
  ('Speed Demon', 'Show off your quick reflexes', 'title', 2000, 200, NULL, 'rare', 'titles'),
  ('Night Owl', 'For those who game late into the night', 'title', 1000, 100, NULL, 'uncommon', 'titles'),

  -- Frames
  ('Neon Edge', 'A glowing neon border', 'frame', 3000, 300, NULL, 'rare', 'frames'),
  ('Golden Crown', 'The mark of royalty', 'frame', NULL, 800, NULL, 'legendary', 'frames'),
  ('Ice Crystal', 'Cool and collected', 'frame', 2500, 250, NULL, 'rare', 'frames'),

  -- Themes
  ('Cyberpunk', 'Futuristic neon colors', 'theme', 4000, 400, NULL, 'epic', 'themes'),
  ('Nature', 'Calming forest greens', 'theme', 1500, 150, NULL, 'uncommon', 'themes'),
  ('Sunset', 'Warm orange gradients', 'theme', 1500, 150, NULL, 'uncommon', 'themes'),

  -- XP Boosts
  ('24h XP Boost (25%)', '+25% XP for 24 hours', 'xp_boost', 500, 50, NULL, 'common', 'boosts'),
  ('7d XP Boost (25%)', '+25% XP for 7 days', 'xp_boost', 2000, 200, NULL, 'uncommon', 'boosts'),
  ('24h XP Boost (50%)', '+50% XP for 24 hours', 'xp_boost', 1000, 100, NULL, 'rare', 'boosts')
ON CONFLICT DO NOTHING;
-- Migration: 011_activity_feed.sql
-- Activity feed system with social activities, news posts, and reactions

-- ============================================
-- ACTIVITY FEED ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'match_completed', 'match_created', 'tournament_joined', 'tournament_won',
    'challenge_completed', 'badge_earned', 'level_up', 'title_unlocked',
    'clan_joined', 'clan_created', 'friend_added', 'achievement_unlocked',
    'battle_pass_tier', 'season_rank', 'media_uploaded', 'profile_updated'
  )),
  target_type VARCHAR(50), -- 'match', 'tournament', 'clan', 'user', 'badge', etc
  target_id UUID,
  metadata JSONB DEFAULT '{}', -- activity-specific data
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  is_highlighted BOOLEAN DEFAULT false,
  reaction_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEWS/ANNOUNCEMENTS FROM ADMINS
-- ============================================
CREATE TABLE IF NOT EXISTS public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  banner_url TEXT,
  post_type VARCHAR(30) DEFAULT 'news' CHECK (post_type IN ('news', 'update', 'event', 'maintenance', 'feature')),
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  tags JSONB DEFAULT '[]',
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEED REACTIONS (LIKES, ETC)
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES public.activity_feed(id) ON DELETE CASCADE NOT NULL,
  reaction_type VARCHAR(20) DEFAULT 'like' CHECK (reaction_type IN ('like', 'celebrate', 'fire', 'gg')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_visibility ON activity_feed(visibility);
CREATE INDEX IF NOT EXISTS idx_activity_feed_highlighted ON activity_feed(is_highlighted) WHERE is_highlighted = true;
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON news_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_pinned ON news_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity ON activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_user ON activity_reactions(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Activity Feed RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities" ON public.activity_feed
  FOR SELECT USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid() AND following_id = activity_feed.user_id
    ))
  );

CREATE POLICY "Users can create own activities" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage activities" ON public.activity_feed
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- News Posts RLS
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published news" ON public.news_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Service role can manage news" ON public.news_posts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Activity Reactions RLS
ALTER TABLE public.activity_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.activity_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own reactions" ON public.activity_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create activity feed item
CREATE OR REPLACE FUNCTION create_activity(
  p_user_id UUID,
  p_activity_type VARCHAR(50),
  p_target_type VARCHAR(50) DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_visibility VARCHAR(20) DEFAULT 'public'
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO public.activity_feed (
    user_id, activity_type, target_type, target_id, metadata, visibility
  ) VALUES (
    p_user_id, p_activity_type, p_target_type, p_target_id, p_metadata, p_visibility
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle reaction
CREATE OR REPLACE FUNCTION toggle_activity_reaction(
  p_user_id UUID,
  p_activity_id UUID,
  p_reaction_type VARCHAR(20) DEFAULT 'like'
) RETURNS JSONB AS $$
DECLARE
  v_existing RECORD;
BEGIN
  -- Check if reaction exists
  SELECT * INTO v_existing
  FROM public.activity_reactions
  WHERE user_id = p_user_id AND activity_id = p_activity_id;

  IF FOUND THEN
    -- Remove reaction
    DELETE FROM public.activity_reactions
    WHERE user_id = p_user_id AND activity_id = p_activity_id;

    -- Update count
    UPDATE public.activity_feed
    SET reaction_count = GREATEST(0, reaction_count - 1)
    WHERE id = p_activity_id;

    RETURN jsonb_build_object('action', 'removed', 'reaction_type', v_existing.reaction_type);
  ELSE
    -- Add reaction
    INSERT INTO public.activity_reactions (user_id, activity_id, reaction_type)
    VALUES (p_user_id, p_activity_id, p_reaction_type);

    -- Update count
    UPDATE public.activity_feed
    SET reaction_count = reaction_count + 1
    WHERE id = p_activity_id;

    RETURN jsonb_build_object('action', 'added', 'reaction_type', p_reaction_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create activities on various events
-- Example: Badge earned
CREATE OR REPLACE FUNCTION create_badge_earned_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_activity(
    NEW.user_id,
    'badge_earned',
    'badge',
    NEW.badge_id,
    jsonb_build_object('badge_id', NEW.badge_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if user_badges table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN
    DROP TRIGGER IF EXISTS trigger_badge_earned_activity ON public.user_badges;
    CREATE TRIGGER trigger_badge_earned_activity
      AFTER INSERT ON public.user_badges
      FOR EACH ROW
      EXECUTE FUNCTION create_badge_earned_activity();
  END IF;
END $$;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_reactions;

-- ============================================
-- SEED DATA: Sample News Posts
-- ============================================
INSERT INTO public.news_posts (
  title, content, excerpt, post_type, is_pinned, is_published, published_at
)
VALUES
  (
    'Welcome to GamerHub!',
    'We''re excited to launch GamerHub, your new home for competitive gaming. Connect with players, join clans, compete in tournaments, and climb the leaderboards!\n\n## What''s New\n- **Matchmaking**: Find players who match your skill level\n- **Clans**: Create or join a clan and compete together\n- **Tournaments**: Participate in organized competitions\n- **Battle Pass**: Earn exclusive rewards as you play\n\nStart exploring and let us know what you think!',
    'Your new home for competitive gaming is here.',
    'news',
    true,
    true,
    NOW()
  ),
  (
    'Season 1 Battle Pass Now Available!',
    'Rise of Champions is here! The first-ever GamerHub Battle Pass brings you 100 levels of exclusive rewards.\n\n## Premium Rewards Include:\n- Exclusive titles and frames\n- Premium themes\n- Bonus coins and gems\n- Legendary cosmetics at level 100\n\nPurchase the Battle Pass now to start earning!',
    'Earn exclusive rewards with the Season 1 Battle Pass.',
    'feature',
    false,
    true,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;
-- Game API Integrations Migration
-- Supports Riot Games (Valorant) and Steam (CS2), plus mobile games (PUBG Mobile, Free Fire, CoC, COD Mobile)

-- Enum for integration providers
CREATE TYPE integration_provider AS ENUM ('riot', 'steam');

-- Enum for sync status
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'completed', 'failed');

-- Game OAuth tokens and connections
CREATE TABLE game_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_username TEXT,
  provider_avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for quick provider lookups
CREATE INDEX idx_game_connections_provider ON game_connections(provider, provider_user_id);
CREATE INDEX idx_game_connections_user ON game_connections(user_id);

-- Game-specific stats storage
CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- e.g., 'valorant', 'cs2', 'pubg-mobile', 'freefire', 'coc', 'cod-mobile'
  game_mode TEXT, -- e.g., 'competitive', 'unrated', 'ranked'
  season TEXT, -- e.g., 'Episode 8 Act 1', 'Season 2024 Split 1'
  stats JSONB NOT NULL DEFAULT '{}',
  rank_info JSONB DEFAULT '{}', -- Current rank, LP, tier, etc.
  last_match_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id, game_mode, season)
);

-- Index for stats lookups
CREATE INDEX idx_game_stats_user_game ON game_stats(user_id, game_id);
CREATE INDEX idx_game_stats_connection ON game_stats(connection_id);

-- Match history from external games
CREATE TABLE game_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  external_match_id TEXT NOT NULL, -- Match ID from the provider
  game_mode TEXT,
  map_name TEXT,
  agent_or_champion TEXT, -- Character played
  result TEXT, -- 'win', 'loss', 'draw'
  score JSONB, -- Team scores, rounds, etc.
  stats JSONB NOT NULL DEFAULT '{}', -- KDA, damage, etc.
  duration_seconds INTEGER,
  played_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_match_id)
);

-- Index for match history lookups
CREATE INDEX idx_game_match_history_user ON game_match_history(user_id, game_id, played_at DESC);
CREATE INDEX idx_game_match_history_connection ON game_match_history(connection_id, played_at DESC);

-- Sync jobs for tracking background syncs
CREATE TABLE game_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'incremental', 'match_history'
  status sync_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  stats_synced INTEGER DEFAULT 0,
  matches_synced INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sync job lookups
CREATE INDEX idx_game_sync_jobs_connection ON game_sync_jobs(connection_id, created_at DESC);
CREATE INDEX idx_game_sync_jobs_status ON game_sync_jobs(status) WHERE status IN ('pending', 'syncing');

-- Supported games configuration
CREATE TABLE supported_games (
  id TEXT PRIMARY KEY, -- e.g., 'valorant', 'cs2', 'pubg-mobile', 'freefire', 'coc', 'cod-mobile'
  name TEXT NOT NULL,
  provider integration_provider NOT NULL,
  icon_url TEXT,
  banner_url TEXT,
  description TEXT,
  stat_fields JSONB DEFAULT '[]', -- Defines what stats to display
  rank_system JSONB DEFAULT '{}', -- Rank tiers and icons
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert supported games
INSERT INTO supported_games (id, name, provider, description, stat_fields, rank_system, display_order) VALUES
('valorant', 'VALORANT', 'riot', 'Tactical 5v5 character-based shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "headshot_pct", "label": "HS%"}, {"key": "adr", "label": "ADR"}, {"key": "win_rate", "label": "Win Rate"}]',
  '{"tiers": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"]}',
  1),
('cs2', 'Counter-Strike 2', 'steam', 'Tactical first-person shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "headshot_pct", "label": "HS%"}, {"key": "adr", "label": "ADR"}, {"key": "win_rate", "label": "Win Rate"}]',
  '{"tiers": ["Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master", "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master", "Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian", "Legendary Eagle", "Legendary Eagle Master", "Supreme Master First Class", "Global Elite"]}',
  2),
('pubg-mobile', 'PUBG Mobile', 'steam', 'Mobile battle royale shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "damage", "label": "Damage"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "top10_rate", "label": "Top 10%"}]',
  '{"tiers": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Ace Master", "Ace Dominator", "Conqueror"]}',
  3),
('freefire', 'Free Fire', 'steam', 'Mobile battle royale',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "damage", "label": "Damage"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "booyah", "label": "Booyah!"}]',
  '{"tiers": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Grand Master"]}',
  4),
('coc', 'Clash of Clans', 'steam', 'Strategic clan-based mobile game',
  '[{"key": "trophies", "label": "Trophies"}, {"key": "war_stars", "label": "War Stars"}, {"key": "donations", "label": "Donations"}, {"key": "attack_wins", "label": "Attack Wins"}, {"key": "defense_wins", "label": "Defense Wins"}]',
  '{"tiers": ["Bronze League", "Silver League", "Gold League", "Crystal League", "Master League", "Champion League", "Titan League", "Legend League"]}',
  5),
('cod-mobile', 'COD Mobile', 'steam', 'Mobile first-person shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "kd_ratio", "label": "K/D"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "score_per_min", "label": "Score/min"}]',
  '{"tiers": ["Rookie", "Veteran", "Elite", "Pro", "Master", "Grand Master", "Legendary"]}',
  6);

-- Enable RLS
ALTER TABLE game_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_connections
CREATE POLICY "Users can view their own connections"
  ON game_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own connections"
  ON game_connections FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for game_stats (public read, private write)
CREATE POLICY "Anyone can view game stats"
  ON game_stats FOR SELECT
  USING (true);

CREATE POLICY "System can manage game stats"
  ON game_stats FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for game_match_history (public read, private write)
CREATE POLICY "Anyone can view match history"
  ON game_match_history FOR SELECT
  USING (true);

CREATE POLICY "System can manage match history"
  ON game_match_history FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for game_sync_jobs
CREATE POLICY "Users can view their own sync jobs"
  ON game_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sync jobs"
  ON game_sync_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for supported_games (public read)
CREATE POLICY "Anyone can view supported games"
  ON supported_games FOR SELECT
  USING (true);

-- Function to get user's connected games with stats
CREATE OR REPLACE FUNCTION get_user_game_connections(p_user_id UUID)
RETURNS TABLE (
  connection_id UUID,
  provider integration_provider,
  provider_username TEXT,
  provider_avatar_url TEXT,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  games JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id as connection_id,
    gc.provider,
    gc.provider_username,
    gc.provider_avatar_url,
    gc.connected_at,
    gc.last_synced_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'game_id', gs.game_id,
          'rank_info', gs.rank_info,
          'stats', gs.stats,
          'synced_at', gs.synced_at
        )
      ) FILTER (WHERE gs.id IS NOT NULL),
      '[]'::jsonb
    ) as games
  FROM game_connections gc
  LEFT JOIN game_stats gs ON gs.connection_id = gc.id
  WHERE gc.user_id = p_user_id AND gc.is_active = true
  GROUP BY gc.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update game stats
CREATE OR REPLACE FUNCTION upsert_game_stats(
  p_user_id UUID,
  p_connection_id UUID,
  p_game_id TEXT,
  p_game_mode TEXT,
  p_season TEXT,
  p_stats JSONB,
  p_rank_info JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO game_stats (user_id, connection_id, game_id, game_mode, season, stats, rank_info)
  VALUES (p_user_id, p_connection_id, p_game_id, p_game_mode, p_season, p_stats, COALESCE(p_rank_info, '{}'::jsonb))
  ON CONFLICT (user_id, game_id, game_mode, season)
  DO UPDATE SET
    stats = p_stats,
    rank_info = COALESCE(p_rank_info, game_stats.rank_info),
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start a sync job
CREATE OR REPLACE FUNCTION start_game_sync(
  p_user_id UUID,
  p_connection_id UUID,
  p_sync_type TEXT DEFAULT 'full'
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_existing_job UUID;
BEGIN
  -- Check for existing pending/running job
  SELECT id INTO v_existing_job
  FROM game_sync_jobs
  WHERE connection_id = p_connection_id
    AND status IN ('pending', 'syncing')
  LIMIT 1;

  IF v_existing_job IS NOT NULL THEN
    RETURN v_existing_job;
  END IF;

  -- Create new sync job
  INSERT INTO game_sync_jobs (user_id, connection_id, sync_type, status, started_at)
  VALUES (p_user_id, p_connection_id, p_sync_type, 'syncing', NOW())
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_game_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_connections_updated_at
  BEFORE UPDATE ON game_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER game_stats_updated_at
  BEFORE UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

-- Add indexes for performance
CREATE INDEX idx_supported_games_provider ON supported_games(provider) WHERE is_active = true;
-- Forums and Community Posts Migration

-- Enum for post types
CREATE TYPE forum_post_type AS ENUM ('discussion', 'question', 'guide', 'lfg', 'announcement');

-- Forum categories
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name or emoji
  color TEXT, -- Hex color for category
  game_id TEXT REFERENCES supported_games(id) ON DELETE SET NULL, -- Optional game association
  parent_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE, -- For subcategories
  post_count INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false, -- Only admins can post
  is_hidden BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category lookups
CREATE INDEX idx_forum_categories_slug ON forum_categories(slug);
CREATE INDEX idx_forum_categories_game ON forum_categories(game_id) WHERE game_id IS NOT NULL;

-- Forum posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML for display
  post_type forum_post_type DEFAULT 'discussion',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false, -- No more replies allowed
  is_solved BOOLEAN DEFAULT false, -- For questions
  solved_reply_id UUID, -- The reply that solved the question
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  vote_score INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES profiles(id),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Indexes for post lookups
CREATE INDEX idx_forum_posts_category ON forum_posts(category_id, is_deleted, created_at DESC);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id, is_deleted);
CREATE INDEX idx_forum_posts_pinned ON forum_posts(category_id, is_pinned DESC, last_reply_at DESC);
CREATE INDEX idx_forum_posts_type ON forum_posts(post_type) WHERE NOT is_deleted;
CREATE INDEX idx_forum_posts_tags ON forum_posts USING GIN(tags) WHERE NOT is_deleted;

-- Forum replies
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  content_html TEXT,
  vote_score INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT false, -- Marked as solution for questions
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reply lookups
CREATE INDEX idx_forum_replies_post ON forum_replies(post_id, is_deleted, created_at);
CREATE INDEX idx_forum_replies_author ON forum_replies(author_id, is_deleted);
CREATE INDEX idx_forum_replies_parent ON forum_replies(parent_id) WHERE parent_id IS NOT NULL;

-- Forum votes (for posts and replies)
CREATE TABLE forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 downvote, 1 upvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id),
  CHECK ((post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL))
);

-- Indexes for vote lookups
CREATE INDEX idx_forum_votes_post ON forum_votes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_forum_votes_reply ON forum_votes(reply_id) WHERE reply_id IS NOT NULL;

-- Forum subscriptions (follow posts/categories)
CREATE TABLE forum_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  notify_replies BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, category_id),
  CHECK ((post_id IS NOT NULL AND category_id IS NULL) OR (post_id IS NULL AND category_id IS NOT NULL))
);

-- Index for subscription lookups
CREATE INDEX idx_forum_subscriptions_user ON forum_subscriptions(user_id);
CREATE INDEX idx_forum_subscriptions_post ON forum_subscriptions(post_id) WHERE post_id IS NOT NULL;

-- Enable RLS
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_categories (public read)
CREATE POLICY "Anyone can view categories"
  ON forum_categories FOR SELECT
  USING (NOT is_hidden);

-- RLS Policies for forum_posts
CREATE POLICY "Anyone can view non-deleted posts"
  ON forum_posts FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their posts"
  ON forum_posts FOR UPDATE
  USING (auth.uid() = author_id AND NOT is_deleted);

CREATE POLICY "Authors can soft delete their posts"
  ON forum_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (is_deleted = true);

-- RLS Policies for forum_replies
CREATE POLICY "Anyone can view non-deleted replies"
  ON forum_replies FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create replies"
  ON forum_replies FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their replies"
  ON forum_replies FOR UPDATE
  USING (auth.uid() = author_id AND NOT is_deleted);

-- RLS Policies for forum_votes
CREATE POLICY "Users can view their own votes"
  ON forum_votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their votes"
  ON forum_votes FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for forum_subscriptions
CREATE POLICY "Users can manage their subscriptions"
  ON forum_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_post_slug(p_title TEXT, p_category_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  v_base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  v_base_slug := substring(v_base_slug from 1 for 100);

  v_slug := v_base_slug;

  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM forum_posts WHERE category_id = p_category_id AND slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;

  RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new post
CREATE OR REPLACE FUNCTION create_forum_post(
  p_category_id UUID,
  p_author_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_post_type forum_post_type DEFAULT 'discussion',
  p_tags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_slug TEXT;
  v_post_id UUID;
BEGIN
  -- Generate slug
  v_slug := generate_post_slug(p_title, p_category_id);

  -- Create post
  INSERT INTO forum_posts (category_id, author_id, title, slug, content, post_type, tags)
  VALUES (p_category_id, p_author_id, p_title, v_slug, p_content, p_post_type, p_tags)
  RETURNING id INTO v_post_id;

  -- Update category post count
  UPDATE forum_categories
  SET post_count = post_count + 1, updated_at = NOW()
  WHERE id = p_category_id;

  -- Auto-subscribe author to their post
  INSERT INTO forum_subscriptions (user_id, post_id)
  VALUES (p_author_id, v_post_id)
  ON CONFLICT DO NOTHING;

  RETURN v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a reply
CREATE OR REPLACE FUNCTION create_forum_reply(
  p_post_id UUID,
  p_author_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_reply_id UUID;
BEGIN
  -- Create reply
  INSERT INTO forum_replies (post_id, author_id, content, parent_id)
  VALUES (p_post_id, p_author_id, p_content, p_parent_id)
  RETURNING id INTO v_reply_id;

  -- Update post reply count and last reply info
  UPDATE forum_posts
  SET
    reply_count = reply_count + 1,
    last_reply_at = NOW(),
    last_reply_by = p_author_id,
    updated_at = NOW()
  WHERE id = p_post_id;

  -- Auto-subscribe author to the post
  INSERT INTO forum_subscriptions (user_id, post_id)
  VALUES (p_author_id, p_post_id)
  ON CONFLICT DO NOTHING;

  RETURN v_reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vote on a post or reply
CREATE OR REPLACE FUNCTION toggle_forum_vote(
  p_user_id UUID,
  p_vote_type SMALLINT,
  p_post_id UUID DEFAULT NULL,
  p_reply_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_existing_vote SMALLINT;
  v_new_score INTEGER;
BEGIN
  IF p_post_id IS NOT NULL THEN
    -- Check existing vote on post
    SELECT vote_type INTO v_existing_vote
    FROM forum_votes
    WHERE user_id = p_user_id AND post_id = p_post_id;

    IF v_existing_vote IS NOT NULL THEN
      IF v_existing_vote = p_vote_type THEN
        -- Remove vote
        DELETE FROM forum_votes WHERE user_id = p_user_id AND post_id = p_post_id;
        UPDATE forum_posts SET vote_score = vote_score - v_existing_vote WHERE id = p_post_id;
      ELSE
        -- Change vote
        UPDATE forum_votes SET vote_type = p_vote_type WHERE user_id = p_user_id AND post_id = p_post_id;
        UPDATE forum_posts SET vote_score = vote_score - v_existing_vote + p_vote_type WHERE id = p_post_id;
      END IF;
    ELSE
      -- New vote
      INSERT INTO forum_votes (user_id, post_id, vote_type) VALUES (p_user_id, p_post_id, p_vote_type);
      UPDATE forum_posts SET vote_score = vote_score + p_vote_type WHERE id = p_post_id;
    END IF;

    SELECT vote_score INTO v_new_score FROM forum_posts WHERE id = p_post_id;

  ELSIF p_reply_id IS NOT NULL THEN
    -- Check existing vote on reply
    SELECT vote_type INTO v_existing_vote
    FROM forum_votes
    WHERE user_id = p_user_id AND reply_id = p_reply_id;

    IF v_existing_vote IS NOT NULL THEN
      IF v_existing_vote = p_vote_type THEN
        DELETE FROM forum_votes WHERE user_id = p_user_id AND reply_id = p_reply_id;
        UPDATE forum_replies SET vote_score = vote_score - v_existing_vote WHERE id = p_reply_id;
      ELSE
        UPDATE forum_votes SET vote_type = p_vote_type WHERE user_id = p_user_id AND reply_id = p_reply_id;
        UPDATE forum_replies SET vote_score = vote_score - v_existing_vote + p_vote_type WHERE id = p_reply_id;
      END IF;
    ELSE
      INSERT INTO forum_votes (user_id, reply_id, vote_type) VALUES (p_user_id, p_reply_id, p_vote_type);
      UPDATE forum_replies SET vote_score = vote_score + p_vote_type WHERE id = p_reply_id;
    END IF;

    SELECT vote_score INTO v_new_score FROM forum_replies WHERE id = p_reply_id;
  END IF;

  RETURN jsonb_build_object('score', v_new_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark reply as solution
CREATE OR REPLACE FUNCTION mark_reply_as_solution(
  p_post_id UUID,
  p_reply_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_post_author UUID;
BEGIN
  -- Check if user is the post author
  SELECT author_id INTO v_post_author FROM forum_posts WHERE id = p_post_id;

  IF v_post_author != p_user_id THEN
    RETURN false;
  END IF;

  -- Unmark any existing solution
  UPDATE forum_replies SET is_solution = false WHERE post_id = p_post_id AND is_solution = true;

  -- Mark new solution
  UPDATE forum_replies SET is_solution = true WHERE id = p_reply_id;

  -- Update post
  UPDATE forum_posts
  SET is_solved = true, solved_reply_id = p_reply_id, updated_at = NOW()
  WHERE id = p_post_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment view count (called from API)
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_posts SET view_count = view_count + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default categories
INSERT INTO forum_categories (slug, name, description, icon, color, display_order) VALUES
('general', 'General Discussion', 'Talk about anything gaming related', '💬', '#6366f1', 1),
('announcements', 'Announcements', 'Official news and updates', '📢', '#f59e0b', 2),
('introductions', 'Introductions', 'Introduce yourself to the community', '👋', '#10b981', 3),
('help', 'Help & Support', 'Get help with technical issues', '❓', '#ef4444', 4),
('feedback', 'Feedback & Suggestions', 'Share your ideas to improve GamerHub', '💡', '#8b5cf6', 5);

-- Insert game-specific categories
INSERT INTO forum_categories (slug, name, description, icon, color, game_id, display_order) VALUES
('valorant', 'VALORANT', 'Discuss all things Valorant', '🎯', '#ff4654', 'valorant', 10),
('cs2', 'Counter-Strike 2', 'CS2 tactics and community', '💥', '#de9b35', 'cs2', 11),
('pubg-mobile', 'PUBG Mobile', 'PUBG Mobile / BGMI strategies, loot paths, and squad tactics', '🎮', '#f2a900', 'pubg-mobile', 12),
('freefire', 'Free Fire', 'Free Fire character combos, Clash Squad, and ranked tips', '🔥', '#ff5722', 'freefire', 13),
('coc', 'Clash of Clans', 'COC war strategies, base designs, and clan management', '⚔️', '#f5c518', 'coc', 14),
('cod-mobile', 'COD Mobile', 'COD Mobile MP ranked, BR strategies, and loadout tips', '💥', '#ff6f00', 'cod-mobile', 15),
('other-games', 'Other Games', 'Discuss any other games not listed above', '🎲', '#9e9e9e', NULL, 16);

-- Trigger to update timestamps
CREATE TRIGGER forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER forum_replies_updated_at
  BEFORE UPDATE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER forum_categories_updated_at
  BEFORE UPDATE ON forum_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();
-- Streaming and Twitch Integration Migration

-- Enum for stream status
CREATE TYPE stream_status AS ENUM ('offline', 'live', 'hosting');

-- Streamer profiles (linked to Twitch)
CREATE TABLE streamer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  twitch_id TEXT UNIQUE NOT NULL,
  twitch_login TEXT NOT NULL,
  twitch_display_name TEXT,
  twitch_profile_image_url TEXT,
  twitch_broadcaster_type TEXT, -- '', 'affiliate', 'partner'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',

  -- Stream settings
  stream_title TEXT,
  stream_game_id TEXT,
  stream_game_name TEXT,
  stream_language TEXT DEFAULT 'en',

  -- Current status
  status stream_status DEFAULT 'offline',
  current_viewer_count INTEGER DEFAULT 0,
  last_stream_started_at TIMESTAMPTZ,
  last_stream_ended_at TIMESTAMPTZ,

  -- Settings
  is_featured BOOLEAN DEFAULT false, -- Show on homepage
  auto_notify_followers BOOLEAN DEFAULT true,
  embed_enabled BOOLEAN DEFAULT true,

  -- Stats
  total_stream_hours INTEGER DEFAULT 0,
  peak_viewer_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,

  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_streamer_profiles_twitch ON streamer_profiles(twitch_id);
CREATE INDEX idx_streamer_profiles_status ON streamer_profiles(status) WHERE status = 'live';
CREATE INDEX idx_streamer_profiles_featured ON streamer_profiles(is_featured, status);

-- Stream schedules
CREATE TABLE stream_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME,
  timezone TEXT DEFAULT 'UTC',
  title TEXT,
  game_name TEXT,
  is_recurring BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for schedule lookups
CREATE INDEX idx_stream_schedules_streamer ON stream_schedules(streamer_id);
CREATE INDEX idx_stream_schedules_day ON stream_schedules(day_of_week, start_time);

-- Stream history (past streams)
CREATE TABLE stream_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  twitch_stream_id TEXT,
  title TEXT,
  game_id TEXT,
  game_name TEXT,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  vod_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history lookups
CREATE INDEX idx_stream_history_streamer ON stream_history(streamer_id, started_at DESC);

-- Twitch EventSub subscriptions (for tracking active webhooks)
CREATE TABLE twitch_eventsub_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitch_subscription_id TEXT UNIQUE NOT NULL,
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL, -- 'stream.online', 'stream.offline', etc.
  status TEXT DEFAULT 'enabled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for eventsub lookups
CREATE INDEX idx_twitch_eventsub_streamer ON twitch_eventsub_subscriptions(streamer_id);

-- User follows for streamers (separate from user follows)
CREATE TABLE streamer_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES streamer_profiles(id) ON DELETE CASCADE,
  notify_live BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streamer_id)
);

-- Index for follow lookups
CREATE INDEX idx_streamer_follows_user ON streamer_follows(user_id);
CREATE INDEX idx_streamer_follows_streamer ON streamer_follows(streamer_id);

-- Enable RLS
ALTER TABLE streamer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitch_eventsub_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streamer_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streamer_profiles
CREATE POLICY "Anyone can view streamer profiles"
  ON streamer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own streamer profile"
  ON streamer_profiles FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for stream_schedules
CREATE POLICY "Anyone can view schedules"
  ON stream_schedules FOR SELECT
  USING (true);

CREATE POLICY "Streamers can manage their schedules"
  ON stream_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM streamer_profiles
      WHERE id = stream_schedules.streamer_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for stream_history
CREATE POLICY "Anyone can view stream history"
  ON stream_history FOR SELECT
  USING (true);

-- RLS Policies for twitch_eventsub_subscriptions (system only)
CREATE POLICY "System can manage eventsub"
  ON twitch_eventsub_subscriptions FOR ALL
  USING (true);

-- RLS Policies for streamer_follows
CREATE POLICY "Users can manage their follows"
  ON streamer_follows FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can see follow counts"
  ON streamer_follows FOR SELECT
  USING (true);

-- Function to get live streamers
CREATE OR REPLACE FUNCTION get_live_streamers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  twitch_login TEXT,
  twitch_display_name TEXT,
  twitch_profile_image_url TEXT,
  stream_title TEXT,
  stream_game_name TEXT,
  current_viewer_count INTEGER,
  last_stream_started_at TIMESTAMPTZ,
  is_featured BOOLEAN,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    sp.twitch_login,
    sp.twitch_display_name,
    sp.twitch_profile_image_url,
    sp.stream_title,
    sp.stream_game_name,
    sp.current_viewer_count,
    sp.last_stream_started_at,
    sp.is_featured,
    p.username,
    p.display_name,
    p.avatar_url
  FROM streamer_profiles sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.status = 'live'
  ORDER BY sp.is_featured DESC, sp.current_viewer_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update stream status (called by webhook)
CREATE OR REPLACE FUNCTION update_stream_status(
  p_twitch_id TEXT,
  p_status stream_status,
  p_title TEXT DEFAULT NULL,
  p_game_name TEXT DEFAULT NULL,
  p_viewer_count INTEGER DEFAULT 0
) RETURNS VOID AS $$
DECLARE
  v_streamer_id UUID;
  v_was_live BOOLEAN;
BEGIN
  -- Get streamer and check previous status
  SELECT id, (status = 'live') INTO v_streamer_id, v_was_live
  FROM streamer_profiles
  WHERE twitch_id = p_twitch_id;

  IF v_streamer_id IS NULL THEN
    RETURN;
  END IF;

  -- Update streamer profile
  UPDATE streamer_profiles
  SET
    status = p_status,
    stream_title = COALESCE(p_title, stream_title),
    stream_game_name = COALESCE(p_game_name, stream_game_name),
    current_viewer_count = p_viewer_count,
    last_stream_started_at = CASE WHEN p_status = 'live' AND NOT v_was_live THEN NOW() ELSE last_stream_started_at END,
    last_stream_ended_at = CASE WHEN p_status = 'offline' AND v_was_live THEN NOW() ELSE last_stream_ended_at END,
    peak_viewer_count = GREATEST(peak_viewer_count, p_viewer_count),
    updated_at = NOW()
  WHERE id = v_streamer_id;

  -- If stream ended, create history entry
  IF p_status = 'offline' AND v_was_live THEN
    INSERT INTO stream_history (streamer_id, title, game_name, peak_viewers, started_at, ended_at)
    SELECT
      v_streamer_id,
      stream_title,
      stream_game_name,
      peak_viewer_count,
      last_stream_started_at,
      NOW()
    FROM streamer_profiles
    WHERE id = v_streamer_id;

    -- Calculate and update duration
    UPDATE stream_history
    SET duration_minutes = EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
    WHERE streamer_id = v_streamer_id
    AND ended_at IS NOT NULL
    AND duration_minutes IS NULL;

    -- Update total stream hours
    UPDATE streamer_profiles
    SET total_stream_hours = total_stream_hours +
      (SELECT COALESCE(SUM(duration_minutes), 0) / 60
       FROM stream_history
       WHERE streamer_id = v_streamer_id AND duration_minutes IS NOT NULL)
    WHERE id = v_streamer_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle streamer follow
CREATE OR REPLACE FUNCTION toggle_streamer_follow(
  p_user_id UUID,
  p_streamer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM streamer_follows
    WHERE user_id = p_user_id AND streamer_id = p_streamer_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM streamer_follows
    WHERE user_id = p_user_id AND streamer_id = p_streamer_id;

    UPDATE streamer_profiles
    SET follower_count = follower_count - 1
    WHERE id = p_streamer_id;

    RETURN jsonb_build_object('following', false);
  ELSE
    INSERT INTO streamer_follows (user_id, streamer_id)
    VALUES (p_user_id, p_streamer_id);

    UPDATE streamer_profiles
    SET follower_count = follower_count + 1
    WHERE id = p_streamer_id;

    RETURN jsonb_build_object('following', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for timestamps
CREATE TRIGGER streamer_profiles_updated_at
  BEFORE UPDATE ON streamer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

CREATE TRIGGER stream_schedules_updated_at
  BEFORE UPDATE ON stream_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();
-- AI-Powered Matchmaking Migration
-- Uses OpenAI for intelligent teammate/opponent suggestions

-- Player skill profiles per game
CREATE TABLE player_skill_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL, -- valorant, lol, cs2, dota2, etc.

  -- Skill ratings (TrueSkill/Elo-style)
  skill_rating DECIMAL(10, 2) DEFAULT 1500,
  skill_uncertainty DECIMAL(10, 2) DEFAULT 350, -- Lower = more confident
  games_played INTEGER DEFAULT 0,

  -- Play style attributes (0-100 scale)
  aggression_score INTEGER DEFAULT 50,
  teamwork_score INTEGER DEFAULT 50,
  communication_score INTEGER DEFAULT 50,
  consistency_score INTEGER DEFAULT 50,
  adaptability_score INTEGER DEFAULT 50,

  -- Preferences
  preferred_roles TEXT[] DEFAULT '{}',
  preferred_agents TEXT[] DEFAULT '{}', -- Characters/champions
  playtime_preferences JSONB DEFAULT '{}', -- {weekdays: [], weekends: [], timezone: ''}
  language_preferences TEXT[] DEFAULT ARRAY['en'],

  -- Performance data
  avg_kda DECIMAL(5, 2),
  win_rate DECIMAL(5, 2),
  recent_form INTEGER DEFAULT 50, -- 0-100, based on last 10 games

  -- AI-generated insights (cached)
  ai_playstyle_summary TEXT,
  ai_strengths TEXT[],
  ai_weaknesses TEXT[],
  ai_embedding VECTOR(1536), -- OpenAI embedding for similarity search

  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint and indexes
CREATE UNIQUE INDEX idx_player_skill_profiles_user_game ON player_skill_profiles(user_id, game_id);
CREATE INDEX idx_player_skill_profiles_rating ON player_skill_profiles(game_id, skill_rating DESC);
CREATE INDEX idx_player_skill_profiles_embedding ON player_skill_profiles USING ivfflat (ai_embedding vector_cosine_ops);

-- Match suggestions (AI-generated)
CREATE TABLE match_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'teammate', 'opponent', 'team_balance'

  -- Suggested player(s)
  suggested_user_ids UUID[] NOT NULL,

  -- AI reasoning
  compatibility_score DECIMAL(5, 2), -- 0-100
  ai_reasoning TEXT,
  match_factors JSONB DEFAULT '{}', -- Detailed breakdown

  -- Status
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  user_feedback TEXT, -- positive, negative, neutral
  feedback_comment TEXT,

  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for suggestions
CREATE INDEX idx_match_suggestions_user ON match_suggestions(user_id, game_id, status);
CREATE INDEX idx_match_suggestions_expiry ON match_suggestions(expires_at) WHERE status = 'pending';

-- Match outcomes (for improving AI)
CREATE TABLE match_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID REFERENCES match_suggestions(id) ON DELETE SET NULL,
  game_id TEXT NOT NULL,

  -- Participants
  player_ids UUID[] NOT NULL,
  team_a_ids UUID[],
  team_b_ids UUID[],

  -- Results
  winner TEXT, -- 'team_a', 'team_b', 'draw'
  team_a_score INTEGER,
  team_b_score INTEGER,

  -- Performance metrics
  player_stats JSONB DEFAULT '{}', -- {user_id: {kda, damage, etc}}

  -- Quality rating
  match_quality_score DECIMAL(5, 2), -- How balanced was the match
  was_enjoyable BOOLEAN,

  played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for outcomes
CREATE INDEX idx_match_outcomes_players ON match_outcomes USING GIN(player_ids);
CREATE INDEX idx_match_outcomes_suggestion ON match_outcomes(suggestion_id);

-- Team composition requests
CREATE TABLE team_balance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,

  -- Players to balance
  player_ids UUID[] NOT NULL,

  -- AI-generated balanced teams
  team_a_ids UUID[],
  team_b_ids UUID[],
  balance_score DECIMAL(5, 2), -- How balanced
  ai_reasoning TEXT,

  -- Alternative compositions
  alternatives JSONB DEFAULT '[]', -- Array of {team_a, team_b, score, reasoning}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for team balance
CREATE INDEX idx_team_balance_requests_requester ON team_balance_requests(requester_id, created_at DESC);

-- Enable RLS
ALTER TABLE player_skill_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_balance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all skill profiles"
  ON player_skill_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own skill profiles"
  ON player_skill_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their suggestions"
  ON match_suggestions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = ANY(suggested_user_ids));

CREATE POLICY "Users can manage their suggestions"
  ON match_suggestions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view outcomes they participated in"
  ON match_outcomes FOR SELECT
  USING (auth.uid() = ANY(player_ids));

CREATE POLICY "Users can insert outcomes"
  ON match_outcomes FOR INSERT
  WITH CHECK (auth.uid() = ANY(player_ids));

CREATE POLICY "Users can view their balance requests"
  ON team_balance_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = ANY(player_ids));

CREATE POLICY "Users can create balance requests"
  ON team_balance_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Function to get or create skill profile
CREATE OR REPLACE FUNCTION get_or_create_skill_profile(
  p_user_id UUID,
  p_game_id TEXT
) RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM player_skill_profiles
  WHERE user_id = p_user_id AND game_id = p_game_id;

  IF v_profile_id IS NULL THEN
    INSERT INTO player_skill_profiles (user_id, game_id)
    VALUES (p_user_id, p_game_id)
    RETURNING id INTO v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update skill rating after a match (simplified TrueSkill)
CREATE OR REPLACE FUNCTION update_skill_rating(
  p_user_id UUID,
  p_game_id TEXT,
  p_won BOOLEAN,
  p_opponent_rating DECIMAL DEFAULT 1500
) RETURNS VOID AS $$
DECLARE
  v_current_rating DECIMAL;
  v_uncertainty DECIMAL;
  v_k_factor DECIMAL;
  v_expected DECIMAL;
  v_rating_change DECIMAL;
BEGIN
  -- Get current rating
  SELECT skill_rating, skill_uncertainty
  INTO v_current_rating, v_uncertainty
  FROM player_skill_profiles
  WHERE user_id = p_user_id AND game_id = p_game_id;

  IF v_current_rating IS NULL THEN
    PERFORM get_or_create_skill_profile(p_user_id, p_game_id);
    v_current_rating := 1500;
    v_uncertainty := 350;
  END IF;

  -- K-factor based on uncertainty
  v_k_factor := LEAST(40, GREATEST(10, v_uncertainty / 10));

  -- Expected outcome (Elo formula)
  v_expected := 1 / (1 + POWER(10, (p_opponent_rating - v_current_rating) / 400));

  -- Rating change
  IF p_won THEN
    v_rating_change := v_k_factor * (1 - v_expected);
  ELSE
    v_rating_change := v_k_factor * (0 - v_expected);
  END IF;

  -- Update rating
  UPDATE player_skill_profiles
  SET
    skill_rating = v_current_rating + v_rating_change,
    skill_uncertainty = GREATEST(50, v_uncertainty * 0.98), -- Reduce uncertainty over time
    games_played = games_played + 1,
    last_updated_at = NOW()
  WHERE user_id = p_user_id AND game_id = p_game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar players by embedding
CREATE OR REPLACE FUNCTION find_similar_players(
  p_user_id UUID,
  p_game_id TEXT,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  skill_rating DECIMAL,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    psp.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    psp.skill_rating,
    1 - (psp.ai_embedding <=> (
      SELECT ai_embedding FROM player_skill_profiles
      WHERE user_id = p_user_id AND game_id = p_game_id
    )) as similarity_score
  FROM player_skill_profiles psp
  JOIN profiles p ON p.id = psp.user_id
  WHERE psp.game_id = p_game_id
    AND psp.user_id != p_user_id
    AND psp.ai_embedding IS NOT NULL
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to a suggestion
CREATE OR REPLACE FUNCTION respond_to_suggestion(
  p_suggestion_id UUID,
  p_user_id UUID,
  p_response TEXT, -- 'accepted', 'declined'
  p_feedback TEXT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE match_suggestions
  SET
    status = p_response,
    user_feedback = p_feedback,
    feedback_comment = p_comment
  WHERE id = p_suggestion_id
    AND user_id = p_user_id
    AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_updated_at
CREATE TRIGGER player_skill_profiles_updated_at
  BEFORE UPDATE ON player_skill_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();
-- Bot/Automation System Migration
-- Discord integration, notifications, and automation rules

-- Enum for notification channels
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'discord', 'push');

-- Enum for notification types
CREATE TYPE notification_type AS ENUM (
  'match_reminder',
  'tournament_start',
  'clan_invite',
  'friend_request',
  'achievement_earned',
  'level_up',
  'battle_pass_reward',
  'stream_live',
  'forum_reply',
  'direct_message',
  'system_announcement'
);

-- Enum for automation trigger types
CREATE TYPE automation_trigger AS ENUM (
  'member_joined',
  'member_left',
  'match_scheduled',
  'match_completed',
  'tournament_created',
  'achievement_unlocked',
  'level_milestone',
  'weekly_summary'
);

-- Enum for automation action types
CREATE TYPE automation_action AS ENUM (
  'send_discord_message',
  'send_notification',
  'assign_role',
  'update_channel_topic',
  'create_event',
  'post_announcement'
);

-- Discord connections (user-level)
CREATE TABLE discord_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discord_user_id TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  discord_discriminator TEXT,
  discord_avatar TEXT,
  discord_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  guilds JSONB DEFAULT '[]', -- Cached list of mutual guilds
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(discord_user_id)
);

-- Discord guild connections (clan-level)
CREATE TABLE discord_guild_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  guild_name TEXT NOT NULL,
  guild_icon TEXT,
  connected_by UUID NOT NULL REFERENCES profiles(id),
  bot_permissions BIGINT DEFAULT 0,
  webhook_url TEXT,
  webhook_id TEXT,
  webhook_token TEXT,
  notification_channel_id TEXT,
  announcement_channel_id TEXT,
  log_channel_id TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clan_id),
  UNIQUE(guild_id)
);

-- Index for guild lookups
CREATE INDEX idx_discord_guild_connections_guild ON discord_guild_connections(guild_id);

-- User notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  is_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME, -- e.g., 22:00
  quiet_hours_end TIME,   -- e.g., 08:00
  frequency TEXT DEFAULT 'instant', -- 'instant', 'hourly_digest', 'daily_digest'
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

-- Notifications table (in-app notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT,
  image_url TEXT,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- Scheduled notifications (for reminders, digests)
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channels notification_channel[] NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT scheduled_notifications_target CHECK (user_id IS NOT NULL OR clan_id IS NOT NULL)
);

-- Index for scheduled notifications processing
CREATE INDEX idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for)
  WHERE is_sent = false AND is_cancelled = false;

-- Automation rules (clan-level)
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type automation_trigger NOT NULL,
  trigger_conditions JSONB DEFAULT '{}', -- Additional conditions for trigger
  action_type automation_action NOT NULL,
  action_config JSONB NOT NULL, -- Configuration for the action
  is_enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 0, -- Prevent spam
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for automation rules
CREATE INDEX idx_automation_rules_clan ON automation_rules(clan_id, is_enabled);
CREATE INDEX idx_automation_rules_trigger ON automation_rules(trigger_type) WHERE is_enabled = true;

-- Automation execution log
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  action_result JSONB,
  is_success BOOLEAN NOT NULL,
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for automation logs
CREATE INDEX idx_automation_logs_rule ON automation_logs(rule_id, executed_at DESC);
CREATE INDEX idx_automation_logs_clan ON automation_logs(clan_id, executed_at DESC);

-- Discord slash command interactions log
CREATE TABLE discord_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id TEXT NOT NULL,
  interaction_type INTEGER NOT NULL,
  guild_id TEXT,
  channel_id TEXT,
  user_id TEXT NOT NULL,
  gamerhub_user_id UUID REFERENCES profiles(id),
  command_name TEXT,
  command_options JSONB DEFAULT '{}',
  response_type TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(interaction_id)
);

-- Index for interaction lookups
CREATE INDEX idx_discord_interactions_user ON discord_interactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE discord_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_guild_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discord_connections
CREATE POLICY "Users can view their own discord connection"
  ON discord_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own discord connection"
  ON discord_connections FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for discord_guild_connections
CREATE POLICY "Clan members can view guild connections"
  ON discord_guild_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = discord_guild_connections.clan_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Clan admins can manage guild connections"
  ON discord_guild_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = discord_guild_connections.clan_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for scheduled_notifications
CREATE POLICY "Users can view their scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  USING (true);

-- RLS Policies for automation_rules
CREATE POLICY "Clan members can view automation rules"
  ON automation_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = automation_rules.clan_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Clan admins can manage automation rules"
  ON automation_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = automation_rules.clan_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for automation_logs
CREATE POLICY "Clan admins can view automation logs"
  ON automation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = automation_logs.clan_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for discord_interactions
CREATE POLICY "Users can view their own interactions"
  ON discord_interactions FOR SELECT
  USING (auth.uid() = gamerhub_user_id);

-- Function to get user notifications with pagination
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  type notification_type,
  title TEXT,
  body TEXT,
  icon TEXT,
  image_url TEXT,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH unread AS (
    SELECT COUNT(*) as cnt FROM notifications n
    WHERE n.user_id = p_user_id AND n.is_read = false AND n.is_archived = false
  )
  SELECT
    n.id,
    n.type,
    n.title,
    n.body,
    n.icon,
    n.image_url,
    n.action_url,
    n.action_label,
    n.metadata,
    n.is_read,
    n.created_at,
    u.cnt as unread_count
  FROM notifications n, unread u
  WHERE n.user_id = p_user_id
    AND n.is_archived = false
    AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND is_read = false;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs RECORD;
BEGIN
  -- Check user preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id AND notification_type = p_type;

  -- If disabled, don't create
  IF v_prefs IS NOT NULL AND NOT v_prefs.is_enabled THEN
    RETURN NULL;
  END IF;

  -- Check quiet hours
  IF v_prefs IS NOT NULL
     AND v_prefs.quiet_hours_start IS NOT NULL
     AND v_prefs.quiet_hours_end IS NOT NULL THEN
    IF CURRENT_TIME BETWEEN v_prefs.quiet_hours_start AND v_prefs.quiet_hours_end THEN
      -- Schedule for later instead of immediate
      INSERT INTO scheduled_notifications (
        user_id, type, channels, title, body, metadata, scheduled_for
      ) VALUES (
        p_user_id, p_type, v_prefs.channels, p_title, p_body, p_metadata,
        CURRENT_DATE + v_prefs.quiet_hours_end + INTERVAL '1 minute'
      );
      RETURN NULL;
    END IF;
  END IF;

  -- Create in-app notification
  INSERT INTO notifications (
    user_id, type, title, body, icon, action_url, action_label, metadata
  ) VALUES (
    p_user_id, p_type, p_title, p_body, p_icon, p_action_url, p_action_label, p_metadata
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute automation rule
CREATE OR REPLACE FUNCTION execute_automation_rule(
  p_rule_id UUID,
  p_trigger_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_rule RECORD;
  v_log_id UUID;
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := clock_timestamp();

  -- Get rule
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id AND is_enabled = true;

  IF v_rule IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check cooldown
  IF v_rule.cooldown_minutes > 0
     AND v_rule.last_triggered_at IS NOT NULL
     AND v_rule.last_triggered_at + (v_rule.cooldown_minutes || ' minutes')::INTERVAL > NOW() THEN
    RETURN NULL;
  END IF;

  -- Log execution (actual action happens via Edge Function)
  INSERT INTO automation_logs (
    rule_id, clan_id, trigger_data, is_success, execution_time_ms
  ) VALUES (
    p_rule_id, v_rule.clan_id, p_trigger_data, true,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER
  ) RETURNING id INTO v_log_id;

  -- Update rule stats
  UPDATE automation_rules
  SET last_triggered_at = NOW(), trigger_count = trigger_count + 1
  WHERE id = p_rule_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get automation rules for a trigger
CREATE OR REPLACE FUNCTION get_rules_for_trigger(
  p_clan_id UUID,
  p_trigger_type automation_trigger
)
RETURNS TABLE (
  rule_id UUID,
  name TEXT,
  action_type automation_action,
  action_config JSONB,
  trigger_conditions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id as rule_id,
    ar.name,
    ar.action_type,
    ar.action_config,
    ar.trigger_conditions
  FROM automation_rules ar
  WHERE ar.clan_id = p_clan_id
    AND ar.trigger_type = p_trigger_type
    AND ar.is_enabled = true
    AND (
      ar.cooldown_minutes = 0
      OR ar.last_triggered_at IS NULL
      OR ar.last_triggered_at + (ar.cooldown_minutes || ' minutes')::INTERVAL <= NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default notification preferences for new users (via trigger)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, notification_type, channels, is_enabled)
  VALUES
    (NEW.id, 'match_reminder', ARRAY['in_app', 'email']::notification_channel[], true),
    (NEW.id, 'tournament_start', ARRAY['in_app', 'email']::notification_channel[], true),
    (NEW.id, 'clan_invite', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'friend_request', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'achievement_earned', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'level_up', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'battle_pass_reward', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'stream_live', ARRAY['in_app']::notification_channel[], false),
    (NEW.id, 'forum_reply', ARRAY['in_app', 'email']::notification_channel[], true),
    (NEW.id, 'direct_message', ARRAY['in_app']::notification_channel[], true),
    (NEW.id, 'system_announcement', ARRAY['in_app', 'email']::notification_channel[], true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_notification_prefs
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Trigger to update timestamps
CREATE TRIGGER discord_connections_updated_at
  BEFORE UPDATE ON discord_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER discord_guild_connections_updated_at
  BEFORE UPDATE ON discord_guild_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- GamerHub LFG (Looking For Group/Teammates) System
-- Migration: 017_lfg.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Game Roles (CS2, Valorant, etc. specific roles)
CREATE TABLE public.game_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, name)
);

-- 2. LFG Posts (main table for looking-for-group posts)
CREATE TABLE public.lfg_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Post details
  title VARCHAR(100) NOT NULL,
  description TEXT,

  -- Creator's role/rank for this session
  creator_role VARCHAR(50),
  creator_rating INTEGER,
  creator_is_unranked BOOLEAN DEFAULT false,

  -- Looking for criteria
  looking_for_roles TEXT[] DEFAULT '{}',
  min_rating INTEGER,
  max_rating INTEGER,
  accept_unranked BOOLEAN DEFAULT true,

  -- Game settings
  game_mode VARCHAR(50),
  region VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  voice_required BOOLEAN DEFAULT false,

  -- Party slots
  current_players INTEGER DEFAULT 1,
  max_players INTEGER DEFAULT 5,

  -- Visibility/timing
  duration_type VARCHAR(20) DEFAULT '2hr' CHECK (duration_type IN ('1hr', '2hr', '4hr', '8hr', 'until_full')),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'full', 'expired', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LFG Applications (users applying to join)
CREATE TABLE public.lfg_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.lfg_posts(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  applicant_role VARCHAR(50),
  applicant_rating INTEGER,
  applicant_is_unranked BOOLEAN DEFAULT false,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(post_id, applicant_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_game_roles_game ON public.game_roles(game_id);
CREATE INDEX idx_lfg_posts_creator ON public.lfg_posts(creator_id);
CREATE INDEX idx_lfg_posts_game ON public.lfg_posts(game_id);
CREATE INDEX idx_lfg_posts_status ON public.lfg_posts(status);
CREATE INDEX idx_lfg_posts_expires ON public.lfg_posts(expires_at);
CREATE INDEX idx_lfg_posts_region ON public.lfg_posts(region);
CREATE INDEX idx_lfg_posts_active ON public.lfg_posts(status, expires_at) WHERE status = 'active';
CREATE INDEX idx_lfg_applications_post ON public.lfg_applications(post_id);
CREATE INDEX idx_lfg_applications_applicant ON public.lfg_applications(applicant_id);
CREATE INDEX idx_lfg_applications_status ON public.lfg_applications(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.game_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_applications ENABLE ROW LEVEL SECURITY;

-- Game roles: Everyone can read
CREATE POLICY "Game roles are viewable by everyone"
  ON public.game_roles FOR SELECT
  USING (true);

-- LFG Posts: Active posts are viewable by everyone
CREATE POLICY "Active LFG posts are viewable by everyone"
  ON public.lfg_posts FOR SELECT
  USING (status = 'active' AND expires_at > NOW() OR creator_id = auth.uid());

-- LFG Posts: Users can create their own posts
CREATE POLICY "Users can create LFG posts"
  ON public.lfg_posts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- LFG Posts: Users can update their own posts
CREATE POLICY "Users can update their own LFG posts"
  ON public.lfg_posts FOR UPDATE
  USING (auth.uid() = creator_id);

-- LFG Posts: Users can delete their own posts
CREATE POLICY "Users can delete their own LFG posts"
  ON public.lfg_posts FOR DELETE
  USING (auth.uid() = creator_id);

-- LFG Applications: Post creators can view applications
CREATE POLICY "Post creators can view applications"
  ON public.lfg_applications FOR SELECT
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.lfg_posts
      WHERE id = post_id AND creator_id = auth.uid()
    )
  );

-- LFG Applications: Users can apply to posts
CREATE POLICY "Users can apply to LFG posts"
  ON public.lfg_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- LFG Applications: Post creators can update application status
CREATE POLICY "Post creators can update applications"
  ON public.lfg_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lfg_posts
      WHERE id = post_id AND creator_id = auth.uid()
    )
  );

-- LFG Applications: Applicants can delete their own applications
CREATE POLICY "Applicants can delete their applications"
  ON public.lfg_applications FOR DELETE
  USING (applicant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-expire LFG posts
CREATE OR REPLACE FUNCTION expire_lfg_posts()
RETURNS void AS $$
BEGIN
  UPDATE public.lfg_posts
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update current_players count
CREATE OR REPLACE FUNCTION update_lfg_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE public.lfg_posts
    SET current_players = current_players + 1,
        status = CASE
          WHEN current_players + 1 >= max_players THEN 'full'
          ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    UPDATE public.lfg_posts
    SET current_players = current_players + 1,
        status = CASE
          WHEN current_players + 1 >= max_players THEN 'full'
          ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    UPDATE public.lfg_posts
    SET current_players = GREATEST(1, current_players - 1),
        status = CASE
          WHEN status = 'full' THEN 'active'
          ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for player count updates
CREATE TRIGGER on_lfg_application_change
  AFTER INSERT OR UPDATE ON public.lfg_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_lfg_player_count();

-- ============================================
-- SEED DATA: Game Roles
-- ============================================

-- CS2 Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'entry_fragger', 'Entry Fragger', 'First into sites, creates openings for the team', 1
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'awper', 'AWPer', 'Sniper specialist, controls long-range angles', 2
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls strategies and coordinates team', 3
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides utility and flash support for teammates', 4
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'lurker', 'Lurker', 'Flanks and picks off rotations, gathers information', 5
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'clutcher', 'Clutcher', 'Specializes in winning 1vX situations under pressure', 6
FROM public.games WHERE slug = 'cs2'
ON CONFLICT DO NOTHING;

-- Valorant Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'duelist', 'Duelist', 'Entry fraggers who create space for the team', 1
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'initiator', 'Initiator', 'Gathers info and sets up team executes', 2
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'controller', 'Controller', 'Controls areas with smokes and utility', 3
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'sentinel', 'Sentinel', 'Defensive anchor, watches flanks and heals', 4
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls strategies', 5
FROM public.games WHERE slug = 'valorant'
ON CONFLICT DO NOTHING;

-- PUBG Mobile Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'fragger', 'Fragger', 'Aggressive player focused on kills', 1
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides backup and cover fire', 2
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'scout', 'Scout', 'Scouts positions and gathers information', 3
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls rotations and strategy', 4
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT DO NOTHING;

-- Free Fire Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'rusher', 'Rusher', 'Aggressive front-line attacker', 1
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Heals and provides utility', 2
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'sniper', 'Sniper', 'Long-range damage dealer', 3
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'defuser', 'Defuser', 'Handles bomb defusal and objective plays', 4
FROM public.games WHERE slug = 'freefire'
ON CONFLICT DO NOTHING;

-- Clash of Clans Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'war_specialist', 'War Specialist', 'Excels in clan war attacks', 1
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'donator', 'Donator', 'Actively donates troops and resources', 2
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'clan_leader', 'Clan Leader', 'Leads and organizes the clan', 3
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'base_builder', 'Base Builder', 'Specializes in base layout design', 4
FROM public.games WHERE slug = 'coc'
ON CONFLICT DO NOTHING;

-- COD Mobile Roles
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'slayer', 'Slayer', 'Primary kill-focused player', 1
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'obj', 'OBJ', 'Objective-focused player', 2
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'anchor', 'Anchor', 'Holds spawns and map control', 3
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides utility and team support', 4
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT DO NOTHING;
-- GamerHub Blog/News System (HLTV-style)
-- Migration: 018_blog.sql

-- ============================================
-- TABLES
-- ============================================

-- 1. Blog Authors (users with publishing permissions)
CREATE TABLE public.blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role VARCHAR(30) DEFAULT 'contributor' CHECK (role IN ('contributor', 'journalist', 'editor', 'admin')),
  bio TEXT,
  can_publish_directly BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  articles_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blog Posts
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Content
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,

  -- Categorization
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('news', 'interview', 'analysis', 'match_report', 'opinion', 'transfer', 'guide', 'announcement')),
  tags TEXT[] DEFAULT '{}',

  -- Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- SEO
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),

  -- Flags
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blog Comments
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blog Likes (posts)
CREATE TABLE public.blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 5. Blog Comment Likes
CREATE TABLE public.blog_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 6. Blog Bookmarks (saved posts)
CREATE TABLE public.blog_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_blog_authors_user ON public.blog_authors(user_id);
CREATE INDEX idx_blog_authors_role ON public.blog_authors(role);

CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_game ON public.blog_posts(game_id);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_featured ON public.blog_posts(is_featured, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING GIN(tags);

CREATE INDEX idx_blog_comments_post ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_author ON public.blog_comments(author_id);
CREATE INDEX idx_blog_comments_parent ON public.blog_comments(parent_id);

CREATE INDEX idx_blog_likes_post ON public.blog_likes(post_id);
CREATE INDEX idx_blog_likes_user ON public.blog_likes(user_id);

CREATE INDEX idx_blog_bookmarks_user ON public.blog_bookmarks(user_id);
CREATE INDEX idx_blog_bookmarks_post ON public.blog_bookmarks(post_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_bookmarks ENABLE ROW LEVEL SECURITY;

-- Blog Authors: Everyone can view authors
CREATE POLICY "Blog authors are viewable by everyone"
  ON public.blog_authors FOR SELECT
  USING (true);

-- Blog Authors: Only admins can manage authors (simplified - use service role)
CREATE POLICY "Authors can update their own bio"
  ON public.blog_authors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Blog Posts: Published posts are viewable by everyone
CREATE POLICY "Published blog posts are viewable by everyone"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

-- Blog Posts: Authors can create posts
CREATE POLICY "Authors can create blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.blog_authors WHERE user_id = auth.uid())
  );

-- Blog Posts: Authors can update their own posts
CREATE POLICY "Authors can update their own posts"
  ON public.blog_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Blog Posts: Authors can delete their own drafts
CREATE POLICY "Authors can delete their own drafts"
  ON public.blog_posts FOR DELETE
  USING (auth.uid() = author_id AND status = 'draft');

-- Blog Comments: Visible comments are viewable by everyone
CREATE POLICY "Visible comments are viewable by everyone"
  ON public.blog_comments FOR SELECT
  USING (status = 'visible' OR author_id = auth.uid());

-- Blog Comments: Authenticated users can comment
CREATE POLICY "Authenticated users can comment"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Blog Comments: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.blog_comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Blog Comments: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.blog_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Blog Likes: Everyone can view like counts (via aggregate)
CREATE POLICY "Users can view their own likes"
  ON public.blog_likes FOR SELECT
  USING (user_id = auth.uid());

-- Blog Likes: Authenticated users can like
CREATE POLICY "Authenticated users can like posts"
  ON public.blog_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Blog Likes: Users can remove their likes
CREATE POLICY "Users can remove their likes"
  ON public.blog_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comment Likes: Same policies
CREATE POLICY "Users can view their comment likes"
  ON public.blog_comment_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like comments"
  ON public.blog_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their comment likes"
  ON public.blog_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Bookmarks: Users manage their own bookmarks
CREATE POLICY "Users can view their bookmarks"
  ON public.blog_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookmarks"
  ON public.blog_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
  ON public.blog_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_blog_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  base_slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := SUBSTRING(base_slug FROM 1 FOR 200);

  new_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_slug_before_insert
  BEFORE INSERT ON public.blog_posts
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_blog_slug();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_blog_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_like_change
  AFTER INSERT OR DELETE ON public.blog_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_likes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_blog_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_comment_change
  AFTER INSERT OR DELETE ON public.blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_comments_count();

-- Function to update author article count
CREATE OR REPLACE FUNCTION update_blog_author_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = articles_count + 1
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = articles_count + 1
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status != 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = GREATEST(0, articles_count - 1)
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE public.blog_authors
    SET articles_count = GREATEST(0, articles_count - 1)
    WHERE user_id = OLD.author_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_blog_post_publish
  AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_author_count();

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.blog_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_view(post_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.blog_posts
  SET views_count = views_count + 1
  WHERE slug = post_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- GamerHub LFG Game-Specific Fields Migration
-- Migration: 019_lfg_game_specific.sql
-- Adds support for game-specific LFG fields (ranks, agents, maps, perspectives)

-- ============================================
-- ADD NEW COLUMNS TO LFG_POSTS
-- ============================================

-- Add rank columns for tier-based games (Valorant, PUBG Mobile, Free Fire, etc.)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS creator_rank VARCHAR(50),
ADD COLUMN IF NOT EXISTS min_rank VARCHAR(50),
ADD COLUMN IF NOT EXISTS max_rank VARCHAR(50);

-- Add agent/character column (for Valorant, Free Fire)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS creator_agent VARCHAR(50);

-- Add map preference (for BR games like PUBG Mobile, Free Fire)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS map_preference VARCHAR(50);

-- Add perspective (for PUBG Mobile - TPP/FPP)
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS perspective VARCHAR(10);

-- ============================================
-- ADD NEW COLUMNS TO LFG_APPLICATIONS
-- ============================================

-- Add rank column for tier-based games
ALTER TABLE public.lfg_applications
ADD COLUMN IF NOT EXISTS applicant_rank VARCHAR(50);

-- Add agent/character column
ALTER TABLE public.lfg_applications
ADD COLUMN IF NOT EXISTS applicant_agent VARCHAR(50);

-- ============================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lfg_posts_creator_rank ON public.lfg_posts(creator_rank);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_game_mode ON public.lfg_posts(game_mode);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_map ON public.lfg_posts(map_preference);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_perspective ON public.lfg_posts(perspective);

-- ============================================
-- ADD ADDITIONAL GAME ROLES
-- ============================================

-- PUBG Mobile Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'fragger', 'Fragger', 'Aggressive player focused on kills', 1
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides backup and cover fire', 2
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'scout', 'Scout', 'Scouts positions and gathers information', 3
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'igl', 'IGL', 'In-Game Leader, calls rotations and strategy', 4
FROM public.games WHERE slug = 'pubg-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

-- Free Fire Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'rusher', 'Rusher', 'Aggressive front-line attacker', 1
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Heals and provides utility', 2
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'sniper', 'Sniper', 'Long-range damage dealer', 3
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'defuser', 'Defuser', 'Handles bomb defusal and objective plays', 4
FROM public.games WHERE slug = 'freefire'
ON CONFLICT (game_id, name) DO NOTHING;

-- Clash of Clans Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'war_specialist', 'War Specialist', 'Excels in clan war attacks', 1
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'donator', 'Donator', 'Actively donates troops and resources', 2
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'clan_leader', 'Clan Leader', 'Leads and organizes the clan', 3
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'base_builder', 'Base Builder', 'Specializes in base layout design', 4
FROM public.games WHERE slug = 'coc'
ON CONFLICT (game_id, name) DO NOTHING;

-- COD Mobile Roles (if not exists)
INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'slayer', 'Slayer', 'Primary kill-focused player', 1
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'obj', 'OBJ', 'Objective-focused player', 2
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'anchor', 'Anchor', 'Holds spawns and map control', 3
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

INSERT INTO public.game_roles (game_id, name, display_name, description, sort_order)
SELECT id, 'support', 'Support', 'Provides utility and team support', 4
FROM public.games WHERE slug = 'cod-mobile'
ON CONFLICT (game_id, name) DO NOTHING;

-- ============================================
-- COMMENT ON COLUMNS
-- ============================================

COMMENT ON COLUMN public.lfg_posts.creator_rank IS 'Tier-based rank for games like Valorant, PUBG Mobile, Free Fire (e.g., "gold1", "diamond3")';
COMMENT ON COLUMN public.lfg_posts.min_rank IS 'Minimum rank requirement for tier-based games';
COMMENT ON COLUMN public.lfg_posts.max_rank IS 'Maximum rank requirement for tier-based games';
COMMENT ON COLUMN public.lfg_posts.creator_agent IS 'Selected agent/character for games like Valorant, Free Fire';
COMMENT ON COLUMN public.lfg_posts.map_preference IS 'Preferred map for BR games like PUBG Mobile, Free Fire';
COMMENT ON COLUMN public.lfg_posts.perspective IS 'Camera perspective for PUBG Mobile (tpp/fpp)';
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
-- Account Verification & Bot Prevention System
-- Migration 021

-- ============================================
-- PHONE VERIFICATION
-- ============================================
CREATE TABLE public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) NOT NULL,
  verification_code VARCHAR(6),
  code_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(phone_number)
);

-- ============================================
-- ACCOUNT VERIFICATION STATUS
-- ============================================
CREATE TABLE public.account_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Verification statuses
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  game_account_verified BOOLEAN DEFAULT false,
  -- Verified accounts tracking
  verified_game_accounts TEXT[] DEFAULT '{}',
  verified_platforms TEXT[] DEFAULT '{}', -- 'steam', 'riot', 'discord', etc.
  -- Verification level (composite score)
  verification_level INTEGER DEFAULT 0, -- 0=none, 1=email, 2=phone, 3=game, 4=full
  -- Trust scoring
  trust_score INTEGER DEFAULT 50, -- 0-100 scale
  trust_factors JSONB DEFAULT '{}', -- {account_age: 10, games_linked: 20, phone: 30, ...}
  -- Account age tracking
  account_age_days INTEGER DEFAULT 0,
  -- Flags
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  flagged_at TIMESTAMPTZ,
  flagged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- CAPTCHA requirements
  captcha_required BOOLEAN DEFAULT false,
  captcha_required_until TIMESTAMPTZ,
  last_captcha_solve TIMESTAMPTZ,
  captcha_failures INTEGER DEFAULT 0,
  -- Restrictions
  is_restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT,
  restriction_expires_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BEHAVIORAL SIGNALS (Anti-Bot Detection)
-- ============================================
CREATE TABLE public.behavioral_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  signal_type VARCHAR(50) NOT NULL, -- 'rapid_messages', 'profile_view_pattern', 'lfg_spam', 'suspicious_login', etc.
  signal_data JSONB DEFAULT '{}', -- Detailed signal information
  risk_score INTEGER DEFAULT 0, -- 0-100 contribution to overall risk
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  action_taken VARCHAR(50), -- 'none', 'captcha_required', 'flagged', 'restricted'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER REPORTS
-- ============================================
CREATE TABLE public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Report details
  report_type VARCHAR(50) NOT NULL, -- 'bot', 'fake_account', 'harassment', 'spam', 'toxic', 'cheating', 'impersonation', 'other'
  report_category VARCHAR(50), -- Sub-category for more detail
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  -- Context
  context_type VARCHAR(30), -- 'match', 'chat', 'lfg', 'profile', 'clan'
  context_id UUID, -- ID of the related entity
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed', 'escalated')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  -- Resolution
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_note TEXT,
  resolution_action VARCHAR(50), -- 'no_action', 'warning', 'temp_ban', 'permanent_ban', 'restriction'
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- VERIFIED BADGES
-- ============================================
CREATE TABLE public.verified_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type VARCHAR(50) NOT NULL, -- 'phone_verified', 'email_verified', 'game_verified', 'streamer', 'pro_player', 'content_creator', 'tournament_winner'
  -- Game-specific verification
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  external_username VARCHAR(100),
  external_id VARCHAR(200),
  -- Badge details
  display_name VARCHAR(100),
  icon_url TEXT,
  -- Verification
  verification_method VARCHAR(50), -- 'oauth', 'manual', 'api', 'phone_sms'
  verification_data JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- For manual verifications
  -- Expiry (for time-limited badges)
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type, game_id)
);

-- ============================================
-- BLOCKED USERS
-- ============================================
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- ============================================
-- IP/DEVICE TRACKING (For Anti-Abuse)
-- ============================================
CREATE TABLE public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ip_address INET,
  ip_hash VARCHAR(64), -- Hashed IP for privacy
  user_agent TEXT,
  device_fingerprint VARCHAR(64),
  country_code VARCHAR(2),
  city VARCHAR(100),
  is_suspicious BOOLEAN DEFAULT false,
  suspicion_reason TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_phone_verifications_user ON phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_phone ON phone_verifications(phone_number);

CREATE INDEX idx_account_verifications_user ON account_verifications(user_id);
CREATE INDEX idx_account_verifications_level ON account_verifications(verification_level);
CREATE INDEX idx_account_verifications_trust ON account_verifications(trust_score);
CREATE INDEX idx_account_verifications_flagged ON account_verifications(is_flagged) WHERE is_flagged = true;

CREATE INDEX idx_behavioral_signals_user ON behavioral_signals(user_id);
CREATE INDEX idx_behavioral_signals_type ON behavioral_signals(signal_type);
CREATE INDEX idx_behavioral_signals_created ON behavioral_signals(created_at DESC);
CREATE INDEX idx_behavioral_signals_unprocessed ON behavioral_signals(is_processed) WHERE is_processed = false;

CREATE INDEX idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_type ON user_reports(report_type);
CREATE INDEX idx_user_reports_created ON user_reports(created_at DESC);

CREATE INDEX idx_verified_badges_user ON verified_badges(user_id);
CREATE INDEX idx_verified_badges_type ON verified_badges(badge_type);
CREATE INDEX idx_verified_badges_game ON verified_badges(game_id);
CREATE INDEX idx_verified_badges_active ON verified_badges(is_active) WHERE is_active = true;

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_id);

CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_ip ON login_history(ip_hash);
CREATE INDEX idx_login_history_device ON login_history(device_fingerprint);
CREATE INDEX idx_login_history_suspicious ON login_history(is_suspicious) WHERE is_suspicious = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Phone Verifications
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own phone verification"
  ON phone_verifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own phone verification"
  ON phone_verifications FOR ALL
  USING (user_id = auth.uid());

-- Account Verifications
ALTER TABLE account_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification status"
  ON account_verifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Public can view verification level for trust"
  ON account_verifications FOR SELECT
  USING (true); -- Allow public view of verification level only

-- Behavioral Signals (Admin only via service role)
ALTER TABLE behavioral_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signals"
  ON behavioral_signals FOR SELECT
  USING (user_id = auth.uid());

-- User Reports
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports they created"
  ON user_reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Verified Badges
ALTER TABLE verified_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified badges are viewable by everyone"
  ON verified_badges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view all their own badges"
  ON verified_badges FOR SELECT
  USING (user_id = auth.uid());

-- Blocked Users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocked list"
  ON blocked_users FOR SELECT
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- Login History
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login history"
  ON login_history FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_factors JSONB := '{}';
  v_account_age INTEGER;
  v_email_verified BOOLEAN;
  v_phone_verified BOOLEAN;
  v_games_linked INTEGER;
  v_positive_ratings INTEGER;
  v_reports_confirmed INTEGER;
BEGIN
  -- Get account age (max 20 points)
  SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER INTO v_account_age
  FROM profiles WHERE id = p_user_id;

  v_factors := v_factors || jsonb_build_object('account_age', LEAST(v_account_age / 30, 20));
  v_score := v_score + LEAST(v_account_age / 30, 20);

  -- Get email verification status (10 points)
  SELECT email_verified, phone_verified INTO v_email_verified, v_phone_verified
  FROM account_verifications WHERE user_id = p_user_id;

  IF v_email_verified THEN
    v_factors := v_factors || jsonb_build_object('email_verified', 10);
    v_score := v_score + 10;
  END IF;

  -- Get phone verification status (30 points)
  IF v_phone_verified THEN
    v_factors := v_factors || jsonb_build_object('phone_verified', 30);
    v_score := v_score + 30;
  END IF;

  -- Count linked games (max 20 points, 5 per game)
  SELECT COUNT(*) INTO v_games_linked
  FROM user_games WHERE user_id = p_user_id AND is_verified = true;

  v_factors := v_factors || jsonb_build_object('verified_games', LEAST(v_games_linked * 5, 20));
  v_score := v_score + LEAST(v_games_linked * 5, 20);

  -- Count positive ratings (max 20 points)
  SELECT COUNT(*) INTO v_positive_ratings
  FROM ratings WHERE rated_id = p_user_id
  AND (politeness + fair_play + communication + skill_consistency) / 4.0 >= 4;

  v_factors := v_factors || jsonb_build_object('positive_ratings', LEAST(v_positive_ratings, 20));
  v_score := v_score + LEAST(v_positive_ratings, 20);

  -- Deduct for confirmed reports (up to -50 points)
  SELECT COUNT(*) INTO v_reports_confirmed
  FROM user_reports WHERE reported_user_id = p_user_id AND status = 'resolved' AND resolution_action IS NOT NULL;

  v_factors := v_factors || jsonb_build_object('confirmed_reports', -LEAST(v_reports_confirmed * 10, 50));
  v_score := v_score - LEAST(v_reports_confirmed * 10, 50);

  -- Ensure score is between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Update the verification record
  UPDATE account_verifications
  SET trust_score = v_score, trust_factors = v_factors, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID, p_target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = p_user_id AND blocked_id = p_target_id)
       OR (blocker_id = p_target_id AND blocked_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user verification level
CREATE OR REPLACE FUNCTION get_verification_level(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_level INTEGER := 0;
  v_record RECORD;
BEGIN
  SELECT * INTO v_record FROM account_verifications WHERE user_id = p_user_id;

  IF v_record IS NULL THEN
    RETURN 0;
  END IF;

  IF v_record.email_verified THEN
    v_level := 1;
  END IF;

  IF v_record.phone_verified THEN
    v_level := 2;
  END IF;

  IF v_record.game_account_verified THEN
    v_level := 3;
  END IF;

  IF v_record.email_verified AND v_record.phone_verified AND v_record.game_account_verified THEN
    v_level := 4;
  END IF;

  RETURN v_level;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create account verification record when profile is created
CREATE OR REPLACE FUNCTION create_account_verification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO account_verifications (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_verification
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_account_verification();

-- Update updated_at on phone_verifications
CREATE TRIGGER update_phone_verifications_updated_at
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on account_verifications
CREATE TRIGGER update_account_verifications_updated_at
  BEFORE UPDATE ON account_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on user_reports
CREATE TRIGGER update_user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Discord Integration
-- Migration 022

-- ============================================
-- DISCORD SETTINGS
-- ============================================
CREATE TABLE public.discord_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Discord account info
  discord_user_id VARCHAR(30) NOT NULL UNIQUE,
  discord_username VARCHAR(100),
  discord_discriminator VARCHAR(10),
  discord_avatar_hash VARCHAR(100),
  discord_email VARCHAR(255),
  discord_access_token TEXT, -- Encrypted
  discord_refresh_token TEXT, -- Encrypted
  discord_token_expires_at TIMESTAMPTZ,
  -- Imported data
  guilds JSONB DEFAULT '[]', -- [{id, name, icon, owner}]
  -- Feature settings
  cross_post_lfg BOOLEAN DEFAULT false,
  cross_post_tournaments BOOLEAN DEFAULT false,
  cross_post_matches BOOLEAN DEFAULT false,
  rich_presence_enabled BOOLEAN DEFAULT false,
  show_discord_status BOOLEAN DEFAULT true,
  import_friends_enabled BOOLEAN DEFAULT false,
  share_activity BOOLEAN DEFAULT true,
  -- Webhook settings
  default_webhook_url TEXT,
  default_channel_id VARCHAR(30),
  default_guild_id VARCHAR(30),
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISCORD CROSSPOSTS
-- ============================================
CREATE TABLE public.discord_crossposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Content reference
  content_type VARCHAR(30) NOT NULL, -- 'lfg_post', 'tournament', 'match', 'clan_recruitment'
  content_id UUID NOT NULL,
  -- Discord message info
  discord_message_id VARCHAR(30),
  discord_channel_id VARCHAR(30) NOT NULL,
  discord_guild_id VARCHAR(30),
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'posted', 'failed', 'deleted'
  error_message TEXT,
  -- Timestamps
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, discord_channel_id)
);

-- ============================================
-- DISCORD FRIENDS (Imported)
-- ============================================
CREATE TABLE public.discord_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Discord friend info
  discord_friend_id VARCHAR(30) NOT NULL,
  discord_friend_username VARCHAR(100),
  discord_friend_discriminator VARCHAR(10),
  discord_friend_avatar VARCHAR(100),
  -- GamerHub mapping
  gamerhub_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_matched BOOLEAN DEFAULT false,
  -- Status
  invite_sent BOOLEAN DEFAULT false,
  invite_sent_at TIMESTAMPTZ,
  -- Timestamps
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, discord_friend_id)
);

-- ============================================
-- DISCORD WEBHOOKS (for servers)
-- ============================================
CREATE TABLE public.discord_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Webhook info
  webhook_url TEXT NOT NULL,
  webhook_id VARCHAR(30),
  webhook_token TEXT,
  -- Server info
  guild_id VARCHAR(30) NOT NULL,
  guild_name VARCHAR(100),
  channel_id VARCHAR(30) NOT NULL,
  channel_name VARCHAR(100),
  -- Settings
  is_active BOOLEAN DEFAULT true,
  post_lfg BOOLEAN DEFAULT true,
  post_tournaments BOOLEAN DEFAULT true,
  post_clan_recruitment BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guild_id, channel_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_discord_settings_user ON discord_settings(user_id);
CREATE INDEX idx_discord_settings_discord_id ON discord_settings(discord_user_id);

CREATE INDEX idx_discord_crossposts_user ON discord_crossposts(user_id);
CREATE INDEX idx_discord_crossposts_content ON discord_crossposts(content_type, content_id);
CREATE INDEX idx_discord_crossposts_status ON discord_crossposts(status);

CREATE INDEX idx_discord_friends_user ON discord_friends(user_id);
CREATE INDEX idx_discord_friends_matched ON discord_friends(is_matched) WHERE is_matched = true;
CREATE INDEX idx_discord_friends_gamerhub ON discord_friends(gamerhub_user_id) WHERE gamerhub_user_id IS NOT NULL;

CREATE INDEX idx_discord_webhooks_user ON discord_webhooks(user_id);
CREATE INDEX idx_discord_webhooks_guild ON discord_webhooks(guild_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Discord Settings
ALTER TABLE discord_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Discord settings"
  ON discord_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own Discord settings"
  ON discord_settings FOR ALL
  USING (user_id = auth.uid());

-- Discord Crossposts
ALTER TABLE discord_crossposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crossposts"
  ON discord_crossposts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own crossposts"
  ON discord_crossposts FOR ALL
  USING (user_id = auth.uid());

-- Discord Friends
ALTER TABLE discord_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Discord friends"
  ON discord_friends FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own Discord friends"
  ON discord_friends FOR ALL
  USING (user_id = auth.uid());

-- Discord Webhooks
ALTER TABLE discord_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhooks"
  ON discord_webhooks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own webhooks"
  ON discord_webhooks FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_discord_settings_updated_at
  BEFORE UPDATE ON discord_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_webhooks_updated_at
  BEFORE UPDATE ON discord_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to match Discord friends with GamerHub users
CREATE OR REPLACE FUNCTION match_discord_friends(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_matched_count INTEGER := 0;
BEGIN
  -- Update discord_friends where we can match discord_user_id
  UPDATE discord_friends df
  SET
    gamerhub_user_id = ds.user_id,
    is_matched = true
  FROM discord_settings ds
  WHERE df.user_id = p_user_id
    AND df.discord_friend_id = ds.discord_user_id
    AND df.gamerhub_user_id IS NULL;

  GET DIAGNOSTICS v_matched_count = ROW_COUNT;

  RETURN v_matched_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Console Platform Integration (PlayStation, Xbox, Nintendo)
-- Migration 023

-- ============================================
-- CONSOLE CONNECTIONS
-- ============================================
CREATE TABLE public.console_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Platform info
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('playstation', 'xbox', 'nintendo')),
  platform_user_id VARCHAR(100) NOT NULL,
  platform_username VARCHAR(100),
  platform_avatar_url TEXT,
  -- Platform-specific identifiers
  online_id VARCHAR(100), -- PSN Online ID, Xbox Gamertag, Nintendo Friend Code
  account_id VARCHAR(100), -- Internal platform account ID
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(30), -- 'oauth', 'manual', 'code'
  verified_at TIMESTAMPTZ,
  -- Status
  last_online_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  -- Games data
  games_owned TEXT[] DEFAULT '{}', -- List of owned game titles
  recent_games JSONB DEFAULT '[]', -- [{title, last_played, hours}]
  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform),
  UNIQUE(platform, platform_user_id)
);

-- ============================================
-- CROSSPLAY PARTIES
-- ============================================
CREATE TABLE public.crossplay_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  -- Party settings
  title VARCHAR(100),
  description TEXT,
  platforms_allowed TEXT[] DEFAULT ARRAY['pc', 'playstation', 'xbox', 'switch'],
  voice_platform VARCHAR(20) DEFAULT 'gamerhub', -- 'discord', 'game_native', 'gamerhub'
  voice_channel_link TEXT,
  -- Invite
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  max_members INTEGER DEFAULT 4,
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_game', 'closed')),
  current_members INTEGER DEFAULT 1,
  -- Activity
  game_started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '4 hours'
);

-- ============================================
-- CROSSPLAY PARTY MEMBERS
-- ============================================
CREATE TABLE public.crossplay_party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.crossplay_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Platform info
  platform VARCHAR(20) NOT NULL, -- 'pc', 'playstation', 'xbox', 'switch'
  platform_username VARCHAR(100),
  -- Role
  is_leader BOOLEAN DEFAULT false,
  can_invite BOOLEAN DEFAULT false,
  -- Status
  status VARCHAR(20) DEFAULT 'joined' CHECK (status IN ('joined', 'ready', 'in_game', 'away')),
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(party_id, user_id)
);

-- ============================================
-- PLATFORM FRIENDS
-- ============================================
CREATE TABLE public.platform_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Platform info
  platform VARCHAR(20) NOT NULL,
  platform_friend_id VARCHAR(100) NOT NULL,
  platform_friend_username VARCHAR(100),
  platform_friend_avatar TEXT,
  -- GamerHub mapping
  gamerhub_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_matched BOOLEAN DEFAULT false,
  -- Timestamps
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_friend_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_console_connections_user ON console_connections(user_id);
CREATE INDEX idx_console_connections_platform ON console_connections(platform);
CREATE INDEX idx_console_connections_online_id ON console_connections(online_id);
CREATE INDEX idx_console_connections_verified ON console_connections(is_verified) WHERE is_verified = true;

CREATE INDEX idx_crossplay_parties_creator ON crossplay_parties(creator_id);
CREATE INDEX idx_crossplay_parties_game ON crossplay_parties(game_id);
CREATE INDEX idx_crossplay_parties_status ON crossplay_parties(status);
CREATE INDEX idx_crossplay_parties_code ON crossplay_parties(invite_code);
CREATE INDEX idx_crossplay_parties_expires ON crossplay_parties(expires_at);

CREATE INDEX idx_crossplay_party_members_party ON crossplay_party_members(party_id);
CREATE INDEX idx_crossplay_party_members_user ON crossplay_party_members(user_id);

CREATE INDEX idx_platform_friends_user ON platform_friends(user_id);
CREATE INDEX idx_platform_friends_platform ON platform_friends(platform);
CREATE INDEX idx_platform_friends_matched ON platform_friends(is_matched) WHERE is_matched = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Console Connections
ALTER TABLE console_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own console connections"
  ON console_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Public can view verified console connections"
  ON console_connections FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users can manage their own console connections"
  ON console_connections FOR ALL
  USING (user_id = auth.uid());

-- Crossplay Parties
ALTER TABLE crossplay_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open parties"
  ON crossplay_parties FOR SELECT
  USING (status IN ('open', 'full') OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create parties"
  ON crossplay_parties FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their parties"
  ON crossplay_parties FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their parties"
  ON crossplay_parties FOR DELETE
  USING (creator_id = auth.uid());

-- Crossplay Party Members
ALTER TABLE crossplay_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members can view members"
  ON crossplay_party_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crossplay_party_members cpm
      WHERE cpm.party_id = crossplay_party_members.party_id
      AND cpm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM crossplay_parties cp
      WHERE cp.id = crossplay_party_members.party_id
      AND cp.status IN ('open', 'full')
    )
  );

CREATE POLICY "Users can join parties"
  ON crossplay_party_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their membership"
  ON crossplay_party_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave parties"
  ON crossplay_party_members FOR DELETE
  USING (user_id = auth.uid());

-- Platform Friends
ALTER TABLE platform_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own platform friends"
  ON platform_friends FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own platform friends"
  ON platform_friends FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_console_connections_updated_at
  BEFORE UPDATE ON console_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update party member count
CREATE OR REPLACE FUNCTION update_party_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE crossplay_parties
    SET current_members = current_members + 1,
        status = CASE WHEN current_members + 1 >= max_members THEN 'full' ELSE status END
    WHERE id = NEW.party_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE crossplay_parties
    SET current_members = GREATEST(1, current_members - 1),
        status = CASE WHEN status = 'full' THEN 'open' ELSE status END
    WHERE id = OLD.party_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_party_member_change
  AFTER INSERT OR DELETE ON crossplay_party_members
  FOR EACH ROW
  EXECUTE FUNCTION update_party_member_count();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate unique invite code
CREATE OR REPLACE FUNCTION generate_party_invite_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  v_code VARCHAR(20);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    v_code := upper(substr(md5(random()::text), 1, 8));

    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM crossplay_parties WHERE invite_code = v_code) INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Auto-expire old parties
CREATE OR REPLACE FUNCTION cleanup_expired_parties()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM crossplay_parties
  WHERE expires_at < NOW()
    AND status IN ('open', 'full');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Community & UGC Features
-- Migration 024

-- ============================================
-- GUIDES / TUTORIALS
-- ============================================
CREATE TABLE public.guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  content_type VARCHAR(20) DEFAULT 'guide' CHECK (content_type IN ('guide', 'tutorial', 'tier_list', 'build', 'tips')),
  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_read_time INTEGER, -- minutes
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'under_review')),
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.guide_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.guide_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, user_id)
);

CREATE TABLE public.guide_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, user_id)
);

-- ============================================
-- CLIPS / HIGHLIGHTS
-- ============================================
CREATE TABLE public.clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  -- Video metadata
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  -- Source
  source_platform VARCHAR(30), -- 'upload', 'twitch', 'youtube', 'medal'
  source_url TEXT,
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.clip_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES public.clips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'fire', 'poggers', 'insane', 'gg', 'sad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clip_id, user_id, reaction_type)
);

-- ============================================
-- COMMUNITY POLLS
-- ============================================
CREATE TABLE public.community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  question TEXT NOT NULL,
  description TEXT,
  poll_type VARCHAR(20) DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple')),
  options JSONB NOT NULL, -- [{id, text, vote_count}]
  -- Settings
  total_votes INTEGER DEFAULT 0,
  max_choices INTEGER DEFAULT 1, -- For multiple choice
  allow_add_options BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  show_results_before_vote BOOLEAN DEFAULT false,
  -- Timing
  ends_at TIMESTAMPTZ,
  is_closed BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  option_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- ============================================
-- COMMUNITY EVENTS
-- ============================================
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('meetup', 'watch_party', 'community_night', 'ama', 'tournament_watch', 'game_night', 'other')),
  -- Media
  banner_url TEXT,
  thumbnail_url TEXT,
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'UTC',
  -- Location
  location_type VARCHAR(20) DEFAULT 'online' CHECK (location_type IN ('online', 'in_person', 'hybrid')),
  location_details TEXT,
  online_link TEXT,
  -- Capacity
  max_attendees INTEGER,
  rsvp_count INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,
  -- Settings
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  allow_plus_one BOOLEAN DEFAULT false,
  -- Tags
  tags TEXT[] DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.community_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  plus_one INTEGER DEFAULT 0,
  notes TEXT,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- MEME GALLERY
-- ============================================
CREATE TABLE public.memes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  -- Content
  title VARCHAR(200),
  image_url TEXT NOT NULL,
  source_url TEXT, -- Original source if shared
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_nsfw BOOLEAN DEFAULT false,
  -- Engagement
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  -- Status
  is_public BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true, -- For moderation
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.meme_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id UUID REFERENCES public.memes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meme_id, user_id)
);

-- ============================================
-- COMMUNITY ACHIEVEMENTS
-- ============================================
CREATE TABLE public.community_achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(30) NOT NULL CHECK (category IN ('content_creator', 'helper', 'social', 'engagement', 'special')),
  -- Unlock criteria
  unlock_criteria JSONB NOT NULL, -- {type: 'guides_published', count: 5}
  -- Rewards
  points INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 0,
  badge_id UUID, -- Link to badge system
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_community_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.community_achievement_definitions(id) ON DELETE CASCADE NOT NULL,
  progress JSONB DEFAULT '{}', -- Track progress toward achievement
  earned_at TIMESTAMPTZ,
  is_earned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- COMMENTS (Shared across content types)
-- ============================================
CREATE TABLE public.content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Polymorphic reference
  content_type VARCHAR(30) NOT NULL, -- 'guide', 'clip', 'meme', 'event'
  content_id UUID NOT NULL,
  -- Content
  body TEXT NOT NULL,
  -- Threading
  parent_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0,
  -- Engagement
  like_count INTEGER DEFAULT 0,
  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_guides_author ON guides(author_id);
CREATE INDEX idx_guides_game ON guides(game_id);
CREATE INDEX idx_guides_status ON guides(status);
CREATE INDEX idx_guides_featured ON guides(is_featured) WHERE is_featured = true;
CREATE INDEX idx_guides_slug ON guides(slug);
CREATE INDEX idx_guides_created ON guides(created_at DESC);

CREATE INDEX idx_guide_sections_guide ON guide_sections(guide_id);
CREATE INDEX idx_guide_likes_guide ON guide_likes(guide_id);
CREATE INDEX idx_guide_likes_user ON guide_likes(user_id);

CREATE INDEX idx_clips_creator ON clips(creator_id);
CREATE INDEX idx_clips_game ON clips(game_id);
CREATE INDEX idx_clips_public ON clips(is_public) WHERE is_public = true;
CREATE INDEX idx_clips_created ON clips(created_at DESC);

CREATE INDEX idx_clip_reactions_clip ON clip_reactions(clip_id);
CREATE INDEX idx_clip_reactions_user ON clip_reactions(user_id);

CREATE INDEX idx_polls_creator ON community_polls(creator_id);
CREATE INDEX idx_polls_game ON community_polls(game_id);
CREATE INDEX idx_polls_active ON community_polls(is_closed) WHERE is_closed = false;

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

CREATE INDEX idx_events_creator ON community_events(creator_id);
CREATE INDEX idx_events_game ON community_events(game_id);
CREATE INDEX idx_events_starts ON community_events(starts_at);
CREATE INDEX idx_events_public ON community_events(is_public) WHERE is_public = true;

CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);

CREATE INDEX idx_memes_creator ON memes(creator_id);
CREATE INDEX idx_memes_game ON memes(game_id);
CREATE INDEX idx_memes_public ON memes(is_public) WHERE is_public = true;
CREATE INDEX idx_memes_created ON memes(created_at DESC);

CREATE INDEX idx_community_achievements_slug ON community_achievement_definitions(slug);
CREATE INDEX idx_user_community_achievements_user ON user_community_achievements(user_id);
CREATE INDEX idx_user_community_achievements_earned ON user_community_achievements(is_earned) WHERE is_earned = true;

CREATE INDEX idx_content_comments_content ON content_comments(content_type, content_id);
CREATE INDEX idx_content_comments_user ON content_comments(user_id);
CREATE INDEX idx_content_comments_parent ON content_comments(parent_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Guides
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published guides are viewable by everyone"
  ON guides FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Users can create guides"
  ON guides FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their guides"
  ON guides FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their guides"
  ON guides FOR DELETE
  USING (author_id = auth.uid());

-- Guide Sections
ALTER TABLE guide_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guide sections follow guide visibility"
  ON guide_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guides g
      WHERE g.id = guide_sections.guide_id
      AND (g.status = 'published' OR g.author_id = auth.uid())
    )
  );

CREATE POLICY "Authors can manage guide sections"
  ON guide_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guides g
      WHERE g.id = guide_sections.guide_id
      AND g.author_id = auth.uid()
    )
  );

-- Clips
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public clips are viewable by everyone"
  ON clips FOR SELECT
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create clips"
  ON clips FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their clips"
  ON clips FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their clips"
  ON clips FOR DELETE
  USING (creator_id = auth.uid());

-- Polls
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls are viewable by everyone"
  ON community_polls FOR SELECT
  USING (true);

CREATE POLICY "Users can create polls"
  ON community_polls FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their polls"
  ON community_polls FOR UPDATE
  USING (creator_id = auth.uid());

-- Events
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone"
  ON community_events FOR SELECT
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create events"
  ON community_events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their events"
  ON community_events FOR UPDATE
  USING (creator_id = auth.uid());

-- Memes
ALTER TABLE memes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved public memes are viewable"
  ON memes FOR SELECT
  USING ((is_public = true AND is_approved = true) OR creator_id = auth.uid());

CREATE POLICY "Users can create memes"
  ON memes FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can manage their memes"
  ON memes FOR ALL
  USING (creator_id = auth.uid());

-- Comments
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-deleted comments are viewable"
  ON content_comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Users can create comments"
  ON content_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comments"
  ON content_comments FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_events_updated_at
  BEFORE UPDATE ON community_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_comments_updated_at
  BEFORE UPDATE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Community Achievements
-- ============================================
INSERT INTO community_achievement_definitions (slug, name, description, category, unlock_criteria, points, xp_reward) VALUES
  ('first_guide', 'Tutorial Titan', 'Publish your first guide', 'content_creator', '{"type": "guides_published", "count": 1}', 50, 200),
  ('guide_master', 'Guide Guru', 'Publish 10 guides', 'content_creator', '{"type": "guides_published", "count": 10}', 200, 1000),
  ('first_clip', 'Clip Creator', 'Upload your first clip', 'content_creator', '{"type": "clips_uploaded", "count": 1}', 25, 100),
  ('viral_clip', 'Going Viral', 'Get 1000 views on a clip', 'engagement', '{"type": "clip_views", "count": 1000}', 100, 500),
  ('helpful_commenter', 'Helpful Hand', 'Leave 50 comments', 'helper', '{"type": "comments_made", "count": 50}', 75, 300),
  ('event_organizer', 'Event Planner', 'Host 5 community events', 'social', '{"type": "events_hosted", "count": 5}', 150, 750),
  ('poll_master', 'Voice of the People', 'Create 10 community polls', 'social', '{"type": "polls_created", "count": 10}', 100, 400),
  ('meme_lord', 'Meme Lord', 'Get 500 likes on memes', 'engagement', '{"type": "meme_likes", "count": 500}', 150, 600);
-- Accessibility Features
-- Migration 025

-- ============================================
-- ACCESSIBILITY SETTINGS
-- ============================================
CREATE TABLE public.accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Visual Settings
  color_blind_mode VARCHAR(20) DEFAULT 'none' CHECK (color_blind_mode IN ('none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia')),
  high_contrast BOOLEAN DEFAULT false,
  large_text BOOLEAN DEFAULT false,
  text_scale DECIMAL(3,2) DEFAULT 1.0 CHECK (text_scale BETWEEN 0.8 AND 2.0),
  reduce_animations BOOLEAN DEFAULT false,
  reduce_motion BOOLEAN DEFAULT false,
  reduce_transparency BOOLEAN DEFAULT false,

  -- Audio Settings
  text_to_speech_enabled BOOLEAN DEFAULT false,
  tts_voice VARCHAR(50) DEFAULT 'default',
  tts_speed DECIMAL(3,2) DEFAULT 1.0 CHECK (tts_speed BETWEEN 0.5 AND 2.0),
  tts_pitch DECIMAL(3,2) DEFAULT 1.0 CHECK (tts_pitch BETWEEN 0.5 AND 2.0),

  -- Caption Settings
  caption_enabled BOOLEAN DEFAULT false,
  caption_style JSONB DEFAULT '{"fontSize": "medium", "backgroundColor": "black", "textColor": "white", "position": "bottom"}',
  auto_caption_voice_chat BOOLEAN DEFAULT false,

  -- Navigation Settings
  keyboard_navigation BOOLEAN DEFAULT false,
  focus_indicators BOOLEAN DEFAULT true,
  skip_links BOOLEAN DEFAULT true,
  sticky_keys BOOLEAN DEFAULT false,

  -- Chat Settings
  chat_tts_enabled BOOLEAN DEFAULT false,
  chat_tts_mentions_only BOOLEAN DEFAULT false,
  incoming_message_sounds BOOLEAN DEFAULT true,
  message_sound_volume INTEGER DEFAULT 100 CHECK (message_sound_volume BETWEEN 0 AND 100),

  -- Reading Settings
  dyslexia_friendly_font BOOLEAN DEFAULT false,
  line_spacing VARCHAR(10) DEFAULT 'normal' CHECK (line_spacing IN ('compact', 'normal', 'relaxed', 'loose')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOICE TRANSCRIPTIONS
-- ============================================
CREATE TABLE public.voice_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  call_id UUID, -- Reference to call if from voice call
  speaker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Transcription
  transcription TEXT NOT NULL,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  language VARCHAR(10) DEFAULT 'en',
  -- Timing
  timestamp_start TIMESTAMPTZ NOT NULL,
  timestamp_end TIMESTAMPTZ,
  duration_ms INTEGER,
  -- Processing
  is_final BOOLEAN DEFAULT true, -- false for interim results
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_accessibility_settings_user ON accessibility_settings(user_id);
CREATE INDEX idx_voice_transcriptions_conversation ON voice_transcriptions(conversation_id);
CREATE INDEX idx_voice_transcriptions_speaker ON voice_transcriptions(speaker_id);
CREATE INDEX idx_voice_transcriptions_timestamp ON voice_transcriptions(timestamp_start DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE accessibility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accessibility settings"
  ON accessibility_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own accessibility settings"
  ON accessibility_settings FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE voice_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transcriptions in their conversations"
  ON voice_transcriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = voice_transcriptions.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_accessibility_settings_updated_at
  BEFORE UPDATE ON accessibility_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create accessibility settings for new users
CREATE OR REPLACE FUNCTION create_accessibility_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO accessibility_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_accessibility
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_accessibility_settings();
-- Creator Tools
-- Migration 026

-- ============================================
-- CREATOR PROFILES
-- ============================================
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Creator Type
  creator_type VARCHAR(30) NOT NULL CHECK (creator_type IN ('streamer', 'content_creator', 'esports_player', 'coach', 'analyst', 'caster')),

  -- Platform Presence
  primary_platform VARCHAR(30) CHECK (primary_platform IN ('twitch', 'youtube', 'kick', 'tiktok', 'twitter', 'instagram')),
  platform_usernames JSONB DEFAULT '{}', -- {twitch: '', youtube: '', etc}
  platform_urls JSONB DEFAULT '{}',

  -- Stats (synced from platforms)
  follower_count INTEGER DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
  average_viewers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,

  -- Profile
  bio TEXT,
  specialties TEXT[] DEFAULT '{}', -- Games/content types
  languages TEXT[] DEFAULT ARRAY['en'],

  -- Social
  social_links JSONB DEFAULT '{}',

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_tier VARCHAR(20) DEFAULT 'none' CHECK (verification_tier IN ('none', 'emerging', 'established', 'partner')),

  -- Sponsorship
  sponsorship_open BOOLEAN DEFAULT false,
  sponsorship_email TEXT,
  sponsorship_rate_card JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STREAMER OVERLAYS
-- ============================================
CREATE TABLE public.streamer_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Overlay Info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  overlay_type VARCHAR(30) NOT NULL CHECK (overlay_type IN ('lfg_feed', 'match_activity', 'team_roster', 'stats', 'chat', 'alerts', 'custom')),

  -- Configuration
  config JSONB DEFAULT '{}', -- position, size, theme, filters, etc.
  custom_css TEXT,

  -- Access
  access_token VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Stats
  view_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATOR ANALYTICS
-- ============================================
CREATE TABLE public.creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,

  -- Profile Metrics
  profile_views INTEGER DEFAULT 0,
  profile_unique_views INTEGER DEFAULT 0,

  -- Content Metrics
  content_views INTEGER DEFAULT 0,
  content_likes INTEGER DEFAULT 0,
  content_shares INTEGER DEFAULT 0,

  -- Engagement Metrics
  follower_gained INTEGER DEFAULT 0,
  follower_lost INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),

  -- LFG Metrics
  lfg_joins_from_profile INTEGER DEFAULT 0,
  matches_from_profile INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, date)
);

-- ============================================
-- CREATOR CLIPS
-- ============================================
CREATE TABLE public.creator_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Source
  source_url TEXT NOT NULL,
  source_platform VARCHAR(30),

  -- Clip Range
  start_time INTEGER, -- seconds
  end_time INTEGER,

  -- Output
  title VARCHAR(200),
  description TEXT,
  thumbnail_url TEXT,
  processed_url TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================
-- SPONSORSHIP OPPORTUNITIES
-- ============================================
CREATE TABLE public.sponsorship_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(30) CHECK (campaign_type IN ('stream', 'video', 'social_post', 'tournament', 'review', 'other')),

  -- Requirements
  requirements JSONB DEFAULT '{}', -- {min_followers, platforms, games, regions}
  deliverables TEXT[] DEFAULT '{}',

  -- Compensation
  compensation_type VARCHAR(30) CHECK (compensation_type IN ('paid', 'product', 'revenue_share', 'hybrid')),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  budget_currency VARCHAR(3) DEFAULT 'USD',

  -- Timeline
  start_date DATE,
  end_date DATE,
  application_deadline DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'completed', 'cancelled')),
  applications_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SPONSORSHIP APPLICATIONS
-- ============================================
CREATE TABLE public.sponsorship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.sponsorship_opportunities(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.creator_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Application
  pitch TEXT,
  proposed_deliverables TEXT[] DEFAULT '{}',
  proposed_rate DECIMAL(10,2),
  portfolio_urls TEXT[] DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'withdrawn')),
  reviewer_notes TEXT,

  -- Communication
  messages JSONB DEFAULT '[]', -- Internal messages

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(opportunity_id, creator_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_creator_profiles_user ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_type ON creator_profiles(creator_type);
CREATE INDEX idx_creator_profiles_verified ON creator_profiles(is_verified) WHERE is_verified = true;
CREATE INDEX idx_creator_profiles_sponsorship ON creator_profiles(sponsorship_open) WHERE sponsorship_open = true;

CREATE INDEX idx_streamer_overlays_creator ON streamer_overlays(creator_id);
CREATE INDEX idx_streamer_overlays_token ON streamer_overlays(access_token);
CREATE INDEX idx_streamer_overlays_active ON streamer_overlays(is_active) WHERE is_active = true;

CREATE INDEX idx_creator_analytics_creator ON creator_analytics(creator_id);
CREATE INDEX idx_creator_analytics_date ON creator_analytics(date DESC);

CREATE INDEX idx_creator_clips_creator ON creator_clips(creator_id);
CREATE INDEX idx_creator_clips_status ON creator_clips(status);

CREATE INDEX idx_sponsorship_opportunities_sponsor ON sponsorship_opportunities(sponsor_id);
CREATE INDEX idx_sponsorship_opportunities_status ON sponsorship_opportunities(status);
CREATE INDEX idx_sponsorship_opportunities_deadline ON sponsorship_opportunities(application_deadline);

CREATE INDEX idx_sponsorship_applications_opportunity ON sponsorship_applications(opportunity_id);
CREATE INDEX idx_sponsorship_applications_creator ON sponsorship_applications(creator_id);
CREATE INDEX idx_sponsorship_applications_status ON sponsorship_applications(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator profiles are viewable by everyone"
  ON creator_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own creator profile"
  ON creator_profiles FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE streamer_overlays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own overlays"
  ON streamer_overlays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = streamer_overlays.creator_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can manage their overlays"
  ON streamer_overlays FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = streamer_overlays.creator_id
      AND cp.user_id = auth.uid()
    )
  );

ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own analytics"
  ON creator_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = creator_analytics.creator_id
      AND cp.user_id = auth.uid()
    )
  );

ALTER TABLE sponsorship_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open opportunities are viewable"
  ON sponsorship_opportunities FOR SELECT
  USING (status = 'open' OR sponsor_id = auth.uid());

CREATE POLICY "Sponsors can manage their opportunities"
  ON sponsorship_opportunities FOR ALL
  USING (sponsor_id = auth.uid());

ALTER TABLE sponsorship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their applications"
  ON sponsorship_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = sponsorship_applications.creator_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Sponsors can view applications to their opportunities"
  ON sponsorship_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sponsorship_opportunities so
      WHERE so.id = sponsorship_applications.opportunity_id
      AND so.sponsor_id = auth.uid()
    )
  );

CREATE POLICY "Creators can submit applications"
  ON sponsorship_applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = sponsorship_applications.creator_id
      AND cp.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streamer_overlays_updated_at
  BEFORE UPDATE ON streamer_overlays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorship_opportunities_updated_at
  BEFORE UPDATE ON sponsorship_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorship_applications_updated_at
  BEFORE UPDATE ON sponsorship_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate unique overlay access token
CREATE OR REPLACE FUNCTION generate_overlay_token()
RETURNS VARCHAR(100) AS $$
DECLARE
  v_token VARCHAR(100);
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_token := encode(gen_random_bytes(50), 'hex');
    SELECT EXISTS(SELECT 1 FROM streamer_overlays WHERE access_token = v_token) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
-- Language/Region Features
-- Migration 027

-- ============================================
-- EXTEND PROFILES WITH LANGUAGE PREFERENCES
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT ARRAY['en'],
ADD COLUMN IF NOT EXISTS primary_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS auto_translate BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_translated_content BOOLEAN DEFAULT true;

-- ============================================
-- REGIONAL COMMUNITIES
-- ============================================
CREATE TABLE public.regional_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Region Info
  region_code VARCHAR(20) NOT NULL UNIQUE, -- 'na-east', 'eu-west', 'asia-sea', etc.
  region_name VARCHAR(100) NOT NULL,
  country_codes TEXT[] DEFAULT '{}', -- ISO country codes in this region

  -- Details
  description TEXT,
  languages TEXT[] NOT NULL,
  primary_language VARCHAR(10) NOT NULL,
  timezone VARCHAR(50),

  -- Engagement
  member_count INTEGER DEFAULT 0,
  active_members_24h INTEGER DEFAULT 0,

  -- Media
  banner_url TEXT,
  icon_url TEXT,

  -- Settings
  is_official BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.regional_community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES public.regional_communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Role
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),

  -- Settings
  notifications_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(community_id, user_id)
);

-- ============================================
-- CHAT TRANSLATIONS
-- ============================================
CREATE TABLE public.chat_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,

  -- Languages
  original_language VARCHAR(10) NOT NULL,
  translated_language VARCHAR(10) NOT NULL,

  -- Content
  translated_content TEXT NOT NULL,

  -- Quality
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  translation_provider VARCHAR(30), -- 'google', 'deepl', 'azure', etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, translated_language)
);

-- ============================================
-- SCHEDULING PREFERENCES
-- ============================================
CREATE TABLE public.scheduling_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Timezone
  timezone VARCHAR(50) NOT NULL,
  use_24h_format BOOLEAN DEFAULT false,

  -- Availability Schedule
  available_hours JSONB DEFAULT '{}', -- {monday: [{start: '18:00', end: '22:00'}], ...}

  -- Preferences
  preferred_match_times JSONB DEFAULT '{}', -- Preferred times for different activities
  auto_convert_times BOOLEAN DEFAULT true,
  show_local_times_to_others BOOLEAN DEFAULT true,

  -- Quick Availability
  quick_status VARCHAR(20) DEFAULT 'available', -- 'available', 'busy', 'dnd'
  quick_status_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REGIONAL PRICING
-- ============================================
CREATE TABLE public.regional_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Reference
  product_type VARCHAR(30) NOT NULL, -- 'subscription', 'battle_pass', 'currency_pack'
  product_id VARCHAR(50) NOT NULL,

  -- Pricing
  region_code VARCHAR(20) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_usd_price DECIMAL(10,2),
  discount_percent INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_type, product_id, region_code)
);

-- ============================================
-- SUPPORTED LANGUAGES
-- ============================================
CREATE TABLE public.supported_languages (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  direction VARCHAR(3) DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  is_active BOOLEAN DEFAULT true,
  translation_coverage INTEGER DEFAULT 0, -- Percentage of UI translated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_regional_communities_region ON regional_communities(region_code);
CREATE INDEX idx_regional_communities_active ON regional_communities(is_active) WHERE is_active = true;

CREATE INDEX idx_regional_community_members_community ON regional_community_members(community_id);
CREATE INDEX idx_regional_community_members_user ON regional_community_members(user_id);

CREATE INDEX idx_chat_translations_message ON chat_translations(message_id);
CREATE INDEX idx_chat_translations_languages ON chat_translations(original_language, translated_language);

CREATE INDEX idx_scheduling_preferences_user ON scheduling_preferences(user_id);
CREATE INDEX idx_scheduling_preferences_timezone ON scheduling_preferences(timezone);

CREATE INDEX idx_regional_pricing_product ON regional_pricing(product_type, product_id);
CREATE INDEX idx_regional_pricing_region ON regional_pricing(region_code);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE regional_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regional communities are viewable by everyone"
  ON regional_communities FOR SELECT
  USING (is_active = true);

ALTER TABLE regional_community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members are viewable"
  ON regional_community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON regional_community_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave communities"
  ON regional_community_members FOR DELETE
  USING (user_id = auth.uid());

ALTER TABLE chat_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translations are viewable if message is viewable"
  ON chat_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = chat_translations.message_id
      AND cp.user_id = auth.uid()
    )
  );

ALTER TABLE scheduling_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduling preferences"
  ON scheduling_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Public can view availability"
  ON scheduling_preferences FOR SELECT
  USING (show_local_times_to_others = true);

CREATE POLICY "Users can manage their scheduling preferences"
  ON scheduling_preferences FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE regional_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regional pricing is viewable by everyone"
  ON regional_pricing FOR SELECT
  USING (is_active = true);

ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supported languages are viewable"
  ON supported_languages FOR SELECT
  USING (is_active = true);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_regional_communities_updated_at
  BEFORE UPDATE ON regional_communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduling_preferences_updated_at
  BEFORE UPDATE ON scheduling_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regional_pricing_updated_at
  BEFORE UPDATE ON regional_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update member count on join/leave
CREATE OR REPLACE FUNCTION update_regional_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE regional_communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE regional_communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_regional_community_member_change
  AFTER INSERT OR DELETE ON regional_community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_regional_community_member_count();

-- ============================================
-- SEED DATA
-- ============================================

-- Supported Languages
INSERT INTO supported_languages (code, name, native_name, direction, is_active, translation_coverage) VALUES
  ('en', 'English', 'English', 'ltr', true, 100),
  ('es', 'Spanish', 'Español', 'ltr', true, 95),
  ('pt', 'Portuguese', 'Português', 'ltr', true, 90),
  ('fr', 'French', 'Français', 'ltr', true, 85),
  ('de', 'German', 'Deutsch', 'ltr', true, 85),
  ('it', 'Italian', 'Italiano', 'ltr', true, 80),
  ('ru', 'Russian', 'Русский', 'ltr', true, 80),
  ('ja', 'Japanese', '日本語', 'ltr', true, 75),
  ('ko', 'Korean', '한국어', 'ltr', true, 75),
  ('zh', 'Chinese (Simplified)', '中文简体', 'ltr', true, 85),
  ('zh-TW', 'Chinese (Traditional)', '中文繁體', 'ltr', true, 80),
  ('ar', 'Arabic', 'العربية', 'rtl', true, 70),
  ('hi', 'Hindi', 'हिन्दी', 'ltr', true, 60),
  ('th', 'Thai', 'ไทย', 'ltr', true, 60),
  ('vi', 'Vietnamese', 'Tiếng Việt', 'ltr', true, 60),
  ('id', 'Indonesian', 'Bahasa Indonesia', 'ltr', true, 65),
  ('tr', 'Turkish', 'Türkçe', 'ltr', true, 65),
  ('pl', 'Polish', 'Polski', 'ltr', true, 70),
  ('nl', 'Dutch', 'Nederlands', 'ltr', true, 65),
  ('sv', 'Swedish', 'Svenska', 'ltr', true, 60);

-- Regional Communities
INSERT INTO regional_communities (region_code, region_name, country_codes, languages, primary_language, timezone, is_official) VALUES
  ('na-east', 'North America - East', ARRAY['US', 'CA'], ARRAY['en', 'es', 'fr'], 'en', 'America/New_York', true),
  ('na-west', 'North America - West', ARRAY['US', 'CA', 'MX'], ARRAY['en', 'es'], 'en', 'America/Los_Angeles', true),
  ('eu-west', 'Europe - West', ARRAY['GB', 'FR', 'ES', 'PT', 'IE', 'NL', 'BE'], ARRAY['en', 'fr', 'es', 'pt', 'nl'], 'en', 'Europe/London', true),
  ('eu-central', 'Europe - Central', ARRAY['DE', 'AT', 'CH', 'PL', 'CZ'], ARRAY['de', 'en', 'pl'], 'de', 'Europe/Berlin', true),
  ('eu-north', 'Europe - Nordic', ARRAY['SE', 'NO', 'DK', 'FI'], ARRAY['en', 'sv'], 'en', 'Europe/Stockholm', true),
  ('asia-sea', 'Southeast Asia', ARRAY['SG', 'MY', 'ID', 'TH', 'PH', 'VN'], ARRAY['en', 'id', 'th', 'vi'], 'en', 'Asia/Singapore', true),
  ('asia-east', 'East Asia', ARRAY['JP', 'KR', 'TW', 'HK'], ARRAY['ja', 'ko', 'zh-TW', 'en'], 'en', 'Asia/Tokyo', true),
  ('asia-south', 'South Asia', ARRAY['IN', 'PK', 'BD'], ARRAY['en', 'hi'], 'en', 'Asia/Kolkata', true),
  ('oceania', 'Oceania', ARRAY['AU', 'NZ'], ARRAY['en'], 'en', 'Australia/Sydney', true),
  ('latam', 'Latin America', ARRAY['BR', 'AR', 'CL', 'CO', 'PE', 'MX'], ARRAY['es', 'pt'], 'es', 'America/Sao_Paulo', true),
  ('mena', 'Middle East & North Africa', ARRAY['AE', 'SA', 'EG', 'TR'], ARRAY['ar', 'tr', 'en'], 'ar', 'Asia/Dubai', true);
-- Squad DNA Matching
-- Migration 029

-- ============================================
-- SQUAD DNA PROFILES
-- ============================================
CREATE TABLE public.squad_dna_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Playstyle DNA (0-100 scale)
  aggression_rating INTEGER DEFAULT 50 CHECK (aggression_rating BETWEEN 0 AND 100),
  teamwork_rating INTEGER DEFAULT 50 CHECK (teamwork_rating BETWEEN 0 AND 100),
  communication_rating INTEGER DEFAULT 50 CHECK (communication_rating BETWEEN 0 AND 100),
  adaptability_rating INTEGER DEFAULT 50 CHECK (adaptability_rating BETWEEN 0 AND 100),
  consistency_rating INTEGER DEFAULT 50 CHECK (consistency_rating BETWEEN 0 AND 100),
  clutch_rating INTEGER DEFAULT 50 CHECK (clutch_rating BETWEEN 0 AND 100),
  leadership_rating INTEGER DEFAULT 50 CHECK (leadership_rating BETWEEN 0 AND 100),
  patience_rating INTEGER DEFAULT 50 CHECK (patience_rating BETWEEN 0 AND 100),

  -- Role Preferences
  preferred_roles TEXT[] DEFAULT '{}',
  role_flexibility INTEGER DEFAULT 50 CHECK (role_flexibility BETWEEN 0 AND 100),
  willing_to_igl BOOLEAN DEFAULT false,

  -- Timing Patterns
  peak_performance_hours JSONB DEFAULT '{}', -- {monday: ['20:00-23:00'], ...}
  session_duration_avg INTEGER, -- minutes
  preferred_session_length INTEGER, -- minutes

  -- Communication Style
  comm_style VARCHAR(30) CHECK (comm_style IN ('verbose', 'concise', 'callouts_only', 'silent', 'adaptive')),
  mic_quality VARCHAR(20) CHECK (mic_quality IN ('excellent', 'good', 'average', 'poor')),
  language_fluency JSONB DEFAULT '{}', -- {en: 'native', es: 'fluent'}

  -- Learning & Improvement
  accepts_criticism BOOLEAN DEFAULT true,
  gives_constructive_feedback BOOLEAN DEFAULT true,
  review_vods BOOLEAN DEFAULT false,

  -- AI-Generated Insights
  playstyle_summary TEXT, -- AI-generated description
  ideal_teammate_profile JSONB DEFAULT '{}', -- What type of player complements them
  strengths TEXT[] DEFAULT '{}',
  areas_to_improve TEXT[] DEFAULT '{}',

  -- Data Sources
  data_sources JSONB DEFAULT '{}', -- {matches_analyzed: 50, self_reported: true, peer_rated: true}
  last_analysis_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, game_id)
);

-- ============================================
-- SQUAD COMPATIBILITY ANALYSIS
-- ============================================
CREATE TABLE public.squad_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Squad Members
  squad_members UUID[] NOT NULL, -- Array of user_ids
  squad_size INTEGER NOT NULL,

  -- Compatibility Scores (0-100)
  overall_chemistry DECIMAL(5,2),
  role_coverage DECIMAL(5,2), -- How well roles are covered
  playstyle_synergy DECIMAL(5,2), -- How playstyles complement
  communication_match DECIMAL(5,2), -- Communication style compatibility
  schedule_overlap DECIMAL(5,2), -- Time availability overlap

  -- AI Insights
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  suggested_improvements TEXT[] DEFAULT '{}',
  missing_player_profile JSONB DEFAULT '{}', -- What player would complete the squad
  synergy_pairs JSONB DEFAULT '[]', -- [{user1, user2, synergy_type, score}]
  potential_conflicts JSONB DEFAULT '[]',

  -- Predictions
  predicted_win_rate DECIMAL(5,2),
  confidence_score DECIMAL(5,2),

  -- Tracking
  is_active_squad BOOLEAN DEFAULT false,
  matches_played_together INTEGER DEFAULT 0,
  actual_win_rate DECIMAL(5,2),

  -- Timestamps
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SQUAD MATCH REQUESTS
-- ============================================
CREATE TABLE public.squad_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Current Squad
  existing_members UUID[] NOT NULL,
  slots_to_fill INTEGER NOT NULL,

  -- Requirements
  role_requirements JSONB DEFAULT '[]', -- [{role, importance: 'required'|'preferred', playstyle_prefs}]
  skill_range JSONB DEFAULT '{}', -- {min_rank, max_rank}
  schedule_requirements JSONB DEFAULT '{}',
  communication_requirements JSONB DEFAULT '{}',

  -- Results
  suggested_players JSONB DEFAULT '[]', -- [{user_id, compatibility_score, role_fit, reasoning}]
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- PEER RATINGS (for DNA data)
-- ============================================
CREATE TABLE public.squad_dna_peer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,

  -- Ratings (1-5)
  aggression INTEGER CHECK (aggression BETWEEN 1 AND 5),
  teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  adaptability INTEGER CHECK (adaptability BETWEEN 1 AND 5),
  consistency INTEGER CHECK (consistency BETWEEN 1 AND 5),
  clutch INTEGER CHECK (clutch BETWEEN 1 AND 5),
  leadership INTEGER CHECK (leadership BETWEEN 1 AND 5),

  -- Context
  matches_played_together INTEGER DEFAULT 1,
  relationship VARCHAR(30) CHECK (relationship IN ('random_matchmade', 'lfg', 'friend', 'clan_member', 'team')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(rater_id, rated_id, game_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_squad_dna_profiles_user ON squad_dna_profiles(user_id);
CREATE INDEX idx_squad_dna_profiles_game ON squad_dna_profiles(game_id);
CREATE INDEX idx_squad_dna_profiles_aggression ON squad_dna_profiles(aggression_rating);
CREATE INDEX idx_squad_dna_profiles_teamwork ON squad_dna_profiles(teamwork_rating);

CREATE INDEX idx_squad_compatibility_game ON squad_compatibility(game_id);
CREATE INDEX idx_squad_compatibility_members ON squad_compatibility USING GIN (squad_members);
CREATE INDEX idx_squad_compatibility_active ON squad_compatibility(is_active_squad) WHERE is_active_squad = true;

CREATE INDEX idx_squad_match_requests_requester ON squad_match_requests(requester_id);
CREATE INDEX idx_squad_match_requests_game ON squad_match_requests(game_id);
CREATE INDEX idx_squad_match_requests_status ON squad_match_requests(processing_status);

CREATE INDEX idx_squad_dna_peer_ratings_rated ON squad_dna_peer_ratings(rated_id);
CREATE INDEX idx_squad_dna_peer_ratings_game ON squad_dna_peer_ratings(game_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE squad_dna_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DNA profiles are viewable by everyone"
  ON squad_dna_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own DNA profile"
  ON squad_dna_profiles FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE squad_compatibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can view their compatibility"
  ON squad_compatibility FOR SELECT
  USING (auth.uid() = ANY(squad_members));

ALTER TABLE squad_match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own match requests"
  ON squad_match_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Users can create match requests"
  ON squad_match_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

ALTER TABLE squad_dna_peer_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings they gave or received"
  ON squad_dna_peer_ratings FOR SELECT
  USING (rater_id = auth.uid() OR rated_id = auth.uid());

CREATE POLICY "Users can create peer ratings"
  ON squad_dna_peer_ratings FOR INSERT
  WITH CHECK (rater_id = auth.uid() AND rater_id != rated_id);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_squad_dna_profiles_updated_at
  BEFORE UPDATE ON squad_dna_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_squad_compatibility_updated_at
  BEFORE UPDATE ON squad_compatibility
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update DNA profile based on peer ratings
CREATE OR REPLACE FUNCTION update_dna_from_peer_ratings()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_aggression DECIMAL;
  v_avg_teamwork DECIMAL;
  v_avg_communication DECIMAL;
  v_avg_adaptability DECIMAL;
  v_avg_consistency DECIMAL;
  v_avg_clutch DECIMAL;
  v_avg_leadership DECIMAL;
BEGIN
  -- Calculate averages from peer ratings
  SELECT
    AVG(aggression) * 20,
    AVG(teamwork) * 20,
    AVG(communication) * 20,
    AVG(adaptability) * 20,
    AVG(consistency) * 20,
    AVG(clutch) * 20,
    AVG(leadership) * 20
  INTO
    v_avg_aggression,
    v_avg_teamwork,
    v_avg_communication,
    v_avg_adaptability,
    v_avg_consistency,
    v_avg_clutch,
    v_avg_leadership
  FROM squad_dna_peer_ratings
  WHERE rated_id = NEW.rated_id AND game_id = NEW.game_id;

  -- Blend with existing self-reported values (70% self, 30% peer)
  UPDATE squad_dna_profiles
  SET
    aggression_rating = COALESCE((aggression_rating * 0.7 + v_avg_aggression * 0.3)::INTEGER, aggression_rating),
    teamwork_rating = COALESCE((teamwork_rating * 0.7 + v_avg_teamwork * 0.3)::INTEGER, teamwork_rating),
    communication_rating = COALESCE((communication_rating * 0.7 + v_avg_communication * 0.3)::INTEGER, communication_rating),
    adaptability_rating = COALESCE((adaptability_rating * 0.7 + v_avg_adaptability * 0.3)::INTEGER, adaptability_rating),
    consistency_rating = COALESCE((consistency_rating * 0.7 + v_avg_consistency * 0.3)::INTEGER, consistency_rating),
    clutch_rating = COALESCE((clutch_rating * 0.7 + v_avg_clutch * 0.3)::INTEGER, clutch_rating),
    leadership_rating = COALESCE((leadership_rating * 0.7 + v_avg_leadership * 0.3)::INTEGER, leadership_rating),
    updated_at = NOW()
  WHERE user_id = NEW.rated_id AND game_id = NEW.game_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_peer_rating_insert
  AFTER INSERT ON squad_dna_peer_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_dna_from_peer_ratings();
-- Gaming Mood Matching
-- Migration 030

-- ============================================
-- USER MOOD
-- ============================================
CREATE TABLE public.user_mood (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Current Mood
  current_mood VARCHAR(30) NOT NULL CHECK (current_mood IN ('tryhard', 'chill', 'learning', 'tilted', 'social', 'grinding', 'casual', 'competitive')),
  mood_description TEXT, -- Custom description
  intensity INTEGER DEFAULT 50 CHECK (intensity BETWEEN 0 AND 100), -- 0=super chill, 100=maximum tryhard

  -- Preferences for current mood
  open_to_coaching BOOLEAN DEFAULT false,
  open_to_newbies BOOLEAN DEFAULT true,
  voice_chat_preference VARCHAR(20) DEFAULT 'optional' CHECK (voice_chat_preference IN ('required', 'preferred', 'optional', 'none')),
  toxicity_tolerance VARCHAR(20) DEFAULT 'low' CHECK (toxicity_tolerance IN ('none', 'low', 'medium', 'high')),

  -- Auto Detection
  auto_detect BOOLEAN DEFAULT false,
  recent_match_results JSONB DEFAULT '[]', -- For tilt detection
  detected_mood VARCHAR(30),
  detection_confidence DECIMAL(3,2),

  -- Timing
  mood_set_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Mood auto-resets after expiry
  auto_reset_hours INTEGER DEFAULT 4,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MOOD HISTORY
-- ============================================
CREATE TABLE public.mood_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Mood Info
  mood VARCHAR(30) NOT NULL,
  intensity INTEGER,
  mood_description TEXT,

  -- Context
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  trigger_event VARCHAR(50), -- 'manual', 'auto_detected', 'post_match', 'time_based'

  -- Session Outcome
  session_outcome VARCHAR(20) CHECK (session_outcome IN ('positive', 'negative', 'neutral', 'abandoned')),
  match_results JSONB DEFAULT '{}', -- {wins: 0, losses: 0, draws: 0}
  session_duration_minutes INTEGER,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ============================================
-- MOOD COMPATIBILITY PREFERENCES
-- ============================================
CREATE TABLE public.mood_compatibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Preferred Partner Moods
  preferred_moods TEXT[] DEFAULT '{}', -- Moods they like playing with
  avoided_moods TEXT[] DEFAULT '{}', -- Moods they avoid
  strict_mood_matching BOOLEAN DEFAULT false, -- Only match with same mood

  -- Intensity Preferences
  intensity_range_min INTEGER DEFAULT 0,
  intensity_range_max INTEGER DEFAULT 100,
  prefer_similar_intensity BOOLEAN DEFAULT true,

  -- Special Preferences
  avoid_tilted_players BOOLEAN DEFAULT true,
  willing_to_untilt_others BOOLEAN DEFAULT false, -- Willing to help tilted players

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXTEND LFG POSTS FOR MOOD
-- ============================================
ALTER TABLE public.lfg_posts
ADD COLUMN IF NOT EXISTS required_mood VARCHAR(30),
ADD COLUMN IF NOT EXISTS mood_intensity_min INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mood_intensity_max INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS no_tilted_players BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mood_flexible BOOLEAN DEFAULT true;

-- ============================================
-- MOOD PRESETS
-- ============================================
CREATE TABLE public.mood_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Preset Info
  name VARCHAR(50) NOT NULL,
  description TEXT,

  -- Mood Settings
  mood VARCHAR(30) NOT NULL,
  intensity INTEGER DEFAULT 50,
  mood_description TEXT,

  -- Preferences
  open_to_coaching BOOLEAN DEFAULT false,
  open_to_newbies BOOLEAN DEFAULT true,
  voice_chat_preference VARCHAR(20) DEFAULT 'optional',

  -- Quick Access
  keyboard_shortcut VARCHAR(20),
  is_favorite BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_user_mood_user ON user_mood(user_id);
CREATE INDEX idx_user_mood_current ON user_mood(current_mood);
CREATE INDEX idx_user_mood_intensity ON user_mood(intensity);
CREATE INDEX idx_user_mood_expires ON user_mood(expires_at);

CREATE INDEX idx_mood_history_user ON mood_history(user_id);
CREATE INDEX idx_mood_history_mood ON mood_history(mood);
CREATE INDEX idx_mood_history_started ON mood_history(started_at DESC);
CREATE INDEX idx_mood_history_game ON mood_history(game_id);

CREATE INDEX idx_mood_compatibility_user ON mood_compatibility_preferences(user_id);

CREATE INDEX idx_mood_presets_user ON mood_presets(user_id);
CREATE INDEX idx_mood_presets_favorite ON mood_presets(is_favorite) WHERE is_favorite = true;

-- Index for LFG mood filtering
CREATE INDEX idx_lfg_posts_mood ON lfg_posts(required_mood) WHERE required_mood IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_mood ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User moods are viewable by everyone"
  ON user_mood FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own mood"
  ON user_mood FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE mood_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood history"
  ON mood_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their mood history"
  ON mood_history FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE mood_compatibility_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood preferences"
  ON mood_compatibility_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their mood preferences"
  ON mood_compatibility_preferences FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE mood_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood presets"
  ON mood_presets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their mood presets"
  ON mood_presets FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_user_mood_updated_at
  BEFORE UPDATE ON user_mood
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_compatibility_preferences_updated_at
  BEFORE UPDATE ON mood_compatibility_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Log mood changes to history
CREATE OR REPLACE FUNCTION log_mood_change()
RETURNS TRIGGER AS $$
BEGIN
  -- End previous mood session
  UPDATE mood_history
  SET ended_at = NOW()
  WHERE user_id = NEW.user_id AND ended_at IS NULL;

  -- Start new mood session
  INSERT INTO mood_history (user_id, mood, intensity, mood_description, trigger_event)
  VALUES (NEW.user_id, NEW.current_mood, NEW.intensity, NEW.mood_description, 'manual');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_mood_change
  AFTER INSERT OR UPDATE OF current_mood ON user_mood
  FOR EACH ROW
  EXECUTE FUNCTION log_mood_change();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate mood compatibility between two users
CREATE OR REPLACE FUNCTION calculate_mood_compatibility(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_mood1 RECORD;
  v_mood2 RECORD;
  v_prefs1 RECORD;
  v_prefs2 RECORD;
  v_base_score INTEGER := 50;
  v_intensity_diff INTEGER;
BEGIN
  -- Get moods
  SELECT * INTO v_mood1 FROM user_mood WHERE user_id = p_user1_id;
  SELECT * INTO v_mood2 FROM user_mood WHERE user_id = p_user2_id;

  IF v_mood1 IS NULL OR v_mood2 IS NULL THEN
    RETURN 50; -- Default if no mood set
  END IF;

  -- Get preferences
  SELECT * INTO v_prefs1 FROM mood_compatibility_preferences WHERE user_id = p_user1_id;
  SELECT * INTO v_prefs2 FROM mood_compatibility_preferences WHERE user_id = p_user2_id;

  -- Same mood = high compatibility
  IF v_mood1.current_mood = v_mood2.current_mood THEN
    v_base_score := 80;
  -- Compatible mood pairs
  ELSIF (v_mood1.current_mood = 'chill' AND v_mood2.current_mood = 'social')
     OR (v_mood1.current_mood = 'social' AND v_mood2.current_mood = 'chill') THEN
    v_base_score := 70;
  ELSIF (v_mood1.current_mood = 'tryhard' AND v_mood2.current_mood = 'competitive')
     OR (v_mood1.current_mood = 'competitive' AND v_mood2.current_mood = 'tryhard') THEN
    v_base_score := 75;
  ELSIF (v_mood1.current_mood = 'learning' AND v_mood2.current_mood = 'chill')
     OR (v_mood1.current_mood = 'chill' AND v_mood2.current_mood = 'learning') THEN
    v_base_score := 65;
  -- Incompatible mood pairs
  ELSIF v_mood1.current_mood = 'tilted' OR v_mood2.current_mood = 'tilted' THEN
    v_base_score := 20;
  ELSIF (v_mood1.current_mood = 'tryhard' AND v_mood2.current_mood = 'chill')
     OR (v_mood1.current_mood = 'chill' AND v_mood2.current_mood = 'tryhard') THEN
    v_base_score := 30;
  END IF;

  -- Adjust for intensity difference
  v_intensity_diff := ABS(v_mood1.intensity - v_mood2.intensity);
  v_base_score := v_base_score - (v_intensity_diff / 5);

  -- Check avoided moods in preferences
  IF v_prefs1 IS NOT NULL AND v_mood2.current_mood = ANY(v_prefs1.avoided_moods) THEN
    v_base_score := v_base_score - 30;
  END IF;
  IF v_prefs2 IS NOT NULL AND v_mood1.current_mood = ANY(v_prefs2.avoided_moods) THEN
    v_base_score := v_base_score - 30;
  END IF;

  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_base_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-detect tilt from recent match results
CREATE OR REPLACE FUNCTION detect_tilt(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_recent_results JSONB;
  v_loss_streak INTEGER := 0;
  v_result JSONB;
BEGIN
  SELECT recent_match_results INTO v_recent_results
  FROM user_mood WHERE user_id = p_user_id;

  IF v_recent_results IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Count consecutive losses
  FOR v_result IN SELECT * FROM jsonb_array_elements(v_recent_results) LOOP
    IF (v_result->>'result')::text = 'loss' THEN
      v_loss_streak := v_loss_streak + 1;
    ELSE
      v_loss_streak := 0;
    END IF;
  END LOOP;

  -- 3+ consecutive losses suggests tilt
  RETURN v_loss_streak >= 3;
END;
$$ LANGUAGE plpgsql STABLE;
-- =============================================
-- SEED: Indian Gamer Profiles (25 Complete Profiles)
-- =============================================
-- Creates demo_profiles table for sample Indian gamer profiles
-- These are for display/demo purposes and don't require auth users
-- =============================================

-- Create demo_profiles table (no FK to auth.users)
CREATE TABLE IF NOT EXISTS demo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  gaming_style VARCHAR(20) CHECK (gaming_style IN ('casual', 'competitive', 'pro')),
  preferred_language VARCHAR(10) DEFAULT 'en',
  region VARCHAR(100),
  timezone VARCHAR(50),
  online_hours JSONB,
  social_links JSONB,
  is_online BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demo_user_games table
CREATE TABLE IF NOT EXISTS demo_user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  game_name VARCHAR(100) NOT NULL,
  game_slug VARCHAR(50),
  in_game_name VARCHAR(100),
  rank VARCHAR(50),
  role VARCHAR(50),
  secondary_role VARCHAR(50),
  hours_played INTEGER DEFAULT 0,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demo_user_badges table
CREATE TABLE IF NOT EXISTS demo_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  badge_name VARCHAR(100) NOT NULL,
  badge_slug VARCHAR(50),
  badge_icon VARCHAR(10),
  badge_description TEXT,
  badge_rarity VARCHAR(20) CHECK (badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_demo_profiles_username ON demo_profiles(username);
CREATE INDEX IF NOT EXISTS idx_demo_profiles_region ON demo_profiles(region);
CREATE INDEX IF NOT EXISTS idx_demo_profiles_gaming_style ON demo_profiles(gaming_style);
CREATE INDEX IF NOT EXISTS idx_demo_profiles_is_online ON demo_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_demo_user_games_user_id ON demo_user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_user_games_game_slug ON demo_user_games(game_slug);
CREATE INDEX IF NOT EXISTS idx_demo_user_badges_user_id ON demo_user_badges(user_id);

-- Enable RLS
ALTER TABLE demo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_user_badges ENABLE ROW LEVEL SECURITY;

-- Allow public read access to demo profiles
CREATE POLICY "Demo profiles are viewable by everyone" ON demo_profiles
  FOR SELECT USING (true);

CREATE POLICY "Demo user games are viewable by everyone" ON demo_user_games
  FOR SELECT USING (true);

CREATE POLICY "Demo user badges are viewable by everyone" ON demo_user_badges
  FOR SELECT USING (true);

-- =============================================
-- INSERT DEMO PROFILES
-- =============================================

-- Clear existing demo data
TRUNCATE demo_profiles CASCADE;

-- Profile 1: SkRoshanOP - Pro Valorant Player from Mumbai
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'SkRoshanOP',
  'Roshan Sharma',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Roshan&backgroundColor=b6e3f4',
  '/images/banners/gaming-1.svg',
  '🎮 Valorant Pro | Ex-Velocity Gaming | 2x VCT Qualifier | DMs open for scrims 🇮🇳',
  'pro',
  'hi',
  'Mumbai, Maharashtra',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "02:00"}, "weekend": {"start": "14:00", "end": "04:00"}}',
  '{"discord": "SkRoshanOP#1337", "twitch": "skroshanop", "youtube": "@SkRoshanGaming", "twitter": "@SkRoshanOP", "instagram": "@roshan.gaming"}',
  true,
  true,
  NOW() - INTERVAL '8 months'
);

-- Profile 2: AadityaAWP - CS2 AWPer from Delhi
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'AadityaAWP',
  'Aaditya Verma',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aaditya&backgroundColor=c0aede',
  '/images/banners/gaming-2.svg',
  '🔫 AWP is life | CS2 Grinder | Premier 25K+ | Looking for serious team 🎯',
  'competitive',
  'en',
  'Delhi, NCR',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "01:00"}, "weekend": {"start": "16:00", "end": "03:00"}}',
  '{"discord": "AadityaAWP#2048", "steam": "aadityaawp", "youtube": "@AadityaCS2"}',
  false,
  true,
  NOW() - INTERVAL '10 months'
);

-- Profile 3: PriyaSmokeQueen - Valorant Controller from Bangalore
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'PriyaSmokeQueen',
  'Priya Nair',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffd5dc',
  '/images/banners/gaming-3.svg',
  '💨 Smoke diff every game | Omen/Astra main | Girls in Gaming advocate | Stream Mon-Fri',
  'competitive',
  'en',
  'Bangalore, Karnataka',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "23:00"}, "weekend": {"start": "15:00", "end": "01:00"}}',
  '{"discord": "PriyaSmokeQueen#7777", "twitch": "priyasmokequeen", "twitter": "@PriyaGamingBLR", "instagram": "@priya.gaming"}',
  true,
  true,
  NOW() - INTERVAL '7 months'
);

-- Profile 4: VenkatIGL - CS2 IGL from Hyderabad
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'VenkatIGL',
  'Venkat Reddy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Venkat&backgroundColor=d1d4f9',
  '/images/banners/gaming-4.svg',
  '🧠 IGL & Strategist | Ex-Entity Gaming | Open to coaching | Building HydCS Academy',
  'pro',
  'te',
  'Hyderabad, Telangana',
  'Asia/Kolkata',
  '{"weekday": {"start": "17:00", "end": "00:00"}, "weekend": {"start": "12:00", "end": "02:00"}}',
  '{"discord": "VenkatIGL#1001", "steam": "venkatigl", "twitter": "@VenkatIGL", "youtube": "@VenkatCSAcademy"}',
  false,
  true,
  NOW() - INTERVAL '14 months'
);

-- Profile 5: KarthikWalls - Valorant Sentinel from Chennai
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'KarthikWalls',
  'Karthik Subramanian',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik&backgroundColor=ffdfbf',
  '/images/banners/gaming-5.svg',
  '🛡️ Killjoy diff | Site anchor specialist | Setup enjoyer | DMs open for tips',
  'competitive',
  'ta',
  'Chennai, Tamil Nadu',
  'Asia/Kolkata',
  '{"weekday": {"start": "21:00", "end": "01:00"}, "weekend": {"start": "18:00", "end": "03:00"}}',
  '{"discord": "KarthikWalls#4444", "instagram": "@karthik_gaming_tn"}',
  true,
  NOW() - INTERVAL '5 months'
);

-- Profile 6: SouravRUSH - CS2 Entry from Kolkata
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SouravRUSH',
  'Sourav Das',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sourav&backgroundColor=c0f0f0',
  '/images/banners/gaming-1.svg',
  '⚡ Entry frag or die trying | KOL CS Scene | Looking for team | Aim trainer addict',
  'competitive',
  'bn',
  'Kolkata, West Bengal',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "00:00"}, "weekend": {"start": "14:00", "end": "02:00"}}',
  '{"discord": "SouravRUSH#5555", "steam": "souravrush", "twitter": "@SouravRushCS"}',
  false,
  NOW() - INTERVAL '6 months'
);

-- Profile 7: NehaDuelist - Valorant Duelist from Pune
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'NehaDuelist',
  'Neha Patil',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha&backgroundColor=ffb6c1',
  '/images/banners/gaming-2.svg',
  '⚔️ Jett/Reyna 2-trick | VCT Game Changers aspirant | Content creator | Aim labs grinder',
  'competitive',
  'mr',
  'Pune, Maharashtra',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "23:00"}, "weekend": {"start": "13:00", "end": "01:00"}}',
  '{"discord": "NehaDuelist#8888", "twitch": "nehaduelist", "instagram": "@neha.valorant", "youtube": "@NehaDuelistValo"}',
  true,
  true,
  NOW() - INTERVAL '6 months'
);

-- Profile 8: HarshLurk - CS2 Lurker from Ahmedabad
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'HarshLurk',
  'Harsh Patel',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Harsh&backgroundColor=e0e0e0',
  '/images/banners/gaming-3.svg',
  '🐍 Silent but deadly | Lurk timings god | FaceIT Lvl 10 | Clutch or kick',
  'competitive',
  'gu',
  'Ahmedabad, Gujarat',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "02:00"}, "weekend": {"start": "16:00", "end": "04:00"}}',
  '{"discord": "HarshLurk#9999", "steam": "harshlurk"}',
  false,
  NOW() - INTERVAL '9 months'
);

-- Profile 9: ArjunSova - Valorant Initiator from Jaipur
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'ArjunSova',
  'Arjun Singh Rathore',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=ffecd2',
  '/images/banners/gaming-4.svg',
  '🦅 Sova lineups = free wins | Dart diff specialist | YT tutorials coming soon | Rajasthan represent 🏜️',
  'competitive',
  'hi',
  'Jaipur, Rajasthan',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "15:00", "end": "03:00"}}',
  '{"discord": "ArjunSova#1234", "youtube": "@ArjunSovaLineups", "instagram": "@arjun_valorant"}',
  true,
  NOW() - INTERVAL '4 months'
);

-- Profile 10: AmitSupport - CS2 Support from Lucknow
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'AmitSupport',
  'Amit Mishra',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit&backgroundColor=bde0fe',
  '/images/banners/gaming-5.svg',
  '💪 Support player who actually supports | Flash god | Utility diff | Team player always',
  'competitive',
  'hi',
  'Lucknow, Uttar Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "14:00", "end": "02:00"}}',
  '{"discord": "AmitSupport#6666", "steam": "amitsupport"}',
  false,
  NOW() - INTERVAL '5 months'
);

-- Profile 11: AnuRaze - Valorant Duelist from Kochi
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'AnuRaze',
  'Anu Menon',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Anu&backgroundColor=ffc8dd',
  '/images/banners/gaming-1.svg',
  '💥 Raze main | Satchel plays only | Kerala gaming community admin | Girls squad recruiter',
  'competitive',
  'ml',
  'Kochi, Kerala',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "00:00"}, "weekend": {"start": "17:00", "end": "02:00"}}',
  '{"discord": "AnuRaze#2323", "instagram": "@anu.raze.gaming", "twitch": "anuraze"}',
  true,
  NOW() - INTERVAL '3 months'
);

-- Profile 12: GurpreetAK - CS2 Rifler from Chandigarh
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'GurpreetAK',
  'Gurpreet Singh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Gurpreet&backgroundColor=a0c4ff',
  '/images/banners/gaming-2.svg',
  '🔫 AK spray transfer montages | Punjab CS community | Lan events host | DM for scrims',
  'competitive',
  'pa',
  'Chandigarh, Punjab',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "15:00", "end": "03:00"}}',
  '{"discord": "GurpreetAK#4747", "steam": "gurpreetsprayak", "youtube": "@GurpreetAKCS2"}',
  false,
  NOW() - INTERVAL '7 months'
);

-- Profile 13: RahulAstra - Valorant Controller from Indore
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'RahulAstra',
  'Rahul Joshi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=cdb4db',
  '/images/banners/gaming-3.svg',
  '🌌 Astra galaxy brain | 5000 IQ smokes | MP Gaming Discord admin | Coaching available',
  'competitive',
  'hi',
  'Indore, Madhya Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "13:00", "end": "01:00"}}',
  '{"discord": "RahulAstra#7890", "twitch": "rahulastramain", "twitter": "@RahulAstraValo"}',
  true,
  NOW() - INTERVAL '5 months'
);

-- Profile 14: BiswajitFlex - CS2 Flex from Guwahati
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'BiswajitFlex',
  'Biswajit Bora',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Biswajit&backgroundColor=98f5e1',
  '/images/banners/gaming-4.svg',
  '🎭 Can play any role | Northeast India represent | Assam esports advocate | Grind never stops',
  'competitive',
  'as',
  'Guwahati, Assam',
  'Asia/Kolkata',
  '{"weekday": {"start": "17:00", "end": "23:00"}, "weekend": {"start": "12:00", "end": "02:00"}}',
  '{"discord": "BiswajitFlex#3333", "steam": "biswajitflex", "instagram": "@biswajit_cs2"}',
  false,
  NOW() - INTERVAL '2 months'
);

-- Profile 15: SrinivasFade - Valorant Initiator from Vizag
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SrinivasFade',
  'Srinivas Rao',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Srinivas&backgroundColor=ffddd2',
  '/images/banners/gaming-5.svg',
  '👁️ Fade haunt diff | Info gathering specialist | AP Gaming community | Vizag LAN regular',
  'competitive',
  'te',
  'Vizag, Andhra Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "01:00"}, "weekend": {"start": "16:00", "end": "03:00"}}',
  '{"discord": "SrinivasFade#5050", "youtube": "@SrinivasFadeValo"}',
  true,
  NOW() - INTERVAL '4 months'
);

-- Profile 16: VigneshScope - CS2 AWPer from Coimbatore
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'VigneshScope',
  'Vignesh Kumar',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Vignesh&backgroundColor=caffbf',
  '/images/banners/gaming-1.svg',
  '🎯 AWP flicks compilation maker | Coimbatore CS crew | Practicing 4 hours daily | Rising star',
  'competitive',
  'ta',
  'Coimbatore, Tamil Nadu',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "14:00", "end": "02:00"}}',
  '{"discord": "VigneshScope#6060", "steam": "vigneshscope", "youtube": "@VigneshAWPClips"}',
  false,
  NOW() - INTERVAL '1 month'
);

-- Profile 17: PratikCypher - Valorant Sentinel from Nagpur
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'PratikCypher',
  'Pratik Deshmukh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pratik&backgroundColor=9bf6ff',
  '/images/banners/gaming-2.svg',
  '📷 Cypher cam angles nobody knows | Central India gaming | Setup enjoyer | 1v1 me bro',
  'competitive',
  'mr',
  'Nagpur, Maharashtra',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "00:00"}, "weekend": {"start": "15:00", "end": "02:00"}}',
  '{"discord": "PratikCypher#7171", "instagram": "@pratik.cypher"}',
  true,
  NOW() - INTERVAL '3 months'
);

-- Profile 18: DeepakEntry - CS2 Entry from Surat
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'DeepakEntry',
  'Deepak Shah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak&backgroundColor=fdffb6',
  '/images/banners/gaming-3.svg',
  '🚀 First in last out | Gujarat esports scene | Entry diff machine | Team recruiter',
  'competitive',
  'gu',
  'Surat, Gujarat',
  'Asia/Kolkata',
  '{"weekday": {"start": "20:00", "end": "02:00"}, "weekend": {"start": "17:00", "end": "04:00"}}',
  '{"discord": "DeepakEntry#8282", "steam": "deepakentryking"}',
  false,
  NOW() - INTERVAL '1 month'
);

-- Profile 19: ArunPhoenix - Valorant Duelist from Thiruvananthapuram
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'ArunPhoenix',
  'Arun Pillai',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ArunP&backgroundColor=ffc6ff',
  '/images/banners/gaming-4.svg',
  '🔥 Phoenix ult timing god | Kerala valorant scene builder | Run it back mentality | Never tilt',
  'competitive',
  'ml',
  'Thiruvananthapuram, Kerala',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "16:00", "end": "03:00"}}',
  '{"discord": "ArunPhoenix#9393", "twitch": "arunphoenixval", "instagram": "@arun.phoenix.gaming"}',
  true,
  NOW() - INTERVAL '2 months'
);

-- Profile 20: SumanFlash - CS2 Support from Bhubaneswar
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SumanFlash',
  'Suman Mohapatra',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Suman&backgroundColor=bdb2ff',
  '/images/banners/gaming-5.svg',
  '💡 Flash master | Odisha CS community founder | Utility for days | Team-first always',
  'competitive',
  'or',
  'Bhubaneswar, Odisha',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "23:00"}, "weekend": {"start": "13:00", "end": "01:00"}}',
  '{"discord": "SumanFlash#1010", "steam": "sumanflashking"}',
  false,
  NOW() - INTERVAL '6 months'
);

-- Profile 21: RajViper - Valorant Controller from Patna
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'RajViper',
  'Raj Kumar Singh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=RajK&backgroundColor=a0d2db',
  '/images/banners/gaming-1.svg',
  '🐍 Viper lineups for every map | Bihar gaming ambassador | Post-plant specialist | Toxic only in-game',
  'competitive',
  'hi',
  'Patna, Bihar',
  'Asia/Kolkata',
  '{"weekday": {"start": "17:00", "end": "00:00"}, "weekend": {"start": "12:00", "end": "02:00"}}',
  '{"discord": "RajViper#2121", "youtube": "@RajViperLineups", "instagram": "@raj.viper.val"}',
  true,
  NOW() - INTERVAL '1 month'
);

-- Profile 22: SantoshSilent - CS2 Lurker from Ranchi
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'SantoshSilent',
  'Santosh Oraon',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Santosh&backgroundColor=d4a373',
  '/images/banners/gaming-2.svg',
  '🤫 Silent killer | Jharkhand CS pioneer | Timing is everything | Clutch or nothing',
  'competitive',
  'hi',
  'Ranchi, Jharkhand',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "14:00", "end": "03:00"}}',
  '{"discord": "SantoshSilent#3232", "steam": "santoshsilent"}',
  false,
  NOW() - INTERVAL '2 months'
);

-- Profile 23: YashSkye - Valorant Initiator from Dehradun
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'YashSkye',
  'Yash Rawat',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Yash&backgroundColor=e9c46a',
  '/images/banners/gaming-3.svg',
  '🐕 Skye dog diff | Uttarakhand gaming community | Flash + dog combo master | Free coaching',
  'competitive',
  'hi',
  'Dehradun, Uttarakhand',
  'Asia/Kolkata',
  '{"weekday": {"start": "18:00", "end": "00:00"}, "weekend": {"start": "15:00", "end": "02:00"}}',
  '{"discord": "YashSkye#4343", "instagram": "@yash.skye.val", "twitch": "yashskyemain"}',
  true,
  NOW() - INTERVAL '1 month'
);

-- Profile 24: NikhilGOA - CS2 Rifler from Goa
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, created_at)
VALUES (
  'NikhilGOA',
  'Nikhil Naik',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil&backgroundColor=40916c',
  '/images/banners/gaming-4.svg',
  '🏖️ Chill vibes but tryhard gameplay | Goa gaming scene | Beach + CS2 life | LAN party host',
  'competitive',
  'en',
  'Goa',
  'Asia/Kolkata',
  '{"weekday": {"start": "21:00", "end": "03:00"}, "weekend": {"start": "18:00", "end": "05:00"}}',
  '{"discord": "NikhilGOA#5454", "steam": "nikhilgoacs", "instagram": "@nikhil.goa.gaming"}',
  false,
  NOW() - INTERVAL '4 months'
);

-- Profile 25: AnkitNeon - Valorant Duelist from Bhopal
INSERT INTO demo_profiles (username, display_name, avatar_url, banner_url, bio, gaming_style, preferred_language, region, timezone, online_hours, social_links, is_online, is_verified, created_at)
VALUES (
  'AnkitNeon',
  'Ankit Sharma',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=AnkitS&backgroundColor=00b4d8',
  '/images/banners/gaming-5.svg',
  '⚡ Neon slide diff | MP Valorant founder | Speed is key | Aggressive plays only',
  'competitive',
  'hi',
  'Bhopal, Madhya Pradesh',
  'Asia/Kolkata',
  '{"weekday": {"start": "19:00", "end": "01:00"}, "weekend": {"start": "14:00", "end": "03:00"}}',
  '{"discord": "AnkitNeon#6565", "twitch": "ankitneonval", "youtube": "@AnkitNeonClips"}',
  true,
  true,
  NOW() - INTERVAL '2 months'
);

-- =============================================
-- INSERT DEMO USER GAMES
-- =============================================

-- Profile 1: SkRoshanOP - Valorant + CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'SkRoshan#GOAT', 'Radiant', 'Duelist', 'Initiator', 4200,
  '{"kd_ratio": 1.45, "win_rate": 58, "headshot_percentage": 32, "agents": ["Jett", "Raze", "Neon"], "maps": ["Ascent", "Haven", "Split"]}'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SkRoshan', 'Global Elite', 'Entry Fragger', 1800,
  '{"kd_ratio": 1.32, "win_rate": 54, "headshot_percentage": 48}'
FROM demo_profiles WHERE username = 'SkRoshanOP';

-- Profile 2: AadityaAWP - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'AadityaAWP', 'Global Elite', 'AWPer', 'Lurker', 5600,
  '{"kd_ratio": 1.38, "win_rate": 56, "headshot_percentage": 35}'
FROM demo_profiles WHERE username = 'AadityaAWP';

-- Profile 3: PriyaSmokeQueen - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'SmokeQueen#GIRL', 'Immortal 2', 'Controller', 2800,
  '{"kd_ratio": 1.12, "win_rate": 54, "headshot_percentage": 24, "agents": ["Omen", "Astra", "Viper"], "maps": ["Bind", "Icebox", "Lotus"]}'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

-- Profile 4: VenkatIGL - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'VenkatIGL', 'Global Elite', 'IGL', 'Support', 7200,
  '{"kd_ratio": 1.08, "win_rate": 62, "headshot_percentage": 42}'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'VenkatIGL#HYD', 'Ascendant 3', 'Initiator', 800,
  '{"kd_ratio": 1.05, "win_rate": 52, "agents": ["Sova", "Fade", "Breach"]}'
FROM demo_profiles WHERE username = 'VenkatIGL';

-- Profile 5: KarthikWalls - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'KarthikWalls#WALL', 'Diamond 3', 'Sentinel', 1900,
  '{"kd_ratio": 1.18, "win_rate": 53, "headshot_percentage": 26, "agents": ["Killjoy", "Cypher", "Chamber"], "maps": ["Ascent", "Breeze", "Pearl"]}'
FROM demo_profiles WHERE username = 'KarthikWalls';

-- Profile 6: SouravRUSH - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SouravRUSH', 'Legendary Eagle Master', 'Entry Fragger', 3400,
  '{"kd_ratio": 1.25, "win_rate": 51, "headshot_percentage": 52}'
FROM demo_profiles WHERE username = 'SouravRUSH';

-- Profile 7: NehaDuelist - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'NehaDuelist#DASH', 'Immortal 1', 'Duelist', 2400,
  '{"kd_ratio": 1.35, "win_rate": 55, "headshot_percentage": 28, "agents": ["Jett", "Reyna", "Neon"], "maps": ["Haven", "Split", "Fracture"]}'
FROM demo_profiles WHERE username = 'NehaDuelist';

-- Profile 8: HarshLurk - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'HarshLurk', 'Supreme Master First Class', 'Lurker', 'Rifler', 4100,
  '{"kd_ratio": 1.22, "win_rate": 54, "headshot_percentage": 45}'
FROM demo_profiles WHERE username = 'HarshLurk';

-- Profile 9: ArjunSova - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'ArjunSova#DART', 'Ascendant 2', 'Initiator', 2100,
  '{"kd_ratio": 1.15, "win_rate": 56, "headshot_percentage": 25, "agents": ["Sova", "Fade", "Skye"], "maps": ["Icebox", "Breeze", "Ascent"]}'
FROM demo_profiles WHERE username = 'ArjunSova';

-- Profile 10: AmitSupport - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'AmitSupport', 'Master Guardian Elite', 'Support', 'IGL', 2800,
  '{"kd_ratio": 0.95, "win_rate": 55, "headshot_percentage": 38}'
FROM demo_profiles WHERE username = 'AmitSupport';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'AmitSupport#UTIL', 'Platinum 3', 'Controller', 600,
  '{"kd_ratio": 0.98, "win_rate": 51, "agents": ["Brimstone", "Omen"]}'
FROM demo_profiles WHERE username = 'AmitSupport';

-- Profile 11: AnuRaze - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'AnuRaze#BOOM', 'Diamond 2', 'Duelist', 1600,
  '{"kd_ratio": 1.28, "win_rate": 52, "agents": ["Raze", "Phoenix", "Neon"], "maps": ["Bind", "Split", "Haven"]}'
FROM demo_profiles WHERE username = 'AnuRaze';

-- Profile 12: GurpreetAK - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'GurpreetAK', 'Legendary Eagle', 'Rifler', 'Entry Fragger', 3200,
  '{"kd_ratio": 1.18, "win_rate": 52, "headshot_percentage": 41}'
FROM demo_profiles WHERE username = 'GurpreetAK';

-- Profile 13: RahulAstra - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'RahulAstra#STAR', 'Ascendant 1', 'Controller', 2000,
  '{"kd_ratio": 1.05, "win_rate": 54, "agents": ["Astra", "Omen", "Harbor"], "maps": ["Lotus", "Pearl", "Sunset"]}'
FROM demo_profiles WHERE username = 'RahulAstra';

-- Profile 14: BiswajitFlex - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'BiswajitFlex', 'Distinguished Master Guardian', 'Flex', 2600,
  '{"kd_ratio": 1.12, "win_rate": 50, "headshot_percentage": 44}'
FROM demo_profiles WHERE username = 'BiswajitFlex';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'BiswajitFlex#NE', 'Gold 3', 'Sentinel', 400,
  '{"kd_ratio": 1.08, "win_rate": 49, "agents": ["Cypher", "Killjoy"]}'
FROM demo_profiles WHERE username = 'BiswajitFlex';

-- Profile 15: SrinivasFade - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'SrinivasFade#INFO', 'Diamond 1', 'Initiator', 1700,
  '{"kd_ratio": 1.10, "win_rate": 53, "agents": ["Fade", "Gekko", "KAY/O"], "maps": ["Ascent", "Haven", "Icebox"]}'
FROM demo_profiles WHERE username = 'SrinivasFade';

-- Profile 16: VigneshScope - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'VigneshScope', 'Master Guardian 2', 'AWPer', 1800,
  '{"kd_ratio": 1.20, "win_rate": 50, "headshot_percentage": 28}'
FROM demo_profiles WHERE username = 'VigneshScope';

-- Profile 17: PratikCypher - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'PratikCypher#CAM', 'Platinum 2', 'Sentinel', 1400,
  '{"kd_ratio": 1.08, "win_rate": 51, "agents": ["Cypher", "Chamber", "Killjoy"], "maps": ["Split", "Bind", "Ascent"]}'
FROM demo_profiles WHERE username = 'PratikCypher';

-- Profile 18: DeepakEntry - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'DeepakEntry', 'Gold Nova Master', 'Entry Fragger', 1500,
  '{"kd_ratio": 1.15, "win_rate": 48, "headshot_percentage": 46}'
FROM demo_profiles WHERE username = 'DeepakEntry';

-- Profile 19: ArunPhoenix - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'ArunPhoenix#FIRE', 'Platinum 3', 'Duelist', 1300,
  '{"kd_ratio": 1.22, "win_rate": 50, "agents": ["Phoenix", "Yoru", "Iso"], "maps": ["Haven", "Bind", "Fracture"]}'
FROM demo_profiles WHERE username = 'ArunPhoenix';

-- Profile 20: SumanFlash - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SumanFlash', 'Master Guardian 1', 'Support', 2100,
  '{"kd_ratio": 0.92, "win_rate": 53, "headshot_percentage": 36}'
FROM demo_profiles WHERE username = 'SumanFlash';

-- Profile 21: RajViper - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'RajViper#ACID', 'Gold 2', 'Controller', 1100,
  '{"kd_ratio": 1.02, "win_rate": 50, "agents": ["Viper", "Brimstone", "Clove"], "maps": ["Breeze", "Icebox", "Pearl"]}'
FROM demo_profiles WHERE username = 'RajViper';

-- Profile 22: SantoshSilent - CS2
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'SantoshSilent', 'Gold Nova 3', 'Lurker', 1400,
  '{"kd_ratio": 1.10, "win_rate": 49, "headshot_percentage": 40}'
FROM demo_profiles WHERE username = 'SantoshSilent';

-- Profile 23: YashSkye - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'YashSkye#WOOF', 'Silver 3', 'Initiator', 800,
  '{"kd_ratio": 1.05, "win_rate": 48, "agents": ["Skye", "Breach", "KAY/O"], "maps": ["Ascent", "Haven", "Split"]}'
FROM demo_profiles WHERE username = 'YashSkye';

-- Profile 24: NikhilGOA - CS2 + Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, secondary_role, hours_played, stats)
SELECT id, 'Counter-Strike 2', 'cs2', 'NikhilGOA', 'Silver Elite Master', 'Rifler', 'Flex', 1200,
  '{"kd_ratio": 1.08, "win_rate": 47, "headshot_percentage": 38}'
FROM demo_profiles WHERE username = 'NikhilGOA';

INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'NikhilGOA#BEACH', 'Bronze 3', 'Duelist', 300,
  '{"kd_ratio": 1.12, "win_rate": 46, "agents": ["Reyna", "Phoenix"]}'
FROM demo_profiles WHERE username = 'NikhilGOA';

-- Profile 25: AnkitNeon - Valorant
INSERT INTO demo_user_games (user_id, game_name, game_slug, in_game_name, rank, role, hours_played, stats)
SELECT id, 'Valorant', 'valorant', 'AnkitNeon#ZOOM', 'Gold 1', 'Duelist', 950,
  '{"kd_ratio": 1.18, "win_rate": 49, "agents": ["Neon", "Jett", "Raze"], "maps": ["Split", "Fracture", "Sunset"]}'
FROM demo_profiles WHERE username = 'AnkitNeon';

-- =============================================
-- INSERT DEMO USER BADGES
-- =============================================

-- SkRoshanOP badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '6 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Tournament Champion', 'tournament_winner', '🏆', 'Won a tournament', 'legendary', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Content Creator', 'streamer', '📺', 'Active streamer', 'epic', NOW() - INTERVAL '4 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'LAN Warrior', 'lan_warrior', '🖥️', 'Attended LAN events', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'SkRoshanOP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Headshot Machine', 'headshot_machine', '🎯', '60%+ headshot rate', 'legendary', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'SkRoshanOP';

-- AadityaAWP badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '8 months'
FROM demo_profiles WHERE username = 'AadityaAWP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Dedicated Grinder', 'grinder', '⚡', '1000+ hours played', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'AadityaAWP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Ace Hunter', 'ace_hunter', '💀', '100+ aces', 'epic', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'AadityaAWP';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Veteran', 'veteran', '🎖️', '5+ years gaming', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'AadityaAWP';

-- PriyaSmokeQueen badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '7 months'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Content Creator', 'streamer', '📺', 'Active streamer', 'epic', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Friendly Player', 'friendly', '😊', 'High teammate ratings', 'common', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Mentor', 'mentor', '📚', 'Helped 50+ new players', 'rare', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

-- VenkatIGL badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '14 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Team Captain', 'team_captain', '👑', 'Leads a clan/team', 'epic', NOW() - INTERVAL '9 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Mentor', 'mentor', '📚', 'Helped 50+ new players', 'rare', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'LAN Warrior', 'lan_warrior', '🖥️', 'Attended LAN events', 'epic', NOW() - INTERVAL '4 months'
FROM demo_profiles WHERE username = 'VenkatIGL';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Veteran', 'veteran', '🎖️', '5+ years gaming', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'VenkatIGL';

-- NehaDuelist badges
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', NOW() - INTERVAL '6 months'
FROM demo_profiles WHERE username = 'NehaDuelist';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Content Creator', 'streamer', '📺', 'Active streamer', 'epic', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username = 'NehaDuelist';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Rising Star', 'rising_star', '🚀', 'Fast rank improvement', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username = 'NehaDuelist';

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Ace Hunter', 'ace_hunter', '💀', '100+ aces', 'epic', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username = 'NehaDuelist';

-- Add verified badges for other profiles
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Verified Player', 'verified', '✓', 'Account verified', 'common', created_at + INTERVAL '7 days'
FROM demo_profiles WHERE username IN ('KarthikWalls', 'SouravRUSH', 'HarshLurk', 'ArjunSova', 'AmitSupport',
  'AnuRaze', 'GurpreetAK', 'RahulAstra', 'BiswajitFlex', 'SrinivasFade', 'VigneshScope', 'PratikCypher',
  'DeepakEntry', 'ArunPhoenix', 'SumanFlash', 'RajViper', 'SantoshSilent', 'YashSkye', 'NikhilGOA', 'AnkitNeon');

-- Additional badges for various profiles
INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Clutch Master', 'clutch_master', '🎯', '500+ clutch wins', 'epic', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username IN ('HarshLurk', 'SantoshSilent', 'KarthikWalls');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Friendly Player', 'friendly', '😊', 'High teammate ratings', 'common', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('AmitSupport', 'ArjunSova', 'YashSkye', 'SumanFlash', 'ArunPhoenix', 'AnuRaze');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'MVP', 'mvp', '⭐', 'Match MVP 100+ times', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username IN ('SouravRUSH', 'GurpreetAK', 'DeepakEntry');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Mentor', 'mentor', '📚', 'Helped 50+ new players', 'rare', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('RahulAstra', 'YashSkye', 'RajViper');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Early Adopter', 'early_adopter', '🌟', 'Joined during beta', 'rare', NOW() - INTERVAL '6 months'
FROM demo_profiles WHERE username IN ('RahulAstra', 'SumanFlash');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Team Captain', 'team_captain', '👑', 'Leads a clan/team', 'epic', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('AnuRaze', 'SumanFlash', 'AnkitNeon');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Rising Star', 'rising_star', '🚀', 'Fast rank improvement', 'rare', NOW() - INTERVAL '1 month'
FROM demo_profiles WHERE username IN ('VigneshScope', 'AnkitNeon');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'LAN Warrior', 'lan_warrior', '🖥️', 'Attended LAN events', 'epic', NOW() - INTERVAL '3 months'
FROM demo_profiles WHERE username IN ('GurpreetAK', 'SrinivasFade', 'NikhilGOA');

INSERT INTO demo_user_badges (user_id, badge_name, badge_slug, badge_icon, badge_description, badge_rarity, earned_at)
SELECT id, 'Dedicated Grinder', 'grinder', '⚡', '1000+ hours played', 'rare', NOW() - INTERVAL '2 months'
FROM demo_profiles WHERE username IN ('HarshLurk', 'SouravRUSH', 'GurpreetAK');

-- =============================================
-- Create view for complete demo profiles
-- =============================================
CREATE OR REPLACE VIEW demo_profiles_complete AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.banner_url,
  p.bio,
  p.gaming_style,
  p.preferred_language,
  p.region,
  p.timezone,
  p.online_hours,
  p.social_links,
  p.is_online,
  p.is_verified,
  p.created_at,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'game', g.game_name,
      'game_slug', g.game_slug,
      'in_game_name', g.in_game_name,
      'rank', g.rank,
      'role', g.role,
      'secondary_role', g.secondary_role,
      'hours', g.hours_played,
      'stats', g.stats
    ) ORDER BY g.hours_played DESC)
    FROM demo_user_games g WHERE g.user_id = p.id),
    '[]'::json
  ) as games,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'name', b.badge_name,
      'slug', b.badge_slug,
      'icon', b.badge_icon,
      'description', b.badge_description,
      'rarity', b.badge_rarity,
      'earned_at', b.earned_at
    ) ORDER BY
      CASE b.badge_rarity
        WHEN 'legendary' THEN 1
        WHEN 'epic' THEN 2
        WHEN 'rare' THEN 3
        ELSE 4
      END)
    FROM demo_user_badges b WHERE b.user_id = p.id),
    '[]'::json
  ) as badges,
  (SELECT COUNT(*) FROM demo_user_badges b WHERE b.user_id = p.id) as badge_count,
  (SELECT COALESCE(SUM(g.hours_played), 0) FROM demo_user_games g WHERE g.user_id = p.id) as total_hours
FROM demo_profiles p
ORDER BY p.is_online DESC, p.created_at DESC;

-- Grant access
GRANT SELECT ON demo_profiles_complete TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully created 25 Indian demo profiles with games and badges!';
  RAISE NOTICE '📊 Tables created: demo_profiles, demo_user_games, demo_user_badges';
  RAISE NOTICE '👁️ View created: demo_profiles_complete';
END $$;
-- =============================================
-- SEED: Demo Community Posts (Gaming Content)
-- =============================================
-- Creates demo_community_posts table for sample blog/community posts
-- Focused on Valorant, CS2, PUBG Mobile, Free Fire, COC, and COD Mobile content with Indian gamer authors
-- =============================================

-- Create demo_community_posts table
CREATE TABLE IF NOT EXISTS demo_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('guide', 'news', 'analysis', 'opinion', 'tips', 'esports', 'announcement')),
  game VARCHAR(50) NOT NULL CHECK (game IN ('valorant', 'cs2', 'pubg-mobile', 'freefire', 'coc', 'cod-mobile', 'other', 'general')),
  tags TEXT[] DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demo_post_comments table
CREATE TABLE IF NOT EXISTS demo_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES demo_community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_demo_posts_author ON demo_community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_demo_posts_slug ON demo_community_posts(slug);
CREATE INDEX IF NOT EXISTS idx_demo_posts_game ON demo_community_posts(game);
CREATE INDEX IF NOT EXISTS idx_demo_posts_category ON demo_community_posts(category);
CREATE INDEX IF NOT EXISTS idx_demo_posts_featured ON demo_community_posts(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_comments_post ON demo_post_comments(post_id);

-- Enable RLS
ALTER TABLE demo_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_post_comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Demo posts are viewable by everyone" ON demo_community_posts
  FOR SELECT USING (true);

CREATE POLICY "Demo comments are viewable by everyone" ON demo_post_comments
  FOR SELECT USING (true);

-- =============================================
-- INSERT DEMO COMMUNITY POSTS
-- =============================================

-- Clear existing demo posts
TRUNCATE demo_community_posts CASCADE;

-- Post 1: Valorant Guide by SkRoshanOP
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, is_pinned, created_at)
SELECT
  id,
  'Mastering Jett in 2024: The Complete Guide to Dominating Ranked',
  'mastering-jett-2024-complete-guide',
  'From entry fragging to clutch plays, learn how to maximize Jett''s kit and climb to Radiant. Includes advanced dash mechanics, updraft spots, and ult management tips.',
  '## Introduction

Jett remains one of the most impactful duelists in Valorant, and mastering her can single-handedly carry games. After 4000+ hours on Jett, I''m sharing everything I''ve learned.

## Why Jett in 2024?

Despite nerfs, Jett''s kit offers unmatched mobility and entry potential. Her ability to take aggressive angles and escape makes her perfect for creating space.

## Core Mechanics

### Dash Timing
The key to Jett is understanding when to dash. Don''t use it reactively - plan your escape route before taking a fight.

**Pro tip:** Bind dash to a comfortable key. I use Mouse Button 4.

### Updraft Spots
Every map has updraft positions that give you off-angles:
- **Ascent A Site:** Updraft to generator for the unexpected peek
- **Haven C Site:** Updraft to window for site control
- **Split Mid:** Updraft vent peek catches everyone off-guard

### Blade Storm Management
Your ult isn''t just for eco rounds. Use it to:
1. Take aggressive peeks without buying rifles
2. Clutch situations where you need accuracy
3. Post-plant scenarios with unlimited ammo

## Entry Fragging 101

The best Jetts don''t just W-key. Here''s my approach:
1. **Call for utility** - Ask your initiator for flashes
2. **Dry peek information** - Shoulder peek to bait shots
3. **Commit with dash ready** - Entry and dash to safety
4. **Trade setup** - Position so teammates can refrag

## Ranked Climbing Tips

- Play 2-3 agents, but one-trick Jett in crucial games
- Watch your VODs - identify death patterns
- Aim train 20 mins daily - Jett requires crisp aim
- Communicate early rotates - duelists often see rotations first

## Common Mistakes

1. **Dashing into site alone** - Wait for utility
2. **Using knives on eco** - Sometimes the Spectre is better
3. **Predictable updraft angles** - Mix it up
4. **No comms** - Entry info is crucial

## Conclusion

Jett rewards mechanical skill and game sense equally. Master the fundamentals, and the flashy plays will come naturally. See you in Radiant!

*DM me on Discord for VOD reviews: SkRoshanOP#1337*',
  '/images/banners/gaming-1.svg',
  'guide',
  'valorant',
  ARRAY['jett', 'duelist', 'guide', 'ranked', 'tips', 'mechanics'],
  15420,
  892,
  156,
  8,
  true,
  true,
  NOW() - INTERVAL '3 days'
FROM demo_profiles WHERE username = 'SkRoshanOP';

-- Post 2: CS2 Analysis by AadityaAWP
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'AWP Positioning in CS2: 15 Spots That Will Get You Free Kills',
  'awp-positioning-cs2-free-kills-guide',
  'Tired of getting traded after your first AWP kill? Learn the angles that let you get picks and survive to tell the tale. Tested in 25K+ Premier matches.',
  '## The Philosophy of AWP Positioning

Every good AWPer knows: the best position is one you haven''t used before. But there are fundamentals that work at every level.

## What Makes a Good AWP Position?

1. **Cover after the shot** - Can you hide immediately?
2. **Escape route** - Where do you fall back?
3. **Multiple angles** - Can you adjust if they smoke you?
4. **Trade protection** - Is your team in position?

## Top 15 Positions

### Mirage

**1. Jungle Window (A)**
From jungle, you can hold palace and ramp. The window gives cover after shots.

**2. Van (B)**
Classic but effective. Crouch behind van, peek over for the shot.

**3. Top Mid**
Hold window room from top mid. Most players don''t expect it.

### Inferno

**4. Pit Back (A)**
Deep in pit, you control the entire A long approach.

**5. Coffins Angle (B)**
From coffins, angle towards banana. Free information and picks.

**6. Arch Side (Mid)**
Unexpected angle watching mid-to-B rotates.

### Dust 2

**7. Plat (A)**
Elevation advantage, hold long doors with ease.

**8. Window Room (Mid)**
Classic for a reason. Control mid completely.

**9. Back B**
Deep in B site, catch players rushing through tunnels.

### Ancient

**10. Temple (A)**
Hold main and donut simultaneously.

**11. Mid Top**
Control cave and mid push with one angle.

### Anubis

**12. Heaven (A)**
The new elite position. High ground advantage.

**13. Bridge (Mid)**
Hold connector and mid simultaneously.

### Nuke

**14. Heaven**
Classic vertical angle covering A site entirely.

**15. Outside Silo**
Unconventional but catches rotations.

## Movement After the Shot

The AWP is loud. Everyone knows where you are. Your movement in the next 3 seconds determines survival.

**Rule:** Never repeek the same angle twice in a row.

## Practice Routine

1. **10 mins:** Flick training in aim_botz
2. **15 mins:** Position practice in private server
3. **5 mins:** Quick scope drills

## Final Thoughts

AWPing isn''t just about aim - it''s chess. Think three steps ahead, and you''ll be hitting clips in no time.

*Join my Discord for AWP training sessions: AadityaAWP#2048*',
  '/images/banners/gaming-2.svg',
  'guide',
  'cs2',
  ARRAY['awp', 'positioning', 'guide', 'premier', 'tips', 'spots'],
  12850,
  734,
  98,
  10,
  true,
  NOW() - INTERVAL '5 days'
FROM demo_profiles WHERE username = 'AadityaAWP';

-- Post 3: Valorant Esports News by PriyaSmokeQueen
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'VCT 2024 India: Why Controller Players Are the Unsung Heroes',
  'vct-2024-india-controller-players-unsung-heroes',
  'While duelists get the highlight reels, controller players are winning championships. A deep dive into the Indian VCT scene''s smoke metas.',
  '## The Smoke Meta Evolution

The VCT 2024 season has shown us something interesting: teams with elite controller players are consistently outperforming. Let''s analyze why.

## The Numbers Don''t Lie

Looking at Indian VCT Challengers data:
- Teams with dedicated controller mains: **67% win rate**
- Teams flexing controller role: **43% win rate**

The difference? Consistency and depth of knowledge.

## Why Controllers Win Games

### 1. Execute Enablers
A perfect smoke is the difference between a successful site take and a disaster. Consistent smoke placement means:
- Duelists can entry safely
- Initiator utility lands effectively
- The team takes less damage overall

### 2. Post-Plant Anchors
In post-plant scenarios, controllers shine:
- One-ways for information
- Deep smokes to delay defuse
- Mollies/stars for area denial

### 3. Retake Potential
Controllers are clutch machines. Their utility refreshes the fight:
- Isolate angles one by one
- Create safe passages for teammates
- Deny information to attackers

## Top Indian Controllers to Watch

### Omen Players
The one-way king. Indian Omen players have developed unique lineups that the global scene is now adopting.

### Astra Mains
High skill ceiling, massive reward. The best Astra players control entire maps.

### Viper Specialists
Post-plant Viper is terrifying. The lineups Indian players have developed are championship-caliber.

## The Girls in Gaming Perspective

As a female controller main, I want to highlight: there''s a path to pro play that doesn''t require insane mechanics. Game sense, communication, and utility mastery matter equally.

## What This Means for Ranked

If you''re hardstuck, consider:
1. Learning controller as your secondary role
2. Understanding smoke timings deeply
3. Watching pro controller POVs

## Conclusion

The best teams are built on solid controller play. If you want to go pro or just rank up, respect the smoke diff.

*Follow my journey: @PriyaGamingBLR*',
  '/images/banners/gaming-3.svg',
  'analysis',
  'valorant',
  ARRAY['vct', 'esports', 'controller', 'india', 'analysis', 'meta'],
  9845,
  567,
  89,
  7,
  false,
  NOW() - INTERVAL '7 days'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

-- Post 4: CS2 IGL Guide by VenkatIGL
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'From Pug Star to IGL: Building a Championship-Caliber CS2 Team',
  'pug-star-to-igl-building-championship-cs2-team',
  'After years on Entity Gaming and coaching countless players, here''s everything I know about leading a CS2 team to victory.',
  '## The IGL Mindset

Being an IGL isn''t about having the best aim or the most hours. It''s about making everyone around you better.

## My Journey

I started as a fragger. Good aim, zero game sense. It took losing countless important matches to realize: someone needs to think while everyone else shoots.

## What Makes a Great IGL?

### 1. Reading the Game
- **Kill feed awareness** - Who died? Where? What does this mean?
- **Utility tracking** - They used two smokes? Push now.
- **Economy management** - When to force, when to save

### 2. Communication
The best call is useless if delivered poorly:
- Short, clear callouts
- Positive reinforcement mid-round
- Save criticism for post-game

### 3. Adaptation
No plan survives contact with the enemy. You need:
- Default plays for information
- Planned executes for key rounds
- Mid-round calls based on info

## Building Your Team

### Finding the Right Players
Look for:
1. **Coachability** - Can they take feedback?
2. **Consistency** - Do they show up every practice?
3. **Communication** - Do they give useful info?

### Role Distribution
A balanced CS2 team needs:
- 1 IGL (can be any role)
- 1 Primary AWP
- 1 Entry
- 1-2 Support/Utility
- 1 Lurk

### Practice Structure
Our Entity Gaming routine:
- **Monday:** VOD review of weekend matches
- **Tuesday-Thursday:** Scrims (3-4 hours each)
- **Friday:** Anti-strat session
- **Weekend:** Matches

## Anti-Stratting

The difference between good and great teams:
1. Watch opponent demos
2. Identify patterns
3. Prepare specific counters
4. Execute in crucial rounds

## Managing Tilt

Your team will tilt. Here''s how to handle it:
- Call timeout immediately
- Acknowledge the frustration
- Refocus on the next round
- Save detailed discussion for later

## Building HydCS Academy

I''m now focused on developing the next generation of Indian CS talent. The scene needs:
- More organized tournaments
- Better coaching infrastructure
- Mental health support for players

## Final Thoughts

IGLing is thankless work. Your stats will suffer. But winning? That feeling makes it all worth it.

*Interested in coaching? DM me: VenkatIGL#1001*',
  '/images/banners/gaming-4.svg',
  'guide',
  'cs2',
  ARRAY['igl', 'leadership', 'team', 'coaching', 'strategy', 'india'],
  11230,
  623,
  134,
  12,
  true,
  NOW() - INTERVAL '10 days'
FROM demo_profiles WHERE username = 'VenkatIGL';

-- Post 5: Valorant Tips by NehaDuelist
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'Breaking Into VCT Game Changers: A Roadmap for Aspiring Female Pros',
  'breaking-vct-game-changers-roadmap-female-pros',
  'The path to Game Changers isn''t just about skill - it''s about building your presence, finding the right team, and staying mentally strong.',
  '## My Game Changers Dream

Two years ago, I was hardstuck Platinum. Today, I''m Immortal and grinding for Game Changers. Here''s what I learned.

## The Reality Check

Let''s be honest about what you need:
- **Minimum Immortal rank** - Most teams require this
- **Consistent schedule** - 4-6 hours daily for practice
- **Thick skin** - The journey has its challenges

## Building Your Foundation

### Rank Up First
Before team tryouts:
1. Hit Immortal minimum (Diamond 3 for very new scenes)
2. Have VODs ready showing your best plays
3. Maintain a positive tracker.gg history

### Role Mastery
Don''t be a fill player. Master 2-3 agents in one role:
- **Duelists:** Jett, Raze, Neon (my specialty)
- **Controllers:** Omen, Astra, Viper
- **Initiators:** Sova, Fade, Skye
- **Sentinels:** Killjoy, Cypher, Chamber

## Finding a Team

### Where to Look
- Game Changers Discord servers
- Twitter/X gaming communities
- Reddit recruitment threads
- GamerHub LFT posts

### What Teams Want
1. **Coachability** - Can you take criticism?
2. **Availability** - Consistent practice schedule
3. **Communication** - Clear, positive comms
4. **Mental fortitude** - Can you handle pressure?

## The Tryout Process

Expect:
- 1v1 duels to test mechanics
- Team scrims to test chemistry
- VOD review sessions
- Personality/vibe checks

### How to Stand Out
- Be early to everything
- Communicate clearly
- Stay positive even when losing
- Ask thoughtful questions

## Dealing with Toxicity

It exists. Here''s how I handle it:
- Mute immediately, report after game
- Build a supportive community around you
- Focus on improvement, not validation
- Remember: their words reflect them, not you

## Content Creation

Building your brand helps:
- Stream your ranked games
- Post clips on Twitter/TikTok
- Engage with the community
- Show your personality

## The Girls Squad

I''m recruiting for a team focused on Game Changers. We need:
- Dedicated players (Immortal+)
- Positive attitudes
- Willingness to improve
- Schedule flexibility

## Final Advice

The path is long but rewarding. Every female pro you see started exactly where you are. The difference? They didn''t quit.

*Join my Discord for girls-only 10-mans: NehaDuelist#8888*',
  '/images/banners/gaming-5.svg',
  'guide',
  'valorant',
  ARRAY['game-changers', 'female', 'esports', 'career', 'tips', 'guide'],
  8920,
  712,
  203,
  9,
  false,
  NOW() - INTERVAL '4 days'
FROM demo_profiles WHERE username = 'NehaDuelist';

-- Post 6: Valorant Agent Guide by ArjunSova
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Sova Lineups That Pros Don''t Want You to Know (Every Map Updated)',
  'sova-lineups-pros-dont-want-you-know-every-map',
  'After spending 2000+ hours perfecting Sova, here are the lineups that consistently get me free kills and info in Ranked.',
  '## Why Sova in 2024?

Despite Fade''s popularity, Sova remains S-tier for one reason: consistent, reliable information. His dart and drone combo is unmatched for methodical team play.

## The Lineup Philosophy

Good lineups share these traits:
1. **Quick setup** - Under 3 seconds to execute
2. **Hard to destroy** - Places dart in protected spots
3. **Maximum coverage** - Reveals common positions
4. **Repeatability** - Works every time

## Ascent Lineups

### A Site from A Main
**Post-plant dart:** Stand in default corner, aim at the tower tip, jump+throw for a dart that reveals heaven and hell.

### B Site from B Main
**Entry dart:** From B main cubby, aim at the roof corner, no-jump throw lands behind site.

### Mid from Bottom Mid
**Info dart:** Wall lineup that reveals market and pizza without exposure.

## Bind Lineups

### A Site from Showers
**Classic entry:** From showers entrance, aim at lamp, reveals short and triple.

### B Site from Hookah
**Window dart:** Reveals garden and CT without entering site.

## Haven Lineups

### A Site from A Long
**Deep dart:** Reveals heaven, hell, and short with one dart.

### C Site from C Long
**Post-plant special:** Dart that scans site continuously during defuse.

## Icebox Lineups

### A Site from A Main
**Kitchen dart:** The famous lineup that wins A takes.

### B Site from B Main
**Tube dart:** Catches stackers and default players.

## Lotus Lineups

### A Site from A Main
**Rubble dart:** New lineup covering 70% of site.

### C Site from C Main
**Waterfall dart:** Reveals mound and back site.

## Practice Routine

1. **10 mins:** Lineup review in custom
2. **20 mins:** Execute timing practice
3. **Ranked application:** Use 2-3 new lineups per game

## Advanced Tech

### Shock Dart Kills
Post-plant shock dart kills require:
- Knowing exact plant position
- Having 2 shock darts
- Timing (5 seconds before defuse completes)

### Drone Economy
Only drone when:
- You have ult for follow-up
- Your team is ready to trade
- The round is important

## Resources

All lineups available on my YouTube with timestamps:
- @ArjunSovaLineups
- Each map has a dedicated video
- Updating monthly with new spots

*Rajasthan represent!*',
  '/images/banners/gaming-1.svg',
  'guide',
  'valorant',
  ARRAY['sova', 'lineups', 'initiator', 'guide', 'tips', 'maps'],
  14320,
  845,
  167,
  11,
  NOW() - INTERVAL '6 days'
FROM demo_profiles WHERE username = 'ArjunSova';

-- Post 7: CS2 Opinion by HarshLurk
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'The Lost Art of Lurking: Why CS2''s Fast Meta is Missing Something',
  'lost-art-lurking-cs2-fast-meta-missing',
  'Everyone wants to entry, but the best lurkers still win championships. A deep dive into why patience is underrated in modern CS.',
  '## The Problem with CS2 Pugs

Queue up for any Premier match, and you''ll see it: five players rushing to be the first one into site. Lurking? That''s "baiting" apparently.

## What Is Lurking, Actually?

Lurking isn''t hiding in spawn. It''s:
- **Map control** - Taking space the enemy assumes is clear
- **Information** - Calling rotations before they happen
- **Timing** - Hitting flanks at the perfect moment
- **Economy disruption** - Getting exit frags on force buys

## Why It''s Dying

### 1. The Content Culture
Highlight reels show entries, not lurks. Nobody clips "HarshLurk holds flank for 45 seconds."

### 2. FaceIT/Premier Mentality
Random teammates want visible impact. A 0-0-3 lurker at halftime gets flamed, even if they''re enabling every round.

### 3. Pro Scene Influence
Modern pro CS is fast. But pros have rehearsed executes - pugs don''t.

## The Value of a Good Lurk

Consider this scenario:
- Your team fakes A on Mirage
- You''re lurking palace
- Enemies rotate through connector
- You get a 2-3k from behind

That''s not baiting. That''s reading the game.

## When to Lurk

### DO Lurk When:
- Your team has info to execute without you
- You can hear rotations
- The enemy is predictable
- You have a timing in mind

### DON''T Lurk When:
- Your team needs bodies on site
- You''re down players
- The enemy has already rotated
- You''re lurking just to pad K/D

## My Favorite Lurk Spots

### Mirage
- **Palace** - Classic for a reason
- **Underpass** - Control mid secretly
- **B apps hold** - After A contact

### Inferno
- **Banana** - Solo B lurk while team executes A
- **Library** - Post-plant flanker

### Dust 2
- **Upper tunnels** - A Long fake, B lurk
- **Long doors** - B split lurk

## The Mental Game

Lurking requires patience. You need to:
- Be okay with low round impact sometimes
- Trust your teammates
- Time your moves perfectly
- Accept that people won''t understand

## Communication for Lurkers

Call everything:
- "One rotating through mid"
- "Connector clear, pushing B"
- "I have timing in 10 seconds"
- "Don''t peek, I have flank"

## Final Thoughts

The best teams have dedicated lurkers. If you have game sense but average aim, this might be your path to improvement.

*Solo queue warriors: sometimes lurking is the play.*',
  '/images/banners/gaming-2.svg',
  'opinion',
  'cs2',
  ARRAY['lurking', 'strategy', 'opinion', 'meta', 'tips', 'positioning'],
  7650,
  456,
  89,
  8,
  NOW() - INTERVAL '8 days'
FROM demo_profiles WHERE username = 'HarshLurk';

-- Post 8: Valorant News by RahulAstra
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Astra After the Nerfs: Still Galaxy Brain or Time to Switch?',
  'astra-after-nerfs-still-galaxy-brain-time-switch',
  'Riot nerfed Astra''s stars again. Here''s my honest take on whether she''s still worth the effort in Ranked.',
  '## The Nerfs Explained

Patch 9.0 brought significant changes:
- Star recall time increased
- Gravity well size reduced
- Ultimate cost increased

## The Community Reaction

Twitter was on fire. "Astra is dead," they said. But is she?

## My Testing Results

After 50 games post-patch:
- **Win rate:** 52% (down from 56%)
- **Impact per round:** Similar
- **Difficulty:** Higher

## What Changed Practically

### Star Management
Previously: Place stars liberally, recall freely
Now: Every star placement must be intentional

### Gravity Well
The smaller radius means:
- Harder to catch multiple enemies
- Positioning needs to be more precise
- Less forgiving on reads

### Ultimate
Five orbs instead of four. This means:
- Fewer walls per game
- More commitment per use
- Higher value required

## Is She Still Worth It?

**Yes, but...**

Astra''s skill floor went up. If you''re not willing to:
- Study pro Astra gameplay
- Practice star placement extensively
- Accept a learning curve

Then Omen or Harbor might serve you better.

## Who Should Still Play Astra?

- **Dedicated controller mains** - Your investment pays off
- **Team players** - Astra shines with coordination
- **Big brain players** - If you predict well, she''s still OP

## Who Should Switch?

- **Casual controller players** - Omen is more forgiving
- **Solo queue warriors** - Astra needs team support
- **Struggling mechanically** - Focus on aim, not utility

## Patch Wishlist

What I''d like to see:
1. Faster recall on unused stars
2. Slightly larger gravity well
3. Ultimate back to 4 orbs

## Conclusion

Astra isn''t dead - she''s more skill-indexed. If you love the cosmic controller fantasy, keep grinding. If not, Omen awaits.

*The stars align for those who persist.*

*Join MP Gaming Discord for Astra discussions: RahulAstra#7890*',
  '/images/banners/gaming-3.svg',
  'analysis',
  'valorant',
  ARRAY['astra', 'controller', 'patch', 'analysis', 'nerfs', 'meta'],
  6890,
  398,
  67,
  6,
  NOW() - INTERVAL '2 days'
FROM demo_profiles WHERE username = 'RahulAstra';

-- Post 9: CS2 Tips by GurpreetAK
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'AK-47 Spray Control: The 30-Day Challenge That Changed My Game',
  'ak-47-spray-control-30-day-challenge-changed-game',
  'I went from Silver spray to Global spray in 30 days. Here''s the exact routine, with daily practice guides.',
  '## The Challenge Origin

I was hardstuck LEM for six months. Great positioning, okay utility, but my spray? Embarrassing. Time for drastic measures.

## The 30-Day Structure

### Week 1: Foundation
**Focus:** First 10 bullets only

Daily routine (45 mins):
- 15 mins: Static spray on wall
- 15 mins: Recoil Master workshop map
- 15 mins: Bot practice (standing targets)

### Week 2: Movement Integration
**Focus:** Spray transfers

Daily routine (45 mins):
- 10 mins: Wall spray (full 30)
- 20 mins: Spray transfer practice
- 15 mins: Bot practice (moving targets)

### Week 3: Real Application
**Focus:** Peeking + spray

Daily routine (60 mins):
- 10 mins: Warmup spray
- 20 mins: Peek + spray drills
- 30 mins: Deathmatch (AK only)

### Week 4: Mastery
**Focus:** Any situation competence

Daily routine (60 mins):
- 5 mins: Warmup
- 25 mins: Advanced spray scenarios
- 30 mins: Ranked practice

## The Results

**Before:**
- First 5 bullets: 70% accuracy
- Full spray: 30% accuracy
- Spray transfer: Non-existent

**After:**
- First 5 bullets: 90% accuracy
- Full spray: 60% accuracy
- Spray transfer: Functional

## Key Insights

### Insight 1: Muscle Memory Takes Time
Day 1-7 felt like nothing was improving. Day 8+ everything clicked.

### Insight 2: Practice Correctly
Bad practice = bad habits. Focus on the pattern, not speed.

### Insight 3: Rest Matters
My best improvement came after rest days.

## The Pattern Breakdown

### Bullets 1-10
Pull straight down. This is where most kills happen.

### Bullets 11-20
Start the left sweep, then right.

### Bullets 21-30
Finish the right sweep. Rarely needed.

## Workshop Maps

Must-haves:
1. **Recoil Master** - Visual feedback
2. **Aim Botz** - Bot practice
3. **YPRAC Maps** - Scenario practice

## Common Mistakes

1. **Overcomplicating** - The AK pattern is simpler than you think
2. **Speed over accuracy** - Slow is smooth, smooth is fast
3. **Ignoring crosshair placement** - Spray starts at head level

## Beyond the Challenge

Maintenance routine (15 mins daily):
- 5 mins: Wall spray
- 10 mins: DM warmup

## LAN Tournament Moment

Last month, Punjab LAN finals. 1v3 post-plant. Three spray downs in 6 seconds. That moment made 30 days of grinding worth it.

*Punjab CS crew, let''s go!*

*DM for practice partner: GurpreetAK#4747*',
  '/images/banners/gaming-4.svg',
  'tips',
  'cs2',
  ARRAY['ak-47', 'spray', 'practice', 'tips', 'improvement', 'guide'],
  10540,
  623,
  112,
  9,
  NOW() - INTERVAL '12 days'
FROM demo_profiles WHERE username = 'GurpreetAK';

-- Post 10: Valorant Esports by AnkitNeon
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'The Rise of Neon: How Slide Mechanics Are Changing Valorant''s Pro Meta',
  'rise-of-neon-slide-mechanics-changing-pro-meta',
  'Once considered a troll pick, Neon is now appearing in VCT. Let''s analyze why the fastest agent in Valorant is having a moment.',
  '## Neon''s Pro Scene Emergence

VCT Pacific showed us something unexpected: Neon picks on crucial rounds. Not just for fun - for wins.

## Why Now?

### 1. Map Pool Changes
New maps favor mobility:
- **Lotus:** Long rotations benefit speed
- **Sunset:** Multiple entry points reward aggression
- **Pearl:** Mid control is everything

### 2. Anti-Utility Meta
Traditional smokes get destroyed by:
- Fade clears
- Sova reveals
- Chamber trips

Neon? She''s through before utility lands.

## The Slide Mechanics Deep Dive

### Basic Slide
Shift+W+Crouch = Standard slide. 70% of players stop here.

### Bunny Hop Slide
Slide + Jump at end = Momentum carry. This is the key to advanced Neon.

### Slide Cancel
Slide + Weapon switch = Cancel animation. Instant shooting.

### Super Jump
Slide + Jump + Updraft = Maximum distance. Site entries from unexpected angles.

## Pro Player Analysis

### DRX BuZz
His Neon on Lotus A site is textbook:
1. Slide into A main
2. High ground with wall
3. Instant trade potential

### PRX Something
Aggressive mid control:
1. Fast ball to detect
2. Slide through for information
3. Wall for safe retreat

## Ranked Application

### When to Pick Neon
- Maps with long rotates
- Against slow, methodical teams
- When you have mechanical confidence
- Attack-sided halves

### When to Avoid
- Tight maps (Bind, Split)
- Against heavy utility
- If your aim isn''t warmed up
- Against Chamber on site

## My Neon Routine

Pre-game warmup (15 mins):
- 5 mins: Slide mechanics in range
- 5 mins: DM with slide entries
- 5 mins: Lineup review

## The MP Valorant Scene

I started the MP Valorant community to push this kind of innovation. We need:
- More local tournaments
- Content creator support
- Organized practice groups

## Final Thoughts

Neon isn''t just viable - she''s potentially S-tier with the right hands. The skill ceiling is sky-high, and we''re just scratching the surface.

*Speed is key. Let''s go fast.*

*MP Gaming Discord: AnkitNeon#6565*',
  '/images/banners/gaming-5.svg',
  'analysis',
  'valorant',
  ARRAY['neon', 'duelist', 'esports', 'meta', 'mechanics', 'analysis'],
  8760,
  534,
  78,
  8,
  true,
  NOW() - INTERVAL '1 day'
FROM demo_profiles WHERE username = 'AnkitNeon';

-- Post 11: General FPS Tips by KarthikWalls
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'The Sentinel Mindset: How to Think Like a Site Anchor',
  'sentinel-mindset-think-like-site-anchor',
  'Sentinels don''t just hold sites - they create puzzles for attackers. Learn the mental framework behind great sentinel play.',
  '## Beyond Setup Videos

YouTube is full of Killjoy setup guides. What''s missing? The thinking behind when and why to use them.

## The Sentinel Philosophy

Your job isn''t kills. It''s:
1. **Delay** - Slow the execute
2. **Inform** - Tell your team what''s coming
3. **Deny** - Make the site uncomfortable
4. **Anchor** - Be the last line

## Reading Attacker Patterns

### Early Round Reads
- **Fast footsteps** - Prepare for rush, molly ready
- **Slow/default** - Setup lurk watch, save utility
- **Fake indicators** - Don''t rotate on first contact

### Mid-Round Adaptations
Your setup should change based on:
- How many times they''ve hit your site
- What utility they''ve shown
- Player tendencies you''ve noticed

## The Economy Game

### Full Buy
Full setup. All abilities placed optimally.

### Half Buy
Choose: Information OR delay. Not both.

### Eco
Play for exit frags. Don''t waste utility.

## Killjoy Specifics

### Turret Placement Philosophy
- **Early round:** Info gathering position
- **Post-plant:** Sightline denial
- **Retake:** Trade enabler

### Lockdown Timing
Use when:
- You need to retake
- Stopping a push in its tracks
- Forcing an early rotate

## Cypher Specifics

### Tripwire Psychology
Place wires where they''ll think you didn''t. Obvious spots get destroyed.

### Camera Value
One good camera call > one kill. Information wins rounds.

## Chamber Specifics

### Trademark Economy
It''s free info. Use it liberally.

### When to OP
Chamber OP is broken when:
- You have angles to escape
- The enemy AWP is dead
- You''re playing for picks

## The Mental Game

### Don''t Tilt on Broken Setups
They droned your setup? Fine. Adapt.

### Patience is Power
Let them walk into your trap. Don''t peek unnecessarily.

### Communication Priority
"They''re hitting B" > "I killed one"

## Training Regimen

Daily practice:
- 10 mins: New setup discovery
- 20 mins: Retake scenarios
- 30 mins: Ranked application

## My Journey

Started as a duelist main. Hardstuck Plat. Switched to Killjoy, hit Diamond in two acts. Sometimes, your role is the problem.

*Setup diff is real.*',
  '/images/banners/gaming-1.svg',
  'guide',
  'valorant',
  ARRAY['sentinel', 'killjoy', 'cypher', 'guide', 'mindset', 'strategy'],
  7230,
  412,
  56,
  10,
  NOW() - INTERVAL '9 days'
FROM demo_profiles WHERE username = 'KarthikWalls';

-- Post 12: CS2 Esports News by SouravRUSH
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Indian CS2 Scene 2024: The Teams, The Talent, The Future',
  'indian-cs2-scene-2024-teams-talent-future',
  'A comprehensive look at where Indian CS2 stands, who to watch, and what needs to change for global recognition.',
  '## State of the Scene

Let''s be honest: Indian CS2 is in a rebuild phase. Post-pandemic, the scene fragmented. But there''s hope.

## Top Teams to Watch

### Enigma Gaming
The most consistent Indian org in CS2:
- Multiple domestic titles
- Solid infrastructure
- Active content presence

### Orangutan Gaming
Rising contender:
- Young hungry roster
- Strong coaching
- Investment in development

### Team Exploit
Dark horse potential:
- Experienced core
- Tactical depth
- LAN experience

## Standout Players

### AWPers
The Indian AWP talent pool is deep:
- **Marzil** - Veteran consistency
- **Developer** - Flashy potential
- **JEMIN** - Rising talent

### Riflers
Pure fraggers worth watching:
- **Excali** - Entry excellence
- **Rossi** - Clutch performances
- **Rexy** - Young prodigy

### IGLs
The leadership gap:
- Few dedicated IGLs exist
- Most teams use hybrid roles
- This needs development

## Infrastructure Analysis

### What''s Working
- Growing tournament circuit
- Improved streaming production
- Org investment increasing

### What Needs Work
- **Player salaries** - Still below sustainability
- **Practice facilities** - Most teams play from home
- **International exposure** - Need more invites

## The Path to Global Recognition

### Short-term (6 months)
- Dominate APAC qualifiers
- Build LAN experience
- Maintain roster stability

### Medium-term (1-2 years)
- Secure RMR slots
- Major qualification attempts
- International bootcamps

### Long-term (3-5 years)
- Major playoff contention
- Top 20 HLTV ranking
- Self-sustaining scene

## What Players Can Do

1. **Stream regularly** - Build personal brands
2. **Create content** - Clips, VODs, tutorials
3. **Stay professional** - Orgs are watching
4. **Keep grinding** - The scene needs dedicated players

## What Orgs Can Do

1. **Invest in coaching** - The KR approach
2. **International scrims** - Quality practice
3. **Mental health support** - Player longevity
4. **Content pipelines** - Fan engagement

## My Role

As someone pushing the Kolkata scene, I see the potential daily. We need:
- More grassroots tournaments
- Better infrastructure
- Community support

## Conclusion

Indian CS2 isn''t dying - it''s transforming. The players are talented. The passion is there. We just need the ecosystem to catch up.

*KOL CS scene, we rise together.*',
  '/images/banners/gaming-2.svg',
  'esports',
  'cs2',
  ARRAY['india', 'esports', 'scene', 'teams', 'future', 'analysis'],
  9870,
  567,
  134,
  11,
  NOW() - INTERVAL '14 days'
FROM demo_profiles WHERE username = 'SouravRUSH';

-- Post 13: PUBG Guide by BiswajitFlex
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'PUBG Erangel Masterclass: Rotations, Loot Paths, and Circle Predictions',
  'pubg-erangel-masterclass-rotations-loot-circle',
  'Stop dying to the zone. Learn the rotation routes, high-tier loot paths, and circle prediction techniques that top PUBG players use to win consistently.',
  '## Why Erangel Still Matters

Every PUBG player starts on Erangel, but few truly master it. After 3000+ hours and countless chicken dinners, here''s what separates survivors from the lobby.

## The Loot Path Philosophy

### Hot Drops vs Smart Drops
Hot dropping Pochinki every game is content, not strategy. Smart drops consider:
- **Flight path angle** - Which side of the map is less contested?
- **Circle probability** - Center-ish drops have better odds
- **Vehicle spawns** - Can you rotate if zone is far?

### Top 5 Underrated Loot Spots

**1. Mylta Power**
Full squad loot with vehicle spawns nearby. Most lobbies ignore it.

**2. Primorsk**
Coastal town with warehouse loot. Great for south circles.

**3. Ruins + Shooting Range Combo**
Quick compound clear, then rotate to shooting range for military-tier loot.

**4. Mansion**
Solo/duo goldmine. Level 3 gear spawns regularly.

**5. Water Town**
Risky but rewarding. Master the bridge camp and you own mid-map.

## Rotation Framework

### Phase 1: Early Game (0-5 min)
- Loot efficiently, don''t over-loot
- Secure a vehicle immediately
- Listen for nearby gunfights

### Phase 2: Mid Game (5-15 min)
- Move to zone edge, not center
- Use terrain for cover during rotation
- Engage only when advantageous

### Phase 3: Late Game (15+ min)
- Play compounds and ridgelines
- Let others fight, third-party the winner
- Save smokes for final circles

## Circle Prediction

The zone isn''t random. It follows patterns:
- **First circle:** Usually covers 60% of map, biased toward center
- **Phase 2-3:** Tends to shift toward terrain features (hills, compounds)
- **Final circles:** Favor open terrain more than buildings

### Reading the Circle
1. Check terrain elevation in white zone
2. Identify compound clusters
3. Position between zone edge and nearest cover

## Vehicle Management

Rules of driving in PUBG:
- Always park facing your exit route
- Never drive in final 3 circles (too loud)
- Bikes > cars for solo/duo (smaller target)
- Boats are underrated for coastal rotations

## The Indian PUBG Scene

BGMI brought millions of Indian players to PUBG. The competitive scene is growing:
- BGIS (Battlegrounds India Series) is massive
- LAN events are getting bigger
- Content creators are thriving

## Squad Communication

Call these things ALWAYS:
- "Vehicle at 220" - Direction + distance
- "One knocked behind tree, northeast compound"
- "Zone pulling south, rotate now"
- "I need meds" - Don''t die in silence

## Final Thoughts

PUBG rewards patience and positioning over pure aim. Master Erangel''s terrain, respect the circle, and you''ll see more chicken dinners than ever.

*NE India PUBG squad, let''s run customs!*

*DM: BiswajitFlex#3210*',
  '/images/banners/gaming-3.svg',
  'guide',
  'pubg-mobile',
  ARRAY['pubg-mobile', 'erangel', 'rotation', 'guide', 'loot', 'strategy'],
  11340,
  678,
  92,
  10,
  true,
  NOW() - INTERVAL '2 days'
FROM demo_profiles WHERE username = 'BiswajitFlex';

-- Post 14: PUBG Tips by AmitSupport
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'The Support Role in PUBG Squads: Why Your Team Needs a Dedicated Medic',
  'pubg-support-role-squads-dedicated-medic',
  'Everyone wants to frag, but the player who keeps the squad alive wins tournaments. A complete guide to playing support in PUBG.',
  '## The Unsung Hero

In every great PUBG squad, there''s someone who carries meds, shares ammo, and makes calls. That''s the support player, and they''re the reason your team survives to top 5.

## What Does a PUBG Support Do?

### 1. Resource Management
- Carry extra first aid kits and boosters
- Share ammo when teammates run low
- Pick up throwables others ignore (smokes, stuns)

### 2. Callouts and Intel
- Constantly scan surroundings
- Track enemy positions during fights
- Call rotations and vehicle positions

### 3. Revive Priority
- Position yourself to revive safely
- Smoke before reviving (always!)
- Know when to revive vs when to fight

## The Support Loadout

### Primary: DMR or AR
M416 or Beryl for mid-range fights. You''re not the entry fragger.

### Secondary: Sniper or Shotgun
Mini14 for long range intel, or S12K for building clears.

### Must-Carry Items
- 10+ First Aid Kits
- 10+ Boosters (energy drinks + painkillers)
- 4+ Smoke Grenades
- 2+ Stun Grenades

## Positioning in Squad Fights

### During Engagement
- Stay behind the fraggers
- Cover flanks they can''t see
- Be ready to trade or revive

### During Rotation
- Take the rear vehicle seat
- Watch behind during movement
- Call out followers

### During Final Circle
- Anchor one side of your team''s position
- Smoke for repositions
- Keep everyone boosted

## Communication Framework

What to call as support:
- **"Team health check"** - Before rotations
- **"Smoke out, push now"** - Enabling aggression
- **"Hold, I''m reviving [name]"** - Revive calls
- **"Boosters ready, top up after this fight"** - Resource calls

## Why PUBG India Needs More Supports

Watching BGIS, the teams that win have clear role definitions. The fraggers get clips, but the support players win trophies.

## Training Routine

- Practice smoke throwing (distance + accuracy)
- Learn vehicle driving routes on every map
- Watch pro support player POVs
- Custom room 1v4 revive-under-fire drills

## Final Thoughts

Being support isn''t glamorous. Your K/D will be lower. But your win rate? Through the roof. The best squads know: a living teammate is worth more than a kill.

*Lucknow PUBG crew represent!*

*Support mains unite: AmitSupport#5050*',
  '/images/banners/gaming-4.svg',
  'guide',
  'pubg-mobile',
  ARRAY['pubg-mobile', 'support', 'squad', 'guide', 'medic', 'strategy'],
  7890,
  445,
  67,
  8,
  NOW() - INTERVAL '6 days'
FROM demo_profiles WHERE username = 'AmitSupport';

-- Post 15: PUBG Esports Analysis by DeepakEntry
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'BGIS 2024 Meta Analysis: What the Top Indian PUBG Teams Are Doing Differently',
  'bgis-2024-meta-analysis-top-indian-pubg-teams',
  'Breaking down the strategies, drop spots, and rotation patterns that dominated BGIS 2024. Data-driven analysis of 50+ matches.',
  '## BGIS 2024: The Numbers

After analyzing 50+ BGIS matches, clear patterns emerge. The top teams aren''t just better aimers - they''re better strategists.

## Drop Spot Trends

### Most Contested
1. **Pochinki** - 40% of teams attempt, 15% survive
2. **Georgopol** - Popular for aggressive squads
3. **Military Base** - High risk, high reward

### Most Successful
1. **Mylta Power** - Teams that drop here average 2.3 more survival points
2. **Primorsk** - Consistent top 10 finishes
3. **Severny** - Underrated, great for Erangel north circles

## The Winning Formula

### Placement > Kills
Top 5 teams in BGIS prioritized placement:
- Average finish: Top 8
- Average kills: 6.2 per game
- Win rate: 15%

Compare to aggressive teams:
- Average finish: Top 12
- Average kills: 8.7 per game
- Win rate: 8%

**The math is clear:** Consistent placement wins tournaments.

## Rotation Patterns

### Early Rotation Meta
The best teams moved to zone **2 minutes before close**. This gives:
- First pick on compounds
- Less contested rotations
- Better position for next circle

### Vehicle Hoarding
Top teams secured 2 vehicles minimum:
- One for rotation
- One as mobile cover

## Weapon Meta

### Most Used (Top 10 Teams)
1. **M416** - 78% pick rate
2. **Beryl M762** - 45% pick rate
3. **Mini14** - 62% pick rate
4. **AWM** - 100% pick rate (when available)

### Underused but Effective
- **DP-28** - Prone meta is back
- **VSS** - Stealth kills in mid-game

## What Indian Teams Need to Improve

1. **Late-game decision making** - Too many teams panic in final circles
2. **Zone prediction** - Not enough compound scouting
3. **Utility usage** - Smokes are thrown reactively, not proactively
4. **Consistent rosters** - Too much shuffling between tournaments

## Predictions for Next Season

- More teams will adopt the slow-rotation meta
- Vehicle plays will become more strategic
- Support role will become more defined
- Content creator teams will struggle against disciplined squads

## Conclusion

Indian PUBG is maturing. The spray-and-pray era is ending. Teams that study the meta, respect rotations, and play for placement will dominate.

*Data is the new chicken dinner.*',
  '/images/banners/gaming-5.svg',
  'analysis',
  'pubg-mobile',
  ARRAY['pubg-mobile', 'bgis', 'esports', 'analysis', 'meta', 'india'],
  9450,
  534,
  78,
  9,
  NOW() - INTERVAL '11 days'
FROM demo_profiles WHERE username = 'DeepakEntry';

-- Post 16: Free Fire Guide by YashSkye
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'Free Fire Character Combos That Dominate Ranked in 2024',
  'free-fire-character-combos-dominate-ranked-2024',
  'The right character combo can turn an average player into a ranked beast. Here are the top 10 character combinations tested in Heroic+ lobbies.',
  '## Why Character Combos Matter

Free Fire''s unique character system is what separates it from other battle royales. The right combo gives you abilities that stack to create unfair advantages.

## How Character Combos Work

- 1 Active ability (main character)
- 3 Passive abilities (combo slots)
- Abilities must complement your playstyle

## Top 10 Combos for 2024

### Combo 1: The Rusher
**Active: Alok** (Drop the Beat)
- Passive 1: Jota (Sustained Raids)
- Passive 2: Kelly (Dash)
- Passive 3: Hayato (Bushido)

**Why it works:** Heal while running, move faster, deal more damage at low HP. Pure aggression.

### Combo 2: The Sniper
**Active: Chrono** (Time Turner)
- Passive 1: Rafael (Dead Silent)
- Passive 2: Moco (Hacker''s Eye)
- Passive 3: Laura (Sharp Shooter)

**Why it works:** Shield for safety, silent kills, enemy tagging, scope accuracy boost.

### Combo 3: The Survivor
**Active: K** (Master of All)
- Passive 1: Jota (Sustained Raids)
- Passive 2: Dimitri (Healing Heartbeat)
- Passive 3: Kapella (Healing Song)

**Why it works:** EP and HP regeneration stacked. Nearly unkillable in sustained fights.

### Combo 4: The Flanker
**Active: Alok**
- Passive 1: Moco (Hacker''s Eye)
- Passive 2: Kelly (Dash)
- Passive 3: Luqueta (Hat Trick)

**Why it works:** Speed, tracking, and HP gain per kill. Made for flanking and multi-kills.

### Combo 5: The Support
**Active: Dimitri**
- Passive 1: Kapella (Healing Song)
- Passive 2: A124 (Thrill of Battle)
- Passive 3: Olivia (Healing Touch)

**Why it works:** Team healer. Your squad stays alive longer, wins more fights.

### Combo 6-10: Situational Picks

**Combo 6 (Bermuda Rush):** Wukong + Jota + Kelly + Hayato
**Combo 7 (Kalahari Snipe):** Clu + Rafael + Laura + Moco
**Combo 8 (Purgatory Control):** Skyler + Jota + Moco + Luqueta
**Combo 9 (Clash Squad):** Alok + Jota + Luqueta + Hayato
**Combo 10 (Solo Ranked):** Chrono + Jota + Kelly + Hayato

## Free Fire India Scene

The Indian Free Fire scene is massive:
- **FFIC** brings together the best teams
- Content creators like Total Gaming have millions of fans
- Clash Squad tournaments are growing at grassroots level

## Ranked Climbing with Combos

### Bronze to Gold
Use any Alok combo. Healing advantage wins at this level.

### Gold to Diamond
Switch to Chrono or K combos. You need defensive abilities.

### Diamond to Heroic
Master the Rusher or Flanker combo. Aggression wins in high ranks.

### Heroic to Grandmaster
Situational combos. Adapt per match, per map, per lobby.

## Training Tips

1. Test combos in Clash Squad before ranked
2. Watch pro player combo setups on YouTube
3. Adapt to balance patches (combos change every update)
4. Don''t copy blindly - match combo to YOUR playstyle

## Conclusion

Free Fire rewards preparation and strategy through its character system. Master the combos, and you''ll climb faster than you thought possible.

*Dehradun Free Fire fam, let''s go Grandmaster!*

*Join my coaching server: YashSkye#9090*',
  '/images/banners/gaming-1.svg',
  'guide',
  'freefire',
  ARRAY['freefire', 'characters', 'combos', 'ranked', 'guide', 'tips'],
  13560,
  823,
  145,
  11,
  true,
  NOW() - INTERVAL '3 days'
FROM demo_profiles WHERE username = 'YashSkye';

-- Post 17: Free Fire Tips by NikhilGOA
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Clash Squad Domination: Advanced Strategies for Free Fire''s Most Competitive Mode',
  'clash-squad-domination-advanced-strategies-freefire',
  'Clash Squad is where Free Fire gets truly competitive. Economy management, buy strategies, and round-by-round tactics to crush opponents.',
  '## Why Clash Squad Is the Real Game

Battle Royale is fun, but Clash Squad is where skill shines. 4v4, round-based, economy system - it''s Free Fire''s answer to tactical shooters.

## Economy Basics

### Round 1
Everyone starts with the same money. Buy:
- **Pistol upgrade** (Desert Eagle)
- **1 Grenade**
- Save the rest

### Win Round 1 → Round 2
- Buy SMG (MP40 or UMP)
- Light armor
- 1 Utility

### Lose Round 1 → Round 2
- Full save (pistol only)
- Or force buy SMG if 1-0 down and desperate

### Full Buy Round
- AR (SCAR or M4A1) or Sniper (AWM if you''re confident)
- Level 2+ armor
- Full utility (grenades + gloo walls)

## Gloo Wall Mastery

Gloo walls define Free Fire combat:

### Offensive Gloo
- Push with gloo in front
- Place wall, peek right side
- Double gloo for crossing open ground

### Defensive Gloo
- Instant wall when caught in open
- One-way peek positions
- Block doorways during defuse

### Advanced Tech
- **Gloo peek:** Place wall, crouch, peek, shoot, re-crouch
- **Gloo stack:** Double wall for extra cover
- **Gloo bait:** Place wall, don''t peek, rotate behind them

## Map Callouts

### Bermuda
- **Clock Tower** (center) - High ground dominance
- **Factory** (east) - Loot and fights
- **Peak** (west) - Sniper heaven

### Kalahari
- **Command Post** - Best loot
- **Refinery** - Vehicle spawns
- **Sub Zone** - Underground advantage

## Team Roles in Clash Squad

### Entry (1 player)
First one in. Uses Alok/Chrono ability, creates space.

### Support (1 player)
Heals, provides cover fire, trades entry.

### Sniper (1 player)
Holds angles, gets opening picks, covers rotations.

### Anchor (1 player)
Watches flank, clutches rounds, plays patient.

## Round-by-Round Strategy

### Winning Side
- Don''t get overconfident
- Save money for full buys
- Maintain position advantage

### Losing Side
- Eco rounds are fine (save for full buy)
- Force buy only on crucial rounds
- Change strategy mid-match

## The Goa Free Fire Scene

We''re building something special here:
- Beach LAN tournaments every month
- Clash Squad leagues for amateurs
- Community customs for practice

## Final Thoughts

Clash Squad rewards teamwork and tactical thinking. If you want to improve at Free Fire, grind Clash Squad - the skills transfer to BR.

*Goa gamers, let''s make this scene grow!*

*Custom rooms every weekend: NikhilGOA#7070*',
  '/images/banners/gaming-2.svg',
  'tips',
  'freefire',
  ARRAY['freefire', 'clash-squad', 'strategy', 'tips', 'gloo-wall', 'competitive'],
  8760,
  512,
  86,
  9,
  NOW() - INTERVAL '5 days'
FROM demo_profiles WHERE username = 'NikhilGOA';

-- Post 18: Free Fire Esports by RajViper
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Free Fire India Championship 2024: The Teams, The Drama, The Takeaways',
  'free-fire-india-championship-2024-teams-drama-takeaways',
  'FFIC 2024 was a rollercoaster. Upsets, clutches, and a new champion. Here''s everything that happened and what it means for Indian FF esports.',
  '## FFIC 2024: A Recap

The Free Fire India Championship 2024 delivered one of the most competitive seasons in Indian mobile esports history. Let''s break it down.

## The Format

- 18 teams qualified through open qualifiers
- League stage: 3 weeks of round-robin
- Finals: Top 12 teams, 6 matches over 2 days
- Prize pool: Massive for Indian standards

## Standout Moments

### The Underdog Run
A team from Tier 2 city qualifiers made it to the top 6. They had no org, no salary - just raw talent and practice room customs.

### The Clutch King
One player had 3 separate 1v4 clutches across the finals. Free Fire''s character abilities made each one a highlight reel.

### The Strategy Shift
Mid-tournament, the meta shifted from aggressive rushing to zone control. Teams adapted in real-time.

## Meta Analysis

### What Worked
- **Zone edge play** - Teams camping edge and rotating late won more rounds
- **Alok + Jota combo** - Healing advantage in extended fights
- **Sniper openings** - AWM picks to start rounds gave huge advantages

### What Failed
- **Hot drops** - Teams that forced fights early consistently placed bottom
- **Solo carries** - No single player can win a BR tournament alone
- **Static strategies** - Teams that didn''t adapt got figured out

## What This Means for Indian FF

### Growth is Real
- Viewership doubled from 2023
- More orgs are investing
- Grassroots tournaments are emerging everywhere

### Challenges Remain
- **Device disparity** - Not everyone has gaming phones
- **Network issues** - Lag in competitive is unacceptable
- **Regional imbalance** - South and West India dominate

### Opportunities
- **Content + competitive pipeline** - Content creators transitioning to pro
- **College esports** - University leagues are starting
- **Regional leagues** - State-level competitions needed

## Player Development

For aspiring pros:
1. **Grind Clash Squad** - Tactical skills matter
2. **Join custom rooms** - Pro practice lobbies
3. **Study VODs** - Watch FFIC replays
4. **Build a team** - Solo talent isn''t enough
5. **Stay consistent** - Show up to every qualifier

## The Bihar Perspective

From Patna, I see incredible untapped talent. Players here have the skill but lack:
- Tournament awareness
- Organized practice
- Equipment access

We need community-driven solutions.

## Conclusion

FFIC 2024 proved that Indian Free Fire esports is legit. The skill ceiling is rising, the community is passionate, and the future is bright.

*Let''s put Bihar Free Fire on the map.*',
  '/images/banners/gaming-3.svg',
  'esports',
  'freefire',
  ARRAY['freefire', 'ffic', 'esports', 'india', 'tournament', 'analysis'],
  10230,
  612,
  94,
  10,
  NOW() - INTERVAL '8 days'
FROM demo_profiles WHERE username = 'RajViper';

-- =============================================
-- INSERT DEMO POST COMMENTS
-- =============================================

-- Comments on Post 1 (Jett Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'This guide actually helped me hit Immortal! The dash timing section changed everything.',
  45,
  NOW() - INTERVAL '2 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'mastering-jett-2024-complete-guide' AND d.username = 'NehaDuelist';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Roshan bhai always delivering! When''s the next stream?',
  23,
  NOW() - INTERVAL '2 days 3 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'mastering-jett-2024-complete-guide' AND d.username = 'ArjunSova';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'As a controller main, I appreciate Jett players who actually wait for utility. Good guide!',
  34,
  NOW() - INTERVAL '1 day'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'mastering-jett-2024-complete-guide' AND d.username = 'PriyaSmokeQueen';

-- Comments on Post 2 (AWP Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The Mirage spots are insane. Got 3 kills from the jungle window angle yesterday.',
  28,
  NOW() - INTERVAL '4 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'awp-positioning-cs2-free-kills-guide' AND d.username = 'VigneshScope';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Finally someone explaining the movement after shot concept. This is what separates good from great AWPers.',
  19,
  NOW() - INTERVAL '3 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'awp-positioning-cs2-free-kills-guide' AND d.username = 'HarshLurk';

-- Comments on Post 4 (IGL Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Venkat sir, any tips for dealing with teammates who don''t listen to calls?',
  15,
  NOW() - INTERVAL '8 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pug-star-to-igl-building-championship-cs2-team' AND d.username = 'SouravRUSH';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The anti-stratting section is gold. Our team has never properly done this.',
  22,
  NOW() - INTERVAL '7 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pug-star-to-igl-building-championship-cs2-team' AND d.username = 'GurpreetAK';

-- Comments on Post 5 (Game Changers Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Needed this! Trying out for a team next month. The tryout section is super helpful.',
  31,
  NOW() - INTERVAL '3 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'breaking-vct-game-changers-roadmap-female-pros' AND d.username = 'AnuRaze';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'As a fellow female gamer, thank you for this. The toxicity section is so real.',
  47,
  NOW() - INTERVAL '2 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'breaking-vct-game-changers-roadmap-female-pros' AND d.username = 'PriyaSmokeQueen';

-- Comments on Post 10 (Neon Analysis)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The slide mechanics breakdown is what I needed. Practicing the bunny hop slide now!',
  18,
  NOW() - INTERVAL '12 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'rise-of-neon-slide-mechanics-changing-pro-meta' AND d.username = 'ArunPhoenix';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'As a Jett main, Neon looks interesting. Might try her on Lotus.',
  12,
  NOW() - INTERVAL '6 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'rise-of-neon-slide-mechanics-changing-pro-meta' AND d.username = 'SkRoshanOP';

-- Comments on Post 13 (PUBG Erangel Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Bhai the Mylta Power drop is so underrated! Been using it since reading this, easy top 5 every game.',
  32,
  NOW() - INTERVAL '1 day'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pubg-erangel-masterclass-rotations-loot-circle' AND d.username = 'AmitSupport';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Circle prediction section is gold. Never thought about terrain features affecting zone placement.',
  24,
  NOW() - INTERVAL '1 day 5 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pubg-erangel-masterclass-rotations-loot-circle' AND d.username = 'DeepakEntry';

-- Comments on Post 16 (Free Fire Character Combos)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The Rusher combo with Alok + Jota is insane! Hit Heroic for the first time using Combo 1.',
  41,
  NOW() - INTERVAL '2 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'free-fire-character-combos-dominate-ranked-2024' AND d.username = 'NikhilGOA';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Combo 5 support build saved our squad so many times. Great guide Yash bhai!',
  27,
  NOW() - INTERVAL '2 days 4 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'free-fire-character-combos-dominate-ranked-2024' AND d.username = 'RajViper';

-- Comments on Post 17 (Clash Squad)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The gloo wall tech section changed how I play. Gloo peek is so OP once you get the timing.',
  19,
  NOW() - INTERVAL '4 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'clash-squad-domination-advanced-strategies-freefire' AND d.username = 'SantoshSilent';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Economy management section is what most FF players miss. This isn''t just spray and pray!',
  15,
  NOW() - INTERVAL '3 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'clash-squad-domination-advanced-strategies-freefire' AND d.username = 'YashSkye';

-- =============================================
-- Create view for demo posts with author info
-- =============================================
CREATE OR REPLACE VIEW demo_posts_complete AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.excerpt,
  p.content,
  p.cover_image,
  p.category,
  p.game,
  p.tags,
  p.views_count,
  p.likes_count,
  p.comments_count,
  p.read_time_minutes,
  p.is_featured,
  p.is_pinned,
  p.created_at,
  p.updated_at,
  json_build_object(
    'id', a.id,
    'username', a.username,
    'display_name', a.display_name,
    'avatar_url', a.avatar_url,
    'bio', a.bio,
    'gaming_style', a.gaming_style,
    'region', a.region,
    'is_verified', a.is_verified
  ) as author,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', c.id,
      'content', c.content,
      'likes_count', c.likes_count,
      'created_at', c.created_at,
      'author', json_build_object(
        'id', ca.id,
        'username', ca.username,
        'display_name', ca.display_name,
        'avatar_url', ca.avatar_url
      )
    ) ORDER BY c.created_at DESC)
    FROM demo_post_comments c
    JOIN demo_profiles ca ON c.author_id = ca.id
    WHERE c.post_id = p.id),
    '[]'::json
  ) as comments
FROM demo_community_posts p
JOIN demo_profiles a ON p.author_id = a.id
ORDER BY p.is_pinned DESC, p.is_featured DESC, p.created_at DESC;

-- Grant access
GRANT SELECT ON demo_posts_complete TO anon, authenticated;
GRANT SELECT ON demo_community_posts TO anon, authenticated;
GRANT SELECT ON demo_post_comments TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Demo Community Posts Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: demo_community_posts, demo_post_comments';
  RAISE NOTICE 'View: demo_posts_complete';
  RAISE NOTICE 'Posts created: 18 gaming articles';
  RAISE NOTICE 'Comments created: 16 sample comments';
  RAISE NOTICE 'Games covered: Valorant, CS2, PUBG Mobile, Free Fire';
  RAISE NOTICE '========================================';
END $$;
-- Add CoC-style join types and clan progression
-- Migration: 033_clan_join_type.sql

-- Add join_type column: open (anyone joins), invite_only (officers invite), closed (request + approve)
ALTER TABLE public.clans ADD COLUMN join_type VARCHAR(20) DEFAULT 'closed'
  CHECK (join_type IN ('open', 'invite_only', 'closed'));

-- Add clan progression
ALTER TABLE public.clans ADD COLUMN clan_level INT DEFAULT 1;
ALTER TABLE public.clans ADD COLUMN clan_xp INT DEFAULT 0;

-- Index for filtering by join type
CREATE INDEX idx_clans_join_type ON clans(join_type);
-- Clash of Clans API Integration (self-contained)
-- Creates game integration infrastructure if not present, then adds supercell provider

-- ============================================================
-- Step 1: Create enums if they don't exist
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider') THEN
    CREATE TYPE integration_provider AS ENUM ('riot', 'steam', 'supercell');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
    CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'completed', 'failed');
  END IF;
END $$;

-- Add 'supercell' to existing enum if it exists but doesn't have the value
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider')
     AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'integration_provider'::regtype AND enumlabel = 'supercell') THEN
    ALTER TYPE integration_provider ADD VALUE 'supercell';
  END IF;
END $$;

-- ============================================================
-- Step 2: Create tables if they don't exist
-- ============================================================

-- Game OAuth tokens and connections
CREATE TABLE IF NOT EXISTS game_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_username TEXT,
  provider_avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Game-specific stats storage
CREATE TABLE IF NOT EXISTS game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  game_mode TEXT,
  season TEXT,
  stats JSONB NOT NULL DEFAULT '{}',
  rank_info JSONB DEFAULT '{}',
  last_match_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id, game_mode, season)
);

-- Match history from external games
CREATE TABLE IF NOT EXISTS game_match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  external_match_id TEXT NOT NULL,
  game_mode TEXT,
  map_name TEXT,
  agent_or_champion TEXT,
  result TEXT,
  score JSONB,
  stats JSONB NOT NULL DEFAULT '{}',
  duration_seconds INTEGER,
  played_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_match_id)
);

-- Sync jobs for tracking background syncs
CREATE TABLE IF NOT EXISTS game_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES game_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'full',
  status sync_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  stats_synced INTEGER DEFAULT 0,
  matches_synced INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supported games configuration
CREATE TABLE IF NOT EXISTS supported_games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider integration_provider NOT NULL,
  icon_url TEXT,
  banner_url TEXT,
  description TEXT,
  stat_fields JSONB DEFAULT '[]',
  rank_system JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Step 3: Create indexes (IF NOT EXISTS)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_game_connections_provider ON game_connections(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_game_connections_user ON game_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_user_game ON game_stats(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_connection ON game_stats(connection_id);
CREATE INDEX IF NOT EXISTS idx_game_match_history_user ON game_match_history(user_id, game_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_match_history_connection ON game_match_history(connection_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sync_jobs_connection ON game_sync_jobs(connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supported_games_provider ON supported_games(provider) WHERE is_active = true;

-- ============================================================
-- Step 4: Enable RLS
-- ============================================================
ALTER TABLE game_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_games ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 5: RLS Policies (drop and recreate to avoid conflicts)
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own connections" ON game_connections;
CREATE POLICY "Users can view their own connections"
  ON game_connections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own connections" ON game_connections;
CREATE POLICY "Users can manage their own connections"
  ON game_connections FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view game stats" ON game_stats;
CREATE POLICY "Anyone can view game stats"
  ON game_stats FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can manage game stats" ON game_stats;
CREATE POLICY "System can manage game stats"
  ON game_stats FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view match history" ON game_match_history;
CREATE POLICY "Anyone can view match history"
  ON game_match_history FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can manage match history" ON game_match_history;
CREATE POLICY "System can manage match history"
  ON game_match_history FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own sync jobs" ON game_sync_jobs;
CREATE POLICY "Users can view their own sync jobs"
  ON game_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create sync jobs" ON game_sync_jobs;
CREATE POLICY "Users can create sync jobs"
  ON game_sync_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view supported games" ON supported_games;
CREATE POLICY "Anyone can view supported games"
  ON supported_games FOR SELECT
  USING (true);

-- ============================================================
-- Step 6: Functions
-- ============================================================

-- Get user's connected games with stats
CREATE OR REPLACE FUNCTION get_user_game_connections(p_user_id UUID)
RETURNS TABLE (
  connection_id UUID,
  provider integration_provider,
  provider_username TEXT,
  provider_avatar_url TEXT,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  games JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id as connection_id,
    gc.provider,
    gc.provider_username,
    gc.provider_avatar_url,
    gc.connected_at,
    gc.last_synced_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'game_id', gs.game_id,
          'rank_info', gs.rank_info,
          'stats', gs.stats,
          'synced_at', gs.synced_at
        )
      ) FILTER (WHERE gs.id IS NOT NULL),
      '[]'::jsonb
    ) as games
  FROM game_connections gc
  LEFT JOIN game_stats gs ON gs.connection_id = gc.id
  WHERE gc.user_id = p_user_id AND gc.is_active = true
  GROUP BY gc.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update game stats
CREATE OR REPLACE FUNCTION upsert_game_stats(
  p_user_id UUID,
  p_connection_id UUID,
  p_game_id TEXT,
  p_game_mode TEXT,
  p_season TEXT,
  p_stats JSONB,
  p_rank_info JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO game_stats (user_id, connection_id, game_id, game_mode, season, stats, rank_info)
  VALUES (p_user_id, p_connection_id, p_game_id, p_game_mode, p_season, p_stats, COALESCE(p_rank_info, '{}'::jsonb))
  ON CONFLICT (user_id, game_id, game_mode, season)
  DO UPDATE SET
    stats = p_stats,
    rank_info = COALESCE(p_rank_info, game_stats.rank_info),
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Start a sync job
CREATE OR REPLACE FUNCTION start_game_sync(
  p_user_id UUID,
  p_connection_id UUID,
  p_sync_type TEXT DEFAULT 'full'
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_existing_job UUID;
BEGIN
  SELECT id INTO v_existing_job
  FROM game_sync_jobs
  WHERE connection_id = p_connection_id
    AND status IN ('pending', 'syncing')
  LIMIT 1;

  IF v_existing_job IS NOT NULL THEN
    RETURN v_existing_job;
  END IF;

  INSERT INTO game_sync_jobs (user_id, connection_id, sync_type, status, started_at)
  VALUES (p_user_id, p_connection_id, p_sync_type, 'syncing', NOW())
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION update_game_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS game_connections_updated_at ON game_connections;
CREATE TRIGGER game_connections_updated_at
  BEFORE UPDATE ON game_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

DROP TRIGGER IF EXISTS game_stats_updated_at ON game_stats;
CREATE TRIGGER game_stats_updated_at
  BEFORE UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_game_connections_timestamp();

-- ============================================================
-- Step 7: Seed supported games (upsert to avoid duplicates)
-- ============================================================
INSERT INTO supported_games (id, name, provider, description, stat_fields, rank_system, display_order) VALUES
('valorant', 'VALORANT', 'riot', 'Tactical 5v5 character-based shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "headshot_pct", "label": "HS%"}, {"key": "adr", "label": "ADR"}, {"key": "win_rate", "label": "Win Rate"}]',
  '{"tiers": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"]}',
  1),
('cs2', 'Counter-Strike 2', 'steam', 'Tactical first-person shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "headshot_pct", "label": "HS%"}, {"key": "adr", "label": "ADR"}, {"key": "win_rate", "label": "Win Rate"}]',
  '{"tiers": ["Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master", "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master", "Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian", "Legendary Eagle", "Legendary Eagle Master", "Supreme Master First Class", "Global Elite"]}',
  2),
('pubg-mobile', 'PUBG Mobile', 'steam', 'Mobile battle royale shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "damage", "label": "Damage"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "top10_rate", "label": "Top 10%"}]',
  '{"tiers": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown", "Ace", "Ace Master", "Ace Dominator", "Conqueror"]}',
  3),
('freefire', 'Free Fire', 'steam', 'Mobile battle royale',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "damage", "label": "Damage"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "booyah", "label": "Booyah!"}]',
  '{"tiers": ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Grand Master"]}',
  4),
('coc', 'Clash of Clans', 'supercell', 'Strategic clan-based mobile game with live stats via Supercell API',
  '[{"key": "trophies", "label": "Trophies"}, {"key": "best_trophies", "label": "Best Trophies"}, {"key": "war_stars", "label": "War Stars"}, {"key": "attack_wins", "label": "Attack Wins"}, {"key": "defense_wins", "label": "Defense Wins"}, {"key": "donations", "label": "Donations"}, {"key": "town_hall_level", "label": "TH Level"}, {"key": "exp_level", "label": "XP Level"}]',
  '{"tiers": ["Unranked", "Bronze League III", "Bronze League II", "Bronze League I", "Silver League III", "Silver League II", "Silver League I", "Gold League III", "Gold League II", "Gold League I", "Crystal League III", "Crystal League II", "Crystal League I", "Master League III", "Master League II", "Master League I", "Champion League III", "Champion League II", "Champion League I", "Titan League III", "Titan League II", "Titan League I", "Legend League"]}',
  5),
('cod-mobile', 'COD Mobile', 'steam', 'Mobile first-person shooter',
  '[{"key": "kills", "label": "Kills"}, {"key": "deaths", "label": "Deaths"}, {"key": "assists", "label": "Assists"}, {"key": "kd_ratio", "label": "K/D"}, {"key": "win_rate", "label": "Win Rate"}, {"key": "score_per_min", "label": "Score/min"}]',
  '{"tiers": ["Rookie", "Veteran", "Elite", "Pro", "Master", "Grand Master", "Legendary"]}',
  6)
ON CONFLICT (id) DO UPDATE SET
  provider = EXCLUDED.provider,
  description = EXCLUDED.description,
  stat_fields = EXCLUDED.stat_fields,
  rank_system = EXCLUDED.rank_system,
  display_order = EXCLUDED.display_order;
-- ============================================
-- 034: TRAIT ENDORSEMENT SYSTEM
-- Replaces star-based peer ratings with
-- binary trait endorsements + private trust engine
-- ============================================

-- ============================================
-- 1A: DROP OLD PEER RATINGS, CREATE TRAIT ENDORSEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.trait_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endorsed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Binary trait endorsements (true = endorsed, false/null = not endorsed)
  friendly BOOLEAN DEFAULT false,
  team_player BOOLEAN DEFAULT false,
  leader BOOLEAN DEFAULT false,
  communicative BOOLEAN DEFAULT false,
  reliable BOOLEAN DEFAULT false,

  -- Context
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  played_as VARCHAR(20) CHECK (played_as IN ('teammate', 'opponent')),

  -- Optional positive note only
  positive_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One endorsement per endorser-endorsed pair
  UNIQUE(endorser_id, endorsed_id)
);

-- Indexes
CREATE INDEX idx_trait_endorsements_endorsed ON trait_endorsements(endorsed_id);
CREATE INDEX idx_trait_endorsements_endorser ON trait_endorsements(endorser_id);
CREATE INDEX idx_trait_endorsements_game ON trait_endorsements(game_id);
CREATE INDEX idx_trait_endorsements_created ON trait_endorsements(created_at);

-- RLS
ALTER TABLE trait_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trait endorsements are viewable by everyone"
  ON trait_endorsements FOR SELECT USING (true);

CREATE POLICY "Users can endorse others"
  ON trait_endorsements FOR INSERT
  WITH CHECK (auth.uid() = endorser_id AND auth.uid() != endorsed_id);

CREATE POLICY "Users can update their endorsements"
  ON trait_endorsements FOR UPDATE
  USING (auth.uid() = endorser_id);

CREATE POLICY "Users can delete their endorsements"
  ON trait_endorsements FOR DELETE
  USING (auth.uid() = endorser_id);


-- ============================================
-- 1B: RATE LIMIT TRACKING
-- ============================================

CREATE TABLE public.rating_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_count INTEGER DEFAULT 0,
  last_rating_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_rating_limits_user_date ON rating_limits(user_id, date);

ALTER TABLE rating_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON rating_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
  ON rating_limits FOR ALL
  USING (auth.uid() = user_id);


-- ============================================
-- 1C: PRIVATE TRUST ENGINE (account_trust)
-- ============================================

CREATE TABLE public.account_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Composite scores (0-100) - PRIVATE, never shown to users
  trust_score INTEGER DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  behavior_score INTEGER DEFAULT 50 CHECK (behavior_score BETWEEN 0 AND 100),
  influence_score INTEGER DEFAULT 0 CHECK (influence_score BETWEEN 0 AND 100),
  abuse_probability DECIMAL(5,4) DEFAULT 0.0000,

  -- Factor breakdown (0-100 each)
  account_age_score INTEGER DEFAULT 0 CHECK (account_age_score BETWEEN 0 AND 100),
  activity_score INTEGER DEFAULT 0 CHECK (activity_score BETWEEN 0 AND 100),
  community_score INTEGER DEFAULT 30 CHECK (community_score BETWEEN 0 AND 100),
  report_score INTEGER DEFAULT 100 CHECK (report_score BETWEEN 0 AND 100),
  interaction_depth_score INTEGER DEFAULT 0 CHECK (interaction_depth_score BETWEEN 0 AND 100),
  repeat_play_score INTEGER DEFAULT 0 CHECK (repeat_play_score BETWEEN 0 AND 100),
  clan_participation_score INTEGER DEFAULT 0 CHECK (clan_participation_score BETWEEN 0 AND 100),
  verification_bonus INTEGER DEFAULT 0 CHECK (verification_bonus BETWEEN 0 AND 20),

  -- Metadata
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_version INTEGER DEFAULT 1,
  is_frozen BOOLEAN DEFAULT false,
  frozen_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_account_trust_user ON account_trust(user_id);

-- RLS: PRIVATE - only the user can see their own trust data
-- Service role bypasses RLS anyway for admin operations
ALTER TABLE account_trust ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view only their own trust"
  ON account_trust FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================
-- 1D: ANTI-MOB DETECTION FLAGS
-- ============================================

CREATE TABLE public.rating_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN (
    'clan_mob', 'ip_pattern', 'time_burst', 'spike', 'influencer_flow'
  )),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  evidence JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'flagged' CHECK (status IN (
    'flagged', 'frozen', 'reviewed', 'cleared', 'confirmed'
  )),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rating_flags_target ON rating_flags(target_user_id);
CREATE INDEX idx_rating_flags_status ON rating_flags(status);

ALTER TABLE rating_flags ENABLE ROW LEVEL SECURITY;

-- Only service role can access flags (admin panel)
-- No public policies - completely private


-- ============================================
-- 1E: TRUST BADGES VIEW (public, derived from private trust)
-- ============================================

CREATE OR REPLACE VIEW public.trust_badges AS
SELECT
  at.user_id,
  -- Veteran: account older than 365 days
  CASE
    WHEN EXTRACT(DAY FROM (NOW() - p.created_at)) > 365 THEN true
    ELSE false
  END AS is_veteran,
  -- Active: activity score > 60
  CASE WHEN at.activity_score > 60 THEN true ELSE false END AS is_active,
  -- Trusted: trust score > 70
  CASE WHEN at.trust_score > 70 THEN true ELSE false END AS is_trusted,
  -- Verified: from profile
  COALESCE(p.is_verified, false) AS is_verified,
  -- Community Pillar: community score > 75
  CASE WHEN at.community_score > 75 THEN true ELSE false END AS is_community_pillar,
  -- Established: trust score > 40 and account > 90 days
  CASE
    WHEN at.trust_score > 40 AND EXTRACT(DAY FROM (NOW() - p.created_at)) > 90 THEN true
    ELSE false
  END AS is_established
FROM account_trust at
JOIN profiles p ON p.id = at.user_id;


-- ============================================
-- 1F: CALCULATE TRUST SCORE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_trust_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_account_age_days INTEGER;
  v_account_age_score INTEGER;
  v_games_linked INTEGER;
  v_profile_views INTEGER;
  v_activity_score INTEGER;
  v_endorsement_count INTEGER;
  v_endorsement_given INTEGER;
  v_community_score INTEGER;
  v_report_score INTEGER;
  v_interaction_depth_score INTEGER;
  v_repeat_play_score INTEGER;
  v_clan_participation_score INTEGER;
  v_verification_bonus INTEGER;
  v_is_verified BOOLEAN;
  v_trust_score INTEGER;
  v_risk_score INTEGER;
  v_behavior_score INTEGER;
  v_influence_score INTEGER;
  v_profile RECORD;
BEGIN
  -- Fetch profile data
  SELECT * INTO v_profile FROM profiles WHERE id = target_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- 1. Account Age Score (max 100, ~1 point per week, caps at ~2 years)
  v_account_age_days := EXTRACT(DAY FROM (NOW() - v_profile.created_at));
  v_account_age_score := LEAST(100, (v_account_age_days / 7));

  -- 2. Activity Score (games linked + profile views + matches)
  SELECT COUNT(*) INTO v_games_linked FROM user_games WHERE user_id = target_user_id;
  v_profile_views := COALESCE(v_profile.profile_views, 0);
  v_activity_score := LEAST(100,
    (v_games_linked * 15) +
    LEAST(50, v_profile_views / 10) +
    LEAST(20, COALESCE(v_profile.total_matches_played, 0) / 5)
  );

  -- 3. Community Score (based on endorsements received)
  SELECT COUNT(*) INTO v_endorsement_count
  FROM trait_endorsements WHERE endorsed_id = target_user_id;

  v_community_score := CASE
    WHEN v_endorsement_count = 0 THEN 30  -- neutral baseline
    WHEN v_endorsement_count < 5 THEN 40
    WHEN v_endorsement_count < 15 THEN 55
    WHEN v_endorsement_count < 30 THEN 70
    WHEN v_endorsement_count < 50 THEN 85
    ELSE 100
  END;

  -- 4. Report Score (starts at 100, no reports table yet)
  v_report_score := 100;

  -- 5. Interaction Depth (endorsements received + given)
  SELECT COUNT(*) INTO v_endorsement_given
  FROM trait_endorsements WHERE endorser_id = target_user_id;

  v_interaction_depth_score := LEAST(100,
    v_endorsement_count * 8 + v_endorsement_given * 4
  );

  -- 6. Repeat Play Score (people who endorsed with context)
  SELECT COUNT(*) INTO v_repeat_play_score
  FROM trait_endorsements
  WHERE endorsed_id = target_user_id AND game_id IS NOT NULL;
  v_repeat_play_score := LEAST(100, v_repeat_play_score * 10);

  -- 7. Clan Participation Score
  v_clan_participation_score := 0;
  BEGIN
    SELECT LEAST(100, COUNT(*) * 25) INTO v_clan_participation_score
    FROM clan_members WHERE user_id = target_user_id;
  EXCEPTION WHEN undefined_table THEN
    v_clan_participation_score := 0;
  END;

  -- 8. Verification Bonus
  v_is_verified := COALESCE(v_profile.is_verified, false);
  v_verification_bonus := CASE WHEN v_is_verified THEN 15 ELSE 0 END;

  -- Compute trust score (weighted average)
  v_trust_score := LEAST(100, (
    (v_account_age_score * 0.10) +
    (v_activity_score * 0.20) +
    (v_community_score * 0.15) +
    (v_report_score * 0.15) +
    (v_interaction_depth_score * 0.15) +
    (v_repeat_play_score * 0.10) +
    (v_clan_participation_score * 0.10) +
    v_verification_bonus
  )::INTEGER);

  -- Compute risk score (inverse of trust, adjusted)
  v_risk_score := GREATEST(0, 100 - v_trust_score);

  -- Behavior score (based on community + report)
  v_behavior_score := LEAST(100, ((v_community_score + v_report_score) / 2));

  -- Influence score (based on endorsements + activity)
  v_influence_score := LEAST(100, ((v_endorsement_count * 3) + (v_endorsement_given * 2) + (v_activity_score / 2)));

  -- Upsert account_trust row
  INSERT INTO account_trust (
    user_id, trust_score, risk_score, behavior_score, influence_score,
    abuse_probability,
    account_age_score, activity_score, community_score,
    report_score, interaction_depth_score, repeat_play_score,
    clan_participation_score, verification_bonus,
    last_calculated_at, updated_at
  ) VALUES (
    target_user_id, v_trust_score, v_risk_score, v_behavior_score, v_influence_score,
    GREATEST(0, (v_risk_score::DECIMAL / 100)),
    v_account_age_score, v_activity_score, v_community_score,
    v_report_score, v_interaction_depth_score, v_repeat_play_score,
    v_clan_participation_score, v_verification_bonus,
    NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    trust_score = v_trust_score,
    risk_score = v_risk_score,
    behavior_score = v_behavior_score,
    influence_score = v_influence_score,
    abuse_probability = GREATEST(0, (v_risk_score::DECIMAL / 100)),
    account_age_score = v_account_age_score,
    activity_score = v_activity_score,
    community_score = v_community_score,
    report_score = v_report_score,
    interaction_depth_score = v_interaction_depth_score,
    repeat_play_score = v_repeat_play_score,
    clan_participation_score = v_clan_participation_score,
    verification_bonus = v_verification_bonus,
    last_calculated_at = NOW(),
    updated_at = NOW();

  RETURN v_trust_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 1G: CHECK RATE LIMIT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_endorsement_rate_limit(endorser_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_daily_count INTEGER;
  v_weekly_count INTEGER;
  v_last_rating TIMESTAMPTZ;
  v_seconds_since_last INTEGER;
BEGIN
  -- Get today's count
  SELECT COALESCE(daily_count, 0), last_rating_at
  INTO v_daily_count, v_last_rating
  FROM rating_limits
  WHERE user_id = endorser_user_id AND date = CURRENT_DATE;

  IF NOT FOUND THEN
    v_daily_count := 0;
    v_last_rating := NULL;
  END IF;

  -- Get weekly count (last 7 days)
  SELECT COALESCE(SUM(daily_count), 0)
  INTO v_weekly_count
  FROM rating_limits
  WHERE user_id = endorser_user_id
    AND date >= CURRENT_DATE - INTERVAL '6 days';

  -- Check cooldown (30 seconds)
  IF v_last_rating IS NOT NULL THEN
    v_seconds_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_rating));
    IF v_seconds_since_last < 30 THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Please wait ' || (30 - v_seconds_since_last) || ' seconds before endorsing again',
        'daily_remaining', GREATEST(0, 3 - v_daily_count),
        'weekly_remaining', GREATEST(0, 10 - v_weekly_count)
      );
    END IF;
  END IF;

  -- Check daily limit (3/day)
  IF v_daily_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Daily endorsement limit reached (3/day)',
      'daily_remaining', 0,
      'weekly_remaining', GREATEST(0, 10 - v_weekly_count)
    );
  END IF;

  -- Check weekly limit (10/week)
  IF v_weekly_count >= 10 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Weekly endorsement limit reached (10/week)',
      'daily_remaining', GREATEST(0, 3 - v_daily_count),
      'weekly_remaining', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', NULL,
    'daily_remaining', GREATEST(0, 3 - v_daily_count),
    'weekly_remaining', GREATEST(0, 10 - v_weekly_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 1H: UPDATE REPUTATION SCORE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_friendly_pct DECIMAL;
  v_team_player_pct DECIMAL;
  v_leader_pct DECIMAL;
  v_communicative_pct DECIMAL;
  v_reliable_pct DECIMAL;
BEGIN
  -- Count total endorsers for this user
  SELECT COUNT(*) INTO v_total
  FROM trait_endorsements
  WHERE endorsed_id = NEW.endorsed_id;

  IF v_total = 0 THEN
    UPDATE profiles SET reputation_score = 0.00 WHERE id = NEW.endorsed_id;
    RETURN NEW;
  END IF;

  -- Calculate trait endorsement percentages
  SELECT
    COALESCE(SUM(CASE WHEN friendly THEN 1 ELSE 0 END)::DECIMAL / v_total, 0),
    COALESCE(SUM(CASE WHEN team_player THEN 1 ELSE 0 END)::DECIMAL / v_total, 0),
    COALESCE(SUM(CASE WHEN leader THEN 1 ELSE 0 END)::DECIMAL / v_total, 0),
    COALESCE(SUM(CASE WHEN communicative THEN 1 ELSE 0 END)::DECIMAL / v_total, 0),
    COALESCE(SUM(CASE WHEN reliable THEN 1 ELSE 0 END)::DECIMAL / v_total, 0)
  INTO v_friendly_pct, v_team_player_pct, v_leader_pct, v_communicative_pct, v_reliable_pct
  FROM trait_endorsements
  WHERE endorsed_id = NEW.endorsed_id;

  -- Reputation = average endorsement percentage across all traits (0.00 to 1.00 scale)
  UPDATE profiles
  SET reputation_score = ROUND(
    ((v_friendly_pct + v_team_player_pct + v_leader_pct + v_communicative_pct + v_reliable_pct) / 5.0)::NUMERIC,
    2
  )
  WHERE id = NEW.endorsed_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger on trait_endorsements
CREATE TRIGGER on_trait_endorsement_change
  AFTER INSERT OR UPDATE ON trait_endorsements
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_score();
-- GamerHub News Articles System
-- Migration: 035_news_articles.sql
-- Automated gaming news pipeline with AI processing

-- ============================================
-- TABLES
-- ============================================

-- 1. News Sources - RSS/API feed configurations
CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('rss', 'api', 'scraper')),
  url TEXT NOT NULL,
  game_slug VARCHAR(50) NOT NULL,
  region VARCHAR(30) DEFAULT 'global' CHECK (region IN ('india', 'asia', 'sea', 'global')),
  is_active BOOLEAN DEFAULT true,
  fetch_interval_minutes INTEGER DEFAULT 60,
  last_fetched_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. News Articles - Main news content (AI-processed)
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
  external_id VARCHAR(500),

  -- Original content from source
  original_title VARCHAR(500) NOT NULL,
  original_url TEXT NOT NULL,
  original_content TEXT,
  original_published_at TIMESTAMPTZ,

  -- AI-processed content
  title VARCHAR(300) NOT NULL,
  summary TEXT,
  excerpt VARCHAR(300),
  thumbnail_url TEXT,

  -- Classification
  game_slug VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('patch', 'tournament', 'event', 'update', 'roster', 'meta', 'general')),
  region VARCHAR(30) DEFAULT 'global' CHECK (region IN ('india', 'asia', 'sea', 'global')),
  tags TEXT[] DEFAULT '{}',

  -- AI processing metadata
  ai_relevance_score FLOAT DEFAULT 0,
  ai_processed BOOLEAN DEFAULT false,
  ai_processing_error TEXT,

  -- Moderation
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Engagement
  views_count INTEGER DEFAULT 0,

  -- Publishing
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_id, external_id)
);

-- 3. News Fetch Logs - Audit trail for fetch jobs
CREATE TABLE IF NOT EXISTS public.news_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_news_sources_game ON public.news_sources(game_slug);
CREATE INDEX idx_news_sources_active ON public.news_sources(is_active) WHERE is_active = true;

CREATE INDEX idx_news_articles_game ON public.news_articles(game_slug);
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_status ON public.news_articles(status);
CREATE INDEX idx_news_articles_region ON public.news_articles(region);
CREATE INDEX idx_news_articles_published ON public.news_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_news_articles_pending ON public.news_articles(created_at DESC) WHERE status IN ('pending', 'approved');
CREATE INDEX idx_news_articles_source_ext ON public.news_articles(source_id, external_id);
CREATE INDEX idx_news_articles_tags ON public.news_articles USING GIN(tags);
CREATE INDEX idx_news_articles_original_url ON public.news_articles(original_url);

CREATE INDEX idx_news_fetch_logs_source ON public.news_fetch_logs(source_id);
CREATE INDEX idx_news_fetch_logs_status ON public.news_fetch_logs(status, started_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_fetch_logs ENABLE ROW LEVEL SECURITY;

-- News Sources: anyone can view active sources
CREATE POLICY "Anyone can view active news sources"
  ON public.news_sources FOR SELECT
  USING (is_active = true);

-- News Articles: published articles are viewable by everyone
CREATE POLICY "Anyone can view published news articles"
  ON public.news_articles FOR SELECT
  USING (status = 'published');

-- News Fetch Logs: not publicly accessible (service role only)

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to increment news article view count
CREATE OR REPLACE FUNCTION increment_news_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.news_articles
  SET views_count = views_count + 1
  WHERE id = article_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA - RSS Feed Sources
-- ============================================

INSERT INTO public.news_sources (name, slug, source_type, url, game_slug, region, fetch_interval_minutes, config) VALUES
  ('VLR.gg', 'vlr-gg', 'rss', 'https://www.vlr.gg/news/rss', 'valorant', 'global', 30, '{}'),
  ('HLTV', 'hltv', 'rss', 'https://www.hltv.org/rss/news', 'cs2', 'global', 30, '{}'),
  ('AFK Gaming', 'afk-gaming', 'rss', 'https://afkgaming.com/feed', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "pubg-mobile", "freefire", "cod-mobile"]}'),
  ('TalkEsport', 'talkesport', 'rss', 'https://www.talkesport.com/feed/', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "pubg-mobile", "freefire", "cod-mobile"]}'),
  ('Sportskeeda Esports', 'sportskeeda-esports', 'rss', 'https://www.sportskeeda.com/esports/feed', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "freefire", "pubg-mobile"]}'),
  ('Clash of Clans Blog', 'coc-blog', 'rss', 'https://clashofclans.com/blog/rss', 'coc', 'global', 120, '{}'),
  ('Sportskeeda PUBG Mobile', 'sportskeeda-pubg', 'rss', 'https://www.sportskeeda.com/pubg-mobile/feed', 'pubg-mobile', 'india', 60, '{}'),
  ('Sportskeeda Free Fire', 'sportskeeda-freefire', 'rss', 'https://www.sportskeeda.com/free-fire/feed', 'freefire', 'india', 60, '{}')
ON CONFLICT (slug) DO NOTHING;
-- Migration: 036_fix_pro_players_ambiguous.sql
-- Fix ambiguous user_id column reference in get_pro_players_by_games function

-- Drop and recreate the function with proper table aliasing
CREATE OR REPLACE FUNCTION public.get_pro_players_by_games(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  follower_count INT,
  common_games JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_game_ids AS (
    -- Use table alias to avoid ambiguity with RETURNS TABLE user_id column
    SELECT ug_user.game_id
    FROM public.user_games ug_user
    WHERE ug_user.user_id = p_user_id
  ),
  pro_player_followers AS (
    SELECT
      p.id AS pro_user_id,
      (SELECT COUNT(*)::INT FROM public.follows f WHERE f.following_id = p.id) AS pro_follower_count
    FROM public.profiles p
    WHERE p.gaming_style = 'pro'
      AND p.id != p_user_id
      -- Not blocked
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE (bu.blocker_id = p_user_id AND bu.blocked_id = p.id)
           OR (bu.blocker_id = p.id AND bu.blocked_id = p_user_id)
      )
  )
  SELECT
    ppf.pro_user_id AS user_id,
    ppf.pro_follower_count AS follower_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', ug.game_id,
        'game_name', g.name,
        'rank', ug.rank
      )
    ) AS common_games
  FROM pro_player_followers ppf
  JOIN public.user_games ug ON ug.user_id = ppf.pro_user_id
  JOIN public.games g ON g.id = ug.game_id
  WHERE ug.game_id IN (SELECT ugi.game_id FROM user_game_ids ugi)
  GROUP BY ppf.pro_user_id, ppf.pro_follower_count
  ORDER BY ppf.pro_follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pro_players_by_games TO authenticated;
-- Migration: 037_apply_missing_tables.sql
-- This migration ensures all required tables exist
-- Run this in Supabase SQL Editor if you're seeing "table not found" errors

-- ============================================
-- NEWS ARTICLES SYSTEM (from 035_news_articles.sql)
-- ============================================

-- 1. News Sources - RSS/API feed configurations
CREATE TABLE IF NOT EXISTS public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('rss', 'api', 'scraper')),
  url TEXT NOT NULL,
  game_slug VARCHAR(50) NOT NULL,
  region VARCHAR(30) DEFAULT 'global' CHECK (region IN ('india', 'asia', 'sea', 'global')),
  is_active BOOLEAN DEFAULT true,
  fetch_interval_minutes INTEGER DEFAULT 60,
  last_fetched_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. News Articles - Main news content (AI-processed)
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
  external_id VARCHAR(500),

  -- Original content from source
  original_title VARCHAR(500) NOT NULL,
  original_url TEXT NOT NULL,
  original_content TEXT,
  original_published_at TIMESTAMPTZ,

  -- AI-processed content
  title VARCHAR(300) NOT NULL,
  summary TEXT,
  excerpt VARCHAR(300),
  thumbnail_url TEXT,

  -- Classification
  game_slug VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('patch', 'tournament', 'event', 'update', 'roster', 'meta', 'general')),
  region VARCHAR(30) DEFAULT 'global' CHECK (region IN ('india', 'asia', 'sea', 'global')),
  tags TEXT[] DEFAULT '{}',

  -- AI processing metadata
  ai_relevance_score FLOAT DEFAULT 0,
  ai_processed BOOLEAN DEFAULT false,
  ai_processing_error TEXT,

  -- Moderation
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Engagement
  views_count INTEGER DEFAULT 0,

  -- Publishing
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_id, external_id)
);

-- 3. News Fetch Logs - Audit trail for fetch jobs
CREATE TABLE IF NOT EXISTS public.news_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.news_sources(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- News Sources indexes
CREATE INDEX IF NOT EXISTS idx_news_sources_game ON public.news_sources(game_slug);
CREATE INDEX IF NOT EXISTS idx_news_sources_active ON public.news_sources(is_active) WHERE is_active = true;

-- News Articles indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_game ON public.news_articles(game_slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON public.news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON public.news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_region ON public.news_articles(region);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON public.news_articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_news_articles_pending ON public.news_articles(created_at DESC) WHERE status IN ('pending', 'approved');
CREATE INDEX IF NOT EXISTS idx_news_articles_source_ext ON public.news_articles(source_id, external_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON public.news_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_news_articles_original_url ON public.news_articles(original_url);

CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_source ON public.news_fetch_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_news_fetch_logs_status ON public.news_fetch_logs(status, started_at DESC);

-- News RLS
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_fetch_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Anyone can view active news sources" ON public.news_sources;
CREATE POLICY "Anyone can view active news sources"
  ON public.news_sources FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view published news articles" ON public.news_articles;
CREATE POLICY "Anyone can view published news articles"
  ON public.news_articles FOR SELECT
  USING (status = 'published');

-- Function to increment news article view count
CREATE OR REPLACE FUNCTION increment_news_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.news_articles
  SET views_count = views_count + 1
  WHERE id = article_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed news sources
INSERT INTO public.news_sources (name, slug, source_type, url, game_slug, region, fetch_interval_minutes, config) VALUES
  ('VLR.gg', 'vlr-gg', 'rss', 'https://www.vlr.gg/news/rss', 'valorant', 'global', 30, '{}'),
  ('HLTV', 'hltv', 'rss', 'https://www.hltv.org/rss/news', 'cs2', 'global', 30, '{}'),
  ('AFK Gaming', 'afk-gaming', 'rss', 'https://afkgaming.com/feed', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "pubg-mobile", "freefire", "cod-mobile"]}'),
  ('TalkEsport', 'talkesport', 'rss', 'https://www.talkesport.com/feed/', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "pubg-mobile", "freefire", "cod-mobile"]}'),
  ('Sportskeeda Esports', 'sportskeeda-esports', 'rss', 'https://www.sportskeeda.com/esports/feed', 'valorant', 'india', 60, '{"games": ["valorant", "cs2", "freefire", "pubg-mobile"]}'),
  ('Clash of Clans Blog', 'coc-blog', 'rss', 'https://clashofclans.com/blog/rss', 'coc', 'global', 120, '{}'),
  ('Sportskeeda PUBG Mobile', 'sportskeeda-pubg', 'rss', 'https://www.sportskeeda.com/pubg-mobile/feed', 'pubg-mobile', 'india', 60, '{}'),
  ('Sportskeeda Free Fire', 'sportskeeda-freefire', 'rss', 'https://www.sportskeeda.com/free-fire/feed', 'freefire', 'india', 60, '{}')
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- SUBSCRIPTION PLANS (from 008_payments.sql)
-- ============================================

-- Stripe Customer Mapping
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  price_monthly INT NOT NULL,
  price_yearly INT NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(30) NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_customer_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  amount INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('subscription', 'battle_pass', 'currency_pack', 'one_time')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Webhook Events Log
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT false,
  payload JSONB NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add premium flags to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
    ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_until') THEN
    ALTER TABLE public.profiles ADD COLUMN premium_until TIMESTAMPTZ;
  END IF;
END $$;

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium) WHERE is_premium = true;

-- Payment RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Stripe Customers policies
DROP POLICY IF EXISTS "Users can view own stripe customer" ON public.stripe_customers;
CREATE POLICY "Users can view own stripe customer" ON public.stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage stripe customers" ON public.stripe_customers;
CREATE POLICY "Service role can manage stripe customers" ON public.stripe_customers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscription Plans policies
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Service role can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payment Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.payment_transactions;
CREATE POLICY "Service role can manage transactions" ON public.payment_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Stripe Webhook Events policies
DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role can manage webhook events" ON public.stripe_webhook_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update user premium status
CREATE OR REPLACE FUNCTION update_user_premium_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.profiles
    SET is_premium = true, premium_until = NEW.current_period_end
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'unpaid', 'paused') THEN
    UPDATE public.profiles
    SET is_premium = false, premium_until = NULL
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for premium status sync
DROP TRIGGER IF EXISTS sync_premium_status ON public.user_subscriptions;
CREATE TRIGGER sync_premium_status
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_premium_status();

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT
    CASE
      WHEN is_premium = true AND (premium_until IS NULL OR premium_until > NOW()) THEN true
      ELSE false
    END INTO v_is_premium
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_premium, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default subscription plan
INSERT INTO public.subscription_plans (slug, name, description, price_monthly, price_yearly, features, sort_order)
VALUES
  ('premium', 'GamerHub Premium', 'Unlock exclusive features and stand out from the crowd', 999, 9999,
   '["Exclusive titles, frames, and themes", "Priority matchmaking queue", "100MB media uploads (vs 20MB)", "Advanced stats dashboard", "See who viewed your profile", "Unlimited follows", "Early access to new features", "Premium badge on profile"]'::jsonb,
   1)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- FIX PRO PLAYERS AMBIGUOUS COLUMN (from 036)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_pro_players_by_games(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  follower_count INT,
  common_games JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_game_ids AS (
    SELECT ug_user.game_id
    FROM public.user_games ug_user
    WHERE ug_user.user_id = p_user_id
  ),
  pro_player_followers AS (
    SELECT
      p.id AS pro_user_id,
      (SELECT COUNT(*)::INT FROM public.follows f WHERE f.following_id = p.id) AS pro_follower_count
    FROM public.profiles p
    WHERE p.gaming_style = 'pro'
      AND p.id != p_user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE (bu.blocker_id = p_user_id AND bu.blocked_id = p.id)
           OR (bu.blocker_id = p.id AND bu.blocked_id = p_user_id)
      )
  )
  SELECT
    ppf.pro_user_id AS user_id,
    ppf.pro_follower_count AS follower_count,
    jsonb_agg(
      jsonb_build_object(
        'game_id', ug.game_id,
        'game_name', g.name,
        'rank', ug.rank
      )
    ) AS common_games
  FROM pro_player_followers ppf
  JOIN public.user_games ug ON ug.user_id = ppf.pro_user_id
  JOIN public.games g ON g.id = ug.game_id
  WHERE ug.game_id IN (SELECT ugi.game_id FROM user_game_ids ugi)
  GROUP BY ppf.pro_user_id, ppf.pro_follower_count
  ORDER BY ppf.pro_follower_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_pro_players_by_games TO authenticated;

-- Done! All missing tables and fixes have been applied.
-- Migration: 038_friend_posts.sql
-- Creates the friend_posts table for social posting feature

-- ============================================
-- FRIEND POSTS TABLE
-- ============================================

-- Create friend_posts table
CREATE TABLE IF NOT EXISTS public.friend_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friend_posts_user ON public.friend_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_posts_created ON public.friend_posts(created_at DESC);

-- Enable RLS
ALTER TABLE public.friend_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view friend posts" ON public.friend_posts;
CREATE POLICY "Anyone can view friend posts"
  ON public.friend_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create friend posts" ON public.friend_posts;
CREATE POLICY "Authenticated users can create friend posts"
  ON public.friend_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own friend posts" ON public.friend_posts;
CREATE POLICY "Users can update their own friend posts"
  ON public.friend_posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own friend posts" ON public.friend_posts;
CREATE POLICY "Users can delete their own friend posts"
  ON public.friend_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_friend_posts_updated_at
  BEFORE UPDATE ON public.friend_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_posts;
-- Fix: Social list functions were excluding mutual follows (friends),
-- causing empty lists when the profile header counted ALL follows.
-- The "Following" list should show everyone a user follows,
-- and "Followers" should show everyone who follows them,
-- regardless of whether the follow is mutual.

-- Fix get_user_following_list: remove the mutual-follow exclusion
CREATE OR REPLACE FUNCTION public.get_user_following_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  following_id UUID,
  following_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.following_id,
    f.created_at AS following_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.following_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.following_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.follower_id = p_user_id
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.following_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY following_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_user_followers_list: remove the mutual-follow exclusion
CREATE OR REPLACE FUNCTION public.get_user_followers_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  follower_id UUID,
  followed_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.follower_id,
    f.created_at AS followed_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.follower_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.follower_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.following_id = p_user_id
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.follower_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY followed_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_user_social_counts: count ALL follows, not just one-way
CREATE OR REPLACE FUNCTION public.get_user_social_counts(p_user_id UUID)
RETURNS TABLE (
  friends_count INT,
  followers_count INT,
  following_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    public.get_friend_count(p_user_id) AS friends_count,
    (SELECT COUNT(*)::INT FROM public.follows f WHERE f.following_id = p_user_id) AS followers_count,
    (SELECT COUNT(*)::INT FROM public.follows f WHERE f.follower_id = p_user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fix storage RLS policies to allow all authenticated upload paths
-- The previous policy only allowed 'avatars/{user_id}/' and 'banners/{user_id}/'
-- but the app also uploads clan media, general media, etc.

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;

-- New INSERT policy: authenticated users can upload to the 'media' bucket
-- as long as their user ID is part of the path (for ownership)
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (
    -- Profile avatars/banners: avatars/{user_id}/... or banners/{user_id}/...
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- Clan media: clan-avatars/{clan_id}-... or clan-banners/{clan_id}-...
    -- (clan ownership is enforced at API level, not storage level)
    (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR
    -- General media uploads: {user_id}/...
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Drop and recreate UPDATE policy to also cover clan media
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'media' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Drop and recreate DELETE policy to also cover clan media
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (
    (storage.foldername(name))[2] = auth.uid()::text
    OR (storage.foldername(name))[1] IN ('clan-avatars', 'clan-banners')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);
-- Fix: "Database error saving new user" on signup
-- This ensures the profiles table and signup trigger work correctly

-- 1. Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  gaming_style VARCHAR(20) CHECK (gaming_style IN ('casual', 'competitive', 'pro')),
  preferred_language VARCHAR(10) DEFAULT 'en',
  region VARCHAR(50),
  timezone VARCHAR(50),
  online_hours JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns that later migrations expect (safe with IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
    ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_until') THEN
    ALTER TABLE public.profiles ADD COLUMN premium_until TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_matches_played') THEN
    ALTER TABLE public.profiles ADD COLUMN total_matches_played INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_views') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_views INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reputation_score') THEN
    ALTER TABLE public.profiles ADD COLUMN reputation_score DECIMAL(3,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trust_score') THEN
    ALTER TABLE public.profiles ADD COLUMN trust_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Ensure RLS policies exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 5. Recreate the signup trigger function with full error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username VARCHAR(30);
BEGIN
  -- Build username, fallback to user_ prefix if not provided
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- If username already taken, append random suffix
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := substr(v_username, 1, 22) || '_' || substr(md5(random()::text), 1, 6);
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error to Postgres logs so we can see it in Supabase Dashboard > Logs > Postgres
    RAISE LOG 'handle_new_user() failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    -- Still return NEW so the auth.users row is created (user can set up profile later)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
-- Tighten storage bucket limits now that all uploads are compressed to WebP client-side.
-- Previous limit was 50 MB (way too generous for images).
-- New limit: 5 MB per file — images are compressed to <1 MB before upload,
-- so this is a safety net, not a bottleneck. Videos remain unsupported at bucket level.

UPDATE storage.buckets
SET
  file_size_limit = 5242880,  -- 5 MB
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
WHERE id = 'media';
-- Fix: Drop stale gamification trigger that references dropped user_progression table
-- The 999_cleanup_and_focus migration dropped user_progression but left the
-- on_profile_created_gamification trigger on profiles, causing 42P01 errors
-- ("relation user_progression does not exist") whenever a new profile is inserted.

DROP TRIGGER IF EXISTS on_profile_created_gamification ON public.profiles;
DROP FUNCTION IF EXISTS handle_new_profile_gamification();
-- Fix: Drop ALL stale AFTER INSERT triggers on profiles that can break signup.
--
-- When handle_new_user() inserts into profiles, any AFTER INSERT trigger that
-- fails (e.g., references a missing table) causes the profile INSERT to be
-- rolled back inside the EXCEPTION savepoint. The auth.users row is still
-- created, but the profile row is not — leaving the user stuck.
--
-- These triggers are non-essential for signup and can be recreated later if
-- the underlying tables are restored.

-- 1. Gamification trigger (references dropped user_progression table)
DROP TRIGGER IF EXISTS on_profile_created_gamification ON public.profiles;
DROP FUNCTION IF EXISTS handle_new_profile_gamification();

-- 2. Account verification trigger (references account_verifications table)
DROP TRIGGER IF EXISTS on_profile_created_create_verification ON public.profiles;
DROP FUNCTION IF EXISTS create_account_verification();

-- 3. Accessibility settings trigger (references accessibility_settings table)
DROP TRIGGER IF EXISTS on_profile_created_accessibility ON public.profiles;
DROP FUNCTION IF EXISTS create_accessibility_settings();

-- 4. Notification preferences trigger (references notification_preferences table)
DROP TRIGGER IF EXISTS on_profile_created_notification_prefs ON public.profiles;
DROP FUNCTION IF EXISTS create_default_notification_preferences();

-- Verify: List remaining triggers on profiles (should only be update_profiles_updated_at)
DO $$
DECLARE
  t RECORD;
BEGIN
  RAISE LOG '--- Remaining triggers on public.profiles ---';
  FOR t IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'public.profiles'::regclass
      AND NOT tgisinternal
  LOOP
    RAISE LOG 'Trigger: %', t.tgname;
  END LOOP;
END $$;
-- Fix: Recreate blocked_users table dropped by 999_cleanup_and_focus.sql
--
-- The send_friend_request() function (006_friends.sql) checks blocked_users
-- before inserting into friend_requests.  Without this table the function
-- raises  42P01  ("relation does not exist") and friend requests silently fail.

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocked_users;
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);
-- ==========================================================================
-- Migration 046: Restore the complete friends system
-- ==========================================================================
--
-- ROOT CAUSE:  999_cleanup_and_focus.sql dropped friend_requests and
--              blocked_users with CASCADE.  Migration 045 recreated
--              blocked_users, but friend_requests was NEVER recreated.
--
-- Every API route that calls get_relationship_status(), send_friend_request(),
-- or queries the friend_requests table directly returns a 500 because the
-- table doesn't exist.
--
-- This migration restores EVERYTHING the friends system needs:
--   1. friend_requests table
--   2. blocked_users table  (idempotent – IF NOT EXISTS)
--   3. All views
--   4. All RPC functions     (CREATE OR REPLACE)
--   5. RLS policies          (DROP IF EXISTS + CREATE)
--   6. Grants
-- ==========================================================================


-- ============================================
-- 1. TABLES
-- ============================================

-- friend_requests — the table that was never recreated
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, recipient_id),
  CHECK (sender_id != recipient_id)
);

-- blocked_users — safety net (045 should have created it already)
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);


-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender
  ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient
  ON public.friend_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status
  ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_pending
  ON public.friend_requests(recipient_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker
  ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked
  ON public.blocked_users(blocked_id);


-- ============================================
-- 3. VIEWS
-- ============================================

-- Friends = mutual follows
CREATE OR REPLACE VIEW public.friends_view AS
SELECT
  f1.follower_id AS user_id,
  f1.following_id AS friend_id,
  GREATEST(f1.created_at, f2.created_at) AS friends_since
FROM public.follows f1
INNER JOIN public.follows f2
  ON f1.follower_id = f2.following_id
  AND f1.following_id = f2.follower_id
WHERE f1.follower_id < f1.following_id;

-- Following only (one-way, excludes mutual)
CREATE OR REPLACE VIEW public.following_only_view AS
SELECT
  f.follower_id AS user_id,
  f.following_id,
  f.created_at
FROM public.follows f
WHERE NOT EXISTS (
  SELECT 1 FROM public.follows f2
  WHERE f2.follower_id = f.following_id
  AND f2.following_id = f.follower_id
);

-- Followers only (one-way, excludes mutual)
CREATE OR REPLACE VIEW public.followers_only_view AS
SELECT
  f.following_id AS user_id,
  f.follower_id,
  f.created_at
FROM public.follows f
WHERE NOT EXISTS (
  SELECT 1 FROM public.follows f2
  WHERE f2.follower_id = f.following_id
  AND f2.following_id = f.follower_id
);


-- ============================================
-- 4. FUNCTIONS  (CREATE OR REPLACE = safe)
-- ============================================

-- are_friends
CREATE OR REPLACE FUNCTION public.are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = user1_id AND f1.following_id = user2_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_relationship_status
CREATE OR REPLACE FUNCTION public.get_relationship_status(
  current_user_id UUID,
  target_user_id UUID
)
RETURNS TABLE (
  is_friend BOOLEAN,
  is_following BOOLEAN,
  is_follower BOOLEAN,
  has_pending_request_sent BOOLEAN,
  has_pending_request_received BOOLEAN,
  is_blocked BOOLEAN,
  is_blocked_by BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1 FROM public.follows f1
      INNER JOIN public.follows f2
        ON f1.follower_id = f2.following_id
        AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = current_user_id AND f1.following_id = target_user_id
    ) AS is_friend,
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = current_user_id AND following_id = target_user_id
    ) AS is_following,
    EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = target_user_id AND following_id = current_user_id
    ) AS is_follower,
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = current_user_id
        AND recipient_id = target_user_id
        AND status = 'pending'
    ) AS has_pending_request_sent,
    EXISTS (
      SELECT 1 FROM public.friend_requests
      WHERE sender_id = target_user_id
        AND recipient_id = current_user_id
        AND status = 'pending'
    ) AS has_pending_request_received,
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = current_user_id AND blocked_id = target_user_id
    ) AS is_blocked,
    EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = target_user_id AND blocked_id = current_user_id
    ) AS is_blocked_by;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- send_friend_request
CREATE OR REPLACE FUNCTION public.send_friend_request(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_already_friends BOOLEAN;
  v_is_blocked BOOLEAN;
BEGIN
  -- Check if blocked
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = p_sender_id AND blocked_id = p_recipient_id)
       OR (blocker_id = p_recipient_id AND blocked_id = p_sender_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'Cannot send friend request to this user';
  END IF;

  -- Check if already friends
  SELECT public.are_friends(p_sender_id, p_recipient_id) INTO v_already_friends;

  IF v_already_friends THEN
    RAISE EXCEPTION 'Already friends with this user';
  END IF;

  -- Auto-follow the recipient
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_sender_id, p_recipient_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  -- Create or update friend request
  INSERT INTO public.friend_requests (sender_id, recipient_id, message, status)
  VALUES (p_sender_id, p_recipient_id, p_message, 'pending')
  ON CONFLICT (sender_id, recipient_id)
  DO UPDATE SET
    status = 'pending',
    message = EXCLUDED.message,
    created_at = NOW(),
    responded_at = NULL
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- accept_friend_request
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
BEGIN
  SELECT sender_id INTO v_sender_id
  FROM public.friend_requests
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;

  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_recipient_id, v_sender_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- decline_friend_request
CREATE OR REPLACE FUNCTION public.decline_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.friend_requests
  SET status = 'declined', responded_at = NOW()
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_friend_request
CREATE OR REPLACE FUNCTION public.cancel_friend_request(
  p_request_id UUID,
  p_sender_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.friend_requests
  SET status = 'cancelled', responded_at = NOW()
  WHERE id = p_request_id
    AND sender_id = p_sender_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- remove_friend
CREATE OR REPLACE FUNCTION public.remove_friend(
  p_user_id UUID,
  p_friend_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.follows
  WHERE (follower_id = p_user_id AND following_id = p_friend_id)
     OR (follower_id = p_friend_id AND following_id = p_user_id);

  DELETE FROM public.friend_requests
  WHERE (sender_id = p_user_id AND recipient_id = p_friend_id)
     OR (sender_id = p_friend_id AND recipient_id = p_user_id);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_friends
CREATE OR REPLACE FUNCTION public.get_friends(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  friends_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f1.follower_id = p_user_id THEN f1.following_id
      ELSE f1.follower_id
    END AS friend_id,
    GREATEST(f1.created_at, f2.created_at) AS friends_since
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.follower_id = f2.following_id
    AND f1.following_id = f2.follower_id
  WHERE f1.follower_id = p_user_id OR f1.following_id = p_user_id
  GROUP BY f1.follower_id, f1.following_id, f1.created_at, f2.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_friend_count
CREATE OR REPLACE FUNCTION public.get_friend_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f1
    INNER JOIN public.follows f2
      ON f1.follower_id = f2.following_id
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_followers_only_count
CREATE OR REPLACE FUNCTION public.get_followers_only_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f
    WHERE f.following_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = p_user_id
      AND f2.following_id = f.follower_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_following_only_count
CREATE OR REPLACE FUNCTION public.get_following_only_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.follows f
    WHERE f.follower_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = f.following_id
      AND f2.following_id = p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_social_counts
CREATE OR REPLACE FUNCTION public.get_user_social_counts(p_user_id UUID)
RETURNS TABLE (
  friends_count INT,
  followers_count INT,
  following_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    public.get_friend_count(p_user_id) AS friends_count,
    (SELECT COUNT(*)::INT FROM public.follows f WHERE f.following_id = p_user_id) AS followers_count,
    (SELECT COUNT(*)::INT FROM public.follows f WHERE f.follower_id = p_user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_friends_list
CREATE OR REPLACE FUNCTION public.get_user_friends_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  friend_id UUID,
  friends_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f1.follower_id = p_user_id THEN f1.following_id
      ELSE f1.follower_id
    END AS friend_id,
    GREATEST(f1.created_at, f2.created_at) AS friends_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id,
        CASE WHEN f1.follower_id = p_user_id THEN f1.following_id ELSE f1.follower_id END
      )
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id
          AND following_id = (CASE WHEN f1.follower_id = p_user_id THEN f1.following_id ELSE f1.follower_id END)
      )
    END AS is_viewer_following
  FROM public.follows f1
  INNER JOIN public.follows f2
    ON f1.follower_id = f2.following_id
    AND f1.following_id = f2.follower_id
  WHERE (f1.follower_id = p_user_id OR f1.following_id = p_user_id)
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = (CASE WHEN f1.follower_id = p_user_id THEN f1.following_id ELSE f1.follower_id END)
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  GROUP BY f1.follower_id, f1.following_id, f1.created_at, f2.created_at
  ORDER BY friends_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_followers_list
CREATE OR REPLACE FUNCTION public.get_user_followers_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  follower_id UUID,
  followed_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.follower_id,
    f.created_at AS followed_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.follower_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.follower_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.following_id = p_user_id
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.follower_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY followed_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_following_list
CREATE OR REPLACE FUNCTION public.get_user_following_list(
  p_user_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  following_id UUID,
  following_since TIMESTAMPTZ,
  is_viewer_friend BOOLEAN,
  is_viewer_following BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.following_id,
    f.created_at AS following_since,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE public.are_friends(p_viewer_id, f.following_id)
    END AS is_viewer_friend,
    CASE
      WHEN p_viewer_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = p_viewer_id AND following_id = f.following_id
      )
    END AS is_viewer_following
  FROM public.follows f
  WHERE f.follower_id = p_user_id
    AND (
      p_search IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = f.following_id
          AND (pr.username ILIKE '%' || p_search || '%' OR pr.display_name ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY following_since DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- friend_requests policies
DROP POLICY IF EXISTS "Anyone can view their own friend requests" ON public.friend_requests;
CREATE POLICY "Anyone can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own requests" ON public.friend_requests;
CREATE POLICY "Users can update their own requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can delete their own sent requests" ON public.friend_requests;
CREATE POLICY "Users can delete their own sent requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = sender_id);

-- blocked_users policies
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocked_users;
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);


-- ============================================
-- 6. REALTIME
-- ============================================

-- Safe: ADD TABLE is idempotent in recent Supabase versions
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
EXCEPTION WHEN duplicate_object THEN
  NULL;  -- already added
END $$;


-- ============================================
-- 7. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_requests TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;

GRANT EXECUTE ON FUNCTION public.are_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relationship_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_friend TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friends TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_followers_only_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_only_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_social_counts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_friends_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_followers_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_following_list TO authenticated;
-- ==========================================================================
-- 047_friend_request_notifications.sql
--
-- Automatically create in-app notifications when friend request events occur:
--   1. New/re-sent friend request  -> notify the recipient
--   2. Friend request accepted     -> notify the original sender
--
-- Uses the existing create_notification() function which respects user
-- preferences and quiet hours.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.notify_friend_request_events()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name  TEXT;
  v_sender_user  TEXT;
  v_recipient_name TEXT;
  v_recipient_user TEXT;
BEGIN
  -- ── New or re-sent friend request (status = 'pending') ──
  IF (
    (TG_OP = 'INSERT' AND NEW.status = 'pending')
    OR
    (TG_OP = 'UPDATE' AND NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending')
  ) THEN
    -- Look up sender display info
    SELECT COALESCE(display_name, username), username
      INTO v_sender_name, v_sender_user
      FROM public.profiles
     WHERE id = NEW.sender_id;

    PERFORM create_notification(
      NEW.recipient_id,                                       -- p_user_id
      'friend_request'::notification_type,                    -- p_type
      'New Squad Request!',                                   -- p_title
      v_sender_name || ' wants to team up with you! Accept and start gaming together.',  -- p_body
      '🎮',                                                  -- p_icon
      '/friends?tab=requests',                                -- p_action_url
      'View Request',                                         -- p_action_label
      jsonb_build_object(                                     -- p_metadata
        'sender_id',       NEW.sender_id,
        'request_id',      NEW.id,
        'sender_username', v_sender_user
      )
    );
  END IF;

  -- ── Friend request accepted ──
  IF (
    TG_OP = 'UPDATE'
    AND NEW.status = 'accepted'
    AND OLD.status IS DISTINCT FROM 'accepted'
  ) THEN
    -- Look up acceptor (recipient) display info
    SELECT COALESCE(display_name, username), username
      INTO v_recipient_name, v_recipient_user
      FROM public.profiles
     WHERE id = NEW.recipient_id;

    PERFORM create_notification(
      NEW.sender_id,                                          -- p_user_id
      'friend_request'::notification_type,                    -- p_type
      'Squad Up!',                                            -- p_title
      v_recipient_name || ' accepted your friend request! You''re now teammates.',  -- p_body
      '⚔️',                                                  -- p_icon
      '/profile/' || v_recipient_user,                        -- p_action_url
      'View Profile',                                         -- p_action_label
      jsonb_build_object(                                     -- p_metadata
        'friend_id',          NEW.recipient_id,
        'request_id',         NEW.id,
        'acceptor_username',  v_recipient_user
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger (drop first to make migration re-runnable)
DROP TRIGGER IF EXISTS trg_friend_request_notifications ON public.friend_requests;

CREATE TRIGGER trg_friend_request_notifications
  AFTER INSERT OR UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request_events();
-- ==========================================================================
-- Migration 048: Message reactions + message delete policy
-- ==========================================================================

-- Message Reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id
  ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user
  ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);

-- RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view message reactions" ON public.message_reactions;
CREATE POLICY "Users can view message reactions"
  ON public.message_reactions FOR SELECT
  USING (
    public.is_conversation_member(
      (SELECT conversation_id FROM public.messages WHERE id = message_id),
      auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_conversation_member(
      (SELECT conversation_id FROM public.messages WHERE id = message_id),
      auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove own reactions" ON public.message_reactions;
CREATE POLICY "Users can remove own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Allow users to delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Grants
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
-- ==========================================================================
-- 049_fix_friend_request_logic.sql
--
-- FIX: Friend request contradictions
--
-- Problem: When User A sends a request to User B, and User B sends one
-- back (instead of accepting), TWO pending rows exist:
--   (A → B, 'pending')  AND  (B → A, 'pending')
-- Both users get mutual follows (so they appear as "friends"), but the
-- friend_request rows never get cleaned up — causing the same person to
-- show in both the Friends tab AND the Sent Requests tab.
--
-- Fixes:
--   1. send_friend_request  — if a reverse pending request already exists,
--      auto-accept it instead of creating a duplicate.
--   2. accept_friend_request — also mark any reverse pending request as
--      accepted so there are no orphaned 'pending' rows.
-- ==========================================================================

-- ── 1. Fix send_friend_request ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_friend_request(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_already_friends BOOLEAN;
  v_is_blocked BOOLEAN;
  v_reverse_request_id UUID;
BEGIN
  -- Check if blocked
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = p_sender_id AND blocked_id = p_recipient_id)
       OR (blocker_id = p_recipient_id AND blocked_id = p_sender_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RAISE EXCEPTION 'Cannot send friend request to this user';
  END IF;

  -- Check if already friends
  SELECT public.are_friends(p_sender_id, p_recipient_id) INTO v_already_friends;

  IF v_already_friends THEN
    RAISE EXCEPTION 'Already friends with this user';
  END IF;

  -- *** NEW: Check if there is a pending request FROM the recipient TO us ***
  SELECT id INTO v_reverse_request_id
  FROM public.friend_requests
  WHERE sender_id = p_recipient_id
    AND recipient_id = p_sender_id
    AND status = 'pending';

  IF v_reverse_request_id IS NOT NULL THEN
    -- The other person already wants to be our friend — auto-accept their
    -- request instead of creating a conflicting second pending row.
    PERFORM public.accept_friend_request(v_reverse_request_id, p_sender_id);
    RETURN v_reverse_request_id;
  END IF;

  -- Auto-follow the recipient
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_sender_id, p_recipient_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  -- Create or update friend request
  INSERT INTO public.friend_requests (sender_id, recipient_id, message, status)
  VALUES (p_sender_id, p_recipient_id, p_message, 'pending')
  ON CONFLICT (sender_id, recipient_id)
  DO UPDATE SET
    status = 'pending',
    message = EXCLUDED.message,
    created_at = NOW(),
    responded_at = NULL
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2. Fix accept_friend_request ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  p_request_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
BEGIN
  SELECT sender_id INTO v_sender_id
  FROM public.friend_requests
  WHERE id = p_request_id
    AND recipient_id = p_recipient_id
    AND status = 'pending';

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;

  -- Mark this request as accepted
  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;

  -- *** NEW: Also mark any reverse pending request as accepted ***
  UPDATE public.friend_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE sender_id = p_recipient_id
    AND recipient_id = v_sender_id
    AND status = 'pending';

  -- Create follow back (making them friends)
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (p_recipient_id, v_sender_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. Clean up existing bad data ──────────────────────────────────────────
-- Mark any 'pending' friend_requests as 'accepted' where the two users
-- are already mutual follows (i.e. already friends).
UPDATE public.friend_requests fr
SET status = 'accepted', responded_at = NOW()
WHERE fr.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.follows f1
    JOIN public.follows f2
      ON f1.follower_id = f2.following_id
     AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = fr.sender_id
      AND f1.following_id = fr.recipient_id
  );
-- ==========================================================================
-- Migration 049: Restore the complete messaging system
-- ==========================================================================
--
-- ROOT CAUSE:  999_cleanup_and_focus.sql dropped conversations,
--              conversation_participants, and messages with CASCADE.
--              These tables were NEVER recreated.
--
-- This migration restores everything the messaging system needs:
--   1. conversations table
--   2. conversation_participants table
--   3. messages table
--   4. RLS policies
--   5. Helper functions (is_conversation_member, create_direct_conversation)
--   6. Indexes, triggers, grants, realtime
-- ==========================================================================


-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'match')),
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
  ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);


-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Check if a user is a member of a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or find a direct conversation between two users
CREATE OR REPLACE FUNCTION public.create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  existing_conv_id UUID;
  new_conv_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Check if direct conversation already exists between these users
  SELECT c.id INTO existing_conv_id
  FROM conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = current_user_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp3
    WHERE cp3.conversation_id = c.id
  ) = 2
  LIMIT 1;

  IF existing_conv_id IS NOT NULL THEN
    RETURN existing_conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (type)
  VALUES ('direct')
  RETURNING id INTO new_conv_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (new_conv_id, current_user_id),
    (new_conv_id, other_user_id);

  RETURN new_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can view if they are a participant
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    public.is_conversation_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
CREATE POLICY "Users can update their conversations"
  ON public.conversations FOR UPDATE
  USING (public.is_conversation_member(id, auth.uid()));

-- Conversation participants: users can view if they are a member
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    public.is_conversation_member(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their participation" ON public.conversation_participants;
CREATE POLICY "Users can update their participation"
  ON public.conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: users can view if they are in the conversation
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- Messages: users can send if they are in the conversation
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- Messages: users can delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Messages: users can update their own messages
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);


-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Auto-update updated_at on conversations
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================
-- 6. REALTIME
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================
-- 7. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_conversation_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_direct_conversation TO authenticated;
-- Fix: Allow authenticated users to register as blog authors
-- The blog_authors table was missing an INSERT policy, causing RLS violations
-- when premium users tried to access the /write page (which auto-registers them as authors)

CREATE POLICY "Users can register as blog authors"
  ON public.blog_authors FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Community Listings (Tournaments & Giveaways)
-- Lightweight announcement board for tournaments/giveaways organized by
-- YouTubers, pros, or any community member.

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE public.community_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,

  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,

  -- Type: tournament or giveaway
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('tournament', 'giveaway')),

  -- Organizer info (could be a YouTuber, pro, anyone)
  organizer_name VARCHAR(100),
  organizer_url TEXT,

  -- Time period
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',

  -- Rules
  rules TEXT,
  external_link TEXT,
  prize_description TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),

  -- Engagement
  view_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Winners table (many winners per listing)
CREATE TABLE public.community_listing_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- For winners who may not be on the platform
  display_name VARCHAR(100) NOT NULL,
  placement INTEGER,
  prize_awarded TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE public.community_listing_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_community_listings_creator ON community_listings(creator_id);
CREATE INDEX idx_community_listings_game ON community_listings(game_id);
CREATE INDEX idx_community_listings_type ON community_listings(listing_type);
CREATE INDEX idx_community_listings_status ON community_listings(status);
CREATE INDEX idx_community_listings_active ON community_listings(status, starts_at DESC) WHERE status = 'active';
CREATE INDEX idx_community_listings_created ON community_listings(created_at DESC);

CREATE INDEX idx_listing_winners_listing ON community_listing_winners(listing_id);
CREATE INDEX idx_listing_winners_user ON community_listing_winners(user_id);

CREATE INDEX idx_listing_bookmarks_listing ON community_listing_bookmarks(listing_id);
CREATE INDEX idx_listing_bookmarks_user ON community_listing_bookmarks(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE community_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_listing_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_listing_bookmarks ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Active listings are viewable by everyone"
  ON community_listings FOR SELECT
  USING (status IN ('active', 'completed') OR creator_id = auth.uid());

CREATE POLICY "Users can create listings"
  ON community_listings FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their listings"
  ON community_listings FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their listings"
  ON community_listings FOR DELETE
  USING (creator_id = auth.uid());

-- Winners policies
CREATE POLICY "Winners are viewable by everyone"
  ON community_listing_winners FOR SELECT
  USING (true);

CREATE POLICY "Listing creators can manage winners"
  ON community_listing_winners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_listings cl
      WHERE cl.id = community_listing_winners.listing_id
      AND cl.creator_id = auth.uid()
    )
  );

CREATE POLICY "Listing creators can update winners"
  ON community_listing_winners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_listings cl
      WHERE cl.id = community_listing_winners.listing_id
      AND cl.creator_id = auth.uid()
    )
  );

CREATE POLICY "Listing creators can delete winners"
  ON community_listing_winners FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM community_listings cl
      WHERE cl.id = community_listing_winners.listing_id
      AND cl.creator_id = auth.uid()
    )
  );

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks"
  ON community_listing_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can bookmark listings"
  ON community_listing_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their bookmarks"
  ON community_listing_bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_community_listings_updated_at
  BEFORE UPDATE ON community_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Engagement System: Likes & Comments for News Articles and Community Listings
-- Replicates the proven blog engagement pattern from 018_blog.sql

-- ============================================
-- ALTER PARENT TABLES
-- ============================================

ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

ALTER TABLE public.community_listings
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- ============================================
-- NEWS ARTICLE ENGAGEMENT TABLES
-- ============================================

-- Likes
CREATE TABLE public.news_article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- Comments (with nested replies)
CREATE TABLE public.news_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.news_article_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE public.news_article_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.news_article_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Bookmarks
CREATE TABLE public.news_article_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- ============================================
-- COMMUNITY LISTING ENGAGEMENT TABLES
-- ============================================

-- Likes
CREATE TABLE public.community_listing_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- Comments (with nested replies)
CREATE TABLE public.community_listing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.community_listings(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.community_listing_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE public.community_listing_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.community_listing_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Note: community_listing_bookmarks already exists in 051_community_listings.sql

-- ============================================
-- INDEXES
-- ============================================

-- News article likes
CREATE INDEX idx_news_article_likes_article ON public.news_article_likes(article_id);
CREATE INDEX idx_news_article_likes_user ON public.news_article_likes(user_id);

-- News article comments
CREATE INDEX idx_news_article_comments_article ON public.news_article_comments(article_id);
CREATE INDEX idx_news_article_comments_author ON public.news_article_comments(author_id);
CREATE INDEX idx_news_article_comments_parent ON public.news_article_comments(parent_id);

-- News article comment likes
CREATE INDEX idx_news_article_comment_likes_comment ON public.news_article_comment_likes(comment_id);
CREATE INDEX idx_news_article_comment_likes_user ON public.news_article_comment_likes(user_id);

-- News article bookmarks
CREATE INDEX idx_news_article_bookmarks_article ON public.news_article_bookmarks(article_id);
CREATE INDEX idx_news_article_bookmarks_user ON public.news_article_bookmarks(user_id);

-- Community listing likes
CREATE INDEX idx_listing_likes_listing ON public.community_listing_likes(listing_id);
CREATE INDEX idx_listing_likes_user ON public.community_listing_likes(user_id);

-- Community listing comments
CREATE INDEX idx_listing_comments_listing ON public.community_listing_comments(listing_id);
CREATE INDEX idx_listing_comments_author ON public.community_listing_comments(author_id);
CREATE INDEX idx_listing_comments_parent ON public.community_listing_comments(parent_id);

-- Community listing comment likes
CREATE INDEX idx_listing_comment_likes_comment ON public.community_listing_comment_likes(comment_id);
CREATE INDEX idx_listing_comment_likes_user ON public.community_listing_comment_likes(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- News article likes
ALTER TABLE public.news_article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own news likes"
  ON public.news_article_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like news articles"
  ON public.news_article_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their news likes"
  ON public.news_article_likes FOR DELETE
  USING (auth.uid() = user_id);

-- News article comments
ALTER TABLE public.news_article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible news comments are viewable by everyone"
  ON public.news_article_comments FOR SELECT
  USING (status = 'visible' OR author_id = auth.uid());

CREATE POLICY "Authenticated users can comment on news"
  ON public.news_article_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their news comments"
  ON public.news_article_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their news comments"
  ON public.news_article_comments FOR DELETE
  USING (author_id = auth.uid());

-- News article comment likes
ALTER TABLE public.news_article_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own news comment likes"
  ON public.news_article_comment_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like news comments"
  ON public.news_article_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their news comment likes"
  ON public.news_article_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- News article bookmarks
ALTER TABLE public.news_article_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own news bookmarks"
  ON public.news_article_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can bookmark news"
  ON public.news_article_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their news bookmarks"
  ON public.news_article_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Community listing likes
ALTER TABLE public.community_listing_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listing likes"
  ON public.community_listing_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like listings"
  ON public.community_listing_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their listing likes"
  ON public.community_listing_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Community listing comments
ALTER TABLE public.community_listing_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible listing comments are viewable by everyone"
  ON public.community_listing_comments FOR SELECT
  USING (status = 'visible' OR author_id = auth.uid());

CREATE POLICY "Authenticated users can comment on listings"
  ON public.community_listing_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their listing comments"
  ON public.community_listing_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their listing comments"
  ON public.community_listing_comments FOR DELETE
  USING (author_id = auth.uid());

-- Community listing comment likes
ALTER TABLE public.community_listing_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listing comment likes"
  ON public.community_listing_comment_likes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can like listing comments"
  ON public.community_listing_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their listing comment likes"
  ON public.community_listing_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- News article likes count
CREATE OR REPLACE FUNCTION update_news_article_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news_articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news_articles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_news_article_like_change
  AFTER INSERT OR DELETE ON public.news_article_likes
  FOR EACH ROW EXECUTE FUNCTION update_news_article_likes_count();

-- News article comments count
CREATE OR REPLACE FUNCTION update_news_article_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news_articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news_articles SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_news_article_comment_change
  AFTER INSERT OR DELETE ON public.news_article_comments
  FOR EACH ROW EXECUTE FUNCTION update_news_article_comments_count();

-- News article comment likes count
CREATE OR REPLACE FUNCTION update_news_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.news_article_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.news_article_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_news_comment_like_change
  AFTER INSERT OR DELETE ON public.news_article_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_news_comment_likes_count();

-- Listing likes count
CREATE OR REPLACE FUNCTION update_listing_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_listings SET likes_count = likes_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_listings SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_like_change
  AFTER INSERT OR DELETE ON public.community_listing_likes
  FOR EACH ROW EXECUTE FUNCTION update_listing_likes_count();

-- Listing comments count
CREATE OR REPLACE FUNCTION update_listing_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_listings SET comments_count = comments_count + 1 WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_listings SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_comment_change
  AFTER INSERT OR DELETE ON public.community_listing_comments
  FOR EACH ROW EXECUTE FUNCTION update_listing_comments_count();

-- Listing comment likes count
CREATE OR REPLACE FUNCTION update_listing_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_listing_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_listing_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_comment_like_change
  AFTER INSERT OR DELETE ON public.community_listing_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_listing_comment_likes_count();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_news_article_comments_updated_at
  BEFORE UPDATE ON public.news_article_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_comments_updated_at
  BEFORE UPDATE ON public.community_listing_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Add template and color palette columns to blog_posts
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'classic' NOT NULL,
  ADD COLUMN IF NOT EXISTS color_palette TEXT DEFAULT 'neon_surge' NOT NULL;

-- Add check constraints for valid values
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_template_check CHECK (
    template IN ('classic', 'magazine', 'cyberpunk', 'minimal', 'card_grid', 'gaming_stream')
  ),
  ADD CONSTRAINT blog_posts_color_palette_check CHECK (
    color_palette IN ('neon_surge', 'crimson_fire', 'ocean_depth', 'phantom_violet', 'arctic_frost', 'toxic_waste')
  );
-- Admin System Migration
-- Adds admin access control to profiles table

-- Add admin columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_role VARCHAR(30) DEFAULT NULL
  CHECK (admin_role IS NULL OR admin_role IN ('super_admin', 'editor', 'moderator'));

-- Index for quick admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Allow admins to view all news articles (not just published)
CREATE POLICY "Admins can view all news articles"
  ON public.news_articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to insert news articles
CREATE POLICY "Admins can insert news articles"
  ON public.news_articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to update news articles
CREATE POLICY "Admins can update news articles"
  ON public.news_articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to delete news articles
CREATE POLICY "Admins can delete news articles"
  ON public.news_articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
-- ==========================================================================
-- Migration 055: Fix message read receipts & enable realtime for participants
-- ==========================================================================
--
-- FIXES:
--   1. conversation_participants was never added to the realtime publication,
--      so last_read_at updates were invisible to other clients.
--   2. Adds conversation_participants to realtime so read-status changes
--      trigger refetches in the conversation list.
-- ==========================================================================

-- Add conversation_participants to realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Profile customization fields for stat trackers and player card
-- Adds pinned_stats (which 3 stats to showcase) and card_style (player card theme)

ALTER TABLE user_progression
  ADD COLUMN IF NOT EXISTS pinned_stats text[] DEFAULT ARRAY['matches_played', 'matches_won', 'games_linked'],
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'auto';
-- Rank history tracking for timeline visualization
-- Records rank changes over time for each game

CREATE TABLE IF NOT EXISTS rank_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rank text NOT NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  season text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id, rank)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_rank_history_user_id ON rank_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_history_user_game ON rank_history(user_id, game_id, achieved_at);

-- RLS policies
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read rank history
CREATE POLICY "rank_history_select" ON rank_history
  FOR SELECT USING (true);

-- Users can only insert their own rank history
CREATE POLICY "rank_history_insert" ON rank_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rank history
CREATE POLICY "rank_history_update" ON rank_history
  FOR UPDATE USING (auth.uid() = user_id);
-- Migration: 058_shared_news_posts.sql
-- Adds shared_news_id to friend_posts for sharing news articles to the feed

ALTER TABLE public.friend_posts
  ADD COLUMN shared_news_id UUID DEFAULT NULL
  REFERENCES public.news_articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_friend_posts_shared_news
  ON public.friend_posts(shared_news_id)
  WHERE shared_news_id IS NOT NULL;
-- Migration: 059_beta_feedback.sql
-- Beta feedback system — collect user feedback with optional screenshot

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can insert feedback
CREATE POLICY "Users can submit feedback"
  ON public.beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins (or service role) can read all feedback
CREATE POLICY "Admins can read all feedback"
  ON public.beta_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow anonymous feedback (no user_id)
CREATE POLICY "Anonymous users can submit feedback"
  ON public.beta_feedback FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Index for admin review
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created
  ON public.beta_feedback(created_at DESC);
-- 060: Blog Optimizations
-- - Add content_json JSONB column for TipTap AST storage
-- - Add tsvector full-text search with GIN index
-- - Add index for cursor-based pagination
-- - Drop demo seed data tables

-- 1. Add content_json column for storing TipTap JSON AST
-- This preserves semantic structure for portability (RSS, mobile, email)
-- while keeping HTML for backward compatibility during transition
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- 2. Add full-text search vector column
-- Weighted: title (A) is ranked higher than excerpt (B)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
) STORED;

-- GIN index for fast full-text search queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_search_vector
  ON blog_posts USING GIN(search_vector);

-- 3. Composite index for cursor-based pagination
-- Supports ORDER BY is_pinned DESC, published_at DESC with WHERE status = 'published'
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_cursor
  ON blog_posts(status, is_pinned DESC, published_at DESC)
  WHERE status = 'published';

-- 4. Drop demo/seed data tables (these are not used by any code)
DROP TABLE IF EXISTS demo_user_badges CASCADE;
DROP TABLE IF EXISTS demo_user_games CASCADE;
DROP TABLE IF EXISTS demo_profiles CASCADE;
DROP TABLE IF EXISTS demo_community_posts CASCADE;
-- News Article Comments
-- Following the same pattern as blog_comments

CREATE TABLE IF NOT EXISTS public.news_article_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.news_article_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'deleted')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News Article Comment Likes
CREATE TABLE IF NOT EXISTS public.news_article_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.news_article_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_article_comments_article_id ON public.news_article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comments_author_id ON public.news_article_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comments_parent_id ON public.news_article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comments_status ON public.news_article_comments(status);
CREATE INDEX IF NOT EXISTS idx_news_article_comment_likes_comment_id ON public.news_article_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_news_article_comment_likes_user_id ON public.news_article_comment_likes(user_id);

-- RLS Policies
ALTER TABLE public.news_article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_article_comment_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible comments
CREATE POLICY "Anyone can view visible news comments"
  ON public.news_article_comments
  FOR SELECT
  USING (status = 'visible');

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can create news comments"
  ON public.news_article_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own comments
CREATE POLICY "Authors can update own news comments"
  ON public.news_article_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Anyone can view comment likes
CREATE POLICY "Anyone can view news comment likes"
  ON public.news_article_comment_likes
  FOR SELECT
  USING (true);

-- Authenticated users can toggle likes
CREATE POLICY "Authenticated users can like news comments"
  ON public.news_article_comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike news comments"
  ON public.news_article_comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to toggle like on a news comment
CREATE OR REPLACE FUNCTION toggle_news_comment_like(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.news_article_comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.news_article_comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id;

    UPDATE public.news_article_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_comment_id;

    RETURN FALSE;
  ELSE
    INSERT INTO public.news_article_comment_likes (comment_id, user_id)
    VALUES (p_comment_id, v_user_id);

    UPDATE public.news_article_comments
    SET likes_count = likes_count + 1
    WHERE id = p_comment_id;

    RETURN TRUE;
  END IF;
END;
$$;
-- Migration: 061_profile_verification.sql
-- Adds is_verified flag to profiles for public figure / blue-check verification

-- Add verified column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Index for quick lookups (e.g. guest friend-posts query)
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified
  ON public.profiles(is_verified)
  WHERE is_verified = true;
-- ============================================
-- Exclusive Titles & Frames for Premium Members
-- ============================================
-- Recreates the titles table (dropped by 999_cleanup)
-- and adds special titles and frames for early adopters,
-- beta testers, and achievement-based rewards.

-- Recreate titles table (was dropped by 999_cleanup_and_focus.sql)
CREATE TABLE IF NOT EXISTS public.titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  unlock_type VARCHAR(20) NOT NULL CHECK (unlock_type IN ('level', 'badge', 'achievement', 'purchase', 'special')),
  unlock_value JSONB,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate user_titles table (was dropped by 999_cleanup_and_focus.sql)
CREATE TABLE IF NOT EXISTS public.user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title_id UUID REFERENCES public.titles(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

-- Enable RLS
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;

-- Titles are readable by everyone
CREATE POLICY "titles_select" ON public.titles FOR SELECT USING (true);

-- User titles: users can read their own, system inserts
CREATE POLICY "user_titles_select" ON public.user_titles FOR SELECT USING (true);
CREATE POLICY "user_titles_insert" ON public.user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed base titles (from original 004 migration)
INSERT INTO public.titles (slug, name, description, unlock_type, unlock_value, rarity, color, sort_order) VALUES
('newcomer', 'Newcomer', 'Welcome to GamerHub!', 'level', '{"level": 5}', 'common', NULL, 1),
('rising_star', 'Rising Star', 'Making progress!', 'level', '{"level": 10}', 'common', '#FFD700', 2),
('veteran', 'Veteran', 'A seasoned player', 'level', '{"level": 20}', 'rare', '#4169E1', 3),
('elite', 'Elite', 'Among the best', 'level', '{"level": 30}', 'rare', '#9400D3', 4),
('champion', 'Champion', 'A true champion', 'level', '{"level": 40}', 'epic', '#FF4500', 5),
('legend', 'Legend', 'Legendary status achieved', 'level', '{"level": 50}', 'epic', '#FF1493', 6),
('mythic', 'Mythic', 'Mythical prowess', 'level', '{"level": 75}', 'legendary', '#00CED1', 7),
('immortal', 'Immortal', 'Beyond mortal limits', 'level', '{"level": 100}', 'legendary', '#DC143C', 8),
('social_butterfly', 'Social Butterfly', 'Made 50 friends', 'achievement', '{"type": "follows", "count": 50}', 'rare', '#FF69B4', 10),
('streak_master', 'Streak Master', 'Win 10 matches in a row', 'achievement', '{"type": "win_streak", "count": 10}', 'epic', '#FF8C00', 11)
ON CONFLICT (slug) DO NOTHING;

-- Exclusive Titles for early adopters and special achievements (Premium-only)
INSERT INTO public.titles (slug, name, description, unlock_type, unlock_value, rarity, color, sort_order) VALUES
('pioneer', 'Pioneer', 'Among the first to join GamerHub', 'special', '{"type": "early_registration"}', 'legendary', '#FFD700', 20),
('founding_member', 'Founding Member', 'Joined during the beta phase', 'special', '{"type": "beta_user"}', 'epic', '#C0C0C0', 21),
('early_bird', 'Early Bird', 'Registered in the early days', 'special', '{"type": "early_registration"}', 'rare', '#00CED1', 22),
('trailblazer', 'Trailblazer', 'Paving the way for the community', 'special', '{"type": "community_pioneer"}', 'epic', '#FF6347', 23),
('og_gamer', 'OG Gamer', 'An original GamerHub member', 'special', '{"type": "original_member"}', 'legendary', '#E040FB', 24),
('first_blood', 'First Blood', 'Won their very first match', 'special', '{"type": "first_win"}', 'rare', '#DC143C', 25),
('clan_founder', 'Clan Founder', 'Founded a clan on GamerHub', 'special', '{"type": "clan_creation"}', 'rare', '#4169E1', 26),
('content_creator', 'Content Creator', 'Published 10+ blog posts', 'special', '{"type": "blog_posts", "count": 10}', 'epic', '#FF8C00', 27)
ON CONFLICT (slug) DO NOTHING;

-- Exclusive Frames (profile_frames table still exists, just adding new rows)
INSERT INTO public.profile_frames (slug, name, description, image_url, unlock_type, unlock_value, rarity, sort_order) VALUES
('pioneer_frame', 'Pioneer Frame', 'Exclusive golden frame for early adopters', '/images/frames/pioneer.png', 'special', '{"type": "early_registration"}', 'legendary', 10),
('beta_frame', 'Beta Tester Frame', 'Awarded to beta testers who helped shape GamerHub', '/images/frames/beta.png', 'special', '{"type": "beta_user"}', 'epic', 11),
('fire_frame', 'Flame Frame', 'A fiery border for hot gamers with win streaks', '/images/frames/fire.png', 'special', '{"type": "win_streak", "count": 5}', 'rare', 12),
('neon_frame', 'Neon Glow Frame', 'Vibrant neon border that lights up your profile', '/images/frames/neon.png', 'special', '{"type": "level", "level": 25}', 'epic', 13),
('cosmic_frame', 'Cosmic Frame', 'Stars and galaxies surround your avatar', '/images/frames/cosmic.png', 'special', '{"type": "level", "level": 50}', 'legendary', 14)
ON CONFLICT (slug) DO NOTHING;
-- Add user-selected presence status to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'auto'
    CHECK (status IN ('auto', 'online', 'away', 'dnd', 'offline')),
  ADD COLUMN IF NOT EXISTS status_until TIMESTAMPTZ DEFAULT NULL;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

COMMENT ON COLUMN public.profiles.status IS
  'User-selected presence status: auto (system-managed), online, away, dnd, offline (appear offline)';
COMMENT ON COLUMN public.profiles.status_until IS
  'If set, the status reverts to auto when this timestamp is reached';
-- User Activity Tracking: daily presence aggregation
-- Records one row per user per day, incremented by the presence heartbeat

CREATE TABLE IF NOT EXISTS public.user_activity_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_online REAL NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, activity_date)
);

-- Index for fetching a user's activity history
CREATE INDEX IF NOT EXISTS idx_activity_days_user_date
  ON public.user_activity_days(user_id, activity_date DESC);

-- RLS
ALTER TABLE public.user_activity_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity days"
  ON public.user_activity_days FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON public.user_activity_days FOR UPDATE
  USING (auth.uid() = user_id);

-- RPC function called by the 30-second presence heartbeat.
-- Atomic UPSERT: inserts a new row for today or increments minutes_online.
-- Deduplication: skips the increment if last_seen_at was <20s ago
-- (prevents double-counting from multiple open tabs).
CREATE OR REPLACE FUNCTION public.record_heartbeat_activity(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_activity_days (user_id, activity_date, minutes_online, first_seen_at, last_seen_at)
  VALUES (p_user_id, CURRENT_DATE, 0.5, NOW(), NOW())
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    minutes_online = CASE
      WHEN NOW() - user_activity_days.last_seen_at > INTERVAL '20 seconds'
      THEN user_activity_days.minutes_online + 0.5
      ELSE user_activity_days.minutes_online
    END,
    last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.user_activity_days IS
  'Daily presence aggregation: one row per user per day, incremented by heartbeat';
COMMENT ON COLUMN public.user_activity_days.minutes_online IS
  'Total minutes online for this day (incremented 0.5 per 30-second heartbeat)';
-- Migration 065: Fix Supabase Advisor Security Warnings
--
-- Fixes two categories of warnings:
--   1. "Security Definer View" — views that bypass caller RLS
--   2. "Function Search Path Mutable" — functions without explicit search_path
--
-- Safety notes:
--   - ALTER FUNCTION SET search_path only pins schema resolution. Zero logic change.
--   - ALTER VIEW SET (security_invoker = true) makes views respect caller RLS.
--     Only applied to views whose underlying tables all have public SELECT policies.
--
-- Intentionally SKIPPED views:
--   - public.trust_badges: reads account_trust which restricts SELECT to own row.
--     Enabling security_invoker would hide other users' badges on profiles.
--   - public.active_challenges: participant_count subquery reads challenge_progress
--     which restricts non-completed rows to auth.uid(). Count would be inaccurate.
--
-- Uses exception handling to gracefully skip functions/views that were removed
-- by cleanup migrations (e.g. 044, 999).


-- ============================================================
-- PART 1: Views — enable security_invoker = true
-- ============================================================

DO $$
DECLARE
  v TEXT;
  views TEXT[] := ARRAY[
    'leaderboard_global',
    'leaderboard_regional',
    'friends_view',
    'following_only_view',
    'followers_only_view',
    'demo_profiles_complete',
    'demo_posts_complete'
  ];
BEGIN
  FOREACH v IN ARRAY views LOOP
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
      RAISE NOTICE 'Fixed view: %', v;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped missing view: %', v;
    END;
  END LOOP;
END $$;


-- ============================================================
-- PART 2: Functions — SET search_path = public
-- ============================================================

DO $$
DECLARE
  f TEXT;
  funcs TEXT[] := ARRAY[
    -- Trigger functions (no parameters)
    'handle_new_user()',
    'handle_clan_member_join()',
    'handle_clan_member_leave()',
    'handle_clan_member_role_change()',
    'handle_new_profile_gamification()',
    'handle_match_completion_xp()',
    'handle_challenge_completion_xp()',
    'advance_tournament_winner()',
    'log_tournament_activity()',
    'update_user_premium_status()',
    'create_badge_earned_activity()',
    'create_account_verification()',
    'update_party_member_count()',
    'create_accessibility_settings()',
    'create_default_notification_preferences()',
    'update_regional_community_member_count()',
    'update_dna_from_peer_ratings()',
    'log_mood_change()',
    'update_lfg_player_count()',
    'update_blog_likes_count()',
    'update_blog_comments_count()',
    'update_blog_author_count()',
    'update_comment_likes_count()',
    'update_reputation_score()',
    'notify_friend_request_events()',
    'update_news_article_likes_count()',
    'update_news_article_comments_count()',
    'update_news_comment_likes_count()',
    'update_listing_likes_count()',
    'update_listing_comments_count()',
    'update_listing_comment_likes_count()',
    'increment_profile_views()',
    'check_badge_eligibility()',
    'update_updated_at_column()',
    'update_calls_updated_at()',
    'update_game_connections_timestamp()',
    'generate_blog_slug()',

    -- Parameterized functions
    'is_conversation_member(UUID, UUID)',
    'create_direct_conversation(UUID)',
    'award_xp(UUID, INT, VARCHAR, UUID, TEXT, UUID)',
    'assign_quests(UUID, VARCHAR)',
    'update_quest_progress(UUID, VARCHAR, JSONB)',
    'calculate_xp_for_level(INT)',
    'initialize_season_points(UUID, UUID, UUID)',
    'award_points(UUID, UUID, UUID, INT, VARCHAR, VARCHAR, UUID, TEXT)',
    'update_challenge_progress(UUID, UUID, INT, INT)',
    'refresh_leaderboard_rankings(UUID)',
    'grant_season_rewards(UUID)',
    'are_friends(UUID, UUID)',
    'get_relationship_status(UUID, UUID)',
    'send_friend_request(UUID, UUID, TEXT)',
    'accept_friend_request(UUID, UUID)',
    'decline_friend_request(UUID, UUID)',
    'cancel_friend_request(UUID, UUID)',
    'remove_friend(UUID, UUID)',
    'get_friends(UUID)',
    'get_friend_count(UUID)',
    'get_followers_only_count(UUID)',
    'get_following_only_count(UUID)',
    'get_mutual_friends(UUID, INT)',
    'get_similar_rank_players(UUID, INT, INT)',
    'get_pro_players_by_games(UUID, INT)',
    'get_popular_pro_players(INT)',
    'get_user_friends_list(UUID, UUID, INT, INT, TEXT)',
    'get_user_followers_list(UUID, UUID, INT, INT, TEXT)',
    'get_user_following_list(UUID, UUID, INT, INT, TEXT)',
    'get_user_social_counts(UUID)',
    'is_user_premium(UUID)',
    'get_active_battle_pass()',
    'award_battle_pass_xp(UUID, INT)',
    'claim_battle_pass_reward(UUID, UUID)',
    'get_or_create_wallet(UUID)',
    'add_currency(UUID, VARCHAR, INT, VARCHAR, UUID, TEXT)',
    'purchase_shop_item(UUID, UUID, VARCHAR)',
    'create_activity(UUID, VARCHAR, VARCHAR, UUID, JSONB, VARCHAR)',
    'toggle_activity_reaction(UUID, UUID, VARCHAR)',
    'get_user_game_connections(UUID)',
    'upsert_game_stats(UUID, UUID, TEXT, TEXT, TEXT, JSONB, JSONB)',
    'start_game_sync(UUID, UUID, TEXT)',
    'generate_post_slug(TEXT, UUID)',
    'create_forum_post(UUID, UUID, TEXT, TEXT, forum_post_type, TEXT[])',
    'create_forum_reply(UUID, UUID, TEXT, UUID)',
    'toggle_forum_vote(UUID, SMALLINT, UUID, UUID)',
    'mark_reply_as_solution(UUID, UUID, UUID)',
    'increment_post_views(UUID)',
    'get_live_streamers(INTEGER)',
    'update_stream_status(TEXT, stream_status, TEXT, TEXT, INTEGER)',
    'toggle_streamer_follow(UUID, UUID)',
    'get_or_create_skill_profile(UUID, TEXT)',
    'update_skill_rating(UUID, TEXT, BOOLEAN, DECIMAL)',
    'find_similar_players(UUID, TEXT, INTEGER)',
    'respond_to_suggestion(UUID, UUID, TEXT, TEXT, TEXT)',
    'get_user_notifications(UUID, INTEGER, INTEGER, BOOLEAN)',
    'mark_notifications_read(UUID, UUID[])',
    'create_notification(UUID, notification_type, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)',
    'execute_automation_rule(UUID, JSONB)',
    'get_rules_for_trigger(UUID, automation_trigger)',
    'expire_lfg_posts()',
    'increment_blog_view(TEXT)',
    'calculate_trust_score(UUID)',
    'is_user_blocked(UUID, UUID)',
    'get_verification_level(UUID)',
    'check_endorsement_rate_limit(UUID)',
    'match_discord_friends(UUID)',
    'generate_party_invite_code()',
    'cleanup_expired_parties()',
    'generate_overlay_token()',
    'calculate_mood_compatibility(UUID, UUID)',
    'detect_tilt(UUID)',
    'increment_news_view(UUID)',
    'record_heartbeat_activity(UUID)'
  ];
BEGIN
  FOREACH f IN ARRAY funcs LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public', f);
      RAISE NOTICE 'Fixed function: %', f;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped missing function: %', f;
    END;
  END LOOP;
END $$;
-- Negative Endorsements for Premium+ Users
-- Migration: 066_negative_endorsements.sql
-- Adds negative endorsement support to the trait endorsement system

-- Add endorsement type column (positive or negative)
ALTER TABLE public.trait_endorsements
ADD COLUMN IF NOT EXISTS endorsement_type VARCHAR(10) DEFAULT 'positive'
  CHECK (endorsement_type IN ('positive', 'negative'));

-- Add negative trait columns (mirror of positive traits)
ALTER TABLE public.trait_endorsements
ADD COLUMN IF NOT EXISTS toxic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quitter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uncooperative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uncommunicative BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unreliable BOOLEAN DEFAULT false;

-- Index for filtering by endorsement type
CREATE INDEX IF NOT EXISTS idx_trait_endorsements_type
  ON public.trait_endorsements(endorsement_type);

-- Add editor_notes column to blog_posts for editor suggestions
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS editor_notes TEXT;
-- Migration 067: Fix remaining Supabase Security Advisor warnings
--
-- Fixes:
--   1. CRITICAL: active_challenges view SECURITY DEFINER → SECURITY INVOKER
--   2. CRITICAL: trust_badges view SECURITY DEFINER → SECURITY INVOKER
--   3. WARNING: account_trust RLS auth.uid() re-evaluation (resolved by broadening policy)
--   4. WARNING: achievements RLS auth.uid() → (select auth.uid())
--
-- Approach for views:
--   Setting security_invoker = true makes the view respect the CALLER's RLS.
--   This requires broadening SELECT policies on underlying tables so the view
--   still returns correct results for all callers.


-- ============================================================
-- 1. Fix active_challenges view (SECURITY DEFINER → INVOKER)
-- ============================================================

-- The view's COUNT(*) subqueries need to read all challenge_progress rows.
-- Existing RLS only allows own rows + completed rows, which would make
-- participant_count inaccurate. Add a public SELECT policy so counts work.
-- Challenge participation data (who joined which challenge) is not sensitive.

CREATE POLICY "Challenge progress is publicly viewable"
  ON challenge_progress FOR SELECT
  USING (true);

ALTER VIEW public.active_challenges SET (security_invoker = true);


-- ============================================================
-- 2. Fix trust_badges view (SECURITY DEFINER → INVOKER)
-- ============================================================

-- trust_badges reads account_trust for all users to derive boolean badge flags.
-- The old SELECT policy restricted reads to own row only.
-- Replace it with a public SELECT policy so the view works with security_invoker.
-- Trust scores are algorithmic metrics derived from public activity, not PII.

DROP POLICY IF EXISTS "Users can view only their own trust" ON account_trust;

CREATE POLICY "Trust scores are viewable"
  ON account_trust FOR SELECT
  USING (true);

ALTER VIEW public.trust_badges SET (security_invoker = true);


-- ============================================================
-- 3. Fix achievements RLS policies (auth.uid() → subquery)
-- ============================================================

-- Wrapping auth.uid() in (select auth.uid()) causes PostgreSQL to evaluate
-- it once per query instead of once per row, improving performance at scale.

DROP POLICY IF EXISTS "Public achievements are viewable" ON achievements;

CREATE POLICY "Public achievements are viewable"
  ON achievements FOR SELECT
  USING (is_public = true OR user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own achievements" ON achievements;

CREATE POLICY "Users can manage their own achievements"
  ON achievements FOR ALL
  USING (user_id = (select auth.uid()));
-- Migration: 068_friend_post_likes.sql
-- Creates a proper like tracking table for friend posts
-- Fixes: race condition (non-atomic increment), no toggle logic, spam likes

-- ============================================
-- FRIEND POST LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.friend_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_post_likes_post ON public.friend_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_friend_post_likes_user ON public.friend_post_likes(user_id);

-- Enable RLS
ALTER TABLE public.friend_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view friend post likes"
  ON public.friend_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like friend posts"
  ON public.friend_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.friend_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ATOMIC TOGGLE FUNCTION
-- ============================================
-- Atomically likes or unlikes a friend post.
-- Returns the new liked state and the updated likes_count.

CREATE OR REPLACE FUNCTION toggle_friend_post_like(p_post_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
  v_new_count INTEGER;
  v_liked BOOLEAN;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM public.friend_post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Unlike: remove the like
    DELETE FROM public.friend_post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id;
    v_liked := FALSE;
  ELSE
    -- Like: insert the like
    INSERT INTO public.friend_post_likes (post_id, user_id)
    VALUES (p_post_id, p_user_id);
    v_liked := TRUE;
  END IF;

  -- Update the denormalized count atomically
  UPDATE public.friend_posts
  SET likes_count = (
    SELECT COUNT(*) FROM public.friend_post_likes WHERE post_id = p_post_id
  )
  WHERE id = p_post_id
  RETURNING likes_count INTO v_new_count;

  RETURN json_build_object('liked', v_liked, 'likes_count', COALESCE(v_new_count, 0));
END;
$$;

-- Allow the RLS update policy to work for the atomic count update
-- The function runs as SECURITY DEFINER so it can update any post's likes_count

-- Enable realtime for the likes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_post_likes;
-- Migration: 069_friend_post_comments_bookmarks.sql
-- Creates comments and bookmarks tables for friend posts

-- ============================================
-- FRIEND POST COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.friend_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_post_comments_post ON public.friend_post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_friend_post_comments_user ON public.friend_post_comments(user_id);

-- Enable RLS
ALTER TABLE public.friend_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view friend post comments"
  ON public.friend_post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment on friend posts"
  ON public.friend_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.friend_post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FRIEND POST BOOKMARKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.friend_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_post_bookmarks_user ON public.friend_post_bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_post_bookmarks_post ON public.friend_post_bookmarks(post_id);

-- Enable RLS
ALTER TABLE public.friend_post_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookmarks"
  ON public.friend_post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark friend posts"
  ON public.friend_post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own bookmarks"
  ON public.friend_post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ATOMIC TOGGLE BOOKMARK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION toggle_friend_post_bookmark(p_post_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
  v_bookmarked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.friend_post_bookmarks
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.friend_post_bookmarks
    WHERE post_id = p_post_id AND user_id = p_user_id;
    v_bookmarked := FALSE;
  ELSE
    INSERT INTO public.friend_post_bookmarks (post_id, user_id)
    VALUES (p_post_id, p_user_id);
    v_bookmarked := TRUE;
  END IF;

  RETURN json_build_object('bookmarked', v_bookmarked);
END;
$$;

-- ============================================
-- ADD COMMENT FUNCTION (with atomic count update)
-- ============================================

CREATE OR REPLACE FUNCTION add_friend_post_comment(p_post_id UUID, p_user_id UUID, p_content TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Insert the comment
  INSERT INTO public.friend_post_comments (post_id, user_id, content)
  VALUES (p_post_id, p_user_id, p_content)
  RETURNING id INTO v_comment_id;

  -- Update denormalized count
  UPDATE public.friend_posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.friend_post_comments WHERE post_id = p_post_id
  )
  WHERE id = p_post_id
  RETURNING comments_count INTO v_new_count;

  RETURN json_build_object('comment_id', v_comment_id, 'comments_count', COALESCE(v_new_count, 0));
END;
$$;

-- ============================================
-- DELETE COMMENT FUNCTION (with atomic count update)
-- ============================================

CREATE OR REPLACE FUNCTION delete_friend_post_comment(p_comment_id UUID, p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_id UUID;
  v_new_count INTEGER;
BEGIN
  -- Get the post_id and verify ownership
  SELECT post_id INTO v_post_id
  FROM public.friend_post_comments
  WHERE id = p_comment_id AND user_id = p_user_id;

  IF v_post_id IS NULL THEN
    RETURN json_build_object('error', 'Comment not found or not authorized');
  END IF;

  -- Delete the comment
  DELETE FROM public.friend_post_comments WHERE id = p_comment_id;

  -- Update denormalized count
  UPDATE public.friend_posts
  SET comments_count = (
    SELECT COUNT(*) FROM public.friend_post_comments WHERE post_id = v_post_id
  )
  WHERE id = v_post_id
  RETURNING comments_count INTO v_new_count;

  RETURN json_build_object('deleted', true, 'comments_count', COALESCE(v_new_count, 0));
END;
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_post_bookmarks;
-- GamerHub Focus Migration: Gaming Resume & Profile System
-- This migration removes unused features and focuses on the core profile system
-- Target: India's first platform for amateur gaming talent

-- ============================================
-- STEP 1: DROP UNUSED TABLES (in dependency order)
-- ============================================

-- Squad DNA & Mood Matching
DROP TABLE IF EXISTS public.squad_play_sessions CASCADE;
DROP TABLE IF EXISTS public.squad_dna_profiles CASCADE;
DROP TABLE IF EXISTS public.mood_play_sessions CASCADE;
DROP TABLE IF EXISTS public.mood_statuses CASCADE;

-- Creator Tools
DROP TABLE IF EXISTS public.overlay_alerts CASCADE;
DROP TABLE IF EXISTS public.stream_overlays CASCADE;
DROP TABLE IF EXISTS public.creator_analytics CASCADE;
DROP TABLE IF EXISTS public.creator_profiles CASCADE;

-- Community UGC
DROP TABLE IF EXISTS public.guide_comments CASCADE;
DROP TABLE IF EXISTS public.user_guides CASCADE;
DROP TABLE IF EXISTS public.clip_reactions CASCADE;
DROP TABLE IF EXISTS public.game_clips CASCADE;
DROP TABLE IF EXISTS public.map_callouts CASCADE;

-- Console Platforms
DROP TABLE IF EXISTS public.platform_accounts CASCADE;
DROP TABLE IF EXISTS public.gaming_platforms CASCADE;

-- Discord Integration
DROP TABLE IF EXISTS public.discord_linked_accounts CASCADE;
DROP TABLE IF EXISTS public.discord_server_links CASCADE;

-- LFG System
DROP TABLE IF EXISTS public.lfg_applications CASCADE;
DROP TABLE IF EXISTS public.lfg_posts CASCADE;
DROP TABLE IF EXISTS public.game_roles CASCADE;

-- Blog
DROP TABLE IF EXISTS public.article_comments CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;

-- Automation
DROP TABLE IF EXISTS public.automation_logs CASCADE;
DROP TABLE IF EXISTS public.automation_rules CASCADE;

-- AI Matchmaking
DROP TABLE IF EXISTS public.matchmaking_feedback CASCADE;
DROP TABLE IF EXISTS public.matchmaking_queue CASCADE;

-- Streaming
DROP TABLE IF EXISTS public.stream_chat_messages CASCADE;
DROP TABLE IF EXISTS public.stream_viewers CASCADE;
DROP TABLE IF EXISTS public.live_streams CASCADE;
DROP TABLE IF EXISTS public.streamer_profiles CASCADE;

-- Forums
DROP TABLE IF EXISTS public.forum_post_reactions CASCADE;
DROP TABLE IF EXISTS public.forum_replies CASCADE;
DROP TABLE IF EXISTS public.forum_posts CASCADE;
DROP TABLE IF EXISTS public.forum_categories CASCADE;

-- Activity Feed
DROP TABLE IF EXISTS public.activity_reactions CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;

-- Virtual Currency
DROP TABLE IF EXISTS public.currency_transactions CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;

-- Battle Pass
DROP TABLE IF EXISTS public.user_battle_pass CASCADE;
DROP TABLE IF EXISTS public.battle_pass_rewards CASCADE;
DROP TABLE IF EXISTS public.battle_passes CASCADE;

-- Complex Payments (keep simple premium)
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.payment_history CASCADE;

-- Social Suggestions
DROP TABLE IF EXISTS public.user_suggestions CASCADE;
DROP TABLE IF EXISTS public.suggestion_dismissals CASCADE;

-- Complex Friends System (keep follows only)
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.blocked_users CASCADE;

-- Calls
DROP TABLE IF EXISTS public.call_participants CASCADE;
DROP TABLE IF EXISTS public.calls CASCADE;

-- Clans
DROP TABLE IF EXISTS public.clan_events CASCADE;
DROP TABLE IF EXISTS public.clan_invites CASCADE;
DROP TABLE IF EXISTS public.clan_members CASCADE;
DROP TABLE IF EXISTS public.clans CASCADE;

-- Tournaments
DROP TABLE IF EXISTS public.tournament_matches CASCADE;
DROP TABLE IF EXISTS public.tournament_teams CASCADE;
DROP TABLE IF EXISTS public.tournament_registrations CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;

-- Leaderboards (remove complex ones)
DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;
DROP TABLE IF EXISTS public.leaderboards CASCADE;

-- Complex Gamification (simplify)
DROP TABLE IF EXISTS public.user_badge_showcase CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.user_titles CASCADE;
DROP TABLE IF EXISTS public.titles CASCADE;
DROP TABLE IF EXISTS public.user_progression CASCADE;
DROP TABLE IF EXISTS public.xp_transactions CASCADE;
DROP TABLE IF EXISTS public.daily_challenges CASCADE;
DROP TABLE IF EXISTS public.user_daily_challenges CASCADE;

-- Messages (remove for now - focus on profile)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Challenges & Matches (remove for now)
DROP TABLE IF EXISTS public.match_participants CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;

-- ============================================
-- STEP 2: ENHANCE CORE TABLES
-- ============================================

-- Add premium status to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_since TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS premium_tier VARCHAR(20) DEFAULT NULL CHECK (premium_tier IN ('basic', 'pro', 'elite')),
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_matches_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(3,2) DEFAULT 0.00;

-- ============================================
-- STEP 3: SIMPLIFIED BADGE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS public.profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(30) NOT NULL CHECK (category IN ('achievement', 'trust', 'premium', 'skill', 'community', 'special')),
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  points INTEGER DEFAULT 0,
  requirement_type VARCHAR(30), -- 'matches_played', 'rating_received', 'games_linked', etc.
  requirement_value INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.profile_badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false, -- Show on profile
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- STEP 4: ENHANCED PEER RATING SYSTEM
-- ============================================

-- Drop old ratings and create enhanced version
DROP TABLE IF EXISTS public.ratings CASCADE;

CREATE TABLE public.peer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Positive-only ratings (1-5 scale, tick marks)
  teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  skill_level INTEGER CHECK (skill_level BETWEEN 1 AND 5),
  reliability INTEGER CHECK (reliability BETWEEN 1 AND 5),
  sportsmanship INTEGER CHECK (sportsmanship BETWEEN 1 AND 5),

  -- Context
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  played_as VARCHAR(20) CHECK (played_as IN ('teammate', 'opponent')),

  -- Optional positive comment only
  positive_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One rating per rater-rated pair per month
  UNIQUE(rater_id, rated_id)
);

-- ============================================
-- STEP 5: SIMPLE PREMIUM SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'pro', 'elite')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),

  -- Payment info (Razorpay for India)
  payment_provider VARCHAR(20) DEFAULT 'razorpay',
  external_subscription_id VARCHAR(200),

  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 6: PROFILE VIEW TRACKING (for premium analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source VARCHAR(30) CHECK (source IN ('search', 'direct', 'share', 'recommendation')),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profile_badges_category ON profile_badges(category);
CREATE INDEX IF NOT EXISTS idx_user_profile_badges_user ON user_profile_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_badges_featured ON user_profile_badges(user_id) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_peer_ratings_rated ON peer_ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_peer_ratings_rater ON peer_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_peer_ratings_game ON peer_ratings(game_id);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON profile_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation_score DESC);

-- ============================================
-- STEP 8: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Profile badges: Everyone can read
CREATE POLICY "Profile badges are viewable by everyone"
  ON profile_badges FOR SELECT USING (true);

-- User profile badges: Everyone can read
CREATE POLICY "User badges are viewable by everyone"
  ON user_profile_badges FOR SELECT USING (true);

-- Peer ratings: Everyone can read
CREATE POLICY "Peer ratings are viewable by everyone"
  ON peer_ratings FOR SELECT USING (true);

-- Peer ratings: Users can rate others
CREATE POLICY "Users can rate others"
  ON peer_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id AND auth.uid() != rated_id);

-- Peer ratings: Users can update their own ratings
CREATE POLICY "Users can update their ratings"
  ON peer_ratings FOR UPDATE
  USING (auth.uid() = rater_id);

-- Premium subscriptions: Users can view their own
CREATE POLICY "Users can view their subscription"
  ON premium_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Profile views: Users can view their own analytics
CREATE POLICY "Users can view their profile analytics"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_id);

-- Profile views: Anyone can log a view
CREATE POLICY "Anyone can log profile views"
  ON profile_views FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STEP 9: FUNCTIONS & TRIGGERS
-- ============================================

-- Update reputation score based on ratings
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET reputation_score = (
    SELECT ROUND(AVG(
      (COALESCE(teamwork, 0) + COALESCE(communication, 0) +
       COALESCE(skill_level, 0) + COALESCE(reliability, 0) +
       COALESCE(sportsmanship, 0)) / 5.0
    )::numeric, 2)
    FROM peer_ratings
    WHERE rated_id = NEW.rated_id
  )
  WHERE id = NEW.rated_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_peer_rating_change
  AFTER INSERT OR UPDATE ON peer_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_score();

-- Increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET profile_views = profile_views + 1
  WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_view
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_profile_views();

-- Auto-award badges based on achievements
CREATE OR REPLACE FUNCTION check_badge_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_badge RECORD;
BEGIN
  -- Check each badge requirement
  FOR v_badge IN
    SELECT * FROM profile_badges
    WHERE requirement_type IS NOT NULL AND is_active = true
  LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM user_profile_badges
      WHERE user_id = NEW.id AND badge_id = v_badge.id
    ) THEN
      -- Check specific requirements
      IF v_badge.requirement_type = 'games_linked' THEN
        IF (SELECT COUNT(*) FROM user_games WHERE user_id = NEW.id) >= v_badge.requirement_value THEN
          INSERT INTO user_profile_badges (user_id, badge_id) VALUES (NEW.id, v_badge.id);
        END IF;
      ELSIF v_badge.requirement_type = 'profile_views' THEN
        IF NEW.profile_views >= v_badge.requirement_value THEN
          INSERT INTO user_profile_badges (user_id, badge_id) VALUES (NEW.id, v_badge.id);
        END IF;
      ELSIF v_badge.requirement_type = 'reputation_score' THEN
        IF NEW.reputation_score >= v_badge.requirement_value THEN
          INSERT INTO user_profile_badges (user_id, badge_id) VALUES (NEW.id, v_badge.id);
        END IF;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_check_badges
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_badge_eligibility();

-- ============================================
-- STEP 10: SEED BADGES
-- ============================================

INSERT INTO profile_badges (name, display_name, description, category, rarity, points, requirement_type, requirement_value) VALUES
-- Trust Badges
('verified_player', 'Verified Player', 'Account verified with valid ID', 'trust', 'rare', 100, NULL, NULL),
('premium_member', 'Premium Member', 'Supporting GamerHub with premium subscription', 'premium', 'epic', 150, NULL, NULL),
('elite_member', 'Elite Member', 'Elite tier premium subscriber', 'premium', 'legendary', 300, NULL, NULL),

-- Achievement Badges
('first_game', 'First Link', 'Linked your first game account', 'achievement', 'common', 10, 'games_linked', 1),
('multi_gamer', 'Multi-Gamer', 'Linked 3 game accounts', 'achievement', 'uncommon', 25, 'games_linked', 3),
('gaming_arsenal', 'Gaming Arsenal', 'Linked 5+ game accounts', 'achievement', 'rare', 50, 'games_linked', 5),
('rising_star', 'Rising Star', 'Profile viewed 100+ times', 'achievement', 'uncommon', 30, 'profile_views', 100),
('spotlight', 'In The Spotlight', 'Profile viewed 500+ times', 'achievement', 'rare', 75, 'profile_views', 500),
('celebrity', 'Gaming Celebrity', 'Profile viewed 1000+ times', 'achievement', 'epic', 150, 'profile_views', 1000),

-- Skill Badges
('trusted_player', 'Trusted Player', 'Reputation score above 4.0', 'skill', 'rare', 100, 'reputation_score', 4),
('exemplary', 'Exemplary Gamer', 'Reputation score of 4.5+', 'skill', 'epic', 200, 'reputation_score', 4.5),

-- Community Badges
('early_adopter', 'Early Adopter', 'Joined during beta phase', 'special', 'legendary', 250, NULL, NULL),
('pioneer', 'Indian Gaming Pioneer', 'Among first 1000 users', 'special', 'legendary', 300, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 11: UPDATE GAMES FOR INDIAN MARKET
-- ============================================

-- Add BGMI (popular in India)
INSERT INTO games (slug, name, icon_url, has_api, ranks, roles) VALUES
  ('bgmi', 'Battlegrounds Mobile India', '/images/games/bgmi.png', false,
   '["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Ace Master","Ace Dominator","Conqueror"]',
   '["Fragger","Support","Driver","Scout","IGL"]')
ON CONFLICT (slug) DO NOTHING;

-- Add Free Fire (huge in India)
UPDATE games SET
  ranks = '["Bronze I","Bronze II","Bronze III","Silver I","Silver II","Silver III","Gold I","Gold II","Gold III","Gold IV","Platinum I","Platinum II","Platinum III","Platinum IV","Diamond I","Diamond II","Diamond III","Diamond IV","Heroic","Grandmaster"]'
WHERE slug = 'freefire';
-- ==========================================================================
-- Migration 1000: Restore messaging tables required by clans system
-- ==========================================================================
--
-- ROOT CAUSE: 999_cleanup_and_focus.sql drops conversations,
--             conversation_participants, and messages with CASCADE.
--             The clans system (003_clans.sql) depends on these tables
--             via the handle_clan_member_join trigger.
--
-- This migration runs AFTER 999 and restores the minimal tables needed.
-- ==========================================================================

-- 1. Recreate tables if they were dropped

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'match')),
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation
  ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
  ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);

-- 3. RLS

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- 4. Grants
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member TO authenticated;

-- 5. Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Restore Clans System
-- Migration 999 dropped clans, clan_members, clan_invites, clan_events
-- but the application code still depends on them.
-- Tables like clan_games, clan_achievements, etc. survived but lost their FK to clans.

-- ============================================
-- STEP 1: Recreate dropped tables
-- ============================================

-- 1. Clans (core table — must be created first)
CREATE TABLE IF NOT EXISTS public.clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  tag VARCHAR(6) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  primary_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  region VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  min_rank_requirement VARCHAR(50),
  max_members INT DEFAULT 50,
  is_public BOOLEAN DEFAULT true,
  is_recruiting BOOLEAN DEFAULT true,
  conversation_id UUID,
  settings JSONB DEFAULT '{"join_approval_required": true, "allow_member_invites": false}',
  stats JSONB DEFAULT '{"total_wins": 0, "total_matches": 0, "challenges_won": 0}',
  -- Columns from 033_clan_join_type migration
  join_type VARCHAR(20) DEFAULT 'closed' CHECK (join_type IN ('open', 'invite_only', 'closed')),
  clan_level INT DEFAULT 1,
  clan_xp INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clan Members
CREATE TABLE IF NOT EXISTS public.clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'co_leader', 'officer', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  promoted_at TIMESTAMPTZ,
  contribution_points INT DEFAULT 0,
  notes TEXT,
  UNIQUE(clan_id, user_id)
);

-- 3. Clan Invites
CREATE TABLE IF NOT EXISTS public.clan_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('invite', 'request')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================
-- STEP 2: Clean orphaned rows & restore FK constraints on surviving tables
-- ============================================

-- Delete orphaned rows whose clan_id no longer exists in clans
DELETE FROM public.clan_games WHERE clan_id NOT IN (SELECT id FROM public.clans);
DELETE FROM public.clan_achievements WHERE clan_id NOT IN (SELECT id FROM public.clans);
DELETE FROM public.clan_challenges WHERE challenger_clan_id NOT IN (SELECT id FROM public.clans);
DELETE FROM public.clan_challenges WHERE challenged_clan_id IS NOT NULL AND challenged_clan_id NOT IN (SELECT id FROM public.clans);
UPDATE public.clan_challenges SET winner_clan_id = NULL WHERE winner_clan_id IS NOT NULL AND winner_clan_id NOT IN (SELECT id FROM public.clans);
DELETE FROM public.clan_recruitment_posts WHERE clan_id NOT IN (SELECT id FROM public.clans);
DELETE FROM public.clan_activity_log WHERE clan_id NOT IN (SELECT id FROM public.clans);

-- clan_games: re-add FK to clans if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clan_games_clan_id_fkey'
      AND table_name = 'clan_games'
  ) THEN
    ALTER TABLE public.clan_games
      ADD CONSTRAINT clan_games_clan_id_fkey
      FOREIGN KEY (clan_id) REFERENCES public.clans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- clan_achievements: re-add FK to clans if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clan_achievements_clan_id_fkey'
      AND table_name = 'clan_achievements'
  ) THEN
    ALTER TABLE public.clan_achievements
      ADD CONSTRAINT clan_achievements_clan_id_fkey
      FOREIGN KEY (clan_id) REFERENCES public.clans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- clan_challenges: re-add FKs to clans if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clan_challenges_challenger_clan_id_fkey'
      AND table_name = 'clan_challenges'
  ) THEN
    ALTER TABLE public.clan_challenges
      ADD CONSTRAINT clan_challenges_challenger_clan_id_fkey
      FOREIGN KEY (challenger_clan_id) REFERENCES public.clans(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clan_challenges_challenged_clan_id_fkey'
      AND table_name = 'clan_challenges'
  ) THEN
    ALTER TABLE public.clan_challenges
      ADD CONSTRAINT clan_challenges_challenged_clan_id_fkey
      FOREIGN KEY (challenged_clan_id) REFERENCES public.clans(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clan_challenges_winner_clan_id_fkey'
      AND table_name = 'clan_challenges'
  ) THEN
    ALTER TABLE public.clan_challenges
      ADD CONSTRAINT clan_challenges_winner_clan_id_fkey
      FOREIGN KEY (winner_clan_id) REFERENCES public.clans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- clan_recruitment_posts: re-add FK to clans if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clan_recruitment_posts_clan_id_fkey'
      AND table_name = 'clan_recruitment_posts'
  ) THEN
    ALTER TABLE public.clan_recruitment_posts
      ADD CONSTRAINT clan_recruitment_posts_clan_id_fkey
      FOREIGN KEY (clan_id) REFERENCES public.clans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- clan_activity_log: re-add FK to clans if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clan_activity_log_clan_id_fkey'
      AND table_name = 'clan_activity_log'
  ) THEN
    ALTER TABLE public.clan_activity_log
      ADD CONSTRAINT clan_activity_log_clan_id_fkey
      FOREIGN KEY (clan_id) REFERENCES public.clans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- STEP 3: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clans_tag ON clans(tag);
CREATE INDEX IF NOT EXISTS idx_clans_slug ON clans(slug);
CREATE INDEX IF NOT EXISTS idx_clans_primary_game ON clans(primary_game_id);
CREATE INDEX IF NOT EXISTS idx_clans_region ON clans(region);
CREATE INDEX IF NOT EXISTS idx_clans_recruiting ON clans(is_recruiting) WHERE is_recruiting = true;
CREATE INDEX IF NOT EXISTS idx_clans_public ON clans(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_clans_created ON clans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clans_join_type ON clans(join_type);

CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user ON clan_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_role ON clan_members(role);

CREATE INDEX IF NOT EXISTS idx_clan_invites_clan ON clan_invites(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_invites_user ON clan_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_invites_status ON clan_invites(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_clan_invites_type ON clan_invites(type);

-- ============================================
-- STEP 4: Row Level Security
-- ============================================

ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_invites ENABLE ROW LEVEL SECURITY;

-- CLANS POLICIES
DROP POLICY IF EXISTS "Public clans are viewable by everyone" ON clans;
CREATE POLICY "Public clans are viewable by everyone"
  ON clans FOR SELECT
  USING (is_public = true OR EXISTS (
    SELECT 1 FROM clan_members WHERE clan_id = clans.id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Authenticated users can create clans" ON clans;
CREATE POLICY "Authenticated users can create clans"
  ON clans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Leaders and co-leaders can update clan" ON clans;
CREATE POLICY "Leaders and co-leaders can update clan"
  ON clans FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clans.id
    AND user_id = auth.uid()
    AND role IN ('leader', 'co_leader')
  ));

DROP POLICY IF EXISTS "Only leader can delete clan" ON clans;
CREATE POLICY "Only leader can delete clan"
  ON clans FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM clan_members
    WHERE clan_id = clans.id
    AND user_id = auth.uid()
    AND role = 'leader'
  ));

-- CLAN_MEMBERS POLICIES
DROP POLICY IF EXISTS "Clan members are viewable by everyone" ON clan_members;
CREATE POLICY "Clan members are viewable by everyone"
  ON clan_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can add members" ON clan_members;
CREATE POLICY "System can add members"
  ON clan_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Leaders and co-leaders can update members" ON clan_members;
CREATE POLICY "Leaders and co-leaders can update members"
  ON clan_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM clan_members cm
    WHERE cm.clan_id = clan_members.clan_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('leader', 'co_leader')
  ) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Members can leave or leaders can remove" ON clan_members;
CREATE POLICY "Members can leave or leaders can remove"
  ON clan_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_members.clan_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('leader', 'co_leader')
    )
  );

-- CLAN_INVITES POLICIES
DROP POLICY IF EXISTS "Users can view their own invites or clan officers can view requests" ON clan_invites;
CREATE POLICY "Users can view their own invites or clan officers can view requests"
  ON clan_invites FOR SELECT
  USING (
    user_id = auth.uid() OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    )
  );

DROP POLICY IF EXISTS "Officers can create invites, users can request" ON clan_invites;
CREATE POLICY "Officers can create invites, users can request"
  ON clan_invites FOR INSERT
  WITH CHECK (
    (type = 'request' AND user_id = auth.uid()) OR
    (type = 'invite' AND EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    ))
  );

DROP POLICY IF EXISTS "Users can respond to their invites, officers to requests" ON clan_invites;
CREATE POLICY "Users can respond to their invites, officers to requests"
  ON clan_invites FOR UPDATE
  USING (
    (type = 'invite' AND user_id = auth.uid()) OR
    (type = 'request' AND EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    ))
  );

DROP POLICY IF EXISTS "Users can delete their own invites or requests" ON clan_invites;
CREATE POLICY "Users can delete their own invites or requests"
  ON clan_invites FOR DELETE
  USING (
    user_id = auth.uid() OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_id = clan_invites.clan_id
      AND user_id = auth.uid()
      AND role IN ('leader', 'co_leader', 'officer')
    )
  );

-- ============================================
-- STEP 5: Triggers & Functions
-- ============================================

-- Updated_at trigger for clans
DROP TRIGGER IF EXISTS update_clans_updated_at ON clans;
CREATE TRIGGER update_clans_updated_at
  BEFORE UPDATE ON clans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Handle member join: add to conversation + log activity
CREATE OR REPLACE FUNCTION handle_clan_member_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Add member to clan conversation (skip if conversations table doesn't exist)
  BEGIN
    INSERT INTO conversation_participants (conversation_id, user_id)
    SELECT c.conversation_id, NEW.user_id
    FROM clans c
    WHERE c.id = NEW.clan_id AND c.conversation_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    -- conversations table may not exist, skip
  END;

  -- Log activity
  INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description)
  VALUES (NEW.clan_id, NEW.user_id, 'member_joined', 'Joined the clan');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clan_member_join ON clan_members;
CREATE TRIGGER on_clan_member_join
  AFTER INSERT ON clan_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_clan_member_join();

-- Handle member leave: remove from conversation + log activity
CREATE OR REPLACE FUNCTION handle_clan_member_leave()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove from clan conversation (skip if conversations table doesn't exist)
  BEGIN
    DELETE FROM conversation_participants
    WHERE user_id = OLD.user_id
    AND conversation_id = (SELECT conversation_id FROM clans WHERE id = OLD.clan_id);
  EXCEPTION WHEN undefined_table THEN
    -- conversations table may not exist, skip
  END;

  -- Log activity
  INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description)
  VALUES (OLD.clan_id, OLD.user_id, 'member_left', 'Left the clan');

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clan_member_leave ON clan_members;
CREATE TRIGGER on_clan_member_leave
  AFTER DELETE ON clan_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_clan_member_leave();

-- Handle role changes
CREATE OR REPLACE FUNCTION handle_clan_member_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role THEN
    IF NEW.role IN ('leader', 'co_leader', 'officer') AND OLD.role = 'member' THEN
      INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description, metadata)
      VALUES (NEW.clan_id, NEW.user_id, 'member_promoted',
              'Promoted to ' || NEW.role,
              jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
    ELSIF OLD.role IN ('leader', 'co_leader', 'officer') AND NEW.role = 'member' THEN
      INSERT INTO clan_activity_log (clan_id, user_id, activity_type, description, metadata)
      VALUES (NEW.clan_id, NEW.user_id, 'member_demoted',
              'Demoted to ' || NEW.role,
              jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
    END IF;
    NEW.promoted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_clan_member_role_change ON clan_members;
CREATE TRIGGER on_clan_member_role_change
  BEFORE UPDATE ON clan_members
  FOR EACH ROW
  EXECUTE FUNCTION handle_clan_member_role_change();

-- ============================================
-- STEP 6: Realtime
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE clan_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE clan_invites;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE clan_activity_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- ============================================================
-- Migration: Clan Wall, Weekly Missions, Scrim Scheduler
-- ============================================================

-- ============ 1. CLAN WALL POSTS ============

CREATE TABLE IF NOT EXISTS clan_wall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clan_wall_posts_clan_id ON clan_wall_posts(clan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_wall_posts_pinned ON clan_wall_posts(clan_id, is_pinned) WHERE is_pinned = TRUE;

ALTER TABLE clan_wall_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read wall posts of public clans; members can read private clan posts
CREATE POLICY "clan_wall_posts_select" ON clan_wall_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clans WHERE clans.id = clan_wall_posts.clan_id AND clans.is_public = TRUE)
    OR EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_wall_posts.clan_id AND clan_members.user_id = auth.uid())
  );

-- Members can insert posts
CREATE POLICY "clan_wall_posts_insert" ON clan_wall_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_wall_posts.clan_id AND clan_members.user_id = auth.uid())
  );

-- Authors can update their own posts; leaders/co-leaders can pin/unpin
CREATE POLICY "clan_wall_posts_update" ON clan_wall_posts
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_wall_posts.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader')
    )
  );

-- Authors can delete their own posts; leaders/co-leaders can delete any
CREATE POLICY "clan_wall_posts_delete" ON clan_wall_posts
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_wall_posts.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader')
    )
  );


-- ============ 2. CLAN WEEKLY MISSIONS ============

CREATE TABLE IF NOT EXISTS clan_weekly_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('matches_played', 'wins', 'members_online', 'wall_posts', 'scrims_played', 'custom')),
  goal_target INT NOT NULL CHECK (goal_target > 0),
  current_progress INT DEFAULT 0,
  xp_reward INT DEFAULT 50 CHECK (xp_reward >= 0),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clan_weekly_missions_clan_week ON clan_weekly_missions(clan_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_clan_weekly_missions_active ON clan_weekly_missions(clan_id, is_completed) WHERE is_completed = FALSE;

ALTER TABLE clan_weekly_missions ENABLE ROW LEVEL SECURITY;

-- Members can view their clan's missions
CREATE POLICY "clan_weekly_missions_select" ON clan_weekly_missions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_weekly_missions.clan_id AND clan_members.user_id = auth.uid())
  );

-- Leaders/co-leaders can create missions
CREATE POLICY "clan_weekly_missions_insert" ON clan_weekly_missions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_weekly_missions.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader')
    )
  );

-- Leaders/co-leaders can update missions (progress updates via API)
CREATE POLICY "clan_weekly_missions_update" ON clan_weekly_missions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_weekly_missions.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader')
    )
  );

-- Leaders can delete missions
CREATE POLICY "clan_weekly_missions_delete" ON clan_weekly_missions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_weekly_missions.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader')
    )
  );


-- ============ 3. CLAN MISSION CONTRIBUTIONS ============

CREATE TABLE IF NOT EXISTS clan_mission_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES clan_weekly_missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL DEFAULT 1 CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mission_id, user_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_clan_mission_contributions_mission ON clan_mission_contributions(mission_id);

ALTER TABLE clan_mission_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clan_mission_contributions_select" ON clan_mission_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clan_weekly_missions m
      JOIN clan_members cm ON cm.clan_id = m.clan_id
      WHERE m.id = clan_mission_contributions.mission_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "clan_mission_contributions_insert" ON clan_mission_contributions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM clan_weekly_missions m
      JOIN clan_members cm ON cm.clan_id = m.clan_id
      WHERE m.id = clan_mission_contributions.mission_id AND cm.user_id = auth.uid()
    )
  );


-- ============ 4. CLAN SCRIMS ============

CREATE TABLE IF NOT EXISTS clan_scrims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  max_slots INT NOT NULL DEFAULT 10 CHECK (max_slots > 0 AND max_slots <= 100),
  room_id TEXT,
  room_password TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clan_scrims_clan_id ON clan_scrims(clan_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_scrims_upcoming ON clan_scrims(clan_id, status) WHERE status = 'upcoming';

ALTER TABLE clan_scrims ENABLE ROW LEVEL SECURITY;

-- Members can view scrims (room details hidden at API level)
CREATE POLICY "clan_scrims_select" ON clan_scrims
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_scrims.clan_id AND clan_members.user_id = auth.uid())
  );

-- Officers+ can create scrims
CREATE POLICY "clan_scrims_insert" ON clan_scrims
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_scrims.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader', 'officer')
    )
  );

-- Creator or leaders can update scrims
CREATE POLICY "clan_scrims_update" ON clan_scrims
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_scrims.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader')
    )
  );

-- Creator or leaders can delete scrims
CREATE POLICY "clan_scrims_delete" ON clan_scrims
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM clan_members
      WHERE clan_members.clan_id = clan_scrims.clan_id
      AND clan_members.user_id = auth.uid()
      AND clan_members.role IN ('leader', 'co_leader')
    )
  );


-- ============ 5. CLAN SCRIM PARTICIPANTS ============

CREATE TABLE IF NOT EXISTS clan_scrim_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id UUID NOT NULL REFERENCES clan_scrims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'maybe', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scrim_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clan_scrim_participants_scrim ON clan_scrim_participants(scrim_id);

ALTER TABLE clan_scrim_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clan_scrim_participants_select" ON clan_scrim_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clan_scrims s
      JOIN clan_members cm ON cm.clan_id = s.clan_id
      WHERE s.id = clan_scrim_participants.scrim_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "clan_scrim_participants_insert" ON clan_scrim_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM clan_scrims s
      JOIN clan_members cm ON cm.clan_id = s.clan_id
      WHERE s.id = clan_scrim_participants.scrim_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "clan_scrim_participants_update" ON clan_scrim_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clan_scrim_participants_delete" ON clan_scrim_participants
  FOR DELETE USING (auth.uid() = user_id);
-- Fix FK references: change auth.users(id) -> profiles(id) so PostgREST can join profiles

-- 1. clan_wall_posts.user_id
ALTER TABLE clan_wall_posts DROP CONSTRAINT IF EXISTS clan_wall_posts_user_id_fkey;
ALTER TABLE clan_wall_posts ADD CONSTRAINT clan_wall_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. clan_mission_contributions.user_id
ALTER TABLE clan_mission_contributions DROP CONSTRAINT IF EXISTS clan_mission_contributions_user_id_fkey;
ALTER TABLE clan_mission_contributions ADD CONSTRAINT clan_mission_contributions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. clan_scrims.created_by
ALTER TABLE clan_scrims DROP CONSTRAINT IF EXISTS clan_scrims_created_by_fkey;
ALTER TABLE clan_scrims ADD CONSTRAINT clan_scrims_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. clan_scrim_participants.user_id
ALTER TABLE clan_scrim_participants DROP CONSTRAINT IF EXISTS clan_scrim_participants_user_id_fkey;
ALTER TABLE clan_scrim_participants ADD CONSTRAINT clan_scrim_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- Deactivate sources that are NOT about our 3 games (Valorant, BGMI, Free Fire)
UPDATE news_sources SET is_active = false WHERE slug IN ('hltv', 'coc-blog');

-- Fix Sportskeeda PUBG Mobile → BGMI
UPDATE news_sources SET game_slug = 'bgmi' WHERE slug = 'sportskeeda-pubg';

-- Add more India-focused sources for our 3 games
INSERT INTO public.news_sources (name, slug, source_type, url, game_slug, region, fetch_interval_minutes, config) VALUES
  ('Sportskeeda Valorant', 'sportskeeda-valorant', 'rss', 'https://www.sportskeeda.com/valorant/feed', 'valorant', 'india', 60, '{}'),
  ('Sportskeeda BGMI', 'sportskeeda-bgmi', 'rss', 'https://www.sportskeeda.com/bgmi/feed', 'bgmi', 'india', 60, '{}')
ON CONFLICT (slug) DO NOTHING;
-- Page views tracking for admin analytics dashboard
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for efficient aggregation queries
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_user_id ON page_views(user_id) WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (tracks anonymous + authenticated visitors)
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Only admins can read page views
CREATE POLICY "Admins can read page views"
  ON page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Function: get daily page views aggregated by date
CREATE OR REPLACE FUNCTION get_daily_page_views(days_back INT DEFAULT 30)
RETURNS TABLE(date DATE, total_views BIGINT, unique_visitors BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    created_at::date AS date,
    COUNT(*) AS total_views,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) AS unique_visitors
  FROM page_views
  WHERE created_at >= (NOW() - (days_back || ' days')::interval)
  GROUP BY created_at::date
  ORDER BY date ASC;
$$;

-- Function: get top pages by view count
CREATE OR REPLACE FUNCTION get_top_pages(days_back INT DEFAULT 30, page_limit INT DEFAULT 10)
RETURNS TABLE(path TEXT, view_count BIGINT, unique_count BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    page_views.path,
    COUNT(*) AS view_count,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) AS unique_count
  FROM page_views
  WHERE created_at >= (NOW() - (days_back || ' days')::interval)
  GROUP BY page_views.path
  ORDER BY view_count DESC
  LIMIT page_limit;
$$;
