// Client-safe loyalty constants & types. NO node imports here so this can be
// imported from client components. Server-only fs store lives in loyalty.ts.

export type LoyaltyAction =
  | "signup"
  | "daily_login"
  | "link_valorant"
  | "share_rank_card"
  | "refer";

export const ACTION_POINTS: Record<LoyaltyAction, number> = {
  signup: 10,
  daily_login: 5,
  link_valorant: 25,
  share_rank_card: 15,
  refer: 30,
};

export const ACTION_LABEL: Record<LoyaltyAction, string> = {
  signup: "Created profile",
  daily_login: "Daily check-in",
  link_valorant: "Linked Valorant account",
  share_rank_card: "Shared rank card",
  refer: "Referred a friend",
};

/** One-time actions can only ever be awarded once per user. */
export const ONE_TIME: LoyaltyAction[] = ["signup", "link_valorant"];

export interface LoyaltyEvent {
  action: LoyaltyAction;
  points: number;
  at: string;
  /** Idempotency key, e.g. "daily_login:2026-05-17" or "refer:<userId>". */
  key: string;
}

export interface LoyaltyRecord {
  userId: string;
  name: string;
  image?: string | null;
  points: number;
  events: LoyaltyEvent[];
  referralCode: string;
  referredBy?: string;
  updatedAt: string;
}

export const TIERS = [
  { name: "Bronze", min: 0, color: "#cd7f32" },
  { name: "Silver", min: 50, color: "#c0c0c0" },
  { name: "Gold", min: 120, color: "#ffd166" },
  { name: "Platinum", min: 250, color: "#2bd9fe" },
  { name: "Radiant", min: 500, color: "#00ff88" },
] as const;

export function tierFor(points: number) {
  let t: { name: string; min: number; color: string } = TIERS[0];
  for (const tier of TIERS) if (points >= tier.min) t = tier;
  const next = TIERS.find((x) => x.min > points);
  return { ...t, next: next ?? null };
}
