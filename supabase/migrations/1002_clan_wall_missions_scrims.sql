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
