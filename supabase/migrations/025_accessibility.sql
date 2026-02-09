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
