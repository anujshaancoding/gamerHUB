// ggLobby V2 — India Valorant scene ladder. Curated list of semi-pro,
// amateur and content-creator names below the /pros tier-1 ranking. Static
// (no DB) so admin edits = code edits, fast to iterate.
//
// Verified against vlr.gg + Liquipedia VCL South Asia 2026 Split 1, as of
// May 2026. Semi-pros are the VCSA Split 1 mid-table rosters; amateurs are
// notable open-bracket talent; creators are India's biggest Valorant-focused
// streamers and YouTubers.
//
// Voting for "next to go pro" is local-only (localStorage) — see
// src/lib/scene/votes.ts. Promote to a real DB table when traffic warrants.

export type SceneTier = "semi-pro" | "amateur" | "creator";

export interface SceneRole {
  /** Primary role label, free-form to fit Valorant + creator personas. */
  label: string;
  /** Optional secondary chip — agent pool summary, content niche, etc. */
  detail?: string;
}

export interface SceneTracker {
  /** Display label shown on the chip. */
  label: string;
  /** Full URL — opens in a new tab. */
  url: string;
}

export interface ScenePlayer {
  slug: string;
  ign: string;
  /** Real name when known and public. Optional. */
  real_name?: string;
  tier: SceneTier;
  /** Team / org / collective. Use "Free agent" if unsigned, or org name for creators. */
  org: string;
  /** Short org tag for compact rendering, e.g. "VLT", "GE", "REV". */
  org_short?: string;
  role: SceneRole;
  /** Peak competitive rank, e.g. "Radiant", "Immortal 3". */
  peak_rank?: string;
  /** Indian state / city — keeps the "from where" angle visible. */
  hometown?: string;
  age?: number;
  /** One-sentence pitch shown on cards and in profile hero. */
  blurb: string;
  /** Longer-form bio for the profile page. */
  bio?: string;
  /** External trackers — tracker.gg, vlr.gg, blitz, etc. */
  trackers: SceneTracker[];
  socials: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
  };
  /** Highlights — recent placements, milestones, content wins. */
  highlights?: string[];
  /** Pulled into the "next to go pro" voting eligibility filter. */
  eligible_for_promotion?: boolean;
}

export const SCENE_PLAYERS: ScenePlayer[] = [
  // ── Semi-Pro ────────────────────────────────────────────────────────────
  // Verified VCSA 2026 Split 1 mid-table rosters — one step below the
  // S8UL / Revenant XSpark finalists tracked on /pros.

  {
    slug: "gods-reign-roster",
    ign: "Gods Reign",
    tier: "semi-pro",
    org: "Gods Reign",
    org_short: "GR",
    role: { label: "Team", detail: "VCSA 2026 Split 1 · 3rd–4th" },
    peak_rank: "Radiant",
    blurb:
      "Gods Reign locked a top-4 at VCSA 2026 Split 1 — Indian core grinding for the Pacific Ascension slot.",
    trackers: [
      {
        label: "vlr.gg team",
        url: "https://www.vlr.gg/team/gods-reign",
      },
    ],
    socials: { twitter: "GodsReignGG", instagram: "godsreigngg" },
    highlights: [
      "3rd–4th · VCSA 2026 Split 1 ($2,000)",
      "Beat Asterisk in upper bracket Round 1",
    ],
    eligible_for_promotion: true,
  },
  {
    slug: "asterisk-roster",
    ign: "Asterisk",
    tier: "semi-pro",
    org: "Asterisk",
    org_short: "AST",
    role: { label: "Team", detail: "VCSA 2026 Split 1 · 3rd–4th" },
    peak_rank: "Radiant",
    blurb:
      "Asterisk emerged from the qualifier playoffs and matched Gods Reign at 3rd–4th in Split 1.",
    trackers: [
      {
        label: "vlr.gg event",
        url: "https://www.vlr.gg/event/2880/challengers-2026-south-asia-split-1",
      },
    ],
    socials: { twitter: "AsteriskGG" },
    highlights: [
      "3rd–4th · VCSA 2026 Split 1 ($2,000)",
      "Qualified through the open bracket — no invite",
    ],
    eligible_for_promotion: true,
  },
  {
    slug: "xcrew-lightningfast",
    ign: "Lightningfast",
    tier: "semi-pro",
    org: "xCrew Esports",
    org_short: "XCR",
    role: { label: "Duelist" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "Duelist on xCrew's VCSA 2026 Split 1 roster — fast peeks, faster name.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/lightningfast",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },
  {
    slug: "xcrew-hellff",
    ign: "Hellff",
    tier: "semi-pro",
    org: "xCrew Esports",
    org_short: "XCR",
    role: { label: "Initiator" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "Initiator on xCrew — pairs with Lightningfast for set-piece execs.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/hellff",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },
  {
    slug: "xcrew-deecee",
    ign: "deecee",
    tier: "semi-pro",
    org: "xCrew Esports",
    org_short: "XCR",
    role: { label: "Sentinel" },
    peak_rank: "Immortal 3",
    hometown: "India",
    blurb:
      "Anchor on xCrew — quiet sentinel setups, consistent retake numbers.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/deecee",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },

  // ── Amateur ─────────────────────────────────────────────────────────────
  // Full-Indian VCSA Split 1 rosters that fell out earlier — strong
  // open-bracket talent worth scouting.

  {
    slug: "leosun-love",
    ign: "LOVE",
    tier: "amateur",
    org: "Leosun Esports",
    org_short: "LSN",
    role: { label: "IGL" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "IGL on Leosun's all-Indian VCSA 2026 roster — building the comp around set executes.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/love",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },
  {
    slug: "leosun-hybr1d",
    ign: "HyBr1D",
    tier: "amateur",
    org: "Leosun Esports",
    org_short: "LSN",
    role: { label: "Duelist" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "Leosun's primary duelist — open-bracket grinder catching scouts' eyes.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/hybr1d",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },
  {
    slug: "leosun-acestar",
    ign: "AceStaRRRRR",
    tier: "amateur",
    org: "Leosun Esports",
    org_short: "LSN",
    role: { label: "Initiator" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "Loud handle, louder utility — Leosun's initiator running Sova and Fade.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/acestar",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },
  {
    slug: "rad-paradox",
    ign: "Paradox",
    tier: "amateur",
    org: "The Rad Syndicate",
    org_short: "TRS",
    role: { label: "Flex" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "Captain of TRS — all-Indian VCSA 2026 roster making noise in the qualifier circuit.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/paradox",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },
  {
    slug: "rad-tricky",
    ign: "tricky",
    tier: "amateur",
    org: "The Rad Syndicate",
    org_short: "TRS",
    role: { label: "Duelist" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "Entry duelist on TRS — name fits the playstyle.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/tricky",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },
  {
    slug: "rad-deadly10",
    ign: "Deadly10",
    tier: "amateur",
    org: "The Rad Syndicate",
    org_short: "TRS",
    role: { label: "Sentinel" },
    peak_rank: "Radiant",
    hometown: "India",
    blurb:
      "Anchor on TRS — sentinel + clutch numbers worth tracking out of the open bracket.",
    trackers: [
      {
        label: "vlr.gg",
        url: "https://www.vlr.gg/player/deadly10",
      },
    ],
    socials: {},
    eligible_for_promotion: true,
  },

  // ── Content Creators ────────────────────────────────────────────────────
  // India's biggest Valorant-focused streamers and YouTubers. Subscriber
  // numbers verified May 2026.

  {
    slug: "payal-gaming",
    ign: "Payal Gaming",
    real_name: "Payal Dhare",
    tier: "creator",
    org: "S8UL Esports",
    org_short: "S8UL",
    role: { label: "Streamer", detail: "BGMI + Valorant · S8UL" },
    peak_rank: "Immortal 3",
    hometown: "Indore, MP",
    blurb:
      "Face of women in Indian esports — 4.55M YouTube subs, streams Valorant and BGMI under S8UL.",
    bio:
      "Payal Dhare is the most-followed female gaming creator in India. She joined S8UL in 2022 and has since become a co-mentor for the org's female-creator track, hosting 'Girls-Only' bootcamps alongside her Valorant and BGMI streams.",
    trackers: [
      {
        label: "YouTube",
        url: "https://youtube.com/@PayalGaming",
      },
    ],
    socials: { youtube: "PayalGaming", instagram: "payaldhare", twitter: "PayalGamingX" },
    highlights: [
      "4.55M+ YouTube subscribers, 483M+ total views",
      "Signed to S8UL Esports (Mortal, Thug, Goldy's org)",
      "Hosts S8UL's Girls-Only Valorant bootcamps",
    ],
    eligible_for_promotion: false,
  },
  {
    slug: "mortal",
    ign: "MortaL",
    real_name: "Naman Mathur",
    tier: "creator",
    org: "S8UL Esports",
    org_short: "S8UL",
    role: { label: "Streamer", detail: "BGMI + Valorant · S8UL co-founder" },
    hometown: "Mumbai, MH",
    blurb:
      "7M+ subs, S8UL co-founder. Crosses over to Valorant for collab streams and watch-alongs of SkRossi's matches.",
    bio:
      "Naman Mathur built S8UL with Thug and Goldy and remains one of India's most respected esports figures. While BGMI is his bread and butter, his Valorant watch-alongs and collab streams with the S8UL VCSA roster have made him an entry point for casuals discovering the Indian Valorant scene.",
    trackers: [
      {
        label: "YouTube",
        url: "https://youtube.com/@MortaL04",
      },
    ],
    socials: { youtube: "MortaL04", twitter: "Mortal04", instagram: "ig_mortal" },
    highlights: [
      "7M+ YouTube subscribers",
      "S8UL Esports co-founder — the org SkRossi now competes for",
    ],
    eligible_for_promotion: false,
  },
  {
    slug: "skrossi-stream",
    ign: "SkRossi",
    real_name: "Ganesh Gangadhar",
    tier: "creator",
    org: "S8UL Esports",
    org_short: "S8UL",
    role: { label: "Pro Streamer", detail: "Radiant ranked + VCSA scrims" },
    peak_rank: "Radiant",
    hometown: "Hyderabad, TS",
    age: 28,
    blurb:
      "Doubles as India's most-watched Valorant streamer — Radiant ranked grind plus team scrim VOD reviews.",
    bio:
      "SkRossi's stream is required viewing for any Indian Valorant ranked grinder. Mixes high-elo ranked sessions with scrim reviews and educational breakdowns of S8UL's VCSA runs.",
    trackers: [
      {
        label: "Twitch",
        url: "https://twitch.tv/SkRossi",
      },
      {
        label: "YouTube",
        url: "https://youtube.com/@SkRossi",
      },
    ],
    socials: {
      twitch: "SkRossi",
      youtube: "SkRossi",
      twitter: "SkRossi_",
      instagram: "skrossi_",
    },
    highlights: [
      "VCSA 2026 Split 1 champion (S8UL)",
      "India's most-watched live Valorant channel",
    ],
    eligible_for_promotion: false,
  },
];

export function listSceneByTier(tier: SceneTier): ScenePlayer[] {
  return SCENE_PLAYERS.filter((p) => p.tier === tier);
}

export function getScenePlayer(slug: string): ScenePlayer | undefined {
  return SCENE_PLAYERS.find((p) => p.slug === slug);
}

export const TIER_LABEL: Record<SceneTier, string> = {
  "semi-pro": "Semi-Pro",
  amateur: "Amateur",
  creator: "Creators",
};

export const TIER_BLURB: Record<SceneTier, string> = {
  "semi-pro":
    "VCSA 2026 Split 1 mid-table — one step below S8UL and Revenant XSpark. The next callup pool.",
  amateur:
    "Open-bracket VCSA 2026 talent and all-Indian feeder rosters. Org-hunting and worth scouting.",
  creator:
    "India's biggest Valorant-focused streamers and YouTubers — the front door for the scene.",
};
