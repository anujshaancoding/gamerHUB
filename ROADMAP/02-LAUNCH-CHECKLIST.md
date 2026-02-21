# 02 - Launch Checklist

> Everything that MUST be done before ggLobby goes live. Organized by priority.

---

## BLOCKERS (Cannot Launch Without These)

### Legal Documents

- [ ] **Privacy Policy page** — Required by law in every jurisdiction. Must cover:
  - Data collected: email, username, avatar, gaming profiles, messages, IP, device info
  - Third-party processors: Supabase, Vercel, Stripe, LiveKit, OpenAI
  - Data retention periods
  - User rights (access, correction, deletion, export)
  - Cookie usage
  - Contact email for privacy inquiries
  - **How to create**: Use Termly.io (free generator) as a starting point, then customize for ggLobby's specific data practices. Budget $0 for now, $500-2000 for lawyer review at 10K users.

- [ ] **Terms of Service page** — Must cover:
  - Minimum age: 13 years old
  - User conduct rules (no harassment, hate speech, doxxing, cheating promotion)
  - Content ownership: Users retain rights, grant ggLobby a display/storage license
  - Right to moderate, suspend, or ban
  - DMCA takedown procedure
  - Limitation of liability
  - Governing law jurisdiction

- [ ] **Community Guidelines** — Separate from ToS, written in plain language:
  - Gaming-specific rules: No account boosting, no real-money trading, no tournament rigging
  - Content rules: No NSFW, no spam, no impersonation
  - Consequences: Warning > 24hr mute > 7-day suspension > permanent ban
  - Appeal process

### Age Verification

- [ ] **Add date-of-birth field to registration** — Not just a checkbox. Store DOB to prove compliance.
- [ ] **Block users under 13** — If DOB indicates under 13, block registration. Do NOT let them go back and change the date (temp-block the device/session for 24 hours).
- [ ] **Display age requirement** in registration form: "You must be 13 or older to use ggLobby"

### Domain & Deployment

- [ ] **Register domain** — gglobby.com or similar (.gg domain would be ideal for gaming — check gglobby.gg)
- [ ] **Deploy to Vercel** — Connect GitHub repo, set up production environment
- [ ] **Configure environment variables** in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`
  - `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL`
  - `OPENAI_API_KEY`
  - Any Discord/Twitch/Steam OAuth credentials
- [ ] **SSL certificate** — Automatic with Vercel, verify it's active
- [ ] **Custom domain DNS** — Point domain to Vercel

---

## HIGH PRIORITY (Do Within First Week)

### SEO Setup

- [ ] **Create `src/app/sitemap.ts`**
  ```typescript
  // Generate dynamic sitemap with all public pages
  // Include: /blog/[slug], /clans/[slug], /profile/[username], /news/[id]
  // Exclude: /settings, /messages, /admin, /write
  ```

- [ ] **Create `src/app/robots.ts`**
  ```typescript
  // Allow: /blog, /clans, /find-gamers, /community, /news
  // Disallow: /api, /settings, /messages, /admin, /write
  // Sitemap: https://gglobby.com/sitemap.xml
  ```

- [ ] **Add per-page metadata** to all public routes:
  - `/blog` — "Gaming Articles & Guides | ggLobby"
  - `/clans` — "Find Gaming Clans & Teams | ggLobby"
  - `/find-gamers` — "Find Teammates for Valorant, CS2, Dota 2 | ggLobby"
  - `/community` — "Gaming Community Hub | ggLobby"
  - `/news` — "Gaming News | ggLobby"
  - Each `/blog/[slug]` — Use post title + excerpt
  - Each `/clans/[slug]` — Use clan name + description
  - Each `/profile/[username]` — Use gamer tag + games played

- [ ] **Register with Google Search Console**
  1. Go to https://search.google.com/search-console
  2. Add property using URL prefix method
  3. Verify via DNS TXT record (recommended)
  4. Submit sitemap URL
  5. Request indexing for top 10 pages manually

- [ ] **Register with Bing Webmaster Tools**
  1. Go to https://www.bing.com/webmasters
  2. Import from Google Search Console (fastest)
  3. Submit sitemap
  4. Important: Bing also powers DuckDuckGo, Yahoo, Ecosia, and Copilot AI searches

### Security

- [ ] **Audit all API routes for authentication** — Verify every route that should be protected actually checks `auth.uid()`
- [ ] **Review RLS policies** — All tables have RLS enabled, but verify policies are correct
- [ ] **Rate limiting** on sensitive endpoints:
  - Login/register: 5 attempts per minute per IP
  - API endpoints: 100 requests per minute per user
  - File uploads: 10 per minute per user
- [ ] **Sanitize user input** — Verify no XSS vectors in blog content, messages, profile fields
- [ ] **CSRF protection** — Verify Supabase handles this (it does via its auth tokens)
- [ ] **Stripe webhook signature verification** — Verify webhook endpoint validates signatures

### Branding Consistency

- [ ] **Unify naming** — GitHub repo is "gamer hub", app is "ggLobby". Pick one everywhere.
- [ ] **Logo** — Ensure `src/components/layout/logo.tsx` renders properly
- [ ] **Favicon** — Verify all icon sizes in `/public/icons/` are correct
- [ ] **Open Graph image** — Create a 1200x630px OG image for social sharing
- [ ] **App screenshots** — Take 5-6 polished screenshots for marketing and app stores

### Critical Bug Fixes

- [ ] **Fix SELECT * in list queries** — Add explicit column selections to at least:
  - `src/app/api/blog/route.ts` (exclude `content` from list)
  - `src/app/api/feed/route.ts`
  - `src/app/api/clans/route.ts`
  - All other list endpoints
- [ ] **Deduplicate view counting** — Add sessionStorage check before incrementing blog/news views
- [ ] **Fix duplicate Realtime channels** — Remove redundant subscriptions in `chat-window.tsx`

---

## MEDIUM PRIORITY (Do Within First Month)

### GDPR Compliance

- [ ] **Cookie consent banner** — Show before setting non-essential cookies. Must allow:
  - Accept all
  - Reject all
  - Customize (analytics on/off, etc.)
- [ ] **"Download My Data" button** in Settings — Export all user data as JSON
- [ ] **"Delete My Account" flow** — Full data purge (not just soft delete):
  - Delete from Supabase (profile, posts, messages, likes, etc.)
  - Delete uploaded media from Storage
  - Revoke all sessions
  - Confirmation step: "This action cannot be undone"
- [ ] **Data Processing Agreements** — Verify DPAs are in place with:
  - Supabase (available on their website)
  - Vercel (available on their website)
  - Stripe (available on their website)
  - LiveKit (check their website)
  - OpenAI (available on their website)

### Email System

- [ ] **Set up transactional email** — Use Resend (free: 100 emails/day, 3,000/month)
  - Welcome email on registration
  - Friend request notifications (if user opted in)
  - Weekly activity digest (opt-in)
- [ ] **Verify Supabase auth emails** — Customize email templates in Supabase dashboard for:
  - Email verification
  - Password reset
  - Magic link (if enabled)

### Error Monitoring

- [ ] **Set up Sentry** — Free tier: 5K errors/month
  - Install `@sentry/nextjs`
  - Configure client + server error boundaries
  - Set up source maps for readable stack traces

### Analytics

- [ ] **Set up PostHog or Vercel Analytics**
  - PostHog free tier: 1M events/month
  - Track key events: signup, profile_complete, first_friend, first_clan_join, first_post
  - Track feature usage to know what users actually use

### Testing

- [ ] **Run full Playwright E2E suite** — Fix any broken tests
- [ ] **Manual smoke test** of all critical flows:
  - Register > Onboard > Create Profile > Find Gamers > Send Friend Request
  - Create Clan > Invite Members > Start Challenge
  - Write Blog Post > Publish > Comment
  - Send Message > Voice Call
  - Subscribe to Premium > Purchase Item from Shop

---

## LOW PRIORITY (Do Within First Quarter)

### Performance

- [ ] **Lighthouse audit** — Target scores: Performance 90+, SEO 95+, Accessibility 90+
- [ ] **Core Web Vitals** — LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **Bundle analysis** — Run `next build` and check for oversized chunks
- [ ] **Image optimization** — Ensure all static images use Next.js `<Image>` component

### Mobile App Preparation

- [ ] **Configure Expo EAS Build** — Replace `"your-project-id"` in `mobile/app.json`
- [ ] **Create App Store Connect account** — $99/year for iOS
- [ ] **Create Google Play Developer account** — $25 one-time
- [ ] **Prepare app store assets** — Screenshots, description, keywords, privacy URL

### Content

- [ ] **Write 5 seed blog posts** — SEO-targeted:
  - "How to Find Teammates for Valorant in 2026"
  - "Best CS2 Settings and Crosshair Guide"
  - "Top 10 Tips for Climbing Ranked in Dota 2"
  - "How to Start a Gaming Clan That Actually Lasts"
  - "LFG Guide: Finding the Perfect Gaming Group"
- [ ] **Create 3 seed clans** — For the top 3 target games
- [ ] **Populate news section** — Configure external news sources in admin

---

## Launch Day Checklist

On the day you go live:

1. [ ] Verify production deployment is stable (no 500 errors)
2. [ ] Verify registration flow works end-to-end
3. [ ] Verify Supabase free tier limits are not already hit
4. [ ] Monitor Vercel function logs for errors
5. [ ] Have the beta feedback widget enabled
6. [ ] Be available to respond to user reports within 1 hour
7. [ ] Post launch announcement on chosen channels (see Growth Strategy)
8. [ ] Monitor Google Search Console for crawl errors within 48 hours

---

*Estimated total time to complete BLOCKER + HIGH items: 2-3 focused days of work.*
