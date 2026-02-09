// Shop & Wallet Types for Mobile App
export interface ShopItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  item_type: 'title' | 'frame' | 'theme' | 'badge' | 'currency_pack' | 'battle_pass';
  price_coins: number | null;
  price_gems: number | null;
  price_real: number | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon_url: string | null;
  preview_url: string | null;
  is_featured: boolean;
  is_limited: boolean;
  available_from: string | null;
  available_until: string | null;
  stock: number | null;
  sold_count: number;
  created_at: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  coins: number;
  gems: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'earn' | 'spend' | 'purchase' | 'refund' | 'gift';
  currency: 'coins' | 'gems' | 'real';
  amount: number;
  balance_after: number;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface CurrencyPack {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  currency_type: 'coins' | 'gems';
  amount: number;
  bonus_amount: number;
  price_usd: number;
  icon_url: string | null;
  is_featured: boolean;
  discount_percentage: number | null;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  price_paid: number;
  currency_used: 'coins' | 'gems' | 'real';
  purchased_at: string;
  item?: ShopItem;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_featured: boolean;
}
