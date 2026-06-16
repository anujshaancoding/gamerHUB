# Security Middleware Activation — Staged Rollout Plan

**Status:** middleware is DORMANT in production. **Owner sign-off + live logged-in
testing required before activation.** Do not flip this on blind — it gates every
state-changing API request and will 403 client mutations if the prerequisites below
aren't met first.

## Background (audit findings C1 / H1)

`middleware.ts` lives at the repo root. With a `src/` app directory, Next.js expects
middleware at `src/middleware.ts`, so the root file is ignored by `next build`. On top
of that, production runs a **custom server** (`server.mjs` → `app.getRequestHandler()`),
which is a second reason edge middleware may not execute. Net effect today:

- CSRF validation — **OFF** (`validateCsrfToken`)
- Global API rate limiting (60/min, uploads 10/min) — **OFF**
- Admin route redirect + admin-API PIN/token edge gate — **OFF**
- `www → non-www` redirect and `/` → `/overview` rewrite — **OFF** (handled elsewhere/Nginx)

Per-route protections that ARE live and cover the highest-risk surfaces:

- Login brute-force throttle — **in `authorize()`** (`src/lib/auth/auth.config.ts`, 10/15min/IP)
- Register / reset-password / resend-verification / verify-email — in-route limiters
- Admin PIN — `checkPinRateLimit` (5/15min, 1h lockout)
- Admin API auth + PIN + token — re-checked **inside each admin route** (not only at the edge)
- Socket handshake — HMAC-verified in `server.mjs`

So the residual exposure from dormancy is: (a) no *global* request-rate ceiling →
volumetric DoS, and (b) CSRF defense-in-depth is off. Object-level authorization is
enforced in-route (the audit found no IDOR), so dormancy is a missing *outer* layer,
not the only lock.

## Why we can't just move the file

The client already attaches the CSRF token: `installCsrfFetchInterceptor()` is wired in
`AuthProvider.tsx` and patches `window.fetch` to send `x-csrf-token` on mutating `/api/`
requests. BUT that token comes from the `csrf_token` cookie, and **the only thing that
sets that cookie is the dormant middleware** (`setCsrfCookie` on GET page loads). So:

> Activate CSRF validation before the cookie is reliably issued → first-load mutations
> 403 for every user.

This is the chicken-and-egg that makes activation a staged, tested change rather than a
one-line move.

## Rollout sequence (do in order, test between each)

1. **Relocate** `middleware.ts` → `src/middleware.ts`. Keep the `matcher` config.
2. **Confirm execution under the prod server.** Add a temporary header
   (e.g. `x-mw: 1`) in the middleware and verify it appears on responses when running
   `NODE_ENV=production node server.mjs` — NOT just `next dev`. If the custom server does
   not invoke middleware, either (a) move the www-redirect/CSRF/rate-limit/admin-gate
   logic into `server.mjs` directly, or (b) front it with Nginx. **This is the make-or-break
   check.**
3. **Issue the CSRF cookie independently of validation.** Land a change that sets
   `csrf_token` on GET page loads with validation still OFF, deploy, and confirm in the
   browser that the cookie is present and the interceptor sends `x-csrf-token` on a
   sample mutation. (Cookie set + header sent, but nothing rejected yet.)
4. **Audit the ~86 mutation call sites** the prior review flagged: anything NOT going
   through the patched `window.fetch` (server actions, `Request`-object fetches, native
   form posts, third-party widgets) won't carry the header. Either route them through a
   shared `apiFetch()` helper or add them to the CSRF-exempt prefix list intentionally.
   The current exempt list is `/api/auth/`, `/api/upload`, `/api/analytics/`,
   `/api/stripe/webhook`, `/api/cron/`.
5. **Turn CSRF validation ON** for user APIs. Test the full logged-in matrix against a
   real session: send message, post wall/forum/clan content, edit profile, upload
   avatar + clip, like/comment, friend request, settings change, admin actions.
6. **Turn the global rate limiters ON** last. Note the in-memory limiter is **per-PM2
   worker** and resets on restart — if PM2 runs >1 instance, either pin
   `instances: 1` for the web process or move the limiter to Redis (shared store) so the
   ceiling is real. See `src/lib/security/rate-limit.ts`.

## Rollback

Each step is independently revertible. If anything 403s in prod, set the user-API CSRF
block back to a no-op (or re-add the route prefix to the exempt list) and redeploy —
the in-route protections from this session remain in force regardless.
