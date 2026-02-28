# 01 - Current State of ggLobby

> Everything we have built, what works, and what needs attention.

---

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend Framework** | Next.js 16 (App Router) | Production-ready |
| **Language** | TypeScript | Full coverage |
| **UI Library** | React 18 | Stable |
| **Styling** | Tailwind CSS 4 + Radix UI | Production-ready |
| **Animation** | Framer Motion | Working |
| **State Management** | Zustand + React Query (TanStack) | Working |
| **Rich Text Editor** | TipTap (ProseMirror) | Working |
| **Database** | PostgreSQL (self-hosted on VPS) | Production-ready |
| **Authentication** | Auth.js (email + OAuth) | Working |
| **Real-time** | Socket.io (WebSocket) | Working |
| **File Storage** | VPS file storage | Working |
| **Payments** | Stripe | Integrated |
| **Voice/Video Calls** | LiveKit | Integrated |
| **Mobile** | React Native + Expo | Scaffolded |
| **PWA** | Service Worker + Manifest | Configured |
| **Hosting** | VPS (self-hosted) | Production-ready |
| **Testing** | Jest + Playwright | Configured |

---

## Feature Inventory

### A. Authentication & Onboarding

| Feature | Files | Status |
|---------|-------|--------|
| Email/password registration | `src/app/(auth)/`, `src/components/auth/auth-form.tsx` | Built |
| OAuth login (Discord, Steam, Twitch) | `src/app/auth/callback/route.ts` | Built |
| 3-step onboarding wizard | `src/app/(auth)/onboarding/page.tsx` | Built |
| Password reset flow | `src/app/(auth)/reset-password/` | Built |
| Email verification | Via Auth.js | Built |
| Phone verification | `src/app/api/verification/` | Built |
| Auth gate (protected routes) | `src/components/auth/auth-gate-provider.tsx` | Built |
| Session refresh middleware | `src/lib/supabase/middleware.ts` (Auth.js) | Built |

### B. User Profiles

| Feature | Files | Status |
|---------|-------|--------|
| Public gamer profiles | `src/app/(main)/profile/[username]/page.tsx` | Built |
| Profile editing | `src/app/(main)/profile/[username]/edit/page.tsx` | Built |
| Avatar & banner upload (WebP compression) | `src/lib/upload.ts`, `src/components/media/media-uploader.tsx` | Built |
| Game library with ranks | `src/components/profile/profile-games.tsx` | Built |
| Badges & achievements display | `src/components/profile/profile-badges.tsx` | Built |
| Stats & medals | `src/components/profile/profile-stats.tsx`, `profile-medals.tsx` | Built |
| Ratings & endorsements | `src/components/profile/profile-ratings.tsx` | Built |
| Animated rank emblems | `src/components/profile/animated-rank-emblem.tsx` | Built |
| Power level gauge | `src/components/profile/power-level-gauge.tsx` | Built |
| Rank history timeline | `src/components/profile/rank-history-timeline.tsx` | Built |
| Profile customization (themes, frames, titles) | `src/components/profile/game-theme-provider.tsx` | Built |
| Pinned badges editor | `src/components/profile/pinned-badges-editor.tsx` | Built |
| Player card (compact view) | `src/components/profile/player-card.tsx` | Built |
| Clan display on profile | `src/components/profile/clan-display.tsx` | Built |

### C. Social & Friends

| Feature | Files | Status |
|---------|-------|--------|
| Follow/unfollow system | `src/lib/hooks/useFollowing.ts` | Built |
| Friend requests (send/accept/reject) | `src/lib/hooks/useFriends.ts` | Built |
| Friends list page | `src/app/(main)/friends/page.tsx` | Built |
| Follower/following counts | `src/app/api/friends/counts/route.ts` | Built |
| Block users | `src/app/api/blocked/route.ts` | Built |
| User search & discovery | `src/app/(main)/find-gamers/page.tsx` | Built |
| AI-powered friend suggestions | `src/app/api/suggestions/route.ts` | Built |
| Pro player recommendations | `src/components/suggestions/pro-players-section.tsx` | Built |
| Trust scoring system | `src/app/api/ratings/trust-badges/` | Built |
| Trait endorsements | `supabase/migrations/034_trait_endorsements.sql` | Built |
| Activity feed | `src/app/api/feed/route.ts` | Built |
| Online presence tracking | `src/lib/presence/PresenceProvider.tsx` | Built |

### D. Messaging & Communication

| Feature | Files | Status |
|---------|-------|--------|
| Direct messaging | `src/app/(main)/messages/page.tsx` | Built |
| Conversation threads | `src/components/messages/message-thread.tsx` | Built |
| Group conversations | `src/app/api/messages/conversations/route.ts` | Built |
| Message reactions | `supabase/migrations/048_message_reactions.sql` | Built |
| Read receipts | `src/components/chat/chat-window.tsx` | Built |
| Typing indicators | Via Socket.io presence | Built |
| Voice/video calls | `src/components/call/call-room.tsx` (LiveKit) | Built |
| Screen sharing | `src/components/call/screen-share-view.tsx` | Built |
| New conversation modal | `src/components/messages/new-conversation-modal.tsx` | Built |

### E. Clans & Teams

| Feature | Files | Status |
|---------|-------|--------|
| Create clans | `src/components/clans/create-clan-form.tsx` | Built |
| Clan pages with members | `src/app/(main)/clans/[slug]/page.tsx` | Built |
| Browse/search clans | `src/app/(main)/clans/page.tsx` | Built |
| Clan roles (owner, admin, member) | `src/components/clans/clan-role-badge.tsx` | Built |
| Clan invite system | `src/components/clans/clan-invite-modal.tsx` | Built |
| Clan settings management | `src/components/clans/clan-settings-modal.tsx` | Built |
| Clan recruitment posts | `src/app/api/clan-recruitment/route.ts` | Built |
| Clan challenges | `src/app/api/clan-challenges/` | Built |
| Join types (open/invite-only/closed) | Database schema | Built |

### F. Competitive Features

| Feature | Files | Status |
|---------|-------|--------|
| Tournament creation & brackets | `src/app/api/tournaments/` | Built |
| Single elimination brackets | `src/components/tournaments/single-elimination.tsx` | Built |
| Match scheduling & results | `src/components/matches/match-card.tsx` | Built |
| Global & seasonal leaderboards | `src/app/api/leaderboards/` | Built |
| Community challenges | `src/app/api/community-challenges/` | Built |
| LFG (Looking For Group) | `src/app/api/lfg/` | Built |
| AI teammate suggestions | `src/app/api/matchmaking/suggest-teammates/route.ts` | Built |
| AI team balance analysis | `src/app/api/matchmaking/team-balance/route.ts` | Built |
| AI match outcome prediction | `src/app/api/matchmaking/predict-outcome/route.ts` | Built |

### G. Gamification

| Feature | Files | Status |
|---------|-------|--------|
| XP & level progression | `src/lib/hooks/useProgression.ts` | Built |
| Achievement badges (100+) | `src/app/api/badges/route.ts` | Built |
| Daily/weekly quests | `src/lib/hooks/useQuests.ts` | Built |
| Seasonal rewards | `src/lib/hooks/useSeasonRewards.ts` | Built |
| Titles, frames, themes (cosmetics) | `src/app/api/titles/`, `frames/`, `themes/` | Built |
| Battle pass (free + premium tracks) | `src/app/api/battle-pass/` | Built |
| Achievement hunting system | `src/app/api/achievement-hunts/route.ts` | Built |

### H. Content & Publishing

| Feature | Files | Status |
|---------|-------|--------|
| Blog platform with rich editor | `src/app/(main)/write/page.tsx` | Built |
| 6 blog templates (Classic, Magazine, Cyberpunk, etc.) | `src/components/blog/blog-template-renderer.tsx` | Built |
| 6 color palettes (Neon Surge, Crimson Fire, etc.) | `src/components/blog/palette-selector.tsx` | Built |
| Blog comments with threading | `src/components/blog/blog-comments.tsx` | Built |
| Blog likes & bookmarks | `src/app/api/blog/[slug]/like/` | Built |
| SEO metadata per post | JSON-LD structured data | Built |
| News aggregation | `src/app/(main)/news/` | Built |
| News comments & likes | `src/app/api/news/[id]/comments/` | Built |
| Forums with categories | `src/app/api/forums/` | Built |
| Community posts & memes | `src/app/(main)/community/page.tsx` | Built |
| Community listings (marketplace) | `src/app/api/listings/` | Built |
| Polls | `src/app/api/polls/` | Built |

### I. Shop & Monetization

| Feature | Files | Status |
|---------|-------|--------|
| Premium subscription (Stripe) | `src/app/(main)/premium/page.tsx` | Built |
| Stripe checkout & billing portal | `src/app/api/stripe/` | Built |
| Virtual currency (GG$) | `src/app/api/wallet/` | Built |
| In-app shop | `src/app/api/shop/` | Built |
| Currency packs | `src/app/api/shop/currency-packs/` | Built |
| Coupon/discount codes | `src/app/api/coupons/` | Built |
| Battle pass purchase | `src/app/api/battle-pass/purchase/route.ts` | Built |

### J. Integrations

| Platform | Files | Status |
|----------|-------|--------|
| Discord (connect, crosspost, friend import) | `src/app/api/discord/`, `src/app/api/integrations/discord/` | Built |
| Steam | `src/app/api/integrations/steam/` | Built |
| Riot Games / League of Legends | `src/app/api/integrations/riot/` | Built |
| Twitch (connect, embed streams) | `src/app/api/integrations/twitch/` | Built |
| Xbox | `src/app/api/integrations/xbox/` | Built |
| PlayStation | `src/app/api/integrations/playstation/` | Built |
| Nintendo | `src/app/api/integrations/nintendo/` | Built |
| Clash of Clans | `src/app/api/integrations/coc/` | Built |

### K. Creator & Streaming

| Feature | Files | Status |
|---------|-------|--------|
| Creator profiles | `src/app/api/creator/profile/route.ts` | Built |
| Clip management | `src/app/api/creator/clips/route.ts` | Built |
| Stream overlay generation | `src/app/api/creator/overlays/route.ts` | Built |
| Creator analytics | `src/app/api/creator/analytics/route.ts` | Built |
| Live streamer cards | `src/components/streaming/StreamerCard.tsx` | Built |
| Twitch embed | `src/components/streaming/TwitchEmbed.tsx` | Built |
| Sponsorship system | `src/app/api/sponsorships/route.ts` | Built |

### L. Advanced Features

| Feature | Files | Status |
|---------|-------|--------|
| Squad DNA personality matching | `src/app/api/squad-dna/` | Built |
| Mood/vibe compatibility | `src/app/api/mood/` | Built |
| Coaching system | `src/app/api/coaching/sessions/route.ts` | Built |
| Verified player queue | `src/app/api/verified-queue/` | Built |
| Replay rooms | `src/app/api/replay-rooms/` | Built |
| Crossplay party system | `src/app/api/crossplay/parties/` | Built |
| Automation rules (Discord webhooks) | `src/app/api/automation/rules/route.ts` | Built |
| Accessibility options | `src/app/api/accessibility/route.ts` | Built |
| Multi-language translation | `src/app/api/translate/route.ts` | Built |
| Regional pricing | `src/app/api/pricing/[region]/route.ts` | Built |
| Regional communities | `src/app/api/regions/` | Built |

### M. Admin & Moderation

| Feature | Files | Status |
|---------|-------|--------|
| Admin dashboard | `src/app/admin/page.tsx` | Built |
| News publishing | `src/app/admin/publish/` | Built |
| Content moderation | `src/app/admin/moderation/` | Built |
| External news management | `src/app/admin/external-news/` | Built |
| Report system | `src/app/api/reports/route.ts` | Built |
| Toxicity reporting | `src/app/api/toxicity/report/route.ts` | Built |
| Beta feedback collection | `src/app/api/beta/feedback/route.ts` | Built |

### N. Notifications & Settings

| Feature | Files | Status |
|---------|-------|--------|
| Notification center | `src/components/notifications/NotificationCenter.tsx` | Built |
| Notification preferences | `src/app/api/notifications/preferences/route.ts` | Built |
| Settings page (profile, privacy, appearance) | `src/app/(main)/settings/page.tsx` | Built |
| Dark/light theme toggle | `src/components/pwa/PWAProvider.tsx` | Built |
| Integration connections management | `src/app/(main)/settings/connections/` | Built |

---

## Database Architecture

### Scale
- **59 migration files**
- **100+ tables**
- **All tables use UUID primary keys** (gen_random_uuid())
- **Row-Level Security enabled on every table**
- **Comprehensive indexing** on user_id, created_at, foreign keys, and GIN indexes for arrays

### Core Tables
| Table | Purpose | Migration |
|-------|---------|-----------|
| profiles | User profiles and preferences | 001 |
| user_games | Games a user plays with rank info | 001 |
| follows | Follow/follower relationships | 001 |
| messages | Direct messages | 001 |
| conversations | Chat conversations | 001 |
| clans / clan_members | Clan system | 003 |
| tournaments | Tournament brackets | 004 |
| leaderboards | Ranking system | 004 |
| battle_passes / battle_pass_rewards | Seasonal battle pass | 009 |
| user_wallets | Virtual currency | 010 |
| activity_feed | Social feed | 011 |
| blog_posts / blog_comments | Blog system | 018 |
| news_articles | Gaming news | 035 |
| beta_feedback | User feedback | 059 |

---

## Known Technical Issues

### Critical (Must Fix Before Launch)

1. **SELECT * everywhere** — 20+ API routes use `.select()` with no arguments, pulling all columns including heavy content bodies for list queries
2. **No sitemap.ts or robots.ts** — Search engines cannot discover pages
3. **No per-page metadata** on many routes — Hurts SEO significantly
4. **Duplicate Realtime channels** — `chat-window.tsx` opens channels that `useMessages.ts` already opens
5. **Global presence channel** — Single `online-users` channel sends all user states to all users (scales poorly)

### Important (Fix Before 1K Users)

6. **Offset-based pagination on every endpoint** — Degrades at scale, should be cursor-based
7. **No background jobs** — Notifications, emails, feed fanout are all synchronous
8. **5-second polling** in replay rooms and verified queue — Extremely aggressive
9. **Redundant polling + realtime** in notifications hook — Does both simultaneously
10. **No view count deduplication** — Blog/news view counts fire on every page load

### Nice to Have (Fix Before 10K Users)

11. **No CDN for media** — VPS file storage serves from single region
12. **No read/write separation** — GET/POST/PATCH all in same route handlers
13. **Blog content stored as HTML** — Should store TipTap JSON for portability
14. **No full-text search** — Uses ILIKE which cannot use indexes
15. **No error monitoring** — No Sentry or equivalent configured

---

## What's NOT Built Yet

| Item | Priority | Notes |
|------|----------|-------|
| Privacy Policy page | BLOCKER | Legal requirement before launch |
| Terms of Service page | BLOCKER | Legal requirement before launch |
| Community Guidelines page | BLOCKER | Needed for content moderation |
| Cookie consent banner | HIGH | Required for GDPR compliance |
| Age gate (13+ verification) | HIGH | COPPA compliance |
| Sitemap generation | HIGH | Critical for SEO |
| robots.txt | HIGH | Critical for SEO |
| Account data export | MEDIUM | GDPR right to data portability |
| Full account deletion | MEDIUM | GDPR right to erasure |
| DMCA takedown process | MEDIUM | Legal requirement for UGC platforms |
| Email transactional system | MEDIUM | Welcome emails, notifications |
| Push notifications (mobile) | MEDIUM | Engagement driver |
| App Store listing (iOS) | LOW | After mobile app is polished |
| Play Store listing (Android) | LOW | After mobile app is polished |

---

*This document reflects the state of the codebase as of February 2026.*
