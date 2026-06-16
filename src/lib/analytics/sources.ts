/**
 * Canonical analytics `source` vocabulary.
 *
 * Every discovery surface, signup CTA, and signup provider must use one of these
 * strings so all funnel hooks (cta_click, signup, activation) speak one language
 * and joins/segmentation in the funnel queries stay clean.
 *
 * Add new surfaces HERE first, then reference them from the hook. Do not inline
 * raw strings at call sites.
 */

// ── Signup provider sources (event = 'signup') ──────────────────────────────
export const SIGNUP_SOURCES = {
  email: "email",
  google: "google",
} as const;

// ── Activation sources (event = 'activation' — "found a teammate") ───────────
export const ACTIVATION_SOURCES = {
  lfg_accept: "lfg_accept",
  friend_accept: "friend_accept",
} as const;

// ── Discovery / CTA-click sources (event = 'cta_click') ──────────────────────
// `source` here answers: which surface drove the signup intent + where the CTA was.
export const CTA_SOURCES = {
  /** The auth-gate modal shown when a guest hits a gated feature. */
  gate_modal: "gate_modal",
  /** Top navigation bar sign-up / join button. */
  navbar: "navbar",
  /** Public profile page sign-up prompt. */
  profile_page: "profile_page",
  /** LFG surfaces (squad finder, post detail) sign-up prompt. */
  lfg_surface: "lfg_surface",
  /** Guest clicked "Apply" on an LFG post (action-level gate). */
  lfg_apply: "lfg_apply",
  /** Guest clicked "Add friend" on a gamer card (action-level gate). */
  add_friend: "add_friend",
  /** Community feed sign-up prompt. */
  community_feed: "community_feed",
  /** Guest tried to react/comment/share on a community post (action-level gate). */
  community_react: "community_react",
  /** Rank card / stats card embed CTA. */
  rank_card: "rank_card",
  /** "Save/publish my Valorant rank card to profile" action gate. */
  rank_card_save: "rank_card_save",
  /** "Save my Valorant Passport" action gate. */
  passport_save: "passport_save",
  /** "Download my Valorant Passport PNG" action. */
  passport_download: "passport_download",
  /** "Share my Valorant Passport" action. */
  passport_share: "passport_share",
  /** "Submit my Valorant Passport for weekly feature" action. */
  passport_feature_submit: "passport_feature_submit",
  /** "Save/publish my rank-distribution result" action gate. */
  rank_percentile_save: "rank_percentile_save",
  /** "Save & share my sens setup" action gate. */
  sens_setup_save: "sens_setup_save",
  /** "Best agents for your rank" guide — find-teammates / track CTA. */
  agent_rank_guide: "agent_rank_guide",
  /** Rank Up game-sense tier guide — closing "find teammates / LFG" CTA. */
  rank_up_to_lfg: "rank_up_to_lfg",
  /** Generic inline banner CTA. */
  inline_banner: "inline_banner",
  /** Landing page driven by a share link (?ref= present). */
  share_link_landing: "share_link_landing",
  /** Onboarding referral / invite flow. */
  onboarding_referral: "onboarding_referral",
} as const;

/**
 * Per-tool CTA source builder. Tools (sensitivity converter, crosshair, etc.)
 * each get a namespaced source string `tool_<name>` so we can attribute signups
 * to a specific tool without exploding the enum.
 *
 * @example toolSource("sens_converter") // "tool_sens_converter"
 */
export function toolSource(toolName: string): `tool_${string}` {
  return `tool_${toolName}`;
}

// ── Aggregate of all literal sources (excludes the dynamic tool_<name> set) ──
export const ANALYTICS_SOURCES = {
  ...SIGNUP_SOURCES,
  ...ACTIVATION_SOURCES,
  ...CTA_SOURCES,
} as const;

/** Every non-dynamic source string literal. */
export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[keyof typeof ANALYTICS_SOURCES];

/** CTA-click surface sources (the set valid for the cta_click event). */
export type CtaSource =
  | (typeof CTA_SOURCES)[keyof typeof CTA_SOURCES]
  | `tool_${string}`;

/** The set of funnel event names. */
export const FUNNEL_EVENTS = {
  signup: "signup",
  activation: "activation",
  cta_click: "cta_click",
} as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[keyof typeof FUNNEL_EVENTS];

/** Runtime guard used by the /api/analytics/event endpoint to validate input. */
export function isCtaSource(value: unknown): value is CtaSource {
  if (typeof value !== "string") return false;
  if (value.startsWith("tool_") && value.length > 5) return true;
  return Object.values(CTA_SOURCES).includes(value as never);
}
