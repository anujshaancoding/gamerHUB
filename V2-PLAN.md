# ggLobby V2 — Valorant-Only Rebuild Plan

> This folder (`gglobby-v2`) is a copy-and-strip of V1. V1 stays running untouched
> in `../gamer hub` until V2 ships. Fresh git history starts here.

## North Star

**Content is the acquisition engine. The giveaway + loyalty leaderboard is the
conversion/retention engine layered on top of it. Community/LFG is Phase 3.**

A stranger who has never heard of ggLobby finds us via Google ("valorant viper
lineups ascent", "jett guide", "best crosshair valorant", "valorant patch tier
list"), gets standalone value with zero other users present, then converts into
an account because of the monthly giveaway, loyalty leaderboard, and a shareable
rank card. We do not launch a network. We launch a Valorant content + utility
site that quietly collects the data the network will later need.

## Scope: Valorant ONLY

No mention of BGMI, Free Fire, "other games", or multi-game anything — anywhere
in UI, copy, metadata, or onboarding. Keystone file: `src/lib/constants/games.ts`
reduced to a single Valorant entry; TypeScript surfaces the rest.

## Information Architecture (SEO-first — every page targets a real search)

```
/                     Valorant-only landing (content-led + giveaway hook)
/agents               All agents grid
/agents/[agent]       Per-agent: every ability explained in detail, tips, synergies
/maps                 All active-pool maps grid
/maps/[map]           Callouts (interactive minimap) + lineups index
/maps/[map]/lineups   Per-agent / per-side lineup sets (FLAGSHIP — highest intent)
/patch                Patch hub
/patch/[version]      Patch breakdown + updated agent/map tier list
/tier-list            Current meta tier list (agents, maps) — updated per patch
/pros                 Indian pro settings + crosshair + gear database
/pros/[player]        Individual pro page
/crosshairs           Crosshair database (filter by pro/team, 1-click copy)
/tools                Valorant-only tools hub (sens converter, FOV, rank %ile)
/tools/[tool]         Individual tool (each indexable, no login)
/blog                 Valorant-only blog
/blog/[slug]          Article
/forum                Valorant-only forum
/giveaway             Current monthly giveaway + how to earn entries
/leaderboard          Loyalty leaderboard (entries / points)
/u/[username]         Profile (rank card source; minimal until Phase 3)
/login /register /onboarding   Auth (Valorant-only onboarding)
```

Hundreds of indexable, high-intent pages = the distribution engine.

## Strip Manifest

**Collapse to Valorant (keystone):**
- `src/lib/constants/games.ts` → single Valorant entry only.

**Delete / remove from nav + routes (other-game or off-strategy):**
- All BGMI / Free Fire / "Other" game references, icons, rank tables, role sets.

**Freeze (keep code, remove from nav, no maintenance — Phase 3):**
- clans, friends, messages, find-gamers/LFG, community feed, friend-posts,
  battle-pass, cosmetics economy (frames/themes/titles/music/easter eggs), quests.

**Keep + rebuild with content depth:**
- Blog (Valorant-only + patch loop), Pro Scene → pros/crosshairs/gear DB,
  Tools (Valorant-only), Forum (Valorant-only), Onboarding (Valorant-only),
  landing page, OG image route (→ shareable rank card), newsletter capture.

**Build new:**
- /agents, /maps + callouts/lineups (flagship), /patch, /tier-list,
  /giveaway, /leaderboard, loyalty-points system.

## Event Mechanic: Monthly Giveaway / Raffle (NOT tournament)

Works at N=0 — no other players required. Tasks earn loyalty points/entries:
- Sign up, link Valorant, daily login (low weight)
- **Refer a friend** (high weight — viral)
- **Share your rank card** (high weight — viral)
Leaderboard ranks entrants; monthly draw weighted by entries. Prize: one skin /
VP / gift card (~Rs.500–1000). Referral + share are the acquisition tasks.

## Distribution (answers "how does anyone know ggLobby exists")

1. **SEO** (primary): agent guides, map lineups, crosshair DB, patch tier lists.
   Slow (3–6 mo), compounding, free, founder-executable.
2. **Shareable rank card** ("Valorant Wrapped"): users distribute us for free.
3. **Discord bot** (Phase 2): patch notes + rank check + giveaway entries inside
   other people's existing servers.
4. **Founder-led seeding**: share genuinely useful tool/lineup pages into Indian
   Valorant Discords / r/ValorantCompetitive — not a network pitch.
5. **Named Valorant accounts** ("…gglobby"): free flavor, low ceiling.
6. **Newsletter capture** on content pages: convert one-time Google traffic into
   an owned channel.

## Build Order

1. ✅ Scaffold V2 folder
2. ✅ Define IA + this plan
3. ✅ Keystone strip: games.ts → Valorant-only (shipping type errors fixed;
   a systemic inherited V1 db-client typing issue remains in
   frozen/non-shipping code — see RELEASE-CHECKLIST.md, not a launch gate)
4. ✅ Nav + routes strip — out-of-scope V1 cruft (coaching/creator/
   matchmaking/sponsorships/replay-rooms + discord/crossplay/console
   integration) deleted; routes moved to top-level SEO paths (/pros,
   /crosshairs, /tier-list) with 308 redirects; Phase-3 social
   (friends/messages/community/clans/find-gamers) removed from all nav
   surfaces + RightSidebar unmounted (code frozen, not deleted).
5. ✅ Valorant-only onboarding + landing
6. ✅ Agent guide pages
7. ✅ Map callouts + lineups (flagship)
8. ✅ Blog Valorant-only + patch loop — patch hub built: /patch +
   /patch/[version], data-driven (src/lib/data/valorant-patches.ts),
   with integrated meta tier list. Refresh patch data each Riot patch.
9. ✅ Pros/crosshairs/tools/forum rebuild with depth
10. ✅ Loyalty points + giveaway + shareable rank card

See **RELEASE-CHECKLIST.md** for the deploy/SEO cutover steps and the
tracked non-blocking follow-ups.

Inspiration for visual depth (not design-system rewrite — system is solid):
tracker.gg, mobalytics.gg, blitz.gg, prosettings.net, THESPIKE.gg, vlr.gg.
