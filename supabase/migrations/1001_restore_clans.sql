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
