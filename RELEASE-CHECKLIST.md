# ggLobby V2 — Release / Deploy Checklist

Valorant-only V2. Work it top-to-bottom; nothing here is optional unless
marked. Generated during release-prep — keep it updated as things change.

---

## 0. Branch → main (BLOCKING)

All V2 release-prep work lives on branch **`v2-release-prep`**. The VPS
`scripts/deploy.sh` runs **`git pull origin main`** — it will deploy nothing
new until V2 is on `main`.

```bash
# locally, once V2 is reviewed:
git checkout main
git merge --no-ff v2-release-prep
git push origin main
```

> The repo's only prior commit is the pre-strip V1 baseline. Merging V2 to
> `main` is effectively the V1→V2 cutover — do it deliberately, not casually.

---

## 1. Environment variables (BLOCKING)

Set on the VPS (the app's process env / `.env`, not committed). Source of
truth is [.env.example](.env.example). Grouped by consequence if missing:

### Hard-required — app is broken without these
- `DATABASE_URL` — PostgreSQL connection (self-hosted VPS, not Supabase).
- `AUTH_SECRET` — NextAuth v5 secret (`openssl rand -base64 32`). Sessions
  fail without it.
- `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` — set to the
  real prod origin (`https://gglobby.in`). Wrong values break OAuth callbacks,
  canonical URLs and the sitemap.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google sign-in.
- `TOKEN_ENCRYPTION_KEY` — encrypts OAuth tokens at rest
  (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- `ADMIN_PIN_HASH` — admin panel PIN gate (bcrypt hash; see .env.example).
- `UPLOAD_DIR` — e.g. `/var/www/gglobby/uploads`. **Must exist and be
  writable by the app user.** The loyalty/giveaway points store *and* the
  map-lineups store are JSON files under `UPLOAD_DIR/data/` — if the dir is
  missing or read-only, giveaway entries and lineups silently fail to persist.

### Feature-required — that feature fails silently/loudly without it
- `RESEND_API_KEY` + `EMAIL_FROM` — password-reset email. Without it the
  reset endpoint still returns success (anti-enumeration) but **no email is
  sent** — users are locked out with no signal.
- `HENRIK_API_KEY` + `TRACKER_USE_LIVE=true` — `/tracker` real Valorant
  stats. Without both, tracker returns mock data in dev and **errors in
  production**.
- `STEAM_API_KEY` — Steam-side stats on the tracker.
- `CRON_SECRET` — authenticates the news/automation cron endpoint
  (`openssl rand -hex 32`). Cron route is unprotected/broken without it.

### Optional — only if the feature is enabled
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` /
  `STRIPE_WEBHOOK_SECRET` — premium/checkout.
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `NEXT_PUBLIC_LIVEKIT_URL` —
  voice/video.
- `OPENAI_API_KEY`, `DISCORD_*` — AI helpers / Discord (Phase 2).
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — analytics.

---

## 2. Database migrations

`scripts/deploy.sh` **auto-applies** any unappplied `scripts/migrations/*.sql`
via a `_migrations` tracking table — so a normal deploy handles this.

- **Migration 008** (`008_create_wall_post_likes.sql`) is committed and will
  be picked up automatically on the next `deploy.sh` run.
- If deploying **manually** (not via deploy.sh), run pending migrations
  yourself:
  ```bash
  sudo -u postgres psql -d gamerhub -f \
    /var/www/gglobby/scripts/migrations/008_create_wall_post_likes.sql
  ```
- Sanity check after deploy:
  ```bash
  sudo -u postgres psql -d gamerhub -tAc \
    "SELECT filename FROM _migrations ORDER BY filename;"
  ```

---

## 3. Deploy

```bash
# on the VPS
bash /var/www/gglobby/scripts/deploy.sh
# (git pull origin main → npm install if lockfile changed →
#  apply migrations → build → pm2 restart)
```

Post-deploy smoke:
- `pm2 logs gglobby --lines 20` — no boot errors.
- Load `/`, `/agents`, `/maps`, `/pros`, `/patch`, `/patch/11-00`,
  `/crosshairs`, `/tier-list`, `/blog`, `/giveaway` — all 200.
- **Redirects** (added this release): `/pro/valorant`, `/pro/valorant/<slug>`,
  `/tools/crosshairs`, `/tools/tier-list` must 308 → the new top-level paths.
- `/sitemap.xml` — contains the V2 content pillars + agent/map/patch/pro/blog
  URLs, and does **not** list the frozen Phase-3 routes.
- `/robots.txt` reachable.

---

## 4. SEO cutover (because SEO is the primary acquisition engine)

- Submit the new `/sitemap.xml` in Google Search Console.
- The old paths now 308-redirect, so existing indexed URLs transfer ranking —
  no action needed beyond confirming the redirects respond.
- Spot-check that moved pages emit the **new** canonical (`/crosshairs`,
  `/tier-list`, `/pros/<slug>`), not the old nested ones.

---

## 5. Done in release-prep — verify in smoke test

- **Frozen Phase-3 nav removed** — friends / messages / community / clans /
  find-gamers are gone from the sidebar, navbar, mobile menu, and the
  RightSidebar/MessageNotifier panel is unmounted (AppShell is now a
  passthrough). Code is kept (frozen), routes still resolve by direct URL but
  are unlinked and excluded from the sitemap. *Smoke: confirm no frozen links
  appear in any nav for a logged-in user.*
- **Discord / crossplay / console integration deleted** — discord + console
  (xbox/playstation/nintendo) connect routes, crossplay, their hooks/types/
  components removed; Riot + Steam integrations (tracker) deliberately kept.
  *Smoke: `/settings/connections` still loads and Riot/Steam linking works;
  `/tracker` still functions.*

## 6. Known, non-blocking follow-ups

- **~379 TypeScript errors remain**, almost entirely a *systemic inherited V1
  db-client typing issue* in frozen/non-shipping code (was 512 at start of
  release-prep). Build is green via `ignoreBuildErrors: true`; all V2-shipping
  surfaces are type-clean. Real cleanup is a separate, dedicated refactor — do
  **not** treat zero-tsc as a launch gate.
- **Patch data is curated** — update `src/lib/data/valorant-patches.ts` each
  real Riot patch (prepend one object; everything else derives from it).
