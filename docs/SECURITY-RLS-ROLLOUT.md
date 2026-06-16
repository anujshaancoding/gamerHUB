# Row-Level Security (RLS) — Decision & Staged Rollout

**Status:** RLS is NOT a working backstop today, and that is now SAFE by default —
`infra/migrations/011_enable_rls_role_based.sql` is **excluded from auto-deploy**
(`deploy.sh` skips it unless `APPLY_MANUAL=1`). Do not apply it until the wiring below
is done and tested, or it will lock the app out of writes.

## The situation (audit findings C2 / H7)

The app connects to Postgres as **`gamerhub_app`, which OWNS the tables**
(`ALTER TABLE ... OWNER TO gamerhub_app` throughout the migrations). Postgres RLS
semantics matter here:

| State | Applies to table owner? |
|-------|--------------------------|
| `ENABLE ROW LEVEL SECURITY` | **No** — owner bypasses policies |
| `FORCE ROW LEVEL SECURITY`  | **Yes** — owner is subject to policies |

Consequences:

1. The 6 existing `allow_all ... USING(true)` policies (lfg_posts, lfg_applications,
   profile_wall_post_likes, profile_media_likes, profile_media_comments, funnel_events)
   are **inert** — RLS is `ENABLE`d but the app is the owner, so it bypasses them. They
   neither protect nor block anything today. (**H7**)
2. Migration 011 uses **`FORCE`** + policies keyed on `public.current_app_user_id()`,
   which reads `current_setting('app.user_id')`. The app never calls
   `setRequestUser()` (`src/lib/db/user-context.ts` is defined but **never invoked**),
   so that setting is always NULL → every user-scoped `USING`/`WITH CHECK` fails →
   inserts/updates to profiles, messages, notifications, etc. are rejected. Applying
   011 as-is **locks the app out**. (**C2**)

So today's enforcement is **app-layer authorization** (consistent `getUser()` +
ownership checks in every route — the audit found no IDOR across ~22 sampled mutation
routes). RLS is intended as defense-in-depth *underneath* that, not the only lock.

## The decision to make (CEO / backend owner)

Pick ONE before ever running `APPLY_MANUAL=1`:

- **Option A — Make RLS a real backstop (the audit's recommended end state).**
  Multi-day, invasive, must be tested against a live logged-in session:
  1. Stop connecting as the table owner for normal traffic. Create a dedicated login
     role granted into `app_writer` (non-owner, non-BYPASSRLS) and point the app's
     `DATABASE_URL` at it; admin/cron connections use a role granted into `app_admin`
     (BYPASSRLS). `GRANT app_writer TO <app_login_role>;`
  2. Call `setRequestUser(sql, user.id)` at the start of **every** authenticated DB
     request (wrap in `sql.begin(tx => setRequestUser(tx, id, {transaction:true}); …)`
     if behind a transaction-mode pooler — see the note in `user-context.ts`).
  3. Convert the 6 `allow_all` policies to owner-scoped (templates below).
  4. Run `APPLY_MANUAL=1 bash deploy.sh` on staging, exercise the full write matrix
     (send message, edit profile, like/comment, lfg post/apply, notifications), then
     production.

- **Option B — Keep app-layer authz as the enforcement, defer RLS.**
  Leave 011 deferred indefinitely. Keep the `allow_all` policies (they're inert under
  owner-bypass; harmless). Revisit RLS when a backend team is onboarded (this is already
  on the "Pre-Team Expansion Checklist" in CLAUDE.md). Lowest risk; no DB lockout.

Until the decision is made, **Option B is the de-facto safe state** and the deploy guard
keeps it that way.

## H7 — owner-scoped policy templates (for Option A, step 3)

Apply ONLY as part of the Option-A rollout (they require `current_app_user_id()` from 011
to be set per request, and a non-owner app role + `FORCE`, or they're inert/locking):

```sql
-- lfg_posts: anyone can read; author can write their own.
DROP POLICY IF EXISTS allow_all_lfg_posts ON lfg_posts;
CREATE POLICY lfg_posts_read   ON lfg_posts FOR SELECT USING (true);
CREATE POLICY lfg_posts_write  ON lfg_posts FOR ALL
  USING (author_id = public.current_app_user_id())
  WITH CHECK (author_id = public.current_app_user_id());
-- (confirm the owner column name — author_id/user_id/created_by — against the live schema)

-- lfg_applications: applicant owns their row.
DROP POLICY IF EXISTS allow_all_lfg_applications ON lfg_applications;
CREATE POLICY lfg_apps_owner ON lfg_applications FOR ALL
  USING (applicant_id = public.current_app_user_id())
  WITH CHECK (applicant_id = public.current_app_user_id());

-- like/comment tables: reads public, writes owned by user_id.
DROP POLICY IF EXISTS allow_all_wall_post_likes ON profile_wall_post_likes;
CREATE POLICY wall_likes_read  ON profile_wall_post_likes FOR SELECT USING (true);
CREATE POLICY wall_likes_write ON profile_wall_post_likes FOR ALL
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());
-- repeat the same read/write split for profile_media_likes and profile_media_comments.

-- funnel_events: analytics — insert by anyone (anon funnel), no public read.
DROP POLICY IF EXISTS allow_all_funnel_events ON funnel_events;
CREATE POLICY funnel_insert ON funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY funnel_admin  ON funnel_events FOR SELECT TO app_admin USING (true);
```

**Verify every column name with `\d <table>` against the live VPS before running** —
`infra/sql/00_local_baseline.sql` is a non-authoritative local reconstruction.
