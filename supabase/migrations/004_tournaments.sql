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
