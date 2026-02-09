-- Migration: 010_virtual_currency.sql
-- Virtual currency system with wallets, shop items, and transactions

-- ============================================
-- USER WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  coins INT DEFAULT 0 CHECK (coins >= 0), -- free currency (earned)
  gems INT DEFAULT 0 CHECK (gems >= 0), -- premium currency (purchased)
  lifetime_coins_earned BIGINT DEFAULT 0,
  lifetime_gems_purchased BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CURRENCY PACKS FOR PURCHASE
-- ============================================
CREATE TABLE IF NOT EXISTS public.currency_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('gems')),
  amount INT NOT NULL,
  bonus_amount INT DEFAULT 0,
  price_cents INT NOT NULL,
  stripe_price_id VARCHAR(255),
  icon_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP ITEMS (COSMETICS PURCHASABLE WITH CURRENCY)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('title', 'frame', 'theme', 'badge', 'emote', 'avatar_decoration', 'clan_banner', 'xp_boost')),
  item_reference_id UUID, -- FK to titles/frames/themes tables
  price_coins INT,
  price_gems INT,
  original_price_coins INT, -- for sales
  original_price_gems INT,
  icon_url TEXT,
  preview_url TEXT,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  is_limited BOOLEAN DEFAULT false,
  available_until TIMESTAMPTZ,
  max_purchases INT, -- null for unlimited
  current_purchases INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  category VARCHAR(50),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP PURCHASES (USER PURCHASE HISTORY)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shop_items(id) ON DELETE SET NULL,
  item_name VARCHAR(100) NOT NULL, -- denormalized for history
  currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('coins', 'gems', 'real_money')),
  amount_paid INT NOT NULL,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WALLET TRANSACTIONS (AUDIT LOG)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  currency_type VARCHAR(20) NOT NULL CHECK (currency_type IN ('coins', 'gems')),
  amount INT NOT NULL, -- positive for credit, negative for debit
  balance_after INT NOT NULL,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'purchase', 'earn_match', 'earn_quest', 'earn_challenge', 'earn_battle_pass',
    'spend_shop', 'spend_battle_pass', 'refund', 'admin_adjustment', 'gift_received', 'gift_sent', 'daily_bonus'
  )),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_packs_active ON currency_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shop_items_active ON shop_items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shop_items_type ON shop_items(item_type);
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user ON shop_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_item ON shop_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- User Wallets RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallets" ON public.user_wallets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Currency Packs RLS (publicly readable)
ALTER TABLE public.currency_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active currency packs" ON public.currency_packs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage currency packs" ON public.currency_packs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Shop Items RLS (publicly readable)
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shop items" ON public.shop_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage shop items" ON public.shop_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Shop Purchases RLS
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.shop_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases" ON public.shop_purchases
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Wallet Transactions RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions" ON public.wallet_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get or create user wallet
CREATE OR REPLACE FUNCTION get_or_create_wallet(p_user_id UUID)
RETURNS public.user_wallets AS $$
DECLARE
  v_wallet public.user_wallets;
BEGIN
  -- Try to get existing wallet
  SELECT * INTO v_wallet FROM public.user_wallets WHERE user_id = p_user_id;

  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO public.user_wallets (user_id, coins, gems)
    VALUES (p_user_id, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;

  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add currency to wallet
CREATE OR REPLACE FUNCTION add_currency(
  p_user_id UUID,
  p_currency_type VARCHAR(20),
  p_amount INT,
  p_transaction_type VARCHAR(30),
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_wallet public.user_wallets;
  v_new_balance INT;
BEGIN
  -- Get or create wallet
  v_wallet := get_or_create_wallet(p_user_id);

  -- Update wallet
  IF p_currency_type = 'coins' THEN
    UPDATE public.user_wallets
    SET
      coins = coins + p_amount,
      lifetime_coins_earned = CASE WHEN p_amount > 0 THEN lifetime_coins_earned + p_amount ELSE lifetime_coins_earned END,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING coins INTO v_new_balance;
  ELSIF p_currency_type = 'gems' THEN
    UPDATE public.user_wallets
    SET
      gems = gems + p_amount,
      lifetime_gems_purchased = CASE WHEN p_amount > 0 THEN lifetime_gems_purchased + p_amount ELSE lifetime_gems_purchased END,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING gems INTO v_new_balance;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid currency type');
  END IF;

  -- Check for negative balance
  IF v_new_balance < 0 THEN
    -- Rollback by subtracting the amount we added
    IF p_currency_type = 'coins' THEN
      UPDATE public.user_wallets SET coins = coins - p_amount WHERE user_id = p_user_id;
    ELSE
      UPDATE public.user_wallets SET gems = gems - p_amount WHERE user_id = p_user_id;
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Log transaction
  INSERT INTO public.wallet_transactions (
    user_id, currency_type, amount, balance_after, transaction_type, reference_id, description
  ) VALUES (
    p_user_id, p_currency_type, p_amount, v_new_balance, p_transaction_type, p_reference_id, p_description
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purchase shop item
CREATE OR REPLACE FUNCTION purchase_shop_item(
  p_user_id UUID,
  p_item_id UUID,
  p_currency_type VARCHAR(20)
) RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_wallet RECORD;
  v_price INT;
  v_result JSONB;
BEGIN
  -- Get item details
  SELECT * INTO v_item FROM public.shop_items WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  -- Check availability
  IF v_item.is_limited AND v_item.available_until IS NOT NULL AND v_item.available_until < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is no longer available');
  END IF;

  IF v_item.max_purchases IS NOT NULL AND v_item.current_purchases >= v_item.max_purchases THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item is sold out');
  END IF;

  -- Get price
  IF p_currency_type = 'coins' THEN
    v_price := v_item.price_coins;
  ELSIF p_currency_type = 'gems' THEN
    v_price := v_item.price_gems;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid currency type');
  END IF;

  IF v_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item cannot be purchased with this currency');
  END IF;

  -- Check if user already owns this item (for cosmetics)
  IF v_item.item_type IN ('title', 'frame', 'theme') THEN
    -- Check existing purchase
    IF EXISTS (SELECT 1 FROM public.shop_purchases WHERE user_id = p_user_id AND item_id = p_item_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You already own this item');
    END IF;
  END IF;

  -- Deduct currency
  v_result := add_currency(p_user_id, p_currency_type, -v_price, 'spend_shop', p_item_id, 'Purchased: ' || v_item.name);

  IF NOT (v_result->>'success')::boolean THEN
    RETURN v_result;
  END IF;

  -- Record purchase
  INSERT INTO public.shop_purchases (user_id, item_id, item_name, currency_type, amount_paid)
  VALUES (p_user_id, p_item_id, v_item.name, p_currency_type, v_price);

  -- Update item purchase count
  UPDATE public.shop_items
  SET current_purchases = current_purchases + 1
  WHERE id = p_item_id;

  -- TODO: Grant the actual item (title, frame, theme, etc.)

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item.name,
    'item_type', v_item.item_type,
    'amount_paid', v_price,
    'currency_type', p_currency_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- ============================================
-- SEED DATA: Currency Packs
-- ============================================
INSERT INTO public.currency_packs (name, description, currency_type, amount, bonus_amount, price_cents, sort_order)
VALUES
  ('Starter Pack', '100 Gems to get started', 'gems', 100, 0, 99, 1),
  ('Small Bundle', '500 Gems + 50 bonus', 'gems', 500, 50, 499, 2),
  ('Medium Bundle', '1,100 Gems + 150 bonus', 'gems', 1100, 150, 999, 3),
  ('Large Bundle', '2,500 Gems + 500 bonus', 'gems', 2500, 500, 1999, 4),
  ('Mega Bundle', '6,500 Gems + 1,500 bonus', 'gems', 6500, 1500, 4999, 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Shop Items
-- ============================================
INSERT INTO public.shop_items (name, description, item_type, price_coins, price_gems, icon_url, rarity, category)
VALUES
  -- Titles
  ('The Champion', 'A prestigious title for champions', 'title', 5000, 500, NULL, 'epic', 'titles'),
  ('Speed Demon', 'Show off your quick reflexes', 'title', 2000, 200, NULL, 'rare', 'titles'),
  ('Night Owl', 'For those who game late into the night', 'title', 1000, 100, NULL, 'uncommon', 'titles'),

  -- Frames
  ('Neon Edge', 'A glowing neon border', 'frame', 3000, 300, NULL, 'rare', 'frames'),
  ('Golden Crown', 'The mark of royalty', 'frame', NULL, 800, NULL, 'legendary', 'frames'),
  ('Ice Crystal', 'Cool and collected', 'frame', 2500, 250, NULL, 'rare', 'frames'),

  -- Themes
  ('Cyberpunk', 'Futuristic neon colors', 'theme', 4000, 400, NULL, 'epic', 'themes'),
  ('Nature', 'Calming forest greens', 'theme', 1500, 150, NULL, 'uncommon', 'themes'),
  ('Sunset', 'Warm orange gradients', 'theme', 1500, 150, NULL, 'uncommon', 'themes'),

  -- XP Boosts
  ('24h XP Boost (25%)', '+25% XP for 24 hours', 'xp_boost', 500, 50, NULL, 'common', 'boosts'),
  ('7d XP Boost (25%)', '+25% XP for 7 days', 'xp_boost', 2000, 200, NULL, 'uncommon', 'boosts'),
  ('24h XP Boost (50%)', '+50% XP for 24 hours', 'xp_boost', 1000, 100, NULL, 'rare', 'boosts')
ON CONFLICT DO NOTHING;
