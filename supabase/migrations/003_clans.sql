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
