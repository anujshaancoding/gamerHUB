-- ============================================
-- 034: TRAIT ENDORSEMENT SYSTEM
-- Replaces star-based peer ratings with
-- binary trait endorsements + private trust engine
-- ============================================

-- ============================================
-- 1A: DROP OLD PEER RATINGS, CREATE TRAIT ENDORSEMENTS
-- ============================================

DROP TABLE IF EXISTS public.peer_ratings CASCADE;

CREATE TABLE public.trait_endorsements (
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

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_peer_rating_change ON peer_ratings;

-- Create new trigger on trait_endorsements
CREATE TRIGGER on_trait_endorsement_change
  AFTER INSERT OR UPDATE ON trait_endorsements
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_score();
