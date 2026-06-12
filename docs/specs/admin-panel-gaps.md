# Spec: Filling the Admin Panel gaps

**Status:** Proposed (roadmap) · **Owner:** Atlas → Engineering (Forge) · **Date:** 2026-06-12

The admin panel's **auth is solid** (middleware PIN token + per-route `is_admin`, `super_admin`
gate on destructive ops). The gaps are **missing controls** for things the site already does:
moderating the forum, overseeing clans/tournaments, and leaving an audit trail. This spec covers
all four in priority order so they can be built incrementally.

## Conventions every item below reuses

- **New admin section** = a `"use client"` page at `src/app/admin/<section>/page.tsx` + one entry
  in the `allNavItems` array in `src/components/admin/admin-sidebar.tsx`
  (`{ href, label, icon, exact?, newsOnly? }`) + a Lucide icon. Layout/auth/PIN gating is automatic.
- **Server auth in `/api/admin/*`**: `getUser()` → `createAdminClient().from("profiles")
  .select("is_admin")` → 403 if not admin. For destructive ops also select `admin_role` and require
  `admin_role === "super_admin"` (pattern in `src/app/api/admin/users/route.ts:214`).
- **Migrations**: `NNN_description.sql` in `scripts/migrations/` (the deploy runner reads *only*
  this dir and tracks applied files in a `_migrations` table). **Next number = `017`.** Mirror the
  file into `infra/migrations/` for the reorg.
- **Status-lifecycle UI** (pending → investigating → resolved/dismissed/escalated, with
  `resolved_by`/`resolved_at` + resolution-note modal) already exists in `admin/reports` and is the
  template for any moderation queue.

---

## Priority 1 — Forum moderation  ·  effort: M

**Why first:** you have a live forum (`/forum`, `api/forums/*`) with **no admin override at all**.
Post delete today is *owner-only soft delete* (`forum_posts.is_deleted`); an admin can't remove an
abusive thread, lock a flame war, pin an announcement, or hide a category.

**No schema change needed** — the moderation columns already exist:
`forum_posts.is_pinned, is_locked, is_solved, is_deleted, deleted_by`;
`forum_replies.is_deleted`; `forum_categories.is_locked, is_hidden, display_order`.

**Build:**
- New API: `src/app/api/admin/forum/route.ts` (+ `posts/[postId]`, `replies/[replyId]`,
  `categories/[id]` as needed). Admin-gated PATCH/DELETE that can set `is_pinned` / `is_locked` /
  `is_deleted` on any post or reply regardless of author, stamping `deleted_by = admin.id`. Category
  PATCH for `is_locked` / `is_hidden` / `display_order` + create/rename.
- New page: `src/app/admin/forum/page.tsx` — tabs: **Threads** (search, filter by category, quick
  Pin/Lock/Delete), **Replies** (recent + reported), **Categories** (CRUD + reorder).
- Sidebar entry "Forum" (icon `MessagesSquare`).
- **Hook reports → forum**: `user_reports.context_type` already supports content contexts; surface a
  "moderate this thread" jump from the Reports queue.

**Writes are audited** (see Priority 2): every admin delete/lock logs an `admin_audit` row.

---

## Priority 2 — Audit log  ·  effort: S–M  (build alongside / just before P1)

**Why:** `delete_user`, `make_admin`, news publish, and the new forum/clan deletes are
destructive/privileged and currently leave **no trace of who did what**. Small, foundational, and on
the CLAUDE.md pre-team checklist. Build it early so P1/P3 write to it from day one.

**Migration `017_create_admin_audit.sql`:**
```sql
CREATE TABLE admin_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid NOT NULL REFERENCES profiles(id),
  actor_email   text,                      -- denormalized for fast display
  action        text NOT NULL,             -- e.g. 'forum.post.delete', 'user.make_admin'
  target_type   text,                      -- 'forum_post' | 'user' | 'clan' | ...
  target_id     text,
  metadata      jsonb,                     -- before/after, reason, etc.
  ip            text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_created_idx ON admin_audit (created_at DESC);
CREATE INDEX admin_audit_actor_idx   ON admin_audit (actor_id);
```
RLS: SELECT for admins only; INSERT via service/admin client only.

**Helper:** `src/lib/admin/audit.ts` → `logAdminAction(actor, { action, targetType, targetId,
metadata })`. One-line call added to every sensitive admin handler (users PATCH destructive branches,
news publish/delete, forum moderation, automation start/stop).

**Page:** `src/app/admin/audit/page.tsx` — read-only, filter by actor/action/date, newest first.
Reuses the reports list UI. Sidebar entry "Audit Log" (icon `ScrollText`), ideally `super_admin`-only.

---

## Priority 3 — Clans & Tournaments oversight  ·  effort: M–L

**Clans** (`clans`, `clan_members`, `clan_wall_posts`, `clan_scrims`, `clan_weekly_missions`,
`clan_activity_log`, …): admin needs to **disband a clan**, **transfer/remove ownership**, **moderate
clan wall posts**, and **kick a member** from the panel.
- New API `src/app/api/admin/clans/route.ts` (+ `[clanId]`, `[clanId]/wall/[postId]`). Disband =
  soft-delete or status flag (confirm with a `super_admin` gate). All actions audited.
- New page `src/app/admin/clans/page.tsx` — list/search clans, drill into members + wall, moderation
  actions.

**Tournaments** (`tournaments`, `tournament_participants`, `tournament_matches`): admin needs to
**create/edit/cancel** a tournament and **fix bracket/match results** (currently only doable via API).
- New API `src/app/api/admin/tournaments/route.ts` (+ `[tournamentId]`, `.../matches/[matchId]`).
- New page `src/app/admin/tournaments/page.tsx` — create form + manage participants/matches.

Sidebar entries "Clans" (icon `Shield`) and "Tournaments" (icon `Trophy`). Larger because each needs
a list + detail + several actions; can ship clans first, tournaments second.

---

## Priority 4 — Content CRUD: Patch / Tier-list / Maps  ·  effort: M

Today these are **hardcoded TS files** (`valorant-patches.ts`, `valorant-meta.ts`, lineups are the
exception — already file-backed via `/api/lineups`). Editing means a code change + redeploy.

This **overlaps with the Patch/Meta automation spec** (`patch-meta-automation.md`). Recommendation:
do Phases 1–2 of *that* spec (move patches to a `patch_entries` table + an `/admin/patch` editor) and
extend the same review-UI pattern to a tier-list/maps editor. Don't build a separate one-off here.

---

## Recommended sequence

1. **P2 Audit log** (S–M) — foundational; everything else logs into it.
2. **P1 Forum moderation** (M) — highest user-facing value, no schema work.
3. **P3 Clans, then Tournaments** (M–L) — oversight for the two biggest un-managed systems.
4. **P4 Content CRUD** — folded into the Patch/Meta automation build.

Each is independently shippable behind the existing admin auth. P1+P2 together (~one focused build)
already close the most embarrassing gaps: an unmoderatable forum and untraceable destructive actions.

## Decisions for the CEO

- Should **Audit Log** and **clan disband / make-admin** be **`super_admin`-only**, or any admin?
- For forum/clan deletes: **soft-delete** (recoverable, recommended) or hard-delete?
- OK to add table `admin_audit` (migration `017`) — it's additive, no risk to existing data?
