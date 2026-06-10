# ggLobby - Developer Guide

> Consolidated from DEVELOPER.md + DOCUMENTATION.md on 2026-05-25.
>
> This document is the complete KT (Knowledge Transfer) for any developer joining the project — intern, fresher, mid-level, senior, or lead. Read this before touching any code. It also serves as the official product/technical reference for ggLobby.

---

## Table of Contents

### Part I — Product & Vision
1. [What is ggLobby?](#1-what-is-gglobby)
2. [Problem Statement & Market Opportunity](#2-problem-statement--market-opportunity)
3. [Product Vision & Strategy](#3-product-vision--strategy)
4. [Platform Features](#4-platform-features)
5. [Supported Games, Regions & Languages](#5-supported-games-regions--languages)

### Part II — Getting Started
6. [Tech Stack Overview](#6-tech-stack-overview)
7. [Getting Started (Local Setup)](#7-getting-started-local-setup)
8. [Environment Variables](#8-environment-variables)

### Part III — Architecture
9. [Project Architecture](#9-project-architecture)
10. [Folder Structure](#10-folder-structure)
11. [Provider Architecture](#11-provider-architecture)
12. [Data Flow Patterns](#12-data-flow-patterns)

### Part IV — Core Systems
13. [Database Layer](#13-database-layer)
14. [Database Migrations & Schema](#14-database-migrations--schema)
15. [Authentication & Security](#15-authentication--security)
16. [Real-Time System (Socket.io)](#16-real-time-system-socketio)

### Part V — APIs & Frontend
17. [API Routes Guide](#17-api-routes-guide)
18. [Complete API Reference](#18-complete-api-reference)
19. [Frontend Patterns](#19-frontend-patterns)
20. [Feature → File Map](#20-feature--file-map)

### Part VI — Features & Integrations
21. [Admin Panel](#21-admin-panel)
22. [Payments (Stripe)](#22-payments-stripe)
23. [Monetization Strategy](#23-monetization-strategy)
24. [Voice/Video Calls (LiveKit)](#24-voicevideo-calls-livekit)
25. [Third-Party Integrations](#25-third-party-integrations)
26. [SEO, PWA & Mobile](#26-seo-pwa--mobile)

### Part VII — Operations
27. [Testing](#27-testing)
28. [Deployment](#28-deployment)
29. [Common Patterns & Conventions](#29-common-patterns--conventions)
30. [Troubleshooting](#30-troubleshooting)
31. [Complete Commands Reference](#31-complete-commands-reference)
32. [Quick Reference Card](#32-quick-reference-card)

---

# Part I — Product & Vision

## 1. What is ggLobby?

ggLobby is a **gaming social platform** focused on the **Indian esports scene** — primarily covering **BGMI** (Battlegrounds Mobile India), **Valorant**, and **Free Fire**. Think of it as a mix of Discord + LinkedIn + Reddit for gamers.

**Core features:** User profiles, friends, messaging, clans, LFG (Looking for Group), community posts, news, blog, tournaments, battle pass, shop, leaderboards, coaching, and more.

**Live at:** https://gglobby.in

### Core Value Proposition

ggLobby solves the #1 pain point for competitive gamers: **fragmentation**. Today, gamers use Discord for chat, Reddit for LFG, Battlefy for tournaments, Twitch for streaming, and multiple game-specific tools. ggLobby replaces this with one unified platform that:

- Connects gamers by skill, region, playstyle, and mood
- Provides matchmaking, clans, tournaments, and LFG infrastructure
- Integrates directly with game APIs (Riot, Steam, Clash of Clans)
- Offers creator tools, blogs, community forums, and streaming embeds
- Monetizes through Premium subscriptions, Battle Pass, and a virtual currency shop
- Supports progressive web app (PWA) for mobile-first experiences

> **"Connect. Play. Compete."**

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

| Segment | Size | ggLobby Position |
|---------|------|-------------------|
| Global gamers | 3.4B (2025) | Social platform for competitive gamers |
| Mobile gamers | 2.8B | PWA-first, mobile-optimized |
| Esports audience | 640M | Tournament infrastructure + streaming |
| Gaming communities (clans/guilds) | Hundreds of millions | Clan management + recruitment marketplace |
| Game content creators | 50M+ | Blog, community forums, creator profiles |

### Competitive Landscape

| Existing Solution | What It Does | What ggLobby Adds |
|-------------------|-------------|-------------------|
| **Discord** | Communication | Matchmaking, tournaments, progression, monetization |
| **Battlefy** | Tournaments only | Social networking, clans, gamification, integrations |
| **GamerLink** | Basic LFG | Full tournament system, clans, AI matchmaking, blog |
| **Reddit r/gaming** | Discussion | Structured LFG, profiles, game API integration |
| **Twitch** | Streaming only | Full social platform with gaming identity |

### Target Users

1. **Competitive Gamers** — Want organized play, skill-based matchmaking, progression
2. **Clan/Team Leaders** — Need recruitment, management, and competition tools
3. **Content Creators** — Need blog, community forums, creator profiles, streaming tools
4. **Casual Gamers** — Want to find friends, LFG, and explore gaming communities
5. **Tournament Organizers** — Want bracket management, check-ins, and dispute resolution

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

## 4. Platform Features

### 4.1 Community & Social

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

### 4.2 Competitive Gaming

| Feature | Description | Status |
|---------|-------------|--------|
| **Clan System** | Create/join clans, hierarchical roles, recruitment, clan challenges | Active |
| **Clan Creation** | Set name, tag, game, region, join type | `/clans/create` |
| **Clan Detail** | Members, challenges, recruitment posts, activity log | `/clans/[slug]` |
| **Tournament System** | Single/Double Elimination, Round Robin, bracket generation | API Ready |
| **Matchmaking** | AI-powered teammate suggestions, team balancing, outcome prediction | API Ready |
| **LFG (Looking for Group)** | Game-specific LFG posts with requirements | Component Ready |

### 4.3 Gamification

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

### 4.4 Monetization

| Feature | Description |
|---------|-------------|
| **Premium Subscription** | Stripe-powered tiered subscriptions with exclusive features |
| **Battle Pass** | Seasonal content with purchase and progression tracking |
| **Virtual Currency (Wallet)** | In-platform currency for cosmetic purchases |
| **Shop** | Cosmetic items, currency packs purchasable with real money or virtual currency |
| **Creator Tools** | Creator profiles and monetization features |

### 4.5 Communication

| Feature | Description |
|---------|-------------|
| **Real-time Chat** | Direct messaging and group chat via Socket.io |
| **Clan Chat** | Auto-managed chat for clan members |
| **Voice & Video Calls** | Peer-to-peer calls via LiveKit with screen sharing |

### 4.6 Settings & Configuration

| Route | Purpose |
|-------|---------|
| `/settings` | General account settings |
| `/settings/connections` | Manage game integrations (Riot, Steam, Twitch, Discord) |
| `/settings/notifications` | Notification preferences |

---

## 5. Supported Games, Regions & Languages

### Supported Games

| Game | Type | API Integration | Ranks | Roles |
|------|------|:-:|-------|-------|
| Valorant | Tactical FPS | Riot API | 25 | Duelist, Controller, Initiator, Sentinel |
| Counter-Strike 2 | Tactical FPS | Steam API | 18 | Entry Fragger, AWPer, Support, Lurker, IGL |
| PUBG Mobile / BGMI | Battle Royale | - | 10 | Fragger, Support, Scout, IGL |
| Free Fire | Battle Royale | - | 7 | Rusher, Support, Sniper, Defuser |
| Clash of Clans | Strategy | CoC API | 8 | War Specialist, Donator, Clan Leader, Base Builder |
| COD Mobile | FPS | - | 7 | Slayer, OBJ, Anchor, Support |
| Other | Any | - | Custom | Custom |

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

# Part II — Getting Started

## 6. Tech Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Language** | TypeScript | 5.x |
| **UI Library** | React | 18.3.1 |
| **Styling** | Tailwind CSS | 4.x |
| **Component Primitives** | Radix UI | v1-v2 |
| **Animation** | Framer Motion | 12.x |
| **Icons** | Lucide React | 0.562 |
| **Database** | PostgreSQL (self-hosted on VPS, via `postgres` driver) | 16 |
| **Auth** | NextAuth.js (Auth.js) | v5 beta |
| **Real-Time** | Socket.io | 4.8.3 |
| **State/Data Fetching** | TanStack React Query | v5 |
| **Client State (optional)** | Zustand | 5.x |
| **Payments** | Stripe | 20.x |
| **Voice/Video** | LiveKit | 2.x |
| **AI** | OpenAI | 6.x |
| **Rich Text Editor** | TipTap | 3.x |
| **Charts** | Recharts | 3.7 |
| **Process Manager** | PM2 | - |
| **Web Server** | Nginx (reverse proxy) | - |
| **Testing** | Jest 30.x + Playwright 1.57.x + Newman | - |
| **Mobile (scaffold)** | Expo (React Native) | - |
| **Toasts** | Sonner | - |
| **Variants** | class-variance-authority + tailwind-merge + clsx | - |

---

## 7. Getting Started (Local Setup)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Git

### Setup
```bash
# Clone the repo
git clone <repo-url>
cd "gamer hub"

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values (see Section 8)

# Run development server
npm run dev
```

The app runs at `http://localhost:3000`.

### Key Scripts
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm test             # Run Jest unit tests
npm run e2e          # Run Playwright E2E tests
npm run lint         # Run ESLint
npm run test:all     # Jest + Playwright
```

---

## 8. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Yes | JWT secret (generate with `openssl rand -base64 32`) |
| `AUTH_SECRET` | Yes (alias) | Auth.js secret (same as `NEXTAUTH_SECRET`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL (https://gglobby.in) |
| `STRIPE_SECRET_KEY` | For payments | Stripe server key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe client key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook validation |
| `LIVEKIT_API_KEY` | For calls | LiveKit API key |
| `LIVEKIT_API_SECRET` | For calls | LiveKit API secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | For calls | LiveKit server URL |
| `OPENAI_API_KEY` | Optional | AI features (matchmaking, news summaries) |
| `RIOT_API_KEY` | Optional | Riot Games API |
| `RIOT_CLIENT_ID` | Optional | Riot OAuth |
| `RIOT_CLIENT_SECRET` | Optional | Riot OAuth |
| `STEAM_API_KEY` | Optional | Steam integration |
| `TWITCH_CLIENT_ID` | Optional | Twitch integration |
| `TWITCH_CLIENT_SECRET` | Optional | Twitch integration |
| `TWITCH_WEBHOOK_SECRET` | Optional | Twitch webhook signature |
| `DISCORD_CLIENT_ID` | Optional | Discord integration |
| `DISCORD_CLIENT_SECRET` | Optional | Discord integration |
| `DISCORD_BOT_TOKEN` | Optional | Discord bot |
| `COC_API_KEY` | Optional | Clash of Clans API |
| `ADMIN_PIN_HASH` | For admin | bcryptjs hash of admin PIN |
| `UPLOAD_DIR` | Production | File upload directory |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics |

### Sample `.env` block

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth.js
AUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000

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
NEXT_PUBLIC_SITE_URL=https://gglobby.in
```

---

# Part III — Architecture

## 9. Project Architecture

### Production Deployment Topology

```
                          ┌─────────────┐
                          │   Browser   │
                          └──────┬──────┘
                                 │ HTTP / WebSocket
                          ┌──────▼──────┐
                          │    Nginx    │  (port 80/443, SSL)
                          └──────┬──────┘
                     ┌───────────┼───────────┐
                     │           │           │
              /uploads/    /socket.io/      /*
              (static)    (WebSocket)    (proxy)
                     │           │           │
                     │     ┌─────▼─────┐     │
                     │     │ Socket.io │     │
                     │     │  Server   │     │
                     │     └─────┬─────┘     │
                     │           │           │
                     └───────────┼───────────┘
                          ┌──────▼──────┐
                          │  Next.js    │  (port 3000)
                          │  App Router │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │ PostgreSQL  │
                          └─────────────┘
```

### High-Level System Architecture

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
  │  │   Components    │  │   /api/* (300+) │  │  (Session)    │ │
  │  └─────────────────┘  └─────────────────┘  └───────────────┘ │
  └────────────────────────────┬──────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
  │   POSTGRESQL    │ │    LIVEKIT      │ │     STRIPE      │
  │   (Self-hosted) │ │    Server       │ │   Payments      │
  │   Auth.js       │ │  (Voice/Video)  │ │  Subscriptions  │
  │   Socket.io     │ └─────────────────┘ └─────────────────┘
  │   File Storage  │
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

**Key architectural decisions:**
- **No Supabase.** The project migrated from Supabase to a self-hosted VPS. We use raw PostgreSQL with a custom query builder that mimics Supabase syntax (`.from().select().eq()`). See `src/lib/db/query-builder.ts`. The Supabase JS client library is no longer used.
- **Custom Socket.io server** (`server.mjs`) runs alongside Next.js for real-time features.
- **Single VPS deployment** with PM2 for process management and Nginx as reverse proxy.
- **No ORM** — all queries go through the fluent query builder or raw SQL via `postgres` driver.

---

## 10. Folder Structure

```
src/
├── app/                        # Next.js App Router (pages + API)
│   ├── (auth)/                 # Auth pages (login, register, etc.)
│   ├── (main)/                 # Main app pages (dashboard, community, etc.)
│   ├── admin/                  # Admin panel pages
│   ├── api/                    # API routes (300+ endpoints)
│   ├── blog/                   # Public blog (SSR)
│   │   ├── page.tsx            # Blog listing
│   │   └── [slug]/page.tsx     # Blog post
│   ├── onboard/page.tsx        # First-time onboarding
│   ├── offline/page.tsx        # PWA offline fallback
│   ├── not-found.tsx           # 404 page
│   ├── robots.ts               # SEO robots.txt
│   ├── sitemap.ts              # Dynamic sitemap
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home (auto-redirect)
│   └── globals.css             # Global styles
│
├── components/                 # React components (57 directories, 100+ files)
│   ├── ui/                     # Base primitives (Button, Dialog, Select, etc.)
│   ├── layout/                 # AppShell, Navbar, Sidebar, RightSidebar
│   ├── auth/                   # Auth forms, gates
│   ├── admin/                  # Admin panel components
│   ├── community/              # Community posts, events, listings
│   ├── messages/               # Chat UI, message bubbles, emoji
│   ├── chat/                   # ChatWindow, ConversationList
│   ├── clans/                  # Clan cards, walls, missions
│   ├── profile/                # Profile pages, customization (44 files)
│   ├── gamification/           # XP, badges, quests, progression
│   ├── blog/                   # Blog editor, cards, comments
│   ├── call/                   # Voice/video call UI (LiveKit)
│   ├── tournaments/            # Tournament cards, bracket views
│   ├── leaderboards/           # Leaderboard tables, season headers
│   ├── community-challenges/   # Challenge cards, progress bars
│   ├── rewards/                # Reward cards, showcases
│   ├── premium/                # Premium banner, subscription status, plans
│   ├── payments/               # Checkout, payment history
│   ├── battle-pass/            # Battle pass track, rewards, purchase
│   ├── shop/                   # Wallet, items, currency packs
│   ├── feed/                   # Feed items, news cards
│   ├── forums/                 # Forum categories, posts, replies, editor
│   ├── streaming/              # Streamer cards, Twitch embed, live section
│   ├── matchmaking/            # Suggestion cards
│   ├── notifications/          # Notification items, center, preferences
│   ├── automation/             # Rule builder, cards, Discord connect
│   ├── integrations/           # Sync status
│   ├── social-lists/           # Social list items, modals
│   ├── suggestions/            # Pro player cards
│   ├── lfg/                    # LFG post cards, create modal
│   ├── settings/               # Theme switcher
│   ├── pwa/                    # PWA provider
│   ├── matches/                # Match cards
│   ├── challenges/             # Challenge cards
│   ├── media/                  # Media uploader
│   ├── updates/                # Updates/changelog page
│   └── dev/                    # PageLoadTimer (dev tools)
│
├── lib/                        # Utilities, services, hooks
│   ├── db/                     # Database clients + query builder (replaces lib/supabase/)
│   ├── auth/                   # NextAuth config, providers
│   ├── hooks/                  # 72 custom React hooks
│   ├── realtime/               # Socket.io provider + server config
│   ├── presence/               # Online presence tracking
│   ├── integrations/           # Game API clients (Riot, Steam, Twitch, Discord, CoC)
│   ├── matchmaking/            # OpenAI matchmaking logic
│   ├── tournament/             # Bracket generation
│   ├── news/                   # RSS parsing, AI summarization
│   ├── constants/              # Game themes, profiles, skins, regions, languages
│   ├── seo/                    # SEO helpers, JSON-LD
│   ├── theme/                  # Theme provider + definitions
│   ├── query/                  # React Query provider
│   ├── data/                   # Seed data, blog helpers
│   ├── api/                    # Cache headers
│   ├── stripe.ts               # Stripe server config
│   ├── stripe-client.ts        # Stripe client config
│   ├── game-configs.ts         # Game configuration
│   └── utils.ts                # General utilities (cn, formatDate, etc.)
│
├── types/                      # TypeScript type definitions (23 files)
│   ├── database.ts             # Core DB types (largest file)
│   ├── news.ts, blog.ts, community.ts, lfg.ts, discord.ts
│   ├── coaching.ts, squad-dna.ts, mood.ts
│   └── ...
│
├── hooks/                      # Additional hooks (useAuthGate)
└── __tests__/                  # Jest unit tests

# Root config files
├── server.mjs                  # Custom Socket.io + Next.js server
├── middleware.ts                # Auth middleware (route protection)
├── next.config.ts              # Next.js configuration
├── ecosystem.config.js         # PM2 configuration
├── jest.config.js              # Jest configuration
├── playwright.config.ts        # Playwright E2E configuration
├── tailwind.config.ts          # Tailwind config
├── CLAUDE.md                   # AI assistant instructions
├── .env.example                # Environment variables template
├── e2e/                        # Playwright E2E tests
├── mobile/                     # Expo React Native scaffold
├── public/                     # PWA manifest, sw.js, icons, images
└── scripts/                    # Deployment, migration, backup scripts
```

---

## 11. Provider Architecture

In `src/app/layout.tsx`, providers wrap the app in this order:

```
RootLayout
  └── QueryProvider (TanStack React Query)
        └── AuthProvider (NextAuth/Auth.js)
              └── SocketProvider (Socket.io)
                    └── PresenceProvider (Online presence tracking)
                          └── ThemeProvider (Custom theme engine)
                                └── PWAProvider (Service worker + install prompt)
                                      └── AuthGateProvider (Route protection)
                                            └── AppShell (Sidebar + Navbar + Content)
                                                  └── Page Content
```

---

## 12. Data Flow Patterns

```
READ FLOW (React Query)
───────────────────────
Component ──▶ useQuery Hook ──▶ API Route ──▶ PostgreSQL
    ▲                                                          │
    └──────────────────── Cached Data ◀────────────────────────┘

WRITE FLOW (Mutations)
──────────────────────
User Action ──▶ useMutation ──▶ API Route ──▶ PostgreSQL
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
PostgreSQL Change ──▶ Socket.io ──▶ Client Subscription
                                                     │
                                                     ▼
                                               React Query Cache
                                               State Update
```

---

# Part IV — Core Systems

## 13. Database Layer

### Connection
We use the [`postgres`](https://github.com/porsager/postgres) driver (NOT Supabase, NOT Prisma, NOT Knex).

```
src/lib/db/
├── client.ts           # createClient() — standard server-side client
├── admin.ts            # createAdminClient() — same as client (no RLS)
├── client-browser.ts   # Browser-side client (proxied through /api/db-proxy)
├── query-builder.ts    # Fluent query builder (Supabase-like API)
├── rpc-types.ts        # Typed RPC function definitions
└── index.ts            # Re-exports
```

### Query Builder Usage
The query builder provides a Supabase-like fluent API over raw PostgreSQL:

```typescript
import { createClient } from "@/lib/db/client";

const db = createClient();

// SELECT with filters
const { data, error } = await db
  .from("profiles")
  .select("id, username, avatar_url")
  .eq("is_online", true)
  .order("last_seen", { ascending: false })
  .limit(20);

// SELECT with joins (foreign key based)
const { data } = await db
  .from("news_articles")
  .select("*, source:news_sources(id, name, slug)")
  .eq("status", "published");

// INSERT
const { data, error } = await db
  .from("profiles")
  .insert({ username: "player1", display_name: "Player One" })
  .select()
  .single();

// UPDATE
const { data } = await db
  .from("profiles")
  .update({ display_name: "New Name" })
  .eq("id", userId)
  .select()
  .single();

// DELETE
await db.from("messages").delete().eq("id", messageId);

// UPSERT
await db
  .from("user_settings")
  .upsert({ user_id: id, theme: "dark" }, { onConflict: "user_id" });

// RPC (stored functions)
const { data } = await db.rpc("get_leaderboard", { game: "valorant", limit: 10 });
```

### Filter Operations
`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `is`, `in`, `not`, `or`, `contains`, `overlaps`, `textSearch`

### Important Notes
- Both `createClient()` and `createAdminClient()` return identical clients. The separation is for code clarity only.
- The browser client (`client-browser.ts`) proxies all queries through `/api/db-proxy` — never exposes the DB connection to the browser.
- Foreign key joins are auto-resolved by querying `information_schema` and caching FK metadata.
- Connection pool: max 20 connections, 20s idle timeout, 10s connect timeout.

---

## 14. Database Migrations & Schema

### Migration History

The database schema is managed through 37+ incremental migrations (originally tracked in `supabase/migrations/`, now mirrored under `scripts/migrations/` for the VPS-tracked `_migrations` table):

| Migration | Domain | Key Tables |
|-----------|--------|------------|
| `001_initial_schema` | Core | profiles, games, user_games, follows, matches, challenges, conversations, messages, media, ratings |
| `002_calls` | Communication | calls, call_participants |
| `003_clans` | Clans | clans, clan_members, clan_invites, clan_games, clan_achievements, clan_challenges, clan_recruitment_posts, clan_activity_log |
| `003_fix_conversation_rls` | Security | RLS policy fixes for conversations |
| `004_tournaments` | Tournaments | tournaments, tournament_participants, tournament_matches, tournament_match_games, tournament_activity_log |
| `004_leaderboards` | Seasons | seasons, season_points, point_transactions, community_challenges, season_rewards, leaderboard_snapshots |
| `004_gamification` | Progression | user_progression, level_thresholds, xp_transactions, titles, profile_frames, profile_themes, badges, quests |
| `005_storage_buckets` | Storage | Storage bucket configuration |
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

### Core Entity Relationships

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

### Key Database Functions

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

### Key Metrics & Scale

| Dimension | Scope |
|-----------|-------|
| Database Tables | 50+ |
| API Endpoints | 300+ |
| React Components | 100+ |
| Custom Hooks | 72 |
| Database Migrations | 37+ |
| Supported Regions | 7 |
| Supported Languages | 11 |

---

## 15. Authentication & Security

### Stack
- **NextAuth.js v5** (Auth.js) with JWT strategy
- **Providers:** Google OAuth + Email/Password (credentials)
- **Password hashing:** bcryptjs
- **Session duration:** 30 days

### Key Files
```
src/lib/auth/
├── auth.config.ts      # NextAuth configuration (providers, callbacks)
├── AuthProvider.tsx     # Client-side auth context
└── get-user.ts         # Server-side: get current user from session

src/app/(auth)/
├── login/page.tsx
├── register/page.tsx
├── onboarding/page.tsx
├── reset-password/page.tsx
└── update-password/page.tsx

middleware.ts           # Route protection
```

### Auth Flow
```
1. User logs in (Google OAuth or email/password)
2. NextAuth validates credentials
3. JWT token created with user.id
4. Token stored in httpOnly cookie (30-day expiry)
5. middleware.ts checks routes:
   - /admin/* → requires session, otherwise redirect to /login
   - /api/admin/* → requires session + admin_pin_verified cookie
   - /login, /register → redirect to /community if already logged in
   - / → redirect to /community
```

### Getting the Current User in API Routes
```typescript
import { getUser } from "@/lib/auth/get-user";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // user.id is available
}
```

### Admin Auth
Admin pages have a **two-layer** auth:
1. Regular session (JWT) — enforced by middleware
2. **PIN verification** — a PIN entered on the admin page, hashed with bcryptjs, stored as `admin_pin_verified` cookie

### Security Layers

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Auth.js / NextAuth v5 with email/password + Google OAuth, JWT sessions |
| **Session Management** | Middleware refreshes tokens on every request |
| **Route Protection** | AuthGateProvider + middleware matcher |
| **Database Security** | Row Level Security (RLS) policies on all tables |
| **API Security** | Server-side database client with session validation |
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

> Note: per `CLAUDE.md`, RLS policies still need tightening before team expansion (currently a broad `allow_all` exists on `news_articles`). See the Pre-Team Expansion Checklist in `CLAUDE.md`.

---

## 16. Real-Time System (Socket.io)

### Architecture
The Socket.io server runs alongside Next.js in `server.mjs`. The `io` instance is stored on `globalThis.__socket_io__` so API routes can emit events.

### Key Files
```
server.mjs                          # Socket server setup + event handlers
src/lib/realtime/SocketProvider.tsx  # Client-side Socket context
src/lib/presence/PresenceProvider.tsx # Online presence tracking
```

### Events Reference

| Event | Direction | Purpose |
|-------|-----------|---------|
| `presence:sync` | Server → Client | Broadcast online users |
| `message:new` | Server → Client | New message in conversation |
| `message:deleted` | Server → Client | Message deleted |
| `conversation:updated` | Server → Client | Conversation metadata changed |
| `typing:start` / `typing:stop` | Both | Typing indicators |
| `notification:new` | Server → Client | New notification |
| `tournament:updated` | Server → Client | Tournament state change |
| `call:incoming` | Server → Client | Incoming voice/video call |
| `read-receipt:updated` | Server → Client | Message read status |
| `unread:updated` | Server → Client | Unread count changed |
| `status:set` | Client → Server | Set custom status |
| `status:auto-away` | Client → Server | User went idle |
| `status:back` | Client → Server | User returned from idle |

### Presence Tracking
- **Multi-tab support:** Each user has a `Set` of socket IDs (one per browser tab)
- **5-second grace period:** On disconnect, waits 5s before marking offline (prevents false "offline" on page refresh)
- **Status persistence:** Saved to DB so it survives server restarts
- **Auto-away:** Client detects inactivity and emits `status:auto-away`

### Emitting Events from API Routes
```typescript
// In any API route:
const io = (globalThis as any).__socket_io__;
if (io) {
  io.to(`user:${recipientId}`).emit("notification:new", { ... });
}
```

---

# Part V — APIs & Frontend

## 17. API Routes Guide

All API routes are in `src/app/api/`. The project has **300+ endpoints** organized by feature.

### Standard Pattern
Every API route follows this pattern:

```typescript
// src/app/api/feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/client";
import { getUser } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createClient();
    const { data, error } = await db.from("table").select("*").eq("user_id", user.id);

    if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
    return NextResponse.json({ items: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Admin API Pattern
Admin routes additionally check `is_admin` on the profile:

```typescript
const admin = createAdminClient();
const { data: profile } = await admin
  .from("profiles")
  .select("is_admin")
  .eq("id", user.id)
  .single();

if (!profile?.is_admin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Major API Directories

| Directory | Endpoints | Purpose |
|-----------|-----------|---------|
| `/api/auth/` | 4 | Registration, login, password reset |
| `/api/friends/` | 6 | Friends, requests, followers, following |
| `/api/messages/` | 8 | DMs, conversations, typing, reactions |
| `/api/clans/` | 12 | Clan CRUD, members, missions, scrims, wall |
| `/api/blog/` | 6 | Blog posts, comments, likes |
| `/api/news/` | 3 | News articles, comments |
| `/api/community-challenges/` | 3 | Challenges, join |
| `/api/tournaments/` | 5 | Tournaments, brackets, participants |
| `/api/lfg/` | 4 | LFG posts, apply, matching |
| `/api/battle-pass/` | 4 | Battle pass, progress, purchase, claim |
| `/api/shop/` | 4 | Shop items, purchase, currency |
| `/api/stripe/` | 5 | Checkout, customer, webhook |
| `/api/integrations/` | 15+ | Discord, Steam, Riot, Xbox, PS, etc. |
| `/api/admin/` | 8 | Analytics, users, news, blog, reports |
| `/api/gamers/` | 1 | Find gamers |
| `/api/ratings/` | 5 | Trust scores, endorsements |
| `/api/notifications/` | 2 | Notifications, preferences |
| `/api/quests/` | 3 | Active quests, claim, assign |
| `/api/wallet/` | 2 | Balance, transactions |

---

## 18. Complete API Reference

Detailed route table covering the historical 90+ endpoint catalogue (still accurate for the listed surfaces; newer surfaces are summarized in Section 17).

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/auth/callback` | OAuth callback handler |

### Games
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/games` | List all supported games |

### Social & Friends
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

### Progression & Gamification
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

### Quests
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/quests/active` | User's active quests |
| POST | `/api/quests/assign` | Assign daily/weekly quests |
| POST | `/api/quests/[questId]/claim` | Claim quest reward |

### Leaderboards & Seasons
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leaderboard` | Global leaderboard |
| GET | `/api/leaderboards` | Season leaderboards |
| GET | `/api/leaderboards/me` | User's position |
| GET | `/api/seasons` | List seasons |
| GET | `/api/seasons/current` | Current season |
| GET | `/api/seasons/[seasonId]` | Season details |

### Community Challenges
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/community-challenges` | List challenges |
| GET/POST | `/api/community-challenges/[id]` | Details / update |
| POST | `/api/community-challenges/[id]/join` | Join challenge |

### Rewards
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/rewards` | List available rewards |
| POST | `/api/rewards/[id]/claim` | Claim reward |
| POST | `/api/rewards/[id]/equip` | Equip reward |

### Clans
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

### Tournaments
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/tournaments` | List / create |
| GET/PUT | `/api/tournaments/[id]` | Details / update |
| GET/POST | `/api/tournaments/[id]/participants` | List / register |
| GET | `/api/tournaments/[id]/bracket` | Get bracket |
| GET/POST | `/api/tournaments/[id]/matches` | List / create match |
| PUT | `/api/tournaments/[id]/matches/[matchId]` | Submit result |

### Voice/Video (LiveKit)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/livekit/token` | Generate room token |
| POST | `/api/livekit/call` | Initiate call |

### Payments (Stripe)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/stripe/create-customer` | Create Stripe customer |
| POST | `/api/stripe/create-checkout-session` | Start checkout |
| POST | `/api/stripe/create-portal-session` | Customer portal |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| GET | `/api/stripe/payment-methods` | List payment methods |
| POST | `/api/subscriptions/cancel` | Cancel subscription |
| POST | `/api/subscriptions/resume` | Resume subscription |

### Virtual Currency & Shop
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wallet` | Get wallet balance |
| GET | `/api/wallet/transactions` | Transaction history |
| GET | `/api/shop/items` | Shop item catalog |
| POST | `/api/shop/purchase` | Purchase item |
| GET | `/api/shop/currency-packs` | Currency pack options |
| POST | `/api/shop/buy-currency` | Buy virtual currency |

### Battle Pass
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/battle-pass` | Current battle pass info |
| GET | `/api/battle-pass/progress` | User progress |
| POST | `/api/battle-pass/purchase` | Purchase premium pass |
| POST | `/api/battle-pass/claim/[rewardId]` | Claim tier reward |

### Game Integrations
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/integrations` | List connected integrations |
| GET | `/api/integrations/status` | Connection status |
| POST | `/api/integrations/riot/connect` | Connect Riot account |
| GET | `/api/integrations/riot/callback` | Riot OAuth callback |
| POST | `/api/integrations/steam/connect` | Connect Steam account |
| GET | `/api/integrations/steam/callback` | Steam OAuth callback |
| GET | `/api/users/[userId]/game-stats` | Synced game stats |

### Twitch & Streaming
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/twitch/connect` | Connect Twitch account |
| GET | `/api/twitch/callback` | Twitch OAuth callback |
| POST | `/api/twitch/webhook` | Twitch event webhook |
| GET | `/api/streamers` | List streamers |
| GET | `/api/streamers/[userId]` | Streamer profile |
| POST | `/api/streamers/[userId]/follow` | Follow streamer |

### Discord
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/discord/connect` | Connect Discord |
| GET | `/api/discord/callback` | Discord OAuth callback |
| POST | `/api/discord/disconnect` | Disconnect Discord |
| GET | `/api/discord/status` | Connection status |
| POST | `/api/discord/webhook` | Discord webhook events |

### AI Matchmaking
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/matchmaking/suggest-teammates` | AI teammate suggestions |
| POST | `/api/matchmaking/team-balance` | Team balance analysis |
| POST | `/api/matchmaking/predict-outcome` | Match outcome prediction |

### Forums
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/forums/categories` | Forum categories |
| GET/POST | `/api/forums/posts` | List / create posts |
| GET/PUT | `/api/forums/posts/[postId]` | Post details / update |
| POST | `/api/forums/posts/[postId]/vote` | Vote on post |
| POST | `/api/forums/posts/[postId]/replies` | Reply to post |
| POST | `/api/forums/replies/[replyId]/vote` | Vote on reply |
| POST | `/api/forums/replies/[replyId]/solution` | Mark as solution |

### Activity Feed
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/feed` | Activity feed |
| POST | `/api/feed/[activityId]/react` | React to activity |

### Notifications & Automation
| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/notifications/preferences` | Notification settings |
| GET/POST | `/api/automation/rules` | List / create rules |
| GET/PUT/DELETE | `/api/automation/rules/[ruleId]` | Rule CRUD |

---

## 19. Frontend Patterns

### Component Structure
Components are organized by **feature domain**, not by type:

```
src/components/
├── ui/                 # Shared primitives (use these, don't reinvent)
├── layout/             # App shell, nav, sidebar
├── [feature]/          # Feature-specific components
└── [feature]/index.ts  # Barrel exports
```

### State Management
- **Server state:** TanStack React Query (all data fetching goes through hooks)
- **Client state:** React useState/useContext (Zustand is available but used sparingly)
- **No Redux** — keep it simple

### Custom Hooks Pattern
All data fetching is done through hooks in `src/lib/hooks/`. Each hook wraps React Query:

```typescript
// src/lib/hooks/useFeature.ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useFeature() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feature"],
    queryFn: async () => {
      const res = await fetch("/api/feature");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    },
  });

  return { items: data?.items || [], loading: isLoading, error };
}
```

### All 72 Hooks (by feature area)

**Auth & Users:**
useAuth, useAdmin, usePermissions

**Social:**
useFriends, useFriendRequests, useFollowing, useMessages, useNotifications, usePublicSocialList

**Content:**
useBlog, useBlogAuthor, useNewsComments, useCommunity, useFriendPosts, useForums, useNews

**Gaming:**
useGames, useUserGames, useLFG, useMatchmaking, useTournament, useTournaments, useTournamentBracket

**Clans:**
useClans, useClan, useClanMembers, useClanMembership, useClanMissions, useClanScrims, useClanWall, useClanChallenges, useClanInvites

**Gamification:**
useBadges, useQuests, useProgression, useBattlePass, useSeason, useSeasonLeaderboard, useSeasonRewards, useLeaderboard, useAchievementHunt

**Economy:**
useShop, useWallet, useSubscription

**Profile:**
useActivity, useSidebarActivity, useMood, useSquadDNA, useRatings, useStreaming, useCreatorProfile, useCommitment, useAccessibility

**Integrations:**
useIntegrations, useDiscordIntegration, useConsolePlatforms, useConversationGames

**Admin:**
useAdminAnalytics, useAdminBlog, useAdminNews, useAdminReports, useAdminUsers

**Misc:**
useTranslation, useUniversalSearch, useSuggestions, useProPlayers, useListings, useCoaching, useReplayRoom, useVerification, useVerifiedQueue, useAutomation, useCommunityChallenge

### Styling Conventions
- **Tailwind CSS 4** for all styling — no CSS modules, no styled-components
- **cn()** utility for conditional classes: `cn("base-class", condition && "active-class")`
- **CVA** (class-variance-authority) for component variants
- **Dark theme only** — the entire app uses dark backgrounds (`bg-[#0a0a0f]`, `text-white`)
- **Glass morphism** pattern: `bg-white/[0.03] border border-white/10 backdrop-blur`
- **Accent colors:** Violet (primary), Emerald (success), Amber (warning), Red (error)
- **Game colors:** Red = Valorant, Orange = BGMI, Yellow = Free Fire

### Responsiveness
Per `CLAUDE.md`: whenever changing or adding styling, ensure it is fully responsive across all screen sizes — mobile, tablet, and desktop. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).

---

## 20. Feature → File Map

Quick reference: "I need to work on X, where do I look?"

| Feature | Page | Components | Hook | API Route |
|---------|------|------------|------|-----------|
| **Login/Register** | `(auth)/login`, `(auth)/register` | `components/auth/` | `useAuth` | `/api/auth/` |
| **User Profile** | `(main)/profile/[username]` | `components/profile/` (44 files) | `useActivity`, `useRatings` | `/api/profile`, `/api/users/` |
| **Friends** | `(main)/friends` | `components/friends/` | `useFriends`, `useFriendRequests`, `useFollowing` | `/api/friends/` |
| **Messaging** | `(main)/messages/[id]` | `components/messages/` | `useMessages` | `/api/messages/` |
| **Community Feed** | `(main)/community` | `components/community/` | `useCommunity`, `useFriendPosts` | `/api/friend-posts/`, `/api/listings/` |
| **News** | `(main)/news/[id]`, `(main)/community` | `components/news/` | `useNewsComments`, `useAdminNews` | `/api/news/`, `/api/admin/news/` |
| **Blog** | `(main)/blog`, `(main)/write` | `components/blog/` (13 files) | `useBlog`, `useBlogAuthor` | `/api/blog/` |
| **Clans** | `(main)/clans`, `(main)/clans/[slug]` | `components/clans/` | `useClans`, `useClan`, `useClanMembers`, etc. | `/api/clans/` |
| **Find Gamers/LFG** | `(main)/find-gamers` | `components/lfg/`, `components/gamers/` | `useLFG`, `useMatchmaking` | `/api/lfg/`, `/api/gamers/` |
| **Tournaments** | Community page tab | `components/tournaments/` | `useTournaments`, `useTournamentBracket` | `/api/tournaments/` |
| **Dashboard** | `(main)/dashboard` | `components/gamification/` | `useProgression`, `useQuests`, `useBattlePass` | `/api/quests/`, `/api/battle-pass/` |
| **Shop** | Dashboard | `components/shop/` | `useShop`, `useWallet` | `/api/shop/` |
| **Badges/Quests** | Dashboard, Profile | `components/gamification/` | `useBadges`, `useQuests` | `/api/badges/`, `/api/quests/` |
| **Leaderboards** | Dashboard | `components/leaderboards/` | `useLeaderboard`, `useSeasonLeaderboard` | `/api/leaderboards/` |
| **Voice/Video Calls** | Messages | `components/call/` | - | `/api/livekit/` |
| **Notifications** | `(main)/notifications` | `components/notifications/` | `useNotifications` | `/api/notifications/` |
| **Settings** | `(main)/settings` | `components/settings/` | - | `/api/profile`, `/api/notifications/preferences` |
| **Premium** | `(main)/premium` | `components/premium/`, `components/payments/` | `useSubscription` | `/api/stripe/`, `/api/subscriptions/` |
| **Search** | `(main)/search` | `components/search/` | `useUniversalSearch` | `/api/users/search` |
| **Integrations** | `(main)/settings/connections` | `components/integrations/` | `useIntegrations`, `useDiscordIntegration` | `/api/integrations/` |
| **Forums** | Community tab | `components/forums/` | `useForums` | `/api/forums/` |
| **Coaching** | Community tab | `components/coaching/` | `useCoaching` | `/api/coaches/`, `/api/coaching/` |
| **Streaming** | Community/Profiles | `components/streaming/` | `useStreaming` | `/api/streamers/` |
| **Updates Page** | `(main)/updates` | `components/updates/` | - | - (static data) |
| **Admin Panel** | `admin/*` | `components/admin/` | `useAdmin*` hooks | `/api/admin/` |

---

# Part VI — Features & Integrations

## 21. Admin Panel

### Access
- URL: `/admin`
- Requires: logged-in user with `is_admin = true` in profiles table
- Additional: PIN verification (enter PIN → stored as hashed cookie)

### Admin Pages

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/admin` | Overview stats |
| Users | `/admin/users` | User management, ban, verify |
| News | `/admin/news` | Manage/fetch/publish news (3 tabs: Our News, Fetched News, RSS Sources) |
| Blog | `/admin/blog` | Manage blog posts |
| Authors | `/admin/authors` | Manage blog authors |
| Reports | `/admin/reports` | User reports & moderation |
| Feedback | `/admin/feedback` | User feedback/suggestions |
| Analytics | `/admin/analytics` | Usage analytics |

### News Auto-Fetch System
The news system fetches articles from RSS feeds, auto-detects which game they're about using keyword scoring, and queues them for admin review.

**Flow:**
1. Admin clicks "Fetch Latest News" on the Fetched News tab
2. API (`/api/admin/news/fetch`) reads active sources from `news_sources` table
3. Parses each RSS feed with `rss-parser`
4. Runs game detection (weighted keyword matching in `src/lib/news/constants.ts`)
5. Inserts new articles as `status: "pending"`
6. Auto-cleans old pending articles (keeps 5 newest per game)
7. Admin reviews, edits, and publishes from the admin panel

---

## 22. Payments (Stripe)

### Files
```
src/lib/stripe.ts            # Server-side Stripe SDK (lazy init)
src/lib/stripe-client.ts     # Client-side Stripe.js (lazy init via Proxy)
src/components/payments/     # Checkout, pricing, payment history components
src/components/premium/      # Premium plans, badges, feature gates
src/app/api/stripe/          # Stripe API endpoints
```

### Stripe Flow
```
1. User clicks "Subscribe" → /api/stripe/create-checkout-session
2. Stripe Checkout opens
3. User pays → Stripe sends webhook → /api/stripe/webhook
4. Webhook updates user's subscription in DB
5. Features unlocked based on subscription tier
```

### Currency
All prices are in **INR** (Indian Rupees). The `stripe.ts` has helpers for paise ↔ rupees conversion.

### Stripe Endpoints Summary

| Component | Purpose |
|-----------|---------|
| `create-customer` | Creates Stripe customer on signup |
| `create-checkout-session` | Initiates subscription/purchase flow |
| `create-portal-session` | Self-service billing management |
| `webhook` | Handles payment events (subscription created/cancelled/updated) |
| `payment-methods` | Lists saved payment methods |

---

## 23. Monetization Strategy

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

---

## 24. Voice/Video Calls (LiveKit)

### Files
```
src/components/call/          # Call UI (room, controls, participants)
src/app/api/livekit/token     # Generate LiveKit access token
src/app/api/livekit/call      # Initiate call (notifies via Socket.io)
```

### Flow
```
1. User clicks "Call" → /api/livekit/call
2. API generates LiveKit token + emits call:incoming via Socket.io
3. Recipient sees incoming call modal
4. Both users join LiveKit room with their tokens
5. WebRTC handles audio/video streaming
```

---

## 25. Third-Party Integrations

All integration clients are in `src/lib/integrations/`:

| File | Service | Features |
|------|---------|----------|
| `discord.ts` | Discord | Bot commands, webhooks, friend import, crossposting |
| `riot.ts` | Riot Games | Valorant stats, match history |
| `steam.ts` | Steam | Profile linking, game library |
| `twitch.ts` | Twitch | Stream status, follow, OAuth |
| `coc.ts` | Clash of Clans | Player stats, clan data |

### Game API Integrations Summary

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

### OAuth Flow (Discord, Twitch, Steam, Riot, Xbox, PlayStation, Nintendo)
```
/api/integrations/[provider]/connect → Redirect to OAuth
/api/integrations/[provider]/callback → Handle token, save to DB
/api/integrations/[provider]/disconnect → Remove integration
```

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

## 26. SEO, PWA & Mobile

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

# Part VII — Operations

## 27. Testing

### Unit Tests (Jest)
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report (threshold: 70%)
npm run test:ui             # Component tests only
npm run test:api            # API tests only
```

- Config: `jest.config.js`
- Setup: `jest.setup.tsx` (mocks for Next.js, framer-motion, DB, auth)
- Test files: `src/__tests__/`

### E2E Tests (Playwright)
```bash
npm run e2e                 # Run all E2E tests
npm run e2e:ui              # Visual UI mode
npm run e2e:headed          # Headed browser mode
npm run e2e:mobile          # Mobile viewport only
npm run e2e:browserstack    # Cross-browser on BrowserStack
```

- Config: `playwright.config.ts`
- Test files: `e2e/`
- Viewports tested: Desktop (1920x1080), Tablet (1024x768), Mobile (393x851, 390x844)
- Browsers: Chrome, Firefox, Safari

### API Tests (Postman/Newman)
```bash
npm run postman:test
```
- Collection: `postman/gglobby-api-collection.json`

---

## 28. Deployment

### Server
- **VPS:** Single server at `187.77.191.134`
- **OS:** Ubuntu with Nginx, Node.js 20, PostgreSQL 16
- **Process:** PM2 running `server.mjs`
- **Domain:** gglobby.in (SSL via Let's Encrypt/certbot)

### Deploy Process
```bash
# On the VPS:
cd /var/www/gglobby
bash scripts/deploy.sh
```

**What `deploy.sh` does:**
1. `git pull` latest code
2. `npm install` (if package-lock changed)
3. Run pending SQL migrations (tracked in `_migrations` table)
4. `npm run build`
5. `pm2 restart gglobby`

### PM2 Config (`ecosystem.config.js`)
- Single instance (no clustering)
- Max memory: 3GB
- Auto-restart on crash
- Logs: `/var/www/gglobby/logs/`

### Nginx
- Proxies `/*` → `localhost:3000`
- Serves `/uploads/*` directly (30-day cache)
- WebSocket upgrade for `/socket.io/*`
- Max upload: 50MB

### Scripts Reference
```
scripts/
├── deploy.sh               # Main deploy script
├── vps-setup.sh            # Initial VPS setup (run once)
├── backup.sh               # Database backup
├── deploy-guide.sh         # Step-by-step deploy instructions
├── troubleshooting.sh      # Common fixes
├── migration-schema.sql    # Initial DB schema
└── migrations/             # Tracked SQL migrations
```

---

## 29. Common Patterns & Conventions

### File Naming
- **Pages:** `page.tsx` (Next.js convention)
- **Components:** `kebab-case.tsx` (e.g., `friend-card.tsx`)
- **Hooks:** `camelCase.ts` with `use` prefix (e.g., `useFriends.ts`)
- **API routes:** `route.ts` inside feature directory
- **Types:** `kebab-case.ts` (e.g., `squad-dna.ts`)

### Component Pattern
```typescript
"use client";  // Most components are client components

import { useState } from "react";
import { toast } from "sonner";
import { SomeIcon } from "lucide-react";
import { useSomeHook } from "@/lib/hooks/useSomeHook";

export function MyComponent({ prop }: { prop: string }) {
  // Hook calls
  // State
  // Handlers
  // Return JSX
}
```

### Error Handling Pattern
- API routes: try/catch with `NextResponse.json({ error }, { status })`
- Client mutations: try/catch with `toast.error()`
- Always check `!response.ok` before using response data

### Toasts
```typescript
import { toast } from "sonner";
toast.success("Done!");
toast.error("Something failed");
```

### Path Aliases
```
@ → src/  (configured in tsconfig.json)
```
So `@/lib/db/client` means `src/lib/db/client`.

### Git Conventions
- Main branch: `main`
- Deploy from: `main`
- Commit messages: descriptive, present tense

### Updates Page Rule
Per `CLAUDE.md`: whenever pushing code, update `src/components/updates/updates-page-client.tsx` with significant changes (features, major fixes, UI overhauls). See `CLAUDE.md` for the exact entry format.

### Common Development Task Cheat Sheet

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
| Add a database migration | `scripts/migrations/[number]_[name].sql` |
| Get database client (server) | `import { createClient } from '@/lib/db/client'` |
| Get database client (browser) | `import { createClient } from '@/lib/db/client-browser'` |
| Get current user (server) | `const user = await getUser()` from `@/lib/auth/get-user` |
| Get current user (client) | `const { user, profile } = useAuth()` |
| Get progression data | `const { progression } = useProgression()` |
| Get quest data | `const { dailyQuests, weeklyQuests } = useQuests()` |

---

## 30. Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection pool isn't exhausted (max 20 connections)

### "Socket.io not working"
- In dev: Socket.io only works with the custom server (`server.mjs`), not `next dev`
- In production: check Nginx config has WebSocket upgrade for `/socket.io/`
- Check `NEXT_PUBLIC_APP_URL` matches the actual URL

### "Admin panel 403"
- Ensure your user has `is_admin = true` in the `profiles` table
- Verify the admin PIN cookie is set (re-enter PIN if expired)
- Check `ADMIN_PIN_HASH` env variable matches your PIN

### "Build fails with type errors"
- `typescript.ignoreBuildErrors` is `true` in next.config.ts — build shouldn't fail on types
- If it does, run `npx tsc --noEmit` to see actual errors
- Most "errors" from bare `tsc` are false positives from Next.js/node_modules types

### "RSS news fetch failing"
- Go to Admin → News → RSS Sources tab
- Check if the failing source URL is still valid
- Edit the URL or disable the source
- Use "Browse News Manually" links as fallback

### "Stripe webhook not processing"
- Verify `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard
- Check webhook endpoint is accessible: `https://gglobby.in/api/stripe/webhook`
- Check PM2 error logs: `pm2 logs gglobby --err`

### Useful Commands (on VPS)
```bash
pm2 logs gglobby              # View app logs
pm2 logs gglobby --err        # Error logs only
pm2 restart gglobby           # Restart app
pm2 monit                     # Monitor resources
sudo systemctl restart nginx  # Restart Nginx
sudo -u postgres psql gamerhub  # Connect to DB
```

---

## 31. Complete Commands Reference

> Every command a developer might need — no Googling required.

### Local Development

```bash
# ── Starting the app ──
npm run dev                          # Start Next.js dev server (http://localhost:3000)
npm run build                        # Create production build
npm run start                        # Start production server locally
node server.mjs                      # Start with Socket.io (needed for real-time features)

# ── Linting & Type Checking ──
npm run lint                         # Run ESLint
npx tsc --noEmit                     # Type-check without building (expect some false positives from node_modules)

# ── Dependencies ──
npm install                          # Install all dependencies
npm install <package>                # Add a dependency
npm install -D <package>             # Add a dev dependency
npm update                           # Update packages to latest compatible versions
npm ls <package>                     # Check installed version of a package
npm outdated                         # See which packages have newer versions

# ── Environment ──
cp .env.example .env.local           # Create local env file (first time setup)
```

### Git Commands

```bash
# ── Daily Workflow ──
git status                           # See what's changed
git diff                             # See unstaged changes
git diff --staged                    # See staged changes
git add <file>                       # Stage specific file
git add .                            # Stage all changes
git commit -m "your message"         # Commit
git push origin main                 # Push to remote
git pull origin main                 # Pull latest changes

# ── Branches ──
git branch                           # List local branches
git branch -a                        # List all branches (including remote)
git checkout -b feature/my-feature   # Create and switch to new branch
git checkout main                    # Switch to main branch
git merge feature/my-feature         # Merge branch into current branch
git branch -d feature/my-feature     # Delete branch (after merging)

# ── Undoing Things ──
git checkout -- <file>               # Discard changes to a file
git reset HEAD <file>                # Unstage a file
git reset --soft HEAD~1              # Undo last commit (keep changes staged)
git stash                            # Temporarily save uncommitted changes
git stash pop                        # Restore stashed changes
git stash list                       # See all stashes

# ── Viewing History ──
git log --oneline -20                # Last 20 commits (short)
git log --oneline --graph            # Visual branch history
git log -p <file>                    # See full change history of a file
git blame <file>                     # See who changed each line
git show <commit-hash>               # See a specific commit

# ── Remote ──
git remote -v                        # Show remote URLs
git fetch origin                     # Download remote changes without merging
```

### GitHub CLI (gh)

```bash
# ── Pull Requests ──
gh pr create --title "Title" --body "Description"   # Create PR
gh pr list                                           # List open PRs
gh pr view <number>                                  # View PR details
gh pr checkout <number>                              # Checkout PR locally
gh pr merge <number>                                 # Merge PR
gh pr diff <number>                                  # View PR diff

# ── Issues ──
gh issue create --title "Bug: ..." --body "..."      # Create issue
gh issue list                                         # List open issues
gh issue view <number>                                # View issue
gh issue close <number>                               # Close issue

# ── Repo ──
gh repo view --web                                    # Open repo in browser
gh run list                                           # See CI/CD runs
gh run view <run-id>                                  # View specific run
```

### PostgreSQL / Database Commands

```bash
# ── Connecting ──
sudo -u postgres psql gamerhub                        # Connect to DB (on VPS)
psql -U gamerhub_app -h localhost -d gamerhub          # Connect with app user
psql "$DATABASE_URL"                                   # Connect using env variable

# ── From local machine via SSH tunnel ──
ssh -L 5432:localhost:5432 root@187.77.191.134        # Create SSH tunnel first
psql -U gamerhub_app -h localhost -d gamerhub          # Then connect locally
```

```sql
-- ── Viewing Data ──
\dt                                    -- List all tables
\dt+                                   -- List tables with sizes
\d profiles                            -- Describe a table (columns, types, constraints)
\d+ profiles                           -- Describe with extra detail
\di                                    -- List all indexes
\df                                    -- List all functions
\dn                                    -- List schemas
\l                                     -- List all databases
\du                                    -- List all users/roles

-- ── Common Queries ──
SELECT * FROM profiles LIMIT 10;
SELECT id, username, is_admin FROM profiles WHERE is_admin = true;
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM profiles WHERE is_online = true;

-- ── Users & Auth ──
SELECT id, email, provider, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- Find user by email
SELECT u.id, u.email, p.username, p.display_name
FROM users u JOIN profiles p ON u.id = p.id
WHERE u.email = 'someone@gmail.com';

-- Make someone admin
UPDATE profiles SET is_admin = true WHERE username = 'some_user';

-- Remove admin
UPDATE profiles SET is_admin = false WHERE username = 'some_user';

-- ── News Sources ──
SELECT id, name, url, is_active, last_fetched_at FROM news_sources ORDER BY created_at;

-- Fix a broken RSS source URL
UPDATE news_sources SET url = 'https://new-feed-url.com/feed' WHERE name ILIKE '%sportskeeda%';

-- Disable a source
UPDATE news_sources SET is_active = false WHERE id = 'source-uuid-here';

-- ── Tables & Schema ──
-- Check foreign keys for a table
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'profiles';

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('profiles'));

-- Check DB size
SELECT pg_size_pretty(pg_database_size('gamerhub'));

-- ── Maintenance ──
VACUUM ANALYZE;                        -- Reclaim storage and update statistics
VACUUM ANALYZE profiles;               -- For a specific table

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'gamerhub';

-- Kill idle connections (careful!)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'gamerhub' AND state = 'idle' AND pid <> pg_backend_pid();

-- ── Quitting ──
\q                                     -- Exit psql
```

### SQL Migrations

```bash
# ── Creating a new migration ──
# 1. Create a .sql file in scripts/migrations/ with a numbered prefix:
#    scripts/migrations/002_add_some_column.sql
#
# 2. Write your SQL:
#    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS new_col TEXT;
#
# 3. Deploy will auto-run it (tracked in _migrations table)

# ── Checking migration status ──
sudo -u postgres psql -d gamerhub -c "SELECT * FROM _migrations ORDER BY applied_at;"

# ── Running a migration manually ──
sudo -u postgres psql -d gamerhub -f scripts/migrations/002_add_some_column.sql

# ── Recording a manually-run migration ──
sudo -u postgres psql -d gamerhub -c "INSERT INTO _migrations (filename) VALUES ('002_add_some_column.sql');"
```

### VPS / Server Commands

```bash
# ── SSH into VPS ──
ssh root@187.77.191.134

# ── PM2 (Process Manager) ──
pm2 status                            # See running processes
pm2 logs gglobby                      # View app logs (live stream)
pm2 logs gglobby --lines 100          # Last 100 log lines
pm2 logs gglobby --err                # Error logs only
pm2 restart gglobby                   # Restart the app
pm2 stop gglobby                      # Stop the app
pm2 start ecosystem.config.js         # Start from config (first time)
pm2 monit                             # Real-time CPU/memory monitor
pm2 save                              # Save current process list
pm2 startup                           # Set PM2 to start on boot
pm2 flush                             # Clear all log files

# ── Nginx ──
sudo nginx -t                         # Test Nginx config (always run before reload!)
sudo systemctl reload nginx           # Reload config (no downtime)
sudo systemctl restart nginx          # Full restart
sudo systemctl status nginx           # Check Nginx status
sudo cat /var/log/nginx/error.log     # Nginx error log
sudo cat /var/log/nginx/access.log    # Nginx access log
sudo nano /etc/nginx/sites-available/gglobby   # Edit site config

# ── SSL / HTTPS ──
sudo certbot --nginx -d gglobby.in -d www.gglobby.in   # Setup/renew SSL
sudo certbot renew --dry-run                             # Test renewal
sudo certbot certificates                                # Check cert status

# ── PostgreSQL Service ──
sudo systemctl status postgresql      # Check DB status
sudo systemctl restart postgresql     # Restart DB
sudo systemctl start postgresql       # Start DB
sudo systemctl stop postgresql        # Stop DB

# ── System Monitoring ──
htop                                  # Interactive process monitor
df -h                                 # Disk space usage
free -h                               # Memory usage
du -sh /var/www/gglobby               # App directory size
du -sh /var/www/gglobby/uploads       # Uploads size
du -sh /var/www/gglobby/.next         # Build cache size
uptime                                # Server uptime and load
```

### Deployment Commands

```bash
# ── Standard Deploy (on VPS) ──
cd /var/www/gglobby
bash scripts/deploy.sh                # Pull → install → migrate → build → restart

# ── Manual Deploy Steps (if script fails) ──
cd /var/www/gglobby
git pull origin main                  # 1. Pull code
npm install                           # 2. Install deps
npm run build                         # 3. Build
pm2 restart gglobby                   # 4. Restart

# ── Rollback to Previous Version ──
cd /var/www/gglobby
git log --oneline -10                 # Find the commit to rollback to
git checkout <commit-hash>            # Checkout that commit
npm run build                         # Rebuild
pm2 restart gglobby                   # Restart
# WARNING: This puts you in detached HEAD. To go back:
# git checkout main

# ── Database Backup ──
bash scripts/backup.sh                             # Run backup script
pg_dump -U gamerhub_app gamerhub > backup.sql       # Manual full backup
pg_dump -U gamerhub_app gamerhub | gzip > backup.sql.gz  # Compressed backup

# ── Database Restore ──
sudo -u postgres psql gamerhub < backup.sql         # Restore from backup
gunzip -c backup.sql.gz | sudo -u postgres psql gamerhub  # From compressed

# ── Setup Daily Backups (crontab) ──
crontab -e
# Add this line:
# 0 3 * * * /var/www/gglobby/scripts/backup.sh
```

### Testing Commands

```bash
# ── Unit Tests (Jest) ──
npm test                              # Run all unit tests
npm run test:watch                    # Watch mode (re-runs on file change)
npm run test:coverage                 # Generate coverage report
npm run test:ui                       # Test components only
npm run test:api                      # Test API routes only

# ── E2E Tests (Playwright) ──
npm run e2e                           # Run all E2E tests
npm run e2e:ui                        # Visual test runner UI
npm run e2e:headed                    # Run with visible browser
npm run e2e:mobile                    # Mobile viewport tests
npm run e2e:desktop                   # Desktop viewport tests
npm run e2e:browserstack              # Cross-browser testing on BrowserStack
npx playwright show-report            # View last test report

# ── API Tests (Postman) ──
npm run postman:test                  # Run Postman collection

# ── Run Everything ──
npm run test:all                      # Jest + Playwright
npm run test:all:full                 # Jest + Playwright + Postman
```

### File Upload & Storage

```bash
# ── On VPS ──
ls /var/www/gglobby/uploads/          # List uploaded files
du -sh /var/www/gglobby/uploads/      # Check uploads size

# Clean old uploads (be careful!)
find /var/www/gglobby/uploads/ -mtime +90 -type f -delete   # Delete files older than 90 days
```

### Useful One-Liners

```bash
# Generate a NextAuth secret
openssl rand -base64 32

# Generate an admin PIN hash (replace YOUR_PIN)
node -e "require('bcryptjs').hash('YOUR_PIN', 10).then(h => console.log(h))"

# Check what port 3000 is using
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Check Node.js version
node -v

# Check npm version
npm -v

# Check PostgreSQL version
psql --version

# Count lines of code in the project (excluding node_modules)
find src/ -name '*.ts' -o -name '*.tsx' | xargs wc -l | tail -1

# Find all TODO comments in code
grep -rn "TODO" src/ --include="*.ts" --include="*.tsx"

# Find large files in the repo
find . -type f -not -path './node_modules/*' -not -path './.next/*' -not -path './.git/*' | xargs du -h | sort -rh | head -20
```

---

## 32. Quick Reference Card

```
Need to...                          → Go to...
─────────────────────────────────────────────────────
Add a new page                      → src/app/(main)/your-page/page.tsx
Add a new API endpoint              → src/app/api/your-feature/route.ts
Add a new component                 → src/components/your-feature/
Create a data-fetching hook         → src/lib/hooks/useYourFeature.ts
Add a new type definition           → src/types/your-feature.ts
Add a UI primitive                  → src/components/ui/
Modify auth flow                    → src/lib/auth/auth.config.ts
Change route protection             → middleware.ts
Add a Socket.io event               → server.mjs
Modify DB query builder             → src/lib/db/query-builder.ts
Add game API integration            → src/lib/integrations/
Update deployment config            → ecosystem.config.js, scripts/deploy.sh
Add an SQL migration                → scripts/migrations/
Modify admin sidebar nav            → src/components/admin/admin-sidebar.tsx
```

---

*Welcome to the team. Build something awesome.*
