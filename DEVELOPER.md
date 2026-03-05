# ggLobby - Developer Documentation (Knowledge Transfer)

> **Last Updated:** March 4, 2026
> This document is the complete KT (Knowledge Transfer) for any developer joining the project — intern, fresher, mid-level, senior, or lead. Read this before touching any code.

---

## Table of Contents

1. [What is ggLobby?](#1-what-is-gglobby)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [Getting Started](#3-getting-started)
4. [Project Architecture](#4-project-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Database Layer](#6-database-layer)
7. [Authentication](#7-authentication)
8. [Real-Time System (Socket.io)](#8-real-time-system-socketio)
9. [API Routes Guide](#9-api-routes-guide)
10. [Frontend Patterns](#10-frontend-patterns)
11. [Feature → File Map](#11-feature--file-map)
12. [Admin Panel](#12-admin-panel)
13. [Payments (Stripe)](#13-payments-stripe)
14. [Voice/Video Calls (LiveKit)](#14-videovideo-calls-livekit)
15. [Third-Party Integrations](#15-third-party-integrations)
16. [Testing](#16-testing)
17. [Deployment](#17-deployment)
18. [Environment Variables](#18-environment-variables)
19. [Common Patterns & Conventions](#19-common-patterns--conventions)
20. [Troubleshooting](#20-troubleshooting)
21. [Complete Commands Reference](#21-complete-commands-reference) — Git, SQL, VPS, PM2, Nginx, Deploy, Testing, and more

---

## 1. What is ggLobby?

ggLobby is a **gaming social platform** focused on the **Indian esports scene** — primarily covering **BGMI** (Battlegrounds Mobile India), **Valorant**, and **Free Fire**. Think of it as a mix of Discord + LinkedIn + Reddit for gamers.

**Core features:** User profiles, friends, messaging, clans, LFG (Looking for Group), community posts, news, blog, tournaments, battle pass, shop, leaderboards, coaching, and more.

**Live at:** https://gglobby.in

---

## 2. Tech Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Language** | TypeScript | 5.x |
| **UI Library** | React | 18.3.1 |
| **Styling** | Tailwind CSS | 4.x |
| **Component Primitives** | Radix UI | v1-v2 |
| **Animation** | Framer Motion | 12.x |
| **Icons** | Lucide React | 0.562 |
| **Database** | PostgreSQL (via `postgres` driver) | 16 |
| **Auth** | NextAuth.js (Auth.js) | v5 beta |
| **Real-Time** | Socket.io | 4.8.3 |
| **State/Data Fetching** | TanStack React Query | v5 |
| **Payments** | Stripe | 20.x |
| **Voice/Video** | LiveKit | 2.x |
| **AI** | OpenAI | 6.x |
| **Rich Text Editor** | TipTap | 3.x |
| **Charts** | Recharts | 3.7 |
| **Process Manager** | PM2 | - |
| **Web Server** | Nginx (reverse proxy) | - |
| **Testing** | Jest + Playwright + Newman | - |

---

## 3. Getting Started

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
# Edit .env.local with your values (see Section 18)

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

## 4. Project Architecture

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

**Key architectural decisions:**
- **No Supabase.** We use raw PostgreSQL with a custom query builder that mimics Supabase syntax (`.from().select().eq()`). See `src/lib/db/query-builder.ts`.
- **Custom Socket.io server** (`server.mjs`) runs alongside Next.js for real-time features.
- **Single VPS deployment** with PM2 for process management and Nginx as reverse proxy.
- **No ORM** — all queries go through the fluent query builder or raw SQL via `postgres` driver.

---

## 5. Folder Structure

```
src/
├── app/                        # Next.js App Router (pages + API)
│   ├── (auth)/                 # Auth pages (login, register, etc.)
│   ├── (main)/                 # Main app pages (dashboard, community, etc.)
│   ├── admin/                  # Admin panel pages
│   ├── api/                    # API routes (300+ endpoints)
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
│
├── components/                 # React components (57 directories)
│   ├── ui/                     # Base primitives (Button, Dialog, Select, etc.)
│   ├── layout/                 # AppShell, Navbar, Sidebar
│   ├── auth/                   # Auth forms, gates
│   ├── admin/                  # Admin panel components
│   ├── community/              # Community posts, events, listings
│   ├── messages/               # Chat UI, message bubbles, emoji
│   ├── clans/                  # Clan cards, walls, missions
│   ├── profile/                # Profile pages, customization (44 files)
│   ├── gamification/           # XP, badges, quests, progression
│   ├── blog/                   # Blog editor, cards, comments
│   ├── call/                   # Voice/video call UI (LiveKit)
│   └── ... (46 more directories)
│
├── lib/                        # Utilities, services, hooks
│   ├── db/                     # Database clients + query builder
│   ├── auth/                   # NextAuth config, providers
│   ├── hooks/                  # 72 custom React hooks
│   ├── realtime/               # Socket.io provider + server config
│   ├── presence/               # Online presence tracking
│   ├── integrations/           # Game API clients (Riot, Steam, etc.)
│   ├── constants/              # Game themes, profiles, skins
│   ├── seo/                    # SEO helpers, JSON-LD
│   ├── theme/                  # Theme provider + definitions
│   ├── query/                  # React Query provider
│   └── utils.ts                # General utilities (cn, formatDate, etc.)
│
├── types/                      # TypeScript type definitions (23 files)
│   ├── database.ts             # Core DB types (largest file)
│   ├── news.ts, blog.ts, community.ts, lfg.ts, etc.
│   └── ...
│
└── hooks/                      # Additional hooks (useAuthGate)

# Root config files
├── server.mjs                  # Custom Socket.io + Next.js server
├── middleware.ts                # Auth middleware (route protection)
├── next.config.ts              # Next.js configuration
├── ecosystem.config.js         # PM2 configuration
├── jest.config.js              # Jest configuration
├── playwright.config.ts        # Playwright E2E configuration
├── CLAUDE.md                   # AI assistant instructions
├── DEVELOPER.md                # This file
├── .env.example                # Environment variables template
└── scripts/                    # Deployment, migration, backup scripts
```

---

## 6. Database Layer

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

## 7. Authentication

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

---

## 8. Real-Time System (Socket.io)

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

## 9. API Routes Guide

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

## 10. Frontend Patterns

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
- **Client state:** React useState/useContext
- **No Redux, no Zustand** — keep it simple

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
useBlog, useBlogAuthor, useNewsComments, useCommunity, useFriendPosts, useForums

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

### Providers (Wrap Order)
In `src/app/layout.tsx`, providers wrap the app in this order:
```
QueryProvider → AuthProvider → SocketProvider → PresenceProvider → ThemeProvider → PWAProvider → AuthGateProvider
```

### Styling Conventions
- **Tailwind CSS 4** for all styling — no CSS modules, no styled-components
- **cn()** utility for conditional classes: `cn("base-class", condition && "active-class")`
- **CVA** (class-variance-authority) for component variants
- **Dark theme only** — the entire app uses dark backgrounds (`bg-[#0a0a0f]`, `text-white`)
- **Glass morphism** pattern: `bg-white/[0.03] border border-white/10 backdrop-blur`
- **Accent colors:** Violet (primary), Emerald (success), Amber (warning), Red (error)
- **Game colors:** Red = Valorant, Orange = BGMI, Yellow = Free Fire

---

## 11. Feature → File Map

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

## 12. Admin Panel

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

## 13. Payments (Stripe)

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

---

## 14. Voice/Video Calls (LiveKit)

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

## 15. Third-Party Integrations

All integration clients are in `src/lib/integrations/`:

| File | Service | Features |
|------|---------|----------|
| `discord.ts` | Discord | Bot commands, webhooks, friend import, crossposting |
| `riot.ts` | Riot Games | Valorant stats, match history |
| `steam.ts` | Steam | Profile linking, game library |
| `twitch.ts` | Twitch | Stream status, follow, OAuth |
| `coc.ts` | Clash of Clans | Player stats, clan data |

**OAuth integrations** (Discord, Twitch, Steam, Riot, Xbox, PlayStation, Nintendo) follow a standard flow:
```
/api/integrations/[provider]/connect → Redirect to OAuth
/api/integrations/[provider]/callback → Handle token, save to DB
/api/integrations/[provider]/disconnect → Remove integration
```

---

## 16. Testing

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

## 17. Deployment

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

## 18. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Yes | JWT secret (generate with `openssl rand -base64 32`) |
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
| `OPENAI_API_KEY` | Optional | AI features |
| `DISCORD_CLIENT_ID` | Optional | Discord integration |
| `DISCORD_CLIENT_SECRET` | Optional | Discord integration |
| `DISCORD_BOT_TOKEN` | Optional | Discord bot |
| `ADMIN_PIN_HASH` | For admin | bcryptjs hash of admin PIN |
| `UPLOAD_DIR` | Production | File upload directory |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics |

---

## 19. Common Patterns & Conventions

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

---

## 20. Troubleshooting

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

## 21. Complete Commands Reference

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

## Quick Reference Card

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

*Welcome to the team. Build something awesome.* 🎮
