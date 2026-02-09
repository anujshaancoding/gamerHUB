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
