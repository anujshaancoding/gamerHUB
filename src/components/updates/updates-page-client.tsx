"use client";

import {
  Sparkles,
  Bug,
  Wrench,
  Rocket,
  Zap,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

type UpdateType = "feature" | "improvement" | "fix" | "security" | "launch" | "performance";

interface UpdateEntry {
  date: string;
  version?: string;
  type: UpdateType;
  title: string;
  description: string;
  highlights?: string[];
}

const typeConfig: Record<UpdateType, { icon: LucideIcon; color: string; label: string; bg: string }> = {
  feature: { icon: Sparkles, color: "text-purple-400", label: "New Feature", bg: "bg-purple-500/10 border-purple-500/20" },
  improvement: { icon: Wrench, color: "text-blue-400", label: "Improvement", bg: "bg-blue-500/10 border-blue-500/20" },
  fix: { icon: Bug, color: "text-orange-400", label: "Bug Fix", bg: "bg-orange-500/10 border-orange-500/20" },
  security: { icon: Shield, color: "text-green-400", label: "Security", bg: "bg-green-500/10 border-green-500/20" },
  launch: { icon: Rocket, color: "text-primary", label: "Launch", bg: "bg-primary/10 border-primary/20" },
  performance: { icon: Zap, color: "text-yellow-400", label: "Performance", bg: "bg-yellow-500/10 border-yellow-500/20" },
};

// All website updates in reverse chronological order
const updates: UpdateEntry[] = [
  {
    date: "2026-06-06T18:00:00",
    version: "1.38.0",
    type: "improvement",
    title: "Clearer consent at sign-up & a cleaner privacy posture",
    description:
      "Creating an account now asks you to agree to the Terms of Service and Privacy Policy up front, and we've removed third-party analytics in favour of our own first-party metrics.",
    highlights: [
      "Sign-up now has a clear checkbox to agree to the Terms of Service and Privacy Policy, with links to both — your agreement and the policy version are recorded",
      "Removed Google Analytics: we now rely only on privacy-friendly first-party analytics, so no third-party cross-site tracking cookies are set",
    ],
  },
  {
    date: "2026-06-05T20:00:00",
    version: "1.37.1",
    type: "fix",
    title: "Clearer sign-in errors for unverified emails",
    description:
      "Signing in with an unverified email now shows a clear message and a one-tap option to resend your verification link, instead of a confusing error.",
    highlights: [
      "Unverified accounts get an actionable 'verify your email' message with a 'Resend verification email' button right on the sign-in form",
      "Sign-in errors are now always shown in plain language — no more cryptic internal error codes",
    ],
  },
  {
    date: "2026-06-05T19:30:00",
    version: "1.37.0",
    type: "feature",
    title: "LFG closes the loop, browse-before-signup & free Valorant tools",
    description:
      "Our biggest update yet: LFG posts now turn into a real conversation and squadmate connection, you can explore the whole site before signing up, a security fix locks down profile data, and a suite of free shareable Valorant tools lands for India players.",
    highlights: [
      // LFG teammate loop
      "Post owners can now expand 'View applicants' and Accept or Decline each applicant right from the card",
      "Accepting a teammate auto-connects you as squadmates and drops a fresh DM straight into your main inbox (not the Void), pre-seeded with a friendly greeting",
      "You now get a notification the moment someone applies to your post, and applicants get notified the instant they're accepted with a one-tap link into the conversation",
      // Security
      "Security: fixed an issue where some private profile fields could be returned to non-owners through the API — only public fields are now exposed to anyone but the profile owner",
      // Browse-before-signup / activation
      "You can now browse profiles, LFG posts, clans and the forum without an account — sign-up is only prompted when you take an action (Apply, Add Friend, react, save)",
      "Sign-up is now just a few fields and you're in; linking your game is optional and can be done later from your profile",
      "Added a referral CTA to onboarding so you can invite friends",
      // Free Valorant tools
      "New Valorant Rank Card maker (/rank-card) — pick your rank and download a clean PNG for Instagram Stories, Discord and WhatsApp, no account needed",
      "Rank percentile tool now has an India layer — see where you stand in the India 2026 Valorant rank distribution, plus a shareable result",
      "New 'Best Agents for Your Rank' guide (/agents/rank-guide) — pick your rank and role, get agent picks with a shareable link and a 'find teammates' CTA",
      "Sensitivity converter now lets you save & share your exact setup with one link (CS2 → Valorant and more)",
    ],
  },
  {
    date: "2026-06-01T15:00:00",
    version: "1.35.0",
    type: "improvement",
    title: "Giveaway: 'Link your Valorant account' now really links it",
    description:
      "The giveaway task now starts the real Riot sign-in flow instead of just ticking a box. The 25 points are only awarded once your Valorant account is genuinely connected.",
    highlights: [
      "Clicking 'Link' on the giveaway page launches the official Riot account connection right there",
      "Points are verified server-side against a real connection — no more free claims",
      "Already linked via Settings → Connections? Clicking 'Link' grants your points instantly",
      "After connecting, you're brought straight back to the giveaway with points applied",
    ],
  },
  {
    date: "2026-05-31T17:00:00",
    version: "1.34.0",
    type: "feature",
    title: "Showcase glow-up: likes, comments, titles & smart uploads",
    description:
      "Your profile Showcase is now social. Like and comment on anyone's clips and screenshots, give your own uploads a title, and drop in big clips without worrying about file size — we compress them for you.",
    highlights: [
      "❤️ Like and 💬 comment on any clip or screenshot — counts show right on the grid",
      "Give your uploads a title and edit it anytime",
      "Clip owners (and admins) can remove comments on their own media",
      "A real upload progress bar, with a 'compressing' step while big clips are processed",
      "Clips from ShadowPlay/OBS/Medal/Game Bar are auto-compressed server-side — big raw uploads just work, with a thumbnail generated for each",
      "Screenshots are compressed to WebP automatically; friendly error messages throughout",
    ],
  },
  {
    date: "2026-05-27T20:30:00",
    version: "1.32.3",
    type: "performance",
    title: "Faster Tier List chips, longer image cache",
    description:
      "Tier List Maker chip images now go through the same image optimizer the rest of the site uses, and optimized images stay cached for 30 days instead of expiring quickly.",
    highlights: [
      "Chip images served as AVIF/WebP at the size they actually render, instead of the full-resolution source",
      "First row of chips loads eagerly with high fetch priority so the tier list paints faster",
      "Optimized image responses cached for 30 days — return visits skip the re-encode entirely",
    ],
  },
  {
    date: "2026-05-27T20:00:00",
    version: "1.32.2",
    type: "fix",
    title: "Forum threads now actually show up",
    description:
      "The Valorant section was showing 'No threads yet' even though 15 threads existed — the database query was silently failing on every page load. Threads, replies and category counts now render correctly.",
    highlights: [
      "Root cause: the query layer was misreading PostgREST-style FK hints (e.g. profiles!last_reply_by) as constraint names instead of column names",
      "Forum landing, category pages and individual threads all benefit — any page that joins related rows is more reliable",
      "Defensive fallback added so the resolver keeps working even if the schema cache loads incomplete data",
    ],
  },
  {
    date: "2026-05-27T18:00:00",
    version: "1.32.1",
    type: "security",
    title: "Hardened password resets + safer rich-text rendering",
    description:
      "Three quiet-but-important security fixes across auth, content rendering and the dev server. Nothing user-visible changes, but the platform is meaningfully harder to abuse.",
    highlights: [
      "Password reset endpoint now rate-limits per email address (2/day) in addition to per-IP — stops mail-bombing a single inbox even when the attacker rotates IPs",
      "Sanitizer blocks javascript:, vbscript:, file: and data:text/html URLs in href/src attributes — closes a stored-XSS vector in user-authored rich text",
      "Outbound links now force rel=\"noopener noreferrer nofollow\" and image data: URIs are restricted to actual image MIME types",
      "Dev-only LAN allowlist no longer applies in production builds — removes a same-subnet bypass on the VPS",
    ],
  },
  {
    date: "2026-05-25T23:30:00",
    version: "1.32.0",
    type: "improvement",
    title: "Player Lookup gets a tracker.gg-style profile",
    description:
      "The Valorant Player Lookup now shows what tracker.gg shows — real Riot player-card avatar, peak rank, region, raw K/D / ACS / KAST / ADR tiles, a per-agent performance table, a recent-matches list and a shot-placement breakdown. Stats also default to the player's current Act with a dropdown to switch.",
    highlights: [
      "Avatar now uses the player's actual Riot card art (the one shown in-game), not the agent portrait",
      "Header shows region, peak rank, total playtime and live win-loss split alongside the current rank",
      "Four big tiles up top — K/D, ACS, KAST, ADR — colour-coded against rank baselines",
      "New Top Agents table: matches, win %, K/D, ADR, ACS and best map per agent",
      "Recent matches list with map, agent, score, K/D/A and ACS per match (last 10)",
      "Shot-placement bars (head / body / legs %) and a role-performance card (Duelist / Controller / Sentinel / Initiator)",
      "Stats default to the current Act with an Act dropdown to scope older windows",
    ],
  },
  {
    date: "2026-05-25T23:00:00",
    version: "1.31.2",
    type: "feature",
    title: "Chats are back — now in the left sidebar",
    description:
      "Direct messages have a permanent home in the main navigation. A new 'Chats' link under the 'You' group opens your conversation list at /messages and shows a live unread badge so you never miss a reply.",
    highlights: [
      "Left sidebar (desktop) and mobile menu both surface the new 'Chats' entry",
      "Red unread-message badge appears beside the link when you have unseen DMs",
      "Existing conversations, message threads and new-conversation modal all work as before — only the entry point changed",
    ],
  },
  {
    date: "2026-05-25T22:00:00",
    version: "1.31.1",
    type: "improvement",
    title: "ggLobby is in public beta — tell us what to fix",
    description:
      "A small BETA badge now sits next to the ggLobby wordmark in the navbar. The site is live but still under active development — use the feedback widget (bottom-right) to flag bugs, rough edges or feature requests; everything routes straight to the team.",
  },
  {
    date: "2026-05-25T21:00:00",
    version: "1.31.0",
    type: "feature",
    title: "Player Lookup — search any Valorant player by Riot ID",
    description:
      "Find Gamers has a new Player Lookup tab. Type any Riot ID (Name#TAG) to see a quick preview card with rank, main agent, recent matches and win rate — click through to a full tracker.gg-style profile with aim, game-sense, role, map, utility and economy insights.",
    highlights: [
      "New 'Player Lookup' tab inside /find-gamers — searches any public Valorant profile, not just ggLobby users",
      "Preview card shows rank, level, main agent, win rate and a one-line takeaway",
      "Clicking the card opens a shareable full profile at /tracker/valorant/<name>/<tag> with detailed insights across all six categories",
      "Reuses live Henrik-3 data with built-in caching — no stale numbers, no separate sign-in",
      "Friendly error states for invalid IDs, private profiles, rate limits and not-found accounts",
    ],
  },
  {
    date: "2026-05-25T19:00:00",
    version: "1.30.0",
    type: "security",
    title: "Hardened auth, real-time chat, payments and signups",
    description:
      "A round of platform-wide security work: real-time messages can no longer be spoofed onto another user's socket, sign-ups now require email verification, the database is moving back behind row-level security, and Stripe webhooks reject stale/replayed deliveries.",
    highlights: [
      "Socket.IO now refuses any connection without a short-lived signed handshake token — the previous setup trusted whatever userId the browser sent, which could leak another user's private messages",
      "Re-enabled Postgres row-level security with role-based policies (app_readonly / app_writer / app_admin) and per-request user context, replacing the broad allow_all that was left over from the Supabase migration",
      "Real email-verification flow: new sign-ups receive a one-time link, the token is stored hashed in the database, and unverified accounts can no longer log in",
      "Added zod input validation to the highest-traffic POST routes — messaging, wall posts, friend posts, comments, reactions, LFG, friends, reports, feedback, password reset and registration",
      "Stripe webhook deliveries now reject anything older than 3 minutes or claiming a future timestamp, and replays of already-processed events are short-circuited",
    ],
  },
  {
    date: "2026-05-24T14:35:00",
    version: "1.29.1",
    type: "fix",
    title: "Find Gamers / LFG tab no longer shows 'Failed to load posts'",
    description:
      "The Looking-For-Group tab was throwing a server error on every load because the 'has open slots' filter was sending an unresolved Promise to the database instead of a number. Now the filter runs correctly and the tab shows real posts (or a friendly empty state).",
    highlights: [
      "Fixed: LFG browse tab loaded with 'Failed to load posts' for everyone — the hasSlots filter is now applied correctly",
      "Fixed: /api/pro-players and /api/suggestions were crashing with 'getUser is not defined' — missing import added back",
    ],
  },
  {
    date: "2026-05-23T17:30:00",
    version: "1.29.0",
    type: "feature",
    title: "India Scene ladder, Tier-1 roster refresh & beginner forum Q&A",
    description:
      "Launched the India Scene ladder — semi-pros, amateurs and creators below the main pros — refreshed the Tier-1 /pros list against the verified VCSA 2026 Split 1 rosters (including SkRossi's move to S8UL), and seeded 15 pinned beginner Q&A threads in the Valorant forum.",
    highlights: [
      "New /scene page with Semi-Pro, Amateur and Creator tiers and individual profile pages",
      "'Next to go pro' community vote leaderboard — one vote per name",
      "/pros now reflects VCSA 2026 Split 1: S8UL Esports (Split 1 champions) and Revenant XSpark featured",
      "SkRossi moved to S8UL — joined by RvK and Yuvi; venka, Hoax and Techno listed on Revenant XSpark",
      "Removed outdated GE/VLT/TR/RE/RVT roster placeholders that no longer reflect the live scene",
      "Creator tier seeded with Payal Gaming (S8UL), MortaL (S8UL) and SkRossi's stream",
      "15 pinned beginner Q&A threads in the Valorant forum — sens, crosshair, ranked, economy, aim, callouts, lineups, smurfs, toxicity, FPS settings, free skins, game modes and more",
      "Each Q&A is its own indexable /forum/valorant/<slug> page targeting a long-tail beginner search",
      "Fixed: Find Gamers and LFG links from the sidebar/nav no longer get bounced to the Agents page — a leftover redirect from when the routes were frozen was removed",
      "Fixed: forum category pages (e.g. /forum/valorant) were stuck on 'No threads yet' because the thread query was erroring server-side — the embed syntax with a space before the join now parses correctly",
    ],
  },
  {
    date: "2026-05-22T11:09:00",
    version: "1.28.0",
    type: "improvement",
    title: "Valorant-only forum and an updated map pool",
    description:
      "The forum now focuses entirely on the Indian Valorant scene, and the Maps page reflects the current V26 Act 3 competitive rotation.",
    highlights: [
      "Removed the old BGMI, Free Fire, Hardware, LFG, Off-topic and Site Feedback forum sections",
      "Discussions now centre on a single Valorant section, alongside official Announcements",
      "Maps page updated to the live V26 Act 3 pool — Breeze, Fracture and Pearl are back in; Bind, Sunset and Abyss have rotated out",
    ],
  },
  {
    date: "2026-05-21T20:00:00",
    version: "1.27.0",
    type: "improvement",
    title: "Community section is back in the navigation",
    description:
      "The Community page is reachable again from the sidebar and the mobile menu, bringing Valorant blogs, tournaments, giveaways and the friend feed back into one place.",
    highlights: [
      "Community added to the sidebar (under 'You') and the mobile navigation menu",
      "Retired the News tab from the Community page — blogs, tournaments/giveaways and the friend feed remain",
    ],
  },
  {
    date: "2026-05-21T18:00:00",
    version: "1.26.0",
    type: "improvement",
    title: "Tier list maker now uses real Valorant artwork",
    description:
      "Every item in the tier list maker now shows real in-game art instead of plain text, and there's a new preset for ranking agent ultimates.",
    highlights: [
      "Agents, weapons and maps presets now display official in-game icons and map art on every chip",
      "New 'Valorant agent ultimates' preset — rank every agent's ultimate by its real ability icon",
      "Updated to the full current roster: all playable agents, every weapon and all 12 maps",
    ],
  },
  {
    date: "2026-05-19T17:00:00",
    version: "1.25.0",
    type: "feature",
    title: "Patch hub + cleaner content URLs",
    description:
      "A new Valorant Patch Hub lands today: every patch broken down into buffs, nerfs and map-pool changes, with the updated meta tier list right alongside it. We also moved the pro database, crosshair gallery and tier list maker to shorter top-level links.",
    highlights: [
      "New Patch Hub at /patch — per-patch buff/nerf/rework breakdown with the current meta agent + map tier list, every entry linking to its full guide",
      "Pro player database moved to /pros (was /pro/valorant)",
      "Crosshair gallery moved to /crosshairs, tier list maker to /tier-list",
      "Old links redirect automatically, so any saved or shared URLs still work",
      "Added Patch & Meta, Tier List and Leaderboard to the navigation",
      "Streamlined the navigation around the Valorant content experience — sidebar, top bar and mobile menu are now focused on agents, maps, patch, tools, pros and the giveaway",
    ],
  },
  {
    date: "2026-05-18T18:00:00",
    version: "1.24.0",
    type: "improvement",
    title: "ggLobby is now Valorant-only",
    description:
      "We're sharpening our focus. BGMI and Free Fire have been fully removed across the platform — pages, pro profiles, tools and filters now cover Valorant exclusively, so everything you see is built and curated for one game done well.",
    highlights: [
      "Removed BGMI and Free Fire pro pages, player profiles and the head-to-head compare entries",
      "Pro Scene, news, blog and forum filters are now Valorant-focused",
      "Sensitivity converter's mobile tab now covers CODM and PUBG: New State",
      "Added a Legal Disclaimer page (/disclaimer) clarifying VALORANT assets are owned by Riot Games",
      "Streamlined the Friends page — removed the redundant Posts tab; the community feed now lives in one place under Community → Friends",
    ],
  },
  {
    date: "2026-05-14T23:55:00",
    version: "1.23.0",
    type: "improvement",
    title: "Premium is paused — every section unlocked for logged-in users",
    description:
      "We're hiding the Premium tier from navigation while we rework what it should include. Every previously gated feature — reporting, blog publishing, profile-visitor details and more — is now available to all logged-in users for free, and the /premium page has been retired for now.",
  },
  {
    date: "2026-05-14T23:30:00",
    version: "1.22.3",
    type: "improvement",
    title: "Forum activity feed now bumps the freshest threads to the top",
    description:
      "Any new thread, reply or comment in the Forum instantly rises to the top of the right-side activity panel — same vibe as classic discussion boards. Brand-new threads with zero replies also count as activity, so they no longer get buried under older threads that happened to have a stale reply.",
  },
  {
    date: "2026-05-14T22:00:00",
    version: "1.22.2",
    type: "improvement",
    title: "Player Insights paused while we rework data sources",
    description:
      "We've put Player Insights on hold and removed it from the sidebar. The current setup couldn't reliably source real match stats, and we'd rather pause the feature than show numbers we don't trust. The page now shows a brief explainer; we'll bring it back once the data path is solid.",
  },
  {
    date: "2026-05-14T20:00:00",
    version: "1.22.1",
    type: "fix",
    title: "Fixed crash on pro player pages and compare tool",
    description:
      "Resolved a 'Something went wrong' error that appeared on Valorant pro player profiles and on the head-to-head compare view when rendering stats like K/D, ACS, ADR and HS%.",
  },
  {
    date: "2026-05-14T18:00:00",
    version: "1.22.0",
    type: "feature",
    title: "Gamer Tools, Forum, Pick'em, Community Sens Share",
    description:
      "Eight new tools and a full discussion forum. Crosshair gallery pulls every Indian Valorant pro's code into one searchable grid; a community sens-share lets anyone publish their Valorant config; tournament pick'em rides on top of the existing event calendar. The Forum brings sections (Valorant, Hardware, LFG, Off-topic) with threaded replies, upvotes and tags.",
    highlights: [
      "New /forum — discussion board with 8 sections, post types (discussion / question / guide / LFG), nested replies, upvote/downvote, view counts",
      "New /tools hub linking every utility — sens converter, FOV calc, crosshair gallery, sens share, monitor guide, rank percentile, tier list maker, skin estimator, pick'em",
      "FOV calculator at /tools/fov — converts FOV between Valorant, CS2, Apex, COD, Fortnite, R6, OW2 and more (handles Hor+, Vert-, 4:3 stretched, ultrawide)",
      "Pro crosshair gallery at /crosshairs — every Indian Valorant pro's crosshair code with one-click copy, filterable by role",
      "Community sens share at /tools/sens-share — publish your full Valorant/CODM/Apex/CS2 sens, upvote configs, copy with one tap",
      "Monitor & Hz guide at /tools/monitor — refresh-rate frametime table, response time vs input lag, viewing-distance calculator",
      "Rank percentile estimator at /tools/rank-percentile — see what % of the ranked playerbase you're above (Valorant)",
      "Tier list maker at /tier-list — drag-and-drop S/A/B/C/D builder with Valorant agents and Indian pros presets",
      "Valorant skin estimator at /tools/skin-estimator — count your skins by tier and see the rough VP / INR / USD total",
      "Tournament Pick'em on every upcoming /pro/events tournament — predict every match, climb the live leaderboard (+3 pt bonus for finals winner)",
    ],
  },
  {
    date: "2026-05-12T18:00:00",
    version: "1.21.0",
    type: "feature",
    title: "Pro Scene India: Rankings, Gear, Tournaments, Compare & Sens Converter",
    description:
      "A brand new section dedicated to India's competitive Valorant scene. Browse the national ranking, drill into each player's career stats and full setup, jump into the tournament calendar, settle debates with the head-to-head compare tool, move your aim between games with the sensitivity converter, and follow your favourite pros so they show up on your dashboard.",
    highlights: [
      "New /pro section with national ranking tables for Indian Valorant pros",
      "Valorant player pages: K/D, ACS, ADR, HS%, agent pool with pick & win rates, full PC rig + peripherals, one-click crosshair-code copy",
      "Tournament calendar at /pro/events — VCT Challengers SA and more, with dates, prize pools, venues, official streams",
      "Compare tool at /pro/compare — pick any two same-game pros and see stats + gear head-to-head, with the winning side highlighted on each row",
      "Sensitivity converter at /pro/sens-converter — exact PC math for Valorant ↔ CS2 ↔ Apex ↔ Overwatch 2 ↔ R6 ↔ The Finals, plus mobile CODM ↔ PUBG: New State approximations and cm/360° + eDPI",
      "Follow your favourite pros from any player page — a Player of the Week and your followed pros now appear on your dashboard",
      "Amazon India 'Buy on Amazon' links next to each peripheral on every gear card",
      "Verified socials (X, Instagram, YouTube, Twitch) on every player page",
    ],
  },
  {
    date: "2026-05-10T16:00:00",
    version: "1.20.1",
    type: "fix",
    title: "Profile Activity: Smarter Empty States",
    description: "The profile's Usually Online card now auto-derives your typical play window from your recent activity instead of showing blank --:-- placeholders, and the Monthly Trend chart waits until you have at least two months of activity before drawing a (otherwise misleading) line.",
    highlights: [
      "Usually Online card auto-fills from your real first/last seen times once you have a few active days — no manual setup needed",
      "Monthly Trend now shows a 'trend takes shape over time' message for new accounts instead of a flat-zero line",
    ],
  },
  {
    date: "2026-05-09T18:00:00",
    version: "1.20.0",
    type: "feature",
    title: "Player Insights Tracker + Blog SEO Overhaul",
    description: "New multi-game stat tracker that turns raw numbers into a plain-English breakdown of your strengths, weaknesses, and what to practice next — plus a major SEO overhaul of the blog with canonical slug URLs, dynamic social preview images, an RSS feed, and explicit allow-listing for AI search crawlers.",
    highlights: [
      "Player Insights (Beta) at /tracker — Valorant and CS2 via API lookup, all with personalized recommendations",
      "Blog posts now live at /blog/{slug} as the canonical URL — old /community/post/{id} links permanently redirect, so shared and indexed links keep working",
      "Dynamic OG images for every blog post — richer link previews when shared on WhatsApp, X, Discord, and other socials",
      "RSS feed at /blog/rss.xml so readers can follow the blog in their favorite reader",
      "robots.txt now explicitly welcomes AI search crawlers (ChatGPT, Claude, Perplexity, Google AI Overviews, Apple, Meta) so blog content can be cited in AI answers",
      "Fixed share-card downloads getting canceled on some browsers — multi-card downloads now save reliably",
      "Friendlier not-found page for blog posts that have been deleted or unpublished",
    ],
  },
  {
    date: "2026-04-22T12:00:00",
    version: "1.19.1",
    type: "fix",
    title: "Blog View Counter Fixed",
    description: "Blog post view counts were stuck and no longer incrementing. The increment call had been silently rejected by the API proxy since the recent security hardening — view counts now update correctly when posts are read.",
  },
  {
    date: "2026-04-12T20:00:00",
    version: "1.19.0",
    type: "feature",
    title: "Shareable GG Cards",
    description: "Generate a stunning, personalized gamer identity card from your profile and share it on social media.",
    highlights: [
      "One-click GG Card generation from your profile — shows your avatar, rank, stats, XP, clan, and QR code",
      "Download as PNG (optimized for Instagram Stories) or share directly to WhatsApp, X, Telegram, and more",
      "Rich link previews when sharing your profile on social media with dynamic OG images",
    ],
  },
  {
    date: "2026-04-12T14:00:00",
    version: "1.18.1",
    type: "fix",
    title: "Activity Calendar Fixed & Loading Improvements",
    description: "Fixed the profile activity calendar that had been showing all zeros since late February, and added loading skeletons and not-found pages across the platform.",
    highlights: [
      "Fixed activity tracking: heartbeat was silently failing — activity calendar and streak stats now work correctly",
      "Added loading skeletons for LFG, News, Help, Notifications, Premium, Search, Settings, Updates, and more",
      "Added proper not-found pages for profiles, community posts, news articles, and clans",
    ],
  },
  {
    date: "2026-03-30T18:00:00",
    version: "1.18.0",
    type: "feature",
    title: "Conversion Improvements & Platform Enhancements",
    description: "Multiple improvements to increase visitor-to-user conversion and enhance the overall user experience.",
    highlights: [
      "Guest visitors now see up to 15 community posts (up from 4) for a better first impression",
      "Improved blog post signup CTA: engaging call-to-action replaces minimal sign-in link",
      "Onboarding steps 2 & 3 are now skippable — users can jump straight to the community",
    ],
  },
  {
    date: "2026-03-22T22:00:00",
    version: "1.17.1",
    type: "security",
    title: "Full-Stack Security Audit, SEO Fixes & Performance Hardening",
    description: "Comprehensive security and SEO audit across the entire platform. Fixed critical homepage SEO issue, hardened API endpoints, added rate limiting to public routes, and opened public pages to guest visitors.",
    highlights: [
      "Fixed critical SEO issue: homepage now serves real landing page content to search engines instead of a loading spinner",
      "Added rate limiting to newsletter subscribe and username check endpoints to prevent abuse",
      "Created pagination bounds utility — API routes now cap limit/offset to prevent DoS via unbounded queries",
      "Blog, Updates, Help, Privacy, Terms, and Guidelines pages now accessible to guest visitors without auth gate",
      "Sitemap cleaned up: removed auth pages, added /updates page",
      "URL validation added to feedback API to prevent stored XSS via malicious URLs",
      "Homepage converted from client-side redirect to server-side for crawler compatibility",
      "Added skeleton loading screens for Community, Profile, Messages, Blog, Clans, and Find Gamers pages",
      "Added preconnect/dns-prefetch hints for Google Fonts, Google Tag Manager, DiceBear, and Discord CDN",
    ],
  },
  {
    date: "2026-03-22T18:00:00",
    version: "1.17.0",
    type: "improvement",
    title: "New Landing Page, SEO Overhaul & Blog Revamp",
    description: "Rebuilt the landing page with a premium design to convert visitors into users. Created a dedicated SEO-friendly blog page, improved navigation for guests, added newsletter signup, and fixed sitemap/robots.txt for better search engine visibility.",
    highlights: [
      "New premium landing page with animated hero, social proof, game badges, and newsletter signup",
      "Dedicated /blog page with category filters, search, and responsive card grid — no more redirect",
      "Navbar now shows Blog, Find Gamers, and Community links to guest visitors",
      "Sitemap now includes /overview, /blog, and all blog post slug URLs for SEO",
      "Added /lfg redirect to /find-gamers for common URL pattern",
      "Newsletter email capture on both landing page and blog page",
      "Logged-out users now land on the feature-rich overview page instead of an empty dashboard",
    ],
  },
  {
    date: "2026-03-20T18:00:00",
    version: "1.16.1",
    type: "fix",
    title: "Profile Page Crash Fix & Monochrome Theme Contrast",
    description: "Fixed a critical bug that prevented profile pages from loading, and resolved text visibility issues on the Monochrome theme across multiple components.",
    highlights: [
      "Fixed profile page crash caused by a variable initialization error",
      "Fixed invisible button/text on Monochrome theme across PWA install prompt, feedback widget, chat, medals, and more",
      "Hardened the online gamers API to prevent crashes from unexpected responses",
    ],
  },
  {
    date: "2026-03-16T18:00:00",
    version: "1.16.0",
    type: "feature",
    title: "Looking For Group (LFG) & Infrastructure Cleanup",
    description: "Find teammates faster with the new LFG system integrated into the Find Gamers page. Create posts specifying your game, region, and play style to find the right squad. Also migrated all legacy image URLs to our self-hosted infrastructure for better reliability.",
    highlights: [
      "New 'Looking For Group' tab on the Find Gamers page — create and browse LFG posts",
      "Filter LFG posts by game, region, and play style",
      "Apply to join other players' LFG posts",
      "Migrated all avatar and banner images to self-hosted storage for faster loading",
    ],
  },
  {
    date: "2026-03-11T18:00:00",
    version: "1.15.0",
    type: "feature",
    title: "Real-Time Post Interactions & Notifications",
    description: "Like and comment counts on friend posts now update instantly without needing to refresh the page. You'll also receive in-app notifications when someone likes or comments on your posts.",
    highlights: [
      "Instant like and comment count updates with optimistic UI",
      "New in-app notifications for post likes and comments",
      "Delete button on posts now correctly shows only for your own posts",
    ],
  },
  {
    date: "2026-03-09T18:00:00",
    version: "1.14.1",
    type: "improvement",
    title: "Blog Game Filter Updated",
    description: "The game filter in the blog section now focuses on our core title: Valorant.",
  },
  {
    date: "2026-03-07T22:00:00",
    version: "1.14.0",
    type: "feature",
    title: "Advanced Search & Filters for Community",
    description: "All community sections now have powerful search and filter capabilities to help you find exactly what you're looking for.",
    highlights: [
      "News tab: Search by title, filter by game, category, region, and featured status, plus sort by newest or most viewed",
      "Blog tab: Search posts, filter by game, category, and featured status",
      "Tournaments & Giveaways tab: Search listings, filter by game and status (active/completed/cancelled)",
      "Friends tab: Search posts by content or username with real-time filtering",
      "Reusable filter bar with expandable panel, active filter chips, and clear-all functionality",
      "Fully responsive design — filters work beautifully on mobile, tablet, and desktop",
    ],
  },
  {
    date: "2026-03-07T20:00:00",
    version: "1.13.0",
    type: "improvement",
    title: "Blog & Community Consolidation",
    description: "Blog posts now live entirely within the Community section with full SEO support, improved editing flow, and better author controls.",
    highlights: [
      "Blog posts are now fully integrated into the Community section — no more separate /blog page",
      "Full SEO metadata and JSON-LD structured data on every community blog post for better Google indexing",
      "Edit and delete your own posts directly from the community post page via the action bar",
      "Featured image upload added to the blog editor — upload images directly instead of only pasting URLs",
      "Old /blog links automatically redirect to the correct community post page",
    ],
  },
  {
    date: "2026-03-06T20:00:00",
    version: "1.11.1",
    type: "fix",
    title: "Feedback Widget Fix",
    description: "Fixed an issue where feedback submitted via the widget was not appearing in the system. Feedback now saves and displays correctly.",
  },
  {
    date: "2026-03-06T18:00:00",
    version: "1.11.0",
    type: "feature",
    title: "Online Gamers Discovery, Username Changes & Responsive Improvements",
    description: "New online gamers discovery, username change support on profile edit, and responsive layout improvements across multiple pages.",
    highlights: [
      "New 'Online Gamers' section at the top of Find Gamers page",
      "Shows 3 online gamers initially with a 'Load More' option",
      "Excludes friends and private profiles, refreshes every 30 seconds",
      "Username can now be changed on profile edit page with availability check and 14-day cooldown",
      "Improved responsive layouts on dashboard, blog, friends, news, premium, and write pages",
    ],
  },
  {
    date: "2026-03-05T12:00:00",
    version: "1.9.0",
    type: "feature",
    title: "Developer Documentation & Project Setup",
    description: "Comprehensive developer documentation added for onboarding and AI-assisted development.",
    highlights: [
      "DEVELOPER.md knowledge-transfer document for new contributors",
      "CLAUDE.md project instructions for AI-assisted development",
    ],
  },
  {
    date: "2026-03-04T18:00:00",
    version: "1.8.0",
    type: "feature",
    title: "Website Updates Page & URL-Synced Community Tabs",
    description: "Added a dedicated updates page to track all platform changes. Community tabs now update the URL so you can share and bookmark specific tabs. Activity feed items now link directly to the relevant content.",
    highlights: [
      "New Updates page to track platform changelog",
      "Community tab selection syncs with URL (?tab=blog, ?tab=tournaments, etc.)",
      "Activity feed items link directly to blog posts, news articles, and friend posts",
    ],
  },
  {
    date: "2026-03-01T14:00:00",
    version: "1.7.0",
    type: "feature",
    title: "Dynamic OG Card Images for Shared Posts",
    description: "When sharing community posts on social media, a beautiful preview card with the post content and author info is now auto-generated.",
    highlights: [
      "Auto-generated OG images for shared friend posts",
      "Author info and post content displayed on social media previews",
    ],
  },
  {
    date: "2026-02-28T12:00:00",
    version: "1.6.0",
    type: "improvement",
    title: "Confirm Delete Dialogs & Community Enhancements",
    description: "Added confirmation dialogs before deleting posts and various improvements across the community section.",
    highlights: [
      "Confirm dialog before deleting friend posts and blog posts",
      "Shared post OG metadata improvements",
      "Community UI polish and fixes",
    ],
  },
  {
    date: "2026-02-25T10:00:00",
    version: "1.5.0",
    type: "feature",
    title: "E2E Test Suite & API Documentation",
    description: "Added comprehensive end-to-end testing and Postman API collection for developers.",
    highlights: [
      "Full E2E test suite for critical user flows",
      "Postman collection with all API endpoints documented",
      "Codebase cleanup and optimization",
    ],
  },
  {
    date: "2026-02-22T09:00:00",
    version: "1.4.1",
    type: "fix",
    title: "Mini-Chat Popup Reload Fix",
    description: "Fixed an issue where the mini-chat popup would unnecessarily reload when switching browser tabs or windows.",
  },
  {
    date: "2026-02-20T16:00:00",
    version: "1.4.0",
    type: "feature",
    title: "Instant Message Notifications via Socket.io",
    description: "Real-time message notifications are now delivered instantly using Socket.io, so you never miss a message from friends.",
    highlights: [
      "Instant push notifications for new messages",
      "Real-time delivery via WebSocket connection",
      "Notification badge updates in real-time",
    ],
  },
  {
    date: "2026-02-15T11:00:00",
    version: "1.3.0",
    type: "feature",
    title: "Tournaments & Giveaways System",
    description: "Create and participate in gaming tournaments and giveaways directly on the platform.",
    highlights: [
      "Create tournaments with entry fees and prize pools",
      "Host giveaways for the community",
      "Game-specific filtering for tournaments",
    ],
  },
  {
    date: "2026-02-10T14:00:00",
    version: "1.2.0",
    type: "feature",
    title: "Blog & News Section",
    description: "Share gaming guides, tips, and stories with the community through the new blog system. Stay updated with curated gaming news.",
    highlights: [
      "Rich text blog editor with image uploads",
      "Game-specific blog categories",
      "Curated gaming news from trusted sources",
    ],
  },
  {
    date: "2026-02-05T10:00:00",
    version: "1.1.0",
    type: "feature",
    title: "Friends & Social Features",
    description: "Follow gamers, send friend requests, and interact with community posts.",
    highlights: [
      "Friend requests and follow system",
      "Community friend posts with likes and comments",
      "Online presence indicators",
    ],
  },
  {
    date: "2026-02-01T09:00:00",
    version: "1.0.0",
    type: "launch",
    title: "ggLobby Beta Launch",
    description: "The initial beta release of ggLobby - India's gaming social platform. Create your profile, discover gamers, and join the community.",
    highlights: [
      "User profiles with gaming stats",
      "Discover gamers by game preferences",
      "Real-time messaging system",
      "Clan creation and management",
      "Premium subscription with exclusive features",
    ],
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function UpdatesPageClient() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">What&apos;s New</h1>
        <p className="text-text-muted mt-1">
          All the latest updates, features, and improvements to ggLobby
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border" />

        <div className="space-y-6">
          {updates.map((update, index) => {
            const config = typeConfig[update.type];
            const Icon = config.icon;

            return (
              <div key={index} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0",
                  config.bg
                )}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                {/* Content */}
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium border",
                        config.bg, config.color
                      )}>
                        {config.label}
                      </span>
                      {update.version && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-surface-light text-text-muted border border-border">
                          v{update.version}
                        </span>
                      )}
                      <span className="text-xs text-text-dim ml-auto">
                        {formatDate(update.date)} at {formatTime(update.date)}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-text mb-1">
                      {update.title}
                    </h3>
                    <p className="text-sm text-text-muted mb-2">
                      {update.description}
                    </p>
                    {update.highlights && update.highlights.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {update.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", config.color.replace("text-", "bg-"))} />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
