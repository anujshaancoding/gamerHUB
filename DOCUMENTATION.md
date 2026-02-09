# GamerHub - Technical & Business Documentation

> **Official Product Document**
> Last Updated: February 2026
> Version: 2.0.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Market Opportunity](#2-problem-statement--market-opportunity)
3. [Product Vision & Strategy](#3-product-vision--strategy)
4. [Technology Stack](#4-technology-stack)
5. [Platform Features](#5-platform-features)
6. [Architecture Overview](#6-architecture-overview)
7. [Database Architecture](#7-database-architecture)
8. [API Reference](#8-api-reference)
9. [Project Structure](#9-project-structure)
10. [Authentication & Security](#10-authentication--security)
11. [Monetization Strategy](#11-monetization-strategy)
12. [Third-Party Integrations](#12-third-party-integrations)
13. [SEO, PWA & Mobile](#13-seo-pwa--mobile)
14. [Development Guide](#14-development-guide)

---

## 1. Executive Summary

### What is GamerHub?

**GamerHub** is a comprehensive **gaming social platform** that unifies the fragmented gaming ecosystem into a single product. It combines social networking, competitive gaming infrastructure, content creation, monetization, and third-party game integrations to serve the 3+ billion global gaming audience.

> **"Connect. Play. Compete."**

### Core Value Proposition

GamerHub solves the #1 pain point for competitive gamers: **fragmentation**. Today, gamers use Discord for chat, Reddit for LFG, Battlefy for tournaments, Twitch for streaming, and multiple game-specific tools. GamerHub replaces this with one unified platform that:

- Connects gamers by skill, region, playstyle, and mood
- Provides matchmaking, clans, tournaments, and LFG infrastructure
- Integrates directly with game APIs (Riot, Steam, Clash of Clans)
- Offers creator tools, blogs, community forums, and streaming embeds
- Monetizes through Premium subscriptions, Battle Pass, and a virtual currency shop
- Supports progressive web app (PWA) for mobile-first experiences

### Supported Games

| Game | Type | API Integration | Ranks | Roles |
|------|------|:-:|-------|-------|
| Valorant | Tactical FPS | Riot API | 25 | Duelist, Controller, Initiator, Sentinel |
| Counter-Strike 2 | Tactical FPS | Steam API | 18 | Entry Fragger, AWPer, Support, Lurker, IGL |
| PUBG Mobile | Battle Royale | - | 10 | Fragger, Support, Scout, IGL |
| Free Fire | Battle Royale | - | 7 | Rusher, Support, Sniper, Defuser |
| Clash of Clans | Strategy | CoC API | 8 | War Specialist, Donator, Clan Leader, Base Builder |
| COD Mobile | FPS | - | 7 | Slayer, OBJ, Anchor, Support |
| Other | Any | - | Custom | Custom |

### Key Metrics & Scale

| Dimension | Scope |
|-----------|-------|
| Database Tables | 50+ |
| API Endpoints | 90+ |
| React Components | 100+ |
| Custom Hooks | 50+ |
| Database Migrations | 37 |
| Supported Regions | 7 (NA, EU, Asia, Oceania, SA, MENA, SEA) |
| Supported Languages | 11 |

---

## 2. Problem Statement & Market Opportunity

### The Fragmented Gaming Ecosystem

```
CURRENT GAMER PAIN POINTS
─────────────────────────────────────────────────────────────────

1. FRAGMENTED EXPERIENCE
   Discord + Battlefy + Reddit + Twitch + multiple game apps
   = constant context switching, no unified identity

2. NO SKILL-BASED SOCIAL MATCHMAKING
   In-game systems only work for ranked modes
   No way to find similar-skilled teammates for casual or custom play

3. NO UNIFIED GAMING IDENTITY
   Stats scattered across games, no cross-game reputation
   Hard to showcase gaming achievements to the broader community

4. AMATEUR TOURNAMENT ORGANIZATION IS PAINFUL
   Manual bracket management, scheduling coordination,
   no integrated communication channel

5. NO MONETIZATION PATH FOR SEMI-PRO GAMERS
   Gap between casual and professional esports
   No Battle Pass or premium features to reward engaged users
```

### Market Opportunity

| Segment | Size | GamerHub Position |
|---------|------|-------------------|
| Global gamers | 3.4B (2025) | Social platform for competitive gamers |
| Mobile gamers | 2.8B | PWA-first, mobile-optimized |
| Esports audience | 640M | Tournament infrastructure + streaming |
| Gaming communities (clans/guilds) | Hundreds of millions | Clan management + recruitment marketplace |
| Game content creators | 50M+ | Blog, community forums, creator profiles |

### Competitive Landscape

| Existing Solution | What It Does | What GamerHub Adds |
|-------------------|-------------|-------------------|
| **Discord** | Communication | Matchmaking, tournaments, progression, monetization |
| **Battlefy** | Tournaments only | Social networking, clans, gamification, integrations |
| **GamerLink** | Basic LFG | Full tournament system, clans, AI matchmaking, blog |
| **Reddit r/gaming** | Discussion | Structured LFG, profiles, game API integration |
| **Twitch** | Streaming only | Full social platform with gaming identity |

### Target Users

1. **Competitive Gamers** - Want organized play, skill-based matchmaking, progression
2. **Clan/Team Leaders** - Need recruitment, management, and competition tools
3. **Content Creators** - Need blog, community forums, creator profiles, streaming tools
4. **Casual Gamers** - Want to find friends, LFG, and explore gaming communities
5. **Tournament Organizers** - Want bracket management, check-ins, and dispute resolution

---

## 3. Product Vision & Strategy

### Platform Pillars

```
                      ┌──────────────────┐
                      │  UNIFIED GAMING  │
                      │     IDENTITY     │
                      └────────┬─────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
 ┌───────────────┐    ┌───────────────┐      ┌───────────────┐
 │    SOCIAL     │    │  COMPETITIVE  │      │ MONETIZATION  │
 │   FEATURES    │    │    FEATURES   │      │    ENGINE     │
 ├───────────────┤    ├───────────────┤      ├───────────────┤
 │ Community     │    │ Clans         │      │ Premium Subs  │
 │ Friends       │    │ Tournaments   │      │ Battle Pass   │
 │ LFG           │    │ Matchmaking   │      │ Virtual Shop  │
 │ Blog/Forums   │    │ Leaderboards  │      │ Stripe Billing│
 │ Streaming     │    │ Challenges    │      │ Creator Tools │
 └───────────────┘    └───────────────┘      └───────────────┘

                      ┌──────────────────┐
                      │   INTEGRATIONS   │
                      │  Riot · Steam ·  │
                      │  Twitch · CoC ·  │
                      │     Discord      │
                      └──────────────────┘
```

### User Journey

```
  ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
  │  LANDING  │────▶│  SIGN UP  │────▶│ ONBOARDING│────▶│ COMMUNITY │
  │   PAGE    │     │  /login   │     │ /onboard  │     │   FEED    │
  └───────────┘     └───────────┘     └───────────┘     └───────────┘
       │                 │                  │                 │
       ▼                 ▼                  ▼                 ▼
  First visit        Email/Pass       Select games       Browse posts
  → /onboard         registration     Set region          Find gamers
  Returning          Auth flow        Gaming style        Join clans
  → /community                        Connect games       Create LFGs
```

**Home page (`/`)** auto-redirects:
- First-time visitors → `/onboard` (guided onboarding)
- Returning/logged-in users → `/community` (main feed)

---

## 4. Technology Stack

### Core Architecture

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.x |
| **UI Library** | React | 19.2.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth | Built-in |
| **Realtime** | Supabase Realtime (WebSocket) | Built-in |
| **Voice/Video** | LiveKit | 2.x |
| **Payments** | Stripe | 20.x |
| **AI** | OpenAI | 6.x |
| **Rich Text** | TipTap | 3.x |
| **Animations** | Framer Motion | 12.x |

### State Management

| Tool | Purpose |
|------|---------|
| **Zustand** 5.x | Client-side global state |
| **TanStack React Query** 5.x | Server state, caching, mutations |

### UI Components

| Library | Purpose |
|---------|---------|
| **Radix UI** | Accessible primitives (Dialog, Dropdown, Select, Tabs, Switch, etc.) |
| **Lucide React** | Icon system |
| **Sonner** | Toast notifications |
| **class-variance-authority** | Component variant management |
| **tailwind-merge + clsx** | Conditional class merging |

### Testing

| Tool | Scope |
|------|-------|
| **Jest** 30.x | Unit & component tests |
| **React Testing Library** | Component testing |
| **Playwright** 1.57.x | End-to-end testing |

### Mobile

| Tool | Purpose |
|------|---------|
| **Expo (React Native)** | Native mobile app scaffold (in `mobile/` directory) |
| **PWA** | Web-based mobile experience with manifest + service worker |

---

## 5. Platform Features

### 5.1 Community & Social

| Feature | Description | Route |
|---------|-------------|-------|
| **Community Feed** | Main content feed with posts, discussions, and activity | `/community` |
| **Community Posts** | View individual post threads with replies | `/community/post/[id]` |
| **Content Moderation** | Admin tools for moderating community content | `/community/moderate` |
| **Friends System** | Send/accept friend requests, follow/unfollow, mutual friends | `/friends` |
| **Find Gamers** | Discover players filtered by game, rank, region, playstyle | `/find-gamers` |
| **Player Profiles** | Detailed gamer profiles with stats, games, achievements | `/profile/[username]` |
| **Profile Editing** | Edit bio, avatar, games, settings | `/profile/[username]/edit` |
| **Blog** | Public gaming blog with categories, SEO, rich text editor | `/blog`, `/blog/[slug]` |
| **Write** | Rich text blog post editor (TipTap) | `/write` |
| **Notifications** | Activity notifications center | `/notifications` |

### 5.2 Competitive Gaming

| Feature | Description | Status |
|---------|-------------|--------|
| **Clan System** | Create/join clans, hierarchical roles, recruitment, clan challenges | Active |
| **Clan Creation** | Set name, tag, game, region, join type | `/clans/create` |
| **Clan Detail** | Members, challenges, recruitment posts, activity log | `/clans/[slug]` |
| **Tournament System** | Single/Double Elimination, Round Robin, bracket generation | API Ready |
| **Matchmaking** | AI-powered teammate suggestions, team balancing, outcome prediction | API Ready |
| **LFG (Looking for Group)** | Game-specific LFG posts with requirements | Component Ready |

### 5.3 Gamification

| Feature | Description |
|---------|-------------|
| **XP & Levels** | 100-level progression system with exponential curve |
| **Quests** | Daily (3/day) and weekly (3/week) quests with XP rewards |
| **Badges** | 40+ achievement badges across milestone, social, skill, and seasonal categories |
| **Titles** | Unlockable display titles based on level |
| **Profile Frames** | Avatar border cosmetics unlocked through progression |
| **Profile Themes** | Color scheme customization with game-themed options |
| **Seasons** | Seasonal competitive periods with points and rewards |
| **Leaderboards** | Global and per-game rankings with seasonal tracking |
| **Community Challenges** | Time-limited platform-wide events |
| **Battle Pass** | Seasonal progression track with free and premium reward tiers |

### 5.4 Monetization

| Feature | Description |
|---------|-------------|
| **Premium Subscription** | Stripe-powered tiered subscriptions with exclusive features |
| **Battle Pass** | Seasonal content with purchase and progression tracking |
| **Virtual Currency (Wallet)** | In-platform currency for cosmetic purchases |
| **Shop** | Cosmetic items, currency packs purchasable with real money or virtual currency |
| **Creator Tools** | Creator profiles and monetization features |

### 5.5 Communication

| Feature | Description |
|---------|-------------|
| **Real-time Chat** | Direct messaging and group chat via Supabase Realtime |
| **Clan Chat** | Auto-managed chat for clan members |
| **Voice & Video Calls** | Peer-to-peer calls via LiveKit with screen sharing |

### 5.6 Settings & Configuration

| Route | Purpose |
|-------|---------|
| `/settings` | General account settings |
| `/settings/connections` | Manage game integrations (Riot, Steam, Twitch, Discord) |
| `/settings/notifications` | Notification preferences |

---

## 6. Architecture Overview

### 6.1 High-Level System Architecture

```
                            CLIENTS
                  ┌─────────────────────────┐
                  │    Web Browser / PWA     │
                  │    Next.js Frontend      │
                  └───────────┬─────────────┘
                              │ HTTPS
                              ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                     NEXT.JS SERVER                            │
  │  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
  │  │  React Server   │  │   API Routes    │  │  Middleware    │ │
  │  │   Components    │  │   /api/* (90+)  │  │  (Session)    │ │
  │  └─────────────────┘  └─────────────────┘  └───────────────┘ │
  └────────────────────────────┬──────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
  │    SUPABASE     │ │    LIVEKIT      │ │     STRIPE      │
  │  PostgreSQL     │ │    Server       │ │   Payments      │
  │  Auth + RLS     │ │  (Voice/Video)  │ │  Subscriptions  │
  │  Realtime WS    │ └─────────────────┘ └─────────────────┘
  │  Storage        │
  └─────────────────┘         ┌─────────────────┐
                              │    OPENAI API    │
            ┌─────────────────│  AI Matchmaking  │
            │                 │  News Summaries  │
            │                 └─────────────────┘
            ▼
  ┌───────────────────────────────────────────────┐
  │              GAME API INTEGRATIONS             │
  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
  │  │  Riot  │ │ Steam  │ │ Twitch │ │  CoC   │  │
  │  │  API   │ │  API   │ │  API   │ │  API   │  │
  │  └────────┘ └────────┘ └────────┘ └────────┘  │
  │  ┌────────┐                                    │
  │  │Discord │                                    │
  │  │Webhooks│                                    │
  │  └────────┘                                    │
  └───────────────────────────────────────────────┘
```

### 6.2 Data Flow Patterns

```
READ FLOW (React Query)
───────────────────────
Component ──▶ useQuery Hook ──▶ API Route ──▶ Supabase ──▶ PostgreSQL
    ▲                                                          │
    └──────────────────── Cached Data ◀────────────────────────┘

WRITE FLOW (Mutations)
──────────────────────
User Action ──▶ useMutation ──▶ API Route ──▶ Supabase ──▶ PostgreSQL
                                    │                          │
                                    │       ┌──────────────────┘
                                    │       │ Triggers Execute
                                    │       ▼
                                    │   XP Award, Stats Update,
                                    │   Notifications, etc.
                                    │
                                    └──▶ Invalidate Queries

REALTIME FLOW (Subscriptions)
─────────────────────────────
PostgreSQL Change ──▶ Supabase Realtime ──▶ Client Subscription
                                                     │
                                                     ▼
                                               Zustand Store
                                               State Update
```

### 6.3 Provider Architecture

```
RootLayout
  └── QueryProvider (TanStack React Query)
        └── AuthProvider (Supabase Auth)
              └── ThemeProvider (Custom theme engine)
                    └── PWAProvider (Service worker + install prompt)
                          └── AuthGateProvider (Route protection)
                                └── AppShell (Sidebar + Navbar + Content)
                                      └── Page Content
```

---

## 7. Database Architecture

### 7.1 Migration History

The database schema is managed through 37 incremental migrations:

| Migration | Domain | Key Tables |
|-----------|--------|------------|
| `001_initial_schema` | Core | profiles, games, user_games, follows, matches, challenges, conversations, messages, media, ratings |
| `002_calls` | Communication | calls, call_participants |
| `003_clans` | Clans | clans, clan_members, clan_invites, clan_games, clan_achievements, clan_challenges, clan_recruitment_posts, clan_activity_log |
| `003_fix_conversation_rls` | Security | RLS policy fixes for conversations |
| `004_tournaments` | Tournaments | tournaments, tournament_participants, tournament_matches, tournament_match_games, tournament_activity_log |
| `004_leaderboards` | Seasons | seasons, season_points, point_transactions, community_challenges, season_rewards, leaderboard_snapshots |
| `004_gamification` | Progression | user_progression, level_thresholds, xp_transactions, titles, profile_frames, profile_themes, badges, quests |
| `005_storage_buckets` | Storage | Supabase storage bucket configuration |
| `006_friends` | Social | Friend requests, friendship tracking |
| `007_social_suggestions` | Social | AI-powered friend/player suggestions |
| `008_payments` | Monetization | Stripe customer records, subscriptions, payment history |
| `009_battle_pass` | Monetization | Battle pass tiers, rewards, user progress |
| `010_virtual_currency` | Monetization | Wallets, transactions, shop items, currency packs |
| `011_activity_feed` | Social | Activity feed events, reactions |
| `012_game_integrations` | Integrations | Riot, Steam connected accounts, synced stats |
| `013_forums` | Community | Forum categories, posts, replies, votes |
| `014_streaming` | Streaming | Twitch connections, streamer profiles, follow relationships |
| `015_ai_matchmaking` | AI | Matchmaking suggestions, team balance, outcome predictions |
| `016_automation` | Automation | Automation rules, Discord webhook configurations |
| `017_lfg` | LFG | LFG posts, game-specific requirements |
| `018_blog` | Content | Blog posts, categories, comments |
| `019_lfg_game_specific` | LFG | Game-specific LFG enhancements |
| `020_update_games` | Core | Game catalog updates |
| `021_account_verification` | Trust | Account verification system |
| `022_discord_integration` | Integrations | Discord OAuth, webhook events |
| `023_console_platforms` | Platforms | Console account linking (PlayStation, Xbox, Nintendo) |
| `024_community_ugc` | Community | User-generated content system |
| `025_accessibility` | A11y | Accessibility preferences |
| `026_creator_tools` | Creators | Creator profiles, monetization tools |
| `027_localization` | i18n | Language preferences, translation support |
| `029_squad_dna` | Matchmaking | Squad compatibility analysis |
| `030_mood_matching` | Matchmaking | Mood-based player matching |
| `031_seed_indian_profiles` | Seed Data | Demo profiles for Indian gaming market |
| `032_seed_demo_community_posts` | Seed Data | Demo community content |
| `033_clan_join_type` | Clans | Open/request-to-join clan types |
| `034_trait_endorsements` | Social | Player trait endorsement system |
| `034_coc_integration` | Integrations | Clash of Clans API integration |
| `035_news_articles` | Content | Gaming news aggregation |
| `036_fix_pro_players_ambiguous` | Fix | Query ambiguity fix |
| `037_apply_missing_tables` | Fix | Missing table additions |
| `999_cleanup_and_focus` | Maintenance | Schema cleanup and optimization |

### 7.2 Core Entity Relationships

```
                            ┌──────────────┐
                            │   profiles   │
                            │──────────────│
                            │ id (PK/FK)   │
                            │ username     │
                            │ email        │
                            │ region       │
                            │ gaming_style │
                            └──────┬───────┘
                                   │
       ┌───────────┬───────────┬───┴───┬───────────┬───────────┐
       ▼           ▼           ▼       ▼           ▼           ▼
  ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
  │user_games│ │friends │ │ clans  │ │wallet│ │progression│ │ stripe   │
  │   + game │ │requests│ │members │ │      │ │  + XP    │ │customers │
  │   stats  │ │+follows│ │+invites│ │      │ │  + quests│ │+subscript│
  └──────────┘ └────────┘ └────────┘ └──────┘ └──────────┘ └──────────┘
```

### 7.3 Key Database Functions

| Function | Purpose |
|----------|---------|
| `award_xp(user_id, amount, source, game_id)` | Award XP with automatic level-up |
| `award_points(user_id, season_id, points, type)` | Award seasonal leaderboard points |
| `assign_quests(user_id, quest_type)` | Assign daily/weekly quests |
| `update_quest_progress(user_id, quest_id, progress)` | Track quest completion |
| `advance_tournament_winner()` | Auto-advance bracket winners (trigger) |
| `handle_clan_member_join()` | Auto-add to clan chat (trigger) |
| `handle_clan_member_leave()` | Auto-remove from clan chat (trigger) |
| `refresh_leaderboard_rankings()` | Recalculate rank positions |
| `grant_season_rewards()` | Auto-distribute season-end rewards |

---

## 8. API Reference

### 8.1 Complete API Routes Map

#### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/auth/callback` | OAuth callback handler |

#### Games
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/games` | List all supported games |

#### Social & Friends
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/friends` | List user's friends |
| GET | `/api/friends/counts` | Get friend/follower/following counts |
| GET | `/api/friends/followers` | List followers |
| GET | `/api/friends/following` | List following |
| GET | `/api/friends/requests` | List pending friend requests |
| POST | `/api/friends/requests` | Send friend request |
| PUT | `/api/friends/requests/[requestId]` | Accept/decline request |
| DELETE | `/api/friends/[userId]` | Unfriend user |
| GET | `/api/pro-players` | List pro/featured players |
| GET | `/api/suggestions` | AI-powered player suggestions |
| GET | `/api/users/[userId]/social` | User's social info |

#### Progression & Gamification
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/progression` | List progression records |
| GET/POST | `/api/progression/[userId]` | Get/award XP |
| GET | `/api/titles` | List unlocked titles |
| POST | `/api/titles/equip` | Equip a title |
| GET | `/api/frames` | List unlocked frames |
| POST | `/api/frames/equip` | Equip a frame |
| GET | `/api/themes` | List unlocked themes |
| POST | `/api/themes/equip` | Equip a theme |
| GET | `/api/badges` | Badge definitions |
| GET | `/api/badges/user` | Current user's badges |
| GET | `/api/badges/user/[userId]` | Specific user's badges |

#### Quests
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/quests/active` | User's active quests |
| POST | `/api/quests/assign` | Assign daily/weekly quests |
| POST | `/api/quests/[questId]/claim` | Claim quest reward |

#### Leaderboards & Seasons
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leaderboard` | Global leaderboard |
| GET | `/api/leaderboards` | Season leaderboards |
| GET | `/api/leaderboards/me` | User's position |
| GET | `/api/seasons` | List seasons |
| GET | `/api/seasons/current` | Current season |
| GET | `/api/seasons/[seasonId]` | Season details |

#### Community Challenges
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/community-challenges` | List challenges |
| GET/POST | `/api/community-challenges/[id]` | Details / update |
| POST | `/api/community-challenges/[id]/join` | Join challenge |

#### Rewards
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/rewards` | List available rewards |
| POST | `/api/rewards/[id]/claim` | Claim reward |
| POST | `/api/rewards/[id]/equip` | Equip reward |

#### Clans
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/clans` | List / create clans |
| GET/PUT/DELETE | `/api/clans/[clanId]` | Clan CRUD |
| GET/POST | `/api/clans/[clanId]/members` | List / add members |
| PUT/DELETE | `/api/clans/[clanId]/members/[userId]` | Update role / remove |
| GET/POST | `/api/clans/[clanId]/invites` | List / create invites |
| PUT/DELETE | `/api/clans/[clanId]/invites/[inviteId]` | Respond / cancel |
| GET/POST | `/api/clan-challenges` | List / create clan challenges |
| GET/PUT | `/api/clan-challenges/[id]` | Details / update |
| GET/POST | `/api/clan-recruitment` | Recruitment marketplace |
| GET/PUT | `/api/clan-recruitment/[postId]` | Post details / update |

#### Tournaments
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/tournaments` | List / create |
| GET/PUT | `/api/tournaments/[id]` | Details / update |
| GET/POST | `/api/tournaments/[id]/participants` | List / register |
| GET | `/api/tournaments/[id]/bracket` | Get bracket |
| GET/POST | `/api/tournaments/[id]/matches` | List / create match |
| PUT | `/api/tournaments/[id]/matches/[matchId]` | Submit result |

#### Voice/Video (LiveKit)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/livekit/token` | Generate room token |
| POST | `/api/livekit/call` | Initiate call |

#### Payments (Stripe)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/stripe/create-customer` | Create Stripe customer |
| POST | `/api/stripe/create-checkout-session` | Start checkout |
| POST | `/api/stripe/create-portal-session` | Customer portal |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| GET | `/api/stripe/payment-methods` | List payment methods |
| POST | `/api/subscriptions/cancel` | Cancel subscription |
| POST | `/api/subscriptions/resume` | Resume subscription |

#### Virtual Currency & Shop
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wallet` | Get wallet balance |
| GET | `/api/wallet/transactions` | Transaction history |
| GET | `/api/shop/items` | Shop item catalog |
| POST | `/api/shop/purchase` | Purchase item |
| GET | `/api/shop/currency-packs` | Currency pack options |
| POST | `/api/shop/buy-currency` | Buy virtual currency |

#### Battle Pass
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/battle-pass` | Current battle pass info |
| GET | `/api/battle-pass/progress` | User progress |
| POST | `/api/battle-pass/purchase` | Purchase premium pass |
| POST | `/api/battle-pass/claim/[rewardId]` | Claim tier reward |

#### Game Integrations
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/integrations` | List connected integrations |
| GET | `/api/integrations/status` | Connection status |
| POST | `/api/integrations/riot/connect` | Connect Riot account |
| GET | `/api/integrations/riot/callback` | Riot OAuth callback |
| POST | `/api/integrations/steam/connect` | Connect Steam account |
| GET | `/api/integrations/steam/callback` | Steam OAuth callback |
| GET | `/api/users/[userId]/game-stats` | Synced game stats |

#### Twitch & Streaming
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/twitch/connect` | Connect Twitch account |
| GET | `/api/twitch/callback` | Twitch OAuth callback |
| POST | `/api/twitch/webhook` | Twitch event webhook |
| GET | `/api/streamers` | List streamers |
| GET | `/api/streamers/[userId]` | Streamer profile |
| POST | `/api/streamers/[userId]/follow` | Follow streamer |

#### Discord
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/discord/connect` | Connect Discord |
| GET | `/api/discord/callback` | Discord OAuth callback |
| POST | `/api/discord/disconnect` | Disconnect Discord |
| GET | `/api/discord/status` | Connection status |
| POST | `/api/discord/webhook` | Discord webhook events |

#### AI Matchmaking
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/matchmaking/suggest-teammates` | AI teammate suggestions |
| POST | `/api/matchmaking/team-balance` | Team balance analysis |
| POST | `/api/matchmaking/predict-outcome` | Match outcome prediction |

#### Forums
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/forums/categories` | Forum categories |
| GET/POST | `/api/forums/posts` | List / create posts |
| GET/PUT | `/api/forums/posts/[postId]` | Post details / update |
| POST | `/api/forums/posts/[postId]/vote` | Vote on post |
| POST | `/api/forums/posts/[postId]/replies` | Reply to post |
| POST | `/api/forums/replies/[replyId]/vote` | Vote on reply |
| POST | `/api/forums/replies/[replyId]/solution` | Mark as solution |

#### Activity Feed
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/feed` | Activity feed |
| POST | `/api/feed/[activityId]/react` | React to activity |

#### Notifications & Automation
| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/notifications/preferences` | Notification settings |
| GET/POST | `/api/automation/rules` | List / create rules |
| GET/PUT/DELETE | `/api/automation/rules/[ruleId]` | Rule CRUD |

---

## 9. Project Structure

```
gamer-hub/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Auth pages (route group)
│   │   │   ├── login/page.tsx         # /login
│   │   │   ├── register/page.tsx      # /register
│   │   │   └── onboarding/page.tsx    # /onboarding
│   │   │
│   │   ├── (main)/                    # Main app (route group)
│   │   │   ├── dashboard/page.tsx     # User dashboard
│   │   │   ├── community/             # Community feed + posts + moderation
│   │   │   ├── find-gamers/page.tsx   # Player discovery
│   │   │   ├── friends/page.tsx       # Friends management
│   │   │   ├── clans/                 # Clans + create + detail
│   │   │   ├── profile/               # Profile + edit + [username]
│   │   │   ├── premium/page.tsx       # Premium subscription
│   │   │   ├── write/page.tsx         # Blog post editor
│   │   │   ├── notifications/page.tsx # Notification center
│   │   │   └── settings/             # Settings + connections + notifications
│   │   │
│   │   ├── api/                       # 90+ API Routes
│   │   │   ├── auth/                  # Auth endpoints
│   │   │   ├── friends/               # Friend system
│   │   │   ├── clans/                 # Clan CRUD
│   │   │   ├── tournaments/           # Tournament management
│   │   │   ├── stripe/                # Payment processing
│   │   │   ├── battle-pass/           # Battle pass
│   │   │   ├── shop/                  # Virtual shop
│   │   │   ├── wallet/                # Virtual currency
│   │   │   ├── integrations/          # Riot, Steam connections
│   │   │   ├── twitch/                # Twitch integration
│   │   │   ├── discord/               # Discord integration
│   │   │   ├── matchmaking/           # AI matchmaking
│   │   │   ├── forums/                # Forum system
│   │   │   ├── feed/                  # Activity feed
│   │   │   ├── streamers/             # Streamer profiles
│   │   │   ├── automation/            # Discord webhooks & rules
│   │   │   ├── notifications/         # Notification preferences
│   │   │   └── ... (gamification, quests, badges, etc.)
│   │   │
│   │   ├── blog/                      # Public blog (SSR)
│   │   │   ├── page.tsx               # Blog listing
│   │   │   └── [slug]/page.tsx        # Blog post
│   │   │
│   │   ├── onboard/page.tsx           # First-time onboarding
│   │   ├── offline/page.tsx           # PWA offline fallback
│   │   ├── not-found.tsx              # 404 page
│   │   ├── robots.ts                  # SEO robots.txt
│   │   ├── sitemap.ts                 # Dynamic sitemap
│   │   ├── globals.css                # Global styles
│   │   ├── layout.tsx                 # Root layout with providers
│   │   └── page.tsx                   # Home (auto-redirect)
│   │
│   ├── components/                    # 100+ React Components
│   │   ├── ui/                        # Primitives (Button, Card, Dialog, etc.)
│   │   ├── layout/                    # AppShell, Sidebar, Navbar, RightSidebar
│   │   ├── auth/                      # Auth gate provider
│   │   ├── chat/                      # ChatWindow, ConversationList
│   │   ├── call/                      # LiveKit call components
│   │   ├── clans/                     # Clan cards, forms, modals
│   │   ├── gamification/              # XP bars, badges, quests, titles, themes
│   │   ├── tournaments/               # Tournament cards, bracket views
│   │   ├── leaderboards/              # Leaderboard tables, season headers
│   │   ├── community-challenges/      # Challenge cards, progress bars
│   │   ├── rewards/                   # Reward cards, showcases
│   │   ├── premium/                   # Premium banner, subscription status, plans
│   │   ├── payments/                  # Checkout, payment history
│   │   ├── battle-pass/               # Battle pass track, rewards, purchase
│   │   ├── shop/                      # Wallet, items, currency packs
│   │   ├── feed/                      # Feed items, news cards
│   │   ├── forums/                    # Forum categories, posts, replies, editor
│   │   ├── streaming/                 # Streamer cards, Twitch embed, live section
│   │   ├── matchmaking/               # Suggestion cards
│   │   ├── notifications/             # Notification items, center, preferences
│   │   ├── automation/                # Rule builder, cards, Discord connect
│   │   ├── integrations/              # Sync status
│   │   ├── social-lists/              # Social list items, modals
│   │   ├── suggestions/               # Pro player cards
│   │   ├── lfg/                       # LFG post cards, create modal
│   │   ├── blog/                      # Blog comments
│   │   ├── settings/                  # Theme switcher
│   │   ├── pwa/                       # PWA provider
│   │   ├── profile/                   # Profile sections (achievements, media)
│   │   ├── matches/                   # Match cards
│   │   ├── challenges/                # Challenge cards
│   │   ├── media/                     # Media uploader
│   │   └── dev/                       # PageLoadTimer (dev tools)
│   │
│   ├── lib/                           # Utilities & Business Logic
│   │   ├── hooks/                     # 50+ Custom React hooks
│   │   ├── supabase/                  # Client, server, admin, middleware
│   │   ├── integrations/              # Riot, Steam, Twitch, Discord, CoC
│   │   ├── matchmaking/               # OpenAI matchmaking logic
│   │   ├── tournament/                # Bracket generation
│   │   ├── theme/                     # Theme engine
│   │   ├── news/                      # RSS parsing, AI summarization
│   │   ├── query/                     # React Query config
│   │   ├── data/                      # Seed data, blog helpers
│   │   ├── api/                       # Cache headers
│   │   ├── constants/                 # Game definitions, regions, languages
│   │   ├── auth/                      # Auth provider
│   │   ├── stripe.ts                  # Stripe server config
│   │   ├── stripe-client.ts           # Stripe client config
│   │   ├── game-configs.ts            # Game configuration
│   │   └── utils.ts                   # Utility functions
│   │
│   ├── hooks/                         # Additional hooks
│   │   └── useAuthGate.ts             # Auth gate hook
│   │
│   └── types/                         # TypeScript Type Definitions
│       ├── database.ts                # Supabase database types
│       ├── blog.ts                    # Blog types
│       ├── lfg.ts                     # LFG types
│       ├── news.ts                    # News types
│       ├── discord.ts                 # Discord types
│       ├── community.ts              # Community types
│       ├── coaching.ts               # Coaching types
│       ├── squad-dna.ts              # Squad DNA types
│       ├── mood.ts                   # Mood matching types
│       └── ... (15+ type files)
│
├── supabase/
│   └── migrations/                    # 37 SQL migrations
│
├── mobile/                            # Expo React Native app
│   ├── index.ts                       # App entry point
│   ├── App.tsx                        # Root component
│   ├── assets/                        # App icons & splash
│   └── tsconfig.json
│
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service worker
│   ├── icons/                         # PWA icons (72-512px)
│   └── images/                        # Game logos, assets
│
├── e2e/                               # Playwright E2E tests
├── src/__tests__/                     # Jest unit tests
├── middleware.ts                       # Supabase session middleware
├── next.config.ts                     # Next.js config
├── jest.config.js                     # Jest config
├── playwright.config.ts               # Playwright config
├── tailwind.config.ts                 # Tailwind config
└── package.json                       # Dependencies
```

---

## 10. Authentication & Security

### Authentication Flow

```
User ──── Frontend ──── Middleware ──── API Route ──── Supabase Auth
 │            │              │              │               │
 │──Register─▶│              │              │               │
 │            │──────────────────────────────│──signUp()────▶│
 │            │◀─────────────────────────────│──Session──────│
 │            │──Redirect to /onboard───────▶│               │
 │            │                              │               │
 │──Login────▶│              │               │               │
 │            │──────────────────────────────│──signIn()────▶│
 │            │◀─────────────────────────────│──Session──────│
 │            │──Redirect to /community─────▶│               │
 │            │                              │               │
 │──Visit────▶│──────────────▶│               │               │
 │            │              │──getSession()─▶│               │
 │            │              │──Allow/Deny────│               │
```

### Security Layers

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Supabase Auth with email/password, JWT sessions |
| **Session Management** | Middleware refreshes tokens on every request |
| **Route Protection** | AuthGateProvider + middleware matcher |
| **Database Security** | Row Level Security (RLS) policies on all tables |
| **API Security** | Server-side Supabase client with session validation |
| **Payment Security** | Stripe handles all payment data (PCI compliant) |
| **Image Security** | Content Security Policy for remote images, SVG sandboxing |
| **Webhook Security** | Signature verification for Stripe and Twitch webhooks |

### Row Level Security Summary

| Table Category | Read Policy | Write Policy |
|---------------|-------------|-------------|
| profiles | Public | Own profile only |
| games | Public | Admin only |
| friends/follows | Involved parties | Involved parties |
| conversations | Participants only | Participants only |
| messages | Conversation participants | Sender only |
| clans | Public (if recruiting) | Leader/Co-leader |
| clan_members | Members | Leader/Officers |
| tournaments | Public (if not draft) | Organizer only |
| wallet/payments | Own records | System only |

---

## 11. Monetization Strategy

### Revenue Streams

```
┌─────────────────────────────────────────────────────────┐
│                  REVENUE MODEL                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. PREMIUM SUBSCRIPTIONS (Stripe)                      │
│     └── Tiered plans with exclusive features            │
│         • Enhanced profile customization                │
│         • Priority matchmaking                          │
│         • Ad-free experience                            │
│         • Premium badges and frames                     │
│                                                         │
│  2. BATTLE PASS (Seasonal)                              │
│     └── Free + Premium tracks                           │
│         • Cosmetic rewards at each tier                 │
│         • XP boosts for premium pass holders            │
│         • Exclusive seasonal items                      │
│                                                         │
│  3. VIRTUAL CURRENCY SHOP                               │
│     └── Currency packs (real money → virtual coins)     │
│         • Cosmetic items (frames, themes, titles)       │
│         • No pay-to-win mechanics                       │
│                                                         │
│  4. FUTURE: SPONSORSHIPS & PARTNERSHIPS                 │
│     └── Tournament sponsorships                         │
│     └── Game developer partnerships                     │
│     └── Esports team integrations                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Stripe Integration

| Component | Purpose |
|-----------|---------|
| `create-customer` | Creates Stripe customer on signup |
| `create-checkout-session` | Initiates subscription/purchase flow |
| `create-portal-session` | Self-service billing management |
| `webhook` | Handles payment events (subscription created/cancelled/updated) |
| `payment-methods` | Lists saved payment methods |

---

## 12. Third-Party Integrations

### Game API Integrations

| Platform | Integration Type | Features |
|----------|-----------------|----------|
| **Riot Games** | OAuth + API | Account linking, Valorant/LoL rank sync, match history |
| **Steam** | OAuth + API | Account linking, CS2 stats sync, game library |
| **Clash of Clans** | REST API | Player stats, clan data, war history |

### Platform Integrations

| Platform | Integration Type | Features |
|----------|-----------------|----------|
| **Twitch** | OAuth + Webhooks | Stream status, live embeds, follower sync |
| **Discord** | OAuth + Webhooks | Account linking, event notifications, automation rules |
| **LiveKit** | WebRTC | Real-time voice and video calls with screen sharing |
| **OpenAI** | REST API | AI-powered teammate suggestions, team balance, news summaries |
| **Stripe** | REST + Webhooks | Payments, subscriptions, billing portal |

### Integration Architecture

```
User Profile
    │
    ├── Riot Connected? ──▶ Fetch Valorant/LoL ranks, display on profile
    ├── Steam Connected? ──▶ Fetch CS2 stats, game library
    ├── Twitch Connected? ──▶ Show live status, embed stream
    ├── Discord Connected? ──▶ Send event notifications via webhooks
    └── CoC Tag Linked? ──▶ Fetch clan/player data from CoC API
```

---

## 13. SEO, PWA & Mobile

### SEO

| Feature | Implementation |
|---------|---------------|
| **robots.txt** | `src/app/robots.ts` - Allows `/`, `/blog/*`; blocks `/api/`, `/community/`, `/profile/`, `/settings/` |
| **sitemap.xml** | `src/app/sitemap.ts` - Dynamic sitemap with blog posts, categories |
| **OpenGraph** | Metadata in root layout with title, description, type |
| **Structured Keywords** | gaming, social, esports, multiplayer, game-specific tags |

### Progressive Web App (PWA)

| Feature | Implementation |
|---------|---------------|
| **Web App Manifest** | `public/manifest.json` - standalone display, purple theme |
| **Service Worker** | `public/sw.js` - offline caching |
| **Offline Page** | `src/app/offline/page.tsx` - graceful offline fallback |
| **PWA Provider** | `src/components/pwa/PWAProvider.tsx` - install prompts |
| **Icons** | 8 sizes (72px-512px) with maskable support |
| **App Categories** | games, social, entertainment |

### Mobile Strategy

| Approach | Status | Details |
|----------|--------|---------|
| **PWA (Primary)** | Active | Full mobile experience via web with install prompt |
| **Expo React Native** | Scaffold | `mobile/` directory with Expo project bootstrapped |

---

## 14. Development Guide

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Run E2E tests
npm run e2e

# Build for production
npm run build
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# LiveKit (Voice/Video)
LIVEKIT_API_KEY=APIxxx
LIVEKIT_API_SECRET=xxx
NEXT_PUBLIC_LIVEKIT_URL=wss://xxx.livekit.cloud

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# OpenAI (AI Features)
OPENAI_API_KEY=sk-xxx

# Riot Games
RIOT_API_KEY=RGAPI-xxx
RIOT_CLIENT_ID=xxx
RIOT_CLIENT_SECRET=xxx

# Steam
STEAM_API_KEY=xxx

# Twitch
TWITCH_CLIENT_ID=xxx
TWITCH_CLIENT_SECRET=xxx
TWITCH_WEBHOOK_SECRET=xxx

# Discord
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx
DISCORD_BOT_TOKEN=xxx

# Clash of Clans
COC_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://gamerhub.com
```

### Common Development Tasks

| Task | Command / Location |
|------|-------------------|
| Start dev server | `npm run dev` |
| Run all tests | `npm run test:all` |
| Run unit tests | `npm test` |
| Run E2E tests | `npm run e2e` |
| Build production | `npm run build` |
| Add a new page | `src/app/(main)/[page-name]/page.tsx` |
| Add a new API route | `src/app/api/[route-name]/route.ts` |
| Add a new component | `src/components/[category]/[Name].tsx` |
| Add a new hook | `src/lib/hooks/use[Name].ts` |
| Add a database migration | `supabase/migrations/[number]_[name].sql` |
| Get Supabase client (browser) | `import { createClient } from '@/lib/supabase/client'` |
| Get Supabase client (server) | `import { createClient } from '@/lib/supabase/server'` |
| Get current user | `const { user, profile } = useAuth()` |
| Get progression data | `const { progression } = useProgression()` |
| Get quest data | `const { dailyQuests, weeklyQuests } = useQuests()` |

### Custom Hooks Reference

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state, user profile |
| `useProgression` | XP, level, progression data |
| `useQuests` | Daily/weekly quests, claiming |
| `useBadges` | Badge definitions and unlocked badges |
| `useFriends` | Friend list management |
| `useFriendRequests` | Friend request send/accept/decline |
| `useFollowing` | Follow/unfollow users |
| `useClans` | Clan listing and search |
| `useClan` | Single clan data |
| `useClanMembers` | Clan member management |
| `useClanMembership` | User's clan membership |
| `useClanInvites` | Clan invitations |
| `useClanChallenges` | Clan vs clan challenges |
| `useTournaments` | Tournament listing |
| `useTournament` | Single tournament data |
| `useTournamentBracket` | Bracket view data |
| `useLeaderboard` | Leaderboard data |
| `useSeasonLeaderboard` | Season-specific rankings |
| `useSeason` | Current season info |
| `useSeasonRewards` | Season rewards |
| `useCommunityChallenge` | Community challenge data |
| `useSubscription` | Premium subscription status |
| `useBattlePass` | Battle pass progress |
| `useWallet` | Virtual currency balance |
| `useShop` | Shop items and purchases |
| `useForums` | Forum posts and categories |
| `useStreaming` | Streamer data and live status |
| `useMatchmaking` | AI matchmaking suggestions |
| `useAutomation` | Automation rules |
| `useDiscordIntegration` | Discord connection status |
| `useIntegrations` | Game integration status |
| `useNotifications` | Notification management |
| `useNews` | Gaming news feed |
| `useLFG` | Looking for group posts |
| `useBlog` | Blog posts management |
| `useBlogAuthor` | Author-specific blog tools |
| `useCommunity` | Community feed data |
| `useGames` | Game catalog |
| `useRatings` | Player ratings |
| `useProPlayers` | Featured/pro player list |
| `useSuggestions` | AI player suggestions |
| `useVerification` | Account verification |
| `useSquadDNA` | Squad compatibility analysis |
| `useMood` | Mood-based matching |
| `useCoaching` | Coaching features |
| `useCreatorProfile` | Creator tools |
| `useTranslation` | i18n support |
| `useAccessibility` | Accessibility preferences |
| `useConsolePlatforms` | Console account linking |

---

## Appendix: Supported Regions & Languages

### Regions

| Code | Region |
|------|--------|
| `na` | North America |
| `eu` | Europe |
| `asia` | Asia |
| `oce` | Oceania |
| `sa` | South America |
| `mena` | Middle East & North Africa |
| `sea` | Southeast Asia |

### Languages

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `pt` | Portuguese |
| `fr` | French |
| `de` | German |
| `ru` | Russian |
| `zh` | Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `ar` | Arabic |
| `hi` | Hindi |

---

*This document is maintained alongside the GamerHub codebase and reflects the current state of the platform as of February 2026.*
