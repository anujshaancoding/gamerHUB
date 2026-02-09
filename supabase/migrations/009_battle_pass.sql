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
