# ggLobby — Testing & QA Playbook

> **Purpose.** A single end‑to‑end reference for validating ggLobby before and after every
> deploy: frontend, backend/API, the self‑hosted VPS, performance, accessibility, security,
> SEO and the per‑feature flows. Written to be runnable by one person in a few hours, or
> sliced into a pre‑deploy smoke test in ~15 minutes.
>
> **Stack at a glance.** Next.js 16 (App Router, Turbopack) · React 18 · custom Node server
> (`server.mjs` — Next + Socket.IO) · NextAuth v5 · self‑hosted PostgreSQL (`gamerhub`) via the
> `postgres` client over PostgREST‑less direct SQL · PM2 (`gglobby`) · Nginx · Cloudflare in
> front · Stripe · LiveKit · Riot/Henrik APIs.
>
> **Canonical environments.**
> | Env | URL | Notes |
> |-----|-----|-------|
> | Production | https://gglobby.in | VPS, PM2 app `gglobby`, port 3000 behind Nginx + Cloudflare |
> | Local dev | http://localhost:3177 | `npm run dev` (see launch config); needs a DB on `localhost:5433` |

---

## 0. How to use this doc

- **Before a deploy:** run §1 (static checks) + §2 (build) locally. Both must be green.
- **After a deploy:** run §9 (post‑deploy smoke test) against https://gglobby.in. ~15 min.
- **Full regression (periodic):** §3–§8 end‑to‑end.
- **Severity language:** 🔴 blocker (don't ship) · 🟠 fix this cycle · 🟡 polish/backlog.
- Anything that **writes to the production DB** (signup, posting, uploads) should be done with a
  clearly‑labelled test account (e.g. `qa+YYYYMMDD@gglobby.in`) and cleaned up after, or run
  against a staging DB. **Never load‑test or spam prod** — the API is rate‑limited (60 req/min
  global, 10/min for uploads) and Cloudflare may challenge you.

---

## 1. Pre‑flight: static checks (local)

Run from the repo root. All three must pass before building.

```bash
npx tsc --noEmit          # type check — must be clean
npm run lint              # eslint
npm test                  # jest unit/component tests
```

| Check | Pass criteria |
|-------|---------------|
| TypeScript | exit 0, zero errors |
| ESLint | no errors (warnings triaged) |
| Jest | all suites green |

> ⚠️ **Working‑tree gotcha.** The repo is mid‑reorg (`scripts/` → `infra/`) and the local
> working tree is CRLF while GitHub is LF, so `git status` shows ~hundreds of "modified" files
> that are not real changes. **Never `git add -A`.** Stage files individually. A build run in a
> dirty working tree can be *false‑green*; for a deploy‑accurate result, build from a clean
> checkout with a fresh `npm ci` (see §8.4).

---

## 2. Build verification (local)

```bash
NEXT_TELEMETRY_DISABLED=1 npm run build
```

- ✅ Pass = exit 0 and a complete route table printed.
- Watch the startup banner for **deprecation warnings** — e.g. an experimental config key that
  Next renamed. Treat new warnings as 🟠 (they become errors in a future major).
- Note any route that fails to prerender (`○` static vs `ƒ` dynamic vs `●` SSG). A page that
  unexpectedly flips from static to dynamic usually means a new uncached DB/`headers()` call.

---

## 3. Frontend functional testing (by feature area)

ggLobby has ~60 user‑facing routes. Test each area for: **renders without console errors ·
primary action works · empty/loading/error states · auth‑gating correct · mobile layout.**

### 3.1 Public / marketing
| Route | What to verify |
|-------|----------------|
| `/` → `/overview` | Landing renders; hero CTAs (`Create passport`, `Make rank card`) navigate; ticker animates; mobile header is clean (logo + hamburger only); drawer opens with **Create Passport** as first item. |
| `/passport`, `/passport/gallery` | Passport builder loads; gallery grid renders (or graceful empty state). |
| `/rank-card` | Rank card generator; image export works. |
| `/agents`, `/agents/[slug]`, `/agents/rank-guide` | Agent grid + detail; portraits load from `media.valorant-api.com`. |
| `/maps`, `/maps/[slug]` | Map list + lineups viewer. |
| `/crosshairs`, `/tier-list`, `/patch`, `/patch/[version]` | Content renders; copy‑to‑clipboard on crosshairs. |
| `/tools` + `/tools/{fov,monitor,rank-percentile,sens-share,skin-estimator}` | Each calculator computes correctly (client‑side; no DB needed). |
| `/aim` | Aim Lab loads and the 7 drills are playable in‑browser. **(Was 404 on prod — see §10.)** |
| `/blog`, `/blog/[slug]`, `/blog/rss.xml` | Listing + article render; RSS valid XML. **Watch TTFB — see §10.** |
| `/pro`, `/pros`, `/pros/[slug]`, `/pro/{compare,events,sens-converter}` | Pro hub data renders. |
| `/leaderboard`, `/giveaway`, `/scene`, `/scene/[slug]`, `/search` | Render + filters. |
| `/news/[id]` | Article renders; **404 → "Back to Home"** (no public `/news` index exists — see §10). |
| `/privacy`, `/terms`, `/disclaimer`, `/guidelines`, `/help`, `/updates` | Static content current. |

### 3.2 Authenticated app
Sign in first (§4). Verify each is **gated** (logged‑out → redirect) and functional logged‑in.
| Route | What to verify |
|-------|----------------|
| `/dashboard` | Personalized widgets load. |
| `/profile`, `/profile/[username]`, `/profile/[username]/edit` | View + edit profile, media, badges, customization. |
| `/find-gamers`, `/lfg` | Squad finder filters, listing create/apply. |
| `/clans`, `/clans/create`, `/clans/[slug]` | Create clan, join, settings modal. |
| `/friends`, `/messages`, `/messages/[conversationId]`, `/notifications` | Friend requests; real‑time chat (Socket.IO) sends/receives; notifications mark‑read. |
| `/forum`, `/forum/[category]`, `/forum/[category]/[slug]`, `/forum/new` | Browse, create thread, reply, like. |
| `/community`, `/community/post/[id]` | Feed, create post, comment, like. |
| `/tracker`, `/tracker/valorant/[name]/[tag]` | Riot/Henrik lookup returns stats; RSO‑gated flows respect policy (see §7.5). |
| `/settings`, `/settings/connections`, `/settings/notifications` | Game account linking, notification prefs, privacy toggles persist. |
| `/premium` | Stripe checkout opens (use Stripe **test** card `4242 4242 4242 4242`). |
| `/write` | Author/blog editor (TipTap) loads, image upload works. |

### 3.3 Content‑creation flows (the "try every feature" pass)
Do each as a test user, then verify it appears and can be edited/deleted:
1. **Create a forum thread** → appears in category → reply → like → delete.
2. **Create a community post** (with image) → appears in feed → comment → like.
3. **Create/publish a blog post** via `/write` or `/admin/blog` → renders at `/blog/[slug]`.
4. **Build & save a Passport** → appears in `/passport/gallery`.
5. **Generate a rank card** → export image.
6. **LFG listing** → create → another account applies → accept.
7. **Send a DM** → real‑time delivery → notification fires.
8. **Upload showcase clip** (≤200 MB) → transcodes → plays.

> For each: confirm the **optimistic UI**, the **success toast** (sonner), and that a **refresh**
> shows the persisted result (catches "only worked client‑side" bugs).

### 3.4 Admin panel (internal — test, but never log to the public Updates page)
PIN‑gated at `/admin`. Verify: blog/news CRUD, forum moderation, user management, carousel,
authors, emails, automation, analytics, reports, audit log, pro/lineups. Confirm **audit log**
records who did what (needs migration `017_create_admin_audit.sql` applied — see §8.3).

---

## 4. Auth & onboarding

| Flow | Steps & checks |
|------|----------------|
| **Register (email)** | `/register` → submit → verification email (Resend) arrives → `/verify-email?token=…` confirms → can log in. Check rate‑limit + duplicate‑email handling. |
| **Register (Google)** | Google OAuth → `/auth/callback` → lands in app. |
| **Login** | `/login` valid + invalid creds; lockout/error messaging; CSRF cookie set. |
| **Onboarding** | `/onboarding` / `/onboard` first‑run: profile setup, game link, consent capture (`user_consent`). |
| **Password reset** | `/reset-password` → email → `/update-password` → new password works. |
| **Session** | Logout clears session; protected routes redirect; "remember me" persists. |
| **Redirect target** | Logged‑out hitting a gated route (e.g. `/clans`, `/friends`) currently **307s to `/`** — confirm this is intended vs. routing to `/login` with a return URL (see §10, 🟡). |

---

## 5. Responsive testing

Test every page at these breakpoints. Indian gaming traffic skews **mobile‑first** — prioritise 360–414 px.

| Class | Width | Devices |
|-------|-------|---------|
| Small mobile | 360 × 640 | budget Android |
| Mobile | 375 × 812 | iPhone X–13 mini |
| Large mobile | 414 × 896 | iPhone Plus/Max, Pixel |
| Tablet | 768 × 1024 | iPad portrait |
| Desktop | 1280 × 800 | laptop |
| Wide | 1920 × 1080 | desktop |

**Per breakpoint checklist:**
- [ ] No horizontal scroll / overflow (`document.body.scrollWidth <= innerWidth`).
- [ ] Header/nav: logo not crowded; hamburger reachable; drawer scrolls; CTAs ≥ 44 px tap target.
- [ ] Text doesn't clip or overlap the skewed/italic display headings.
- [ ] Grids reflow (cards: 1‑col mobile → 2/3‑col tablet → 4+ desktop).
- [ ] Modals/dialogs/sheets fit viewport and are dismissible.
- [ ] Images use correct `sizes` (no full‑res download on mobile — see §6).
- [ ] Sticky elements (feedback bubble, mini‑chat) don't cover primary CTAs.

> Tailwind prefixes in use: `sm: md: lg: xl:`. When adding styles, **always verify all three of
> mobile/tablet/desktop** (project rule in `CLAUDE.md`). Tools to use locally: browser devtools
> device toolbar, or the preview tooling's `resize` presets.

---

## 6. Performance & asset loading

### 6.1 Targets
| Metric | Target |
|--------|--------|
| TTFB (cached HTML) | < 600 ms |
| LCP | < 2.5 s (mobile, 4G) |
| CLS | < 0.1 |
| Total JS (first load, route) | keep an eye on heavy routes (editor, charts, livekit) |
| Image payload (mobile) | served via Next `<Image>` with correct `sizes` |

### 6.2 How to measure
```bash
# Per-route TTFB / size sweep against prod (read-only, safe):
for r in / /overview /blog /agents /tools /pro; do
  curl -s -o /dev/null -w "$r  %{http_code}  ttfb=%{time_starttransfer}s  size=%{size_download}B\n" "https://gglobby.in$r"
done
```
- Run **Lighthouse** (Chrome DevTools → Lighthouse, mobile preset) on `/overview`, `/blog`,
  `/agents`, a profile page. Target Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100.
- Confirm **Cloudflare caching**: HTML responses carry `cache-control: s-maxage=…`; static
  `/_next/static/*` are immutable + far‑future cached; `content-encoding: br`/`gzip` present.

### 6.3 Asset hygiene
- [ ] Every `next/image` with `fill` has a `sizes` prop (missing `sizes` = full‑res download +
      console warning). Heavy offenders are agent `fullportrait` images.
- [ ] Hero/above‑the‑fold images use `priority`; below‑fold lazy‑load.
- [ ] Fonts: `font-display: swap`, preloaded, subset.
- [ ] No layout shift from late‑loading images (explicit width/height or aspect‑ratio box).
- [ ] Third‑party scripts (GA/GTM, Stripe) loaded `afterInteractive`/lazy, not blocking.
- [ ] `optimizePackageImports` covers heavy barrels (`lucide-react`, `date-fns`, `framer-motion`).

---

## 7. Security testing

Prod posture is **strong** (verified): Cloudflare, `Strict-Transport-Security` (preload),
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`, a full `Content-Security-Policy` with `frame-ancestors 'none'`, and no
`X-Powered-By` leak. Keep it that way.

| Area | Checks |
|------|--------|
| **Headers** | Re‑run `curl -sI https://gglobby.in/` after every deploy; the header set above must persist. |
| **CSP** | When adding a new external script/iframe/image host, update CSP in `next.config.ts` **and** re‑test that the feature works *and* nothing else broke. `script-src` still allows `'unsafe-inline'` (GTM/Stripe) — 🟡 tighten with nonces later. |
| **Authz** | Every `/api/admin/*` rejects non‑admin; user APIs reject cross‑user access (try fetching another user's resource by ID). |
| **Rate limiting** | Confirm 60/min API + 10/min upload limits return 429, not 500. |
| **CSRF** | State‑changing requests require the CSRF token (middleware enforced). |
| **Input/XSS** | Post `<script>`/markdown/HTML in forum, comments, profile bio → rendered sanitized (DOMPurify). |
| **Uploads** | Reject oversized (>200 MB) and non‑media MIME; uploaded files served from `/uploads/*` without path traversal. |
| **Secrets** | No secrets in client bundle (`grep` built `.next` for known env values); `.env.local` never committed. |
| **RLS / DB roles** | Known gap: broad policies + single shared DB role (`gamerhub_app`). Tracked in `CLAUDE.md` pre‑team checklist — 🟠 before backend team. |

> Run `/security-review` on any branch that touches auth, uploads, payments, or the CSP.

---

## 8. VPS / infrastructure testing

Prod runs on a single VPS: PM2 app **`gglobby`** (`server.mjs`, port 3000, `cwd
/var/www/gglobby`, `max_memory_restart: 3G`), Nginx reverse proxy, Cloudflare CDN/edge,
PostgreSQL DB `gamerhub`, uploads on disk at `/var/www/gglobby/uploads`.

### 8.1 Process health (on the VPS)
```bash
pm2 status                         # gglobby = online, low restarts
pm2 logs gglobby --lines 50        # no repeating errors
free -h && df -h                   # memory headroom; disk not full (uploads grow!)
```
- [ ] `gglobby` online, restart count stable (climbing restarts = crash loop).
- [ ] Memory below the 3 GB restart ceiling.
- [ ] Disk has headroom — **uploads dir grows unbounded**; monitor and prune/offload.

### 8.2 Networking
- [ ] Nginx up; `https://gglobby.in` serves; HTTP→HTTPS redirect.
- [ ] `www.` → apex redirect (301) — handled in `middleware.ts`.
- [ ] WebSocket (`wss://gglobby.in`) upgrades for Socket.IO (chat/notifications) — Nginx must
      pass `Upgrade`/`Connection` headers.
- [ ] Cloudflare not caching authenticated/API responses (only static + marketing HTML).

### 8.3 Database
```bash
sudo -u postgres psql -d gamerhub -c "SELECT count(*) FROM users;"
sudo -u postgres psql -d gamerhub -c "SELECT filename FROM _migrations ORDER BY applied_at DESC LIMIT 10;"
```
- [ ] DB reachable from the app (the app connects on `localhost:5433`).
- [ ] **All migrations applied** — compare `_migrations` rows to the migration files on disk.
      Latest expected: `017_create_admin_audit.sql`, `018_game_connections_unique_riot.sql`.
- [ ] Backups run (see `infra/deploy/backup.sh`) and are restorable — **test a restore**, not
      just that the dump exists.

### 8.4 Deploy mechanism
Deploy is **manual, no CD**: SSH to the VPS, `git pull origin main`, build, restart. The helper
`infra/deploy/deploy.sh` does: `git pull` → conditional `npm install` → run pending SQL
migrations (tracked in `_migrations`) → `npm run build` → `pm2 restart gglobby`.

> 🔴 **Reorg footgun — read before pushing the `scripts/` → `infra/` move.** `deploy.sh` hard‑codes
> `MIGRATIONS_DIR="$APP_DIR/scripts/migrations"`, and `_docs/developer-guide.md` documents the
> same path. That is **correct for the current `main`** (which still has `scripts/migrations`).
> The moment the uncommitted `scripts→infra` reorg is pushed, the script will look in a directory
> that no longer exists and **silently apply zero migrations** ("No migrations directory found,
> creating it…") — new schema changes won't land in prod, with no error. **When you commit the
> reorg, update `deploy.sh`, `deploy-guide.sh`, and the developer guide to `infra/migrations` in
> the same commit.**

**Deploy‑accurate build (catch reorg/CRLF false‑greens):**
```bash
git clone <repo> /tmp/gglobby-clean && cd /tmp/gglobby-clean
npm ci && NEXT_TELEMETRY_DISABLED=1 npm run build   # must succeed before you touch prod
```

### 8.5 News automation (hands‑free /news feed)

`/news` is populated automatically — no daily manual curation. The pipeline:
RSS sources (`news_sources`) → `POST /api/admin/news/fetch` → keyword game/region/category
detection → **auto‑publish** confident Valorant matches (`status='published'`), hold borderline
ones as `pending` → old `pending` items auto‑pruned (published ones persist).

**Auth:** the fetch endpoint accepts EITHER a signed‑in admin (the admin "Fetch now" button) OR a
scheduler presenting `Authorization: Bearer $CRON_SECRET`. **Set a strong `CRON_SECRET` in the
prod env** (it gates the cron trigger; if empty, cron auth is disabled).

**Auto‑publish rule:** `gameMatch.score >= AUTO_PUBLISH_MIN_SCORE` (currently 3) **and** the
article text explicitly mentions "valorant". The valorant‑mention guard blocks false positives —
general esports feeds score cricket/WWE on generic keywords; those stay `pending`, never go live.
Tune `AUTO_PUBLISH_MIN_SCORE` in `src/app/api/admin/news/fetch/route.ts`.

**Source curation matters.** Prefer Valorant‑specific, high‑signal feeds (e.g. Google News
`valorant esports india`, a dedicated Valorant news site). Reddit `r/VALORANT` works but mixes in
low‑value posts ("how do I climb bronze"). Manage sources in **/admin/news** (seed via
`/api/admin/news/sources/seed`). Set `is_active=false` on noisy general feeds.

**VPS cron setup** (runs the fetch every 2 hours; news is published with no human in the loop):
```bash
# crontab -e  (on the VPS)
0 */2 * * * curl -s -X POST https://gglobby.in/api/admin/news/fetch \
  -H "Authorization: Bearer $CRON_SECRET" >> /var/www/gglobby/logs/news-cron.log 2>&1
```
> ⚠️ If/when the dormant middleware is activated (see §7 / the security rollout), `/api/admin/*`
> will require an admin PIN cookie at the edge and this cron call will start getting 403. At that
> point either move the fetch to a `/api/cron/news` route or add a `CRON_SECRET` bypass to the
> admin‑API check in middleware. Verify the cron after any middleware change.

**Verify automation works:**
```bash
curl -s -X POST https://gglobby.in/api/admin/news/fetch -H "Authorization: Bearer $CRON_SECRET"
# → {"success":true,"sourcesProcessed":N,"totalFound":..,"totalNew":..}  then check /news
```

---

## 9. Post‑deploy smoke test (~15 min, run on https://gglobby.in after every deploy)

```bash
# 1) Route + status sweep (expect 200, except gated 307 and intentional 404s)
for r in / /overview /login /register /blog /agents /maps /tools /aim /pro /pros \
         /leaderboard /tier-list /crosshairs /forum /community /premium /privacy /terms; do
  curl -s -o /dev/null -w "%-14s %{http_code}  %{time_total}s\n" "$r" --url "https://gglobby.in$r"
done

# 2) Security headers intact
curl -sI https://gglobby.in/ | grep -iE "strict-transport|x-frame|content-security|x-content-type"

# 3) SEO endpoints
curl -s -o /dev/null -w "robots %{http_code}\n"  https://gglobby.in/robots.txt
curl -s -o /dev/null -w "sitemap %{http_code}\n" https://gglobby.in/sitemap.xml
```

Then **manually**:
- [ ] Log in with the QA account; load `/dashboard`.
- [ ] Send a DM / check a notification (verifies Socket.IO/WebSocket post‑deploy).
- [ ] Open one newly‑deployed feature and confirm it works (e.g. `/aim` once the current build ships).
- [ ] Open DevTools console on `/overview` — **zero errors** (warnings triaged).
- [ ] Stripe test checkout opens on `/premium`.
- [ ] `pm2 logs gglobby` shows a clean restart, no error spam.
- [ ] Update the in‑app **Updates page** (`src/components/content/updates/updates-page-client.tsx`)
      per the `CLAUDE.md` rules for any user‑facing change shipped.

---

## 10. Known issues from this audit (2026‑06‑13)

Prioritised. Items marked **[fixed]** are committed in this pass.

> 🔴 **CRITICAL — middleware is not running in production.** `middleware.ts` is at the repo root,
> but the app uses a `src/` directory, so Next.js ignores it (it must be `src/middleware.ts`).
> Verified locally: no `csrf_token` cookie is set and `/admin` isn't gated until the file is moved
> into `src/`. **Consequence:** no API rate‑limiting, **no CSRF enforcement**, and the admin
> edge‑gate is off in prod today. It can't simply be moved — only **16 of 102** client mutation
> files send `csrfHeaders()`, so activating CSRF naively would 403 the other ~86 (forum posts,
> comments, DMs, profile edits…). **Fix = a deliberate, tested rollout:** wire `csrfHeaders()`
> across all mutations → move to `src/middleware.ts` → test every POST flow → deploy with
> monitoring. The gated‑route redirect (item 9 below) + `?callbackUrl` support are already staged
> to activate with this rollout. **Do not move the file unattended.**

| # | Sev | Area | Finding | Status |
|---|-----|------|---------|--------|
| 0 | 🔴 | Security | Middleware dormant in prod (root vs `src/`) — CSRF + rate‑limit + admin gate off (see callout above). | escalated — needs staged rollout |
| 1 | 🟠 | Deploy | `deploy.sh` migrations path breaks if the `scripts→infra` reorg is pushed without updating it (§8.4). | **[fixed]** auto‑detects `infra/migrations` vs `scripts/migrations` |
| 2 | 🟠 | Build | `next.config.ts` used deprecated `experimental.middlewareClientMaxBodySize`. | **[fixed]** → `proxyClientMaxBodySize` |
| 3 | 🟡 | Perf | Overview hero `fill` images (map banner, agent showcase) missing `sizes` → full‑res download + console warnings. | **[fixed]** added `sizes` |
| 4 | 🟡 | UX | Mobile (`<640px`) header crowded the logo with a skewed CTA + hamburger; CTA duplicated the hero. | **[fixed]** CTA hidden `<sm`, added as first item in mobile drawer |
| 5 | 🟡 | UX | News article 404 page's "Back to News" linked to `/news`, which itself 404s (no public news index). | **[fixed]** now "Back to Home" → `/` |
| 6 | 🟠 | Product | **No public news index** — `/news` 404s and `NewsArticleCard` is orphaned; articles only reachable via direct `/news/[id]` links + sitemap. Users can't browse news. | needs product decision (build index or fold into blog) |
| 7 | 🟠 | Code health | **Duplicate component trees** from the reorg — e.g. `src/components/tools/` (1 orphan file) vs live `src/components/gaming/tools/`; also duplicate `maps/`, `ui/avatar` copies. Dead code; risk of editing the wrong file. | dedupe pass |
| 8 | 🟡 | Perf | `/blog` TTFB ~3.5 s on prod vs ~0.3 s elsewhere (cold cache or heavy query). | investigate query/caching |
| 9 | 🟡 | UX | Logged‑out access to gated routes 307‑redirects to `/` (home) rather than `/login` with a return URL — disorienting. | confirm intent |
| 10 | ℹ️ | Deploy | Prod is running an **older build** than local `main` HEAD (`/aim` 404s on prod, 200 locally) — undeployed features are queued. | deploy to ship |

> The DB connection errors you'll see in **local** dev logs (`ECONNREFUSED …:5433`) are expected
> when no local DB/tunnel is running; pages degrade gracefully (return 200 with empty data).
> This is **not** a prod issue.

---

## 11. Competitor UX benchmarks → recommendations

Synthesised from op.gg, tracker.gg, mobalytics, blitz.gg, and India‑focused communities (STAN,
ESFI/BGMI Discords). Full notes in this audit's report. Top opportunities, by impact:

1. **Make the Passport share‑first** — auto‑generate an OG‑style shareable **image card**
   (rank/peak/main/role/clip) with one‑tap copy‑link + share to WhatsApp/Discord/Instagram
   Story. This is ggLobby's biggest native differentiator; tracker.gg treats the share link as a
   designed use case — go further for Indian social channels.
2. **Daily check‑in + streak/badge loop tied to the Passport** (Tracker XP pattern) — the single
   highest‑retention mechanic across competitors. Badges display on the Passport.
3. **Search‑first, login‑optional player lookup** (op.gg funnel) — let anyone look up any Riot ID
   and see stats *before* linking; linking becomes the upsell, not the gate.
4. **Restructure stats as map → agent → role with shot %s** — actionable framing over raw match
   dumps; feeds LFG/role matching.
5. **Version + credential all guide/tier content** to the patch and a named author (mobalytics
   trust play); cross‑link guides ↔ lineups ↔ tier lists so content compounds.
6. **India‑native community hooks** — mobile‑first layouts, WhatsApp/Discord share targets,
   tournament/LFG participation as the day‑1 hook (STAN); joining a clan as low‑friction as a
   Discord channel.
7. **Phase/context‑aware tools** — "you queued Bind → here are your Bind lineups + best agents"
   rather than generic libraries (Blitz lesson: automate the lookup).
8. **Freemium monetization** — ad‑supported free core + a cheap ad‑free/depth premium tier; gate
   *depth, not belonging*. Price well below the ~$8 global benchmark for India.

---

## 12. Quick reference — commands

```bash
# Local
npm run dev                 # dev server (port per launch config)
npx tsc --noEmit            # type check
npm run lint                # lint
npm test                    # unit/component
npm run build               # prod build
npm run e2e                 # Playwright (see playwright.config.ts)

# Prod (read-only, safe from anywhere)
curl -sI https://gglobby.in/                       # headers
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://gglobby.in/overview

# On the VPS
pm2 status && pm2 logs gglobby --lines 50
sudo -u postgres psql -d gamerhub -c "SELECT filename FROM _migrations ORDER BY applied_at DESC LIMIT 5;"
bash infra/deploy/deploy.sh                         # pull → migrate → build → restart
```
