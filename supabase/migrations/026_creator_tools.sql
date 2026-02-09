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
