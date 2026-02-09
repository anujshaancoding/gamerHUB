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
