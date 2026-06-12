# Spec: Automate the Patch & Meta section

**Status:** Proposed (roadmap) · **Owner:** Atlas → Engineering (Forge) · **Date:** 2026-06-12
**Decision on scope:** Build patch/meta auto-updating. **Skin-in-market is dropped** (no
viable public API — see Feasibility).

---

## 1. Problem

The Patch & Meta section (`/patch`, `/patch/[version]`) is 100% hand-maintained:

- Data lives in two hardcoded TypeScript files:
  - `src/lib/data/valorant-patches.ts` — the `PATCHES[]` array (patch notes + tier list)
  - `src/lib/data/valorant-meta.ts` — `AGENT_BEST_MAPS`, `AGENT_PLAYSTYLE`, `MAP_BEST_COMPS`
- Updating means a dev edits the file and redeploys. In practice it goes stale between
  Riot patches because nobody remembers to update it the day a patch drops.

**Goal:** when Riot ships a new Valorant patch, ggLobby detects it within hours, drafts a
structured patch entry automatically, and surfaces it for one-click admin review/publish —
so the section is never more than a day behind, without a developer in the loop.

## 2. Non-goals

- **Fully autonomous publishing.** Patch notes are editorial; a human approves before it goes
  live (consistent with the site's draft-and-queue rule).
- **Auto-generating the tier list.** Tier rankings are opinion, not scrapeable fact. The cron
  drafts the *patch change list*; the editor sets tier positions.
- **"Current skin in the in-game store."** Dropped — see §6.
- BGMI / Free Fire patch coverage. Valorant only for v1 (matches current section scope).

## 3. Current infrastructure we reuse

There is already a working cron pattern:

- `GET /api/cron/automation` — authed via `Authorization: Bearer ${CRON_SECRET}`, hit by an
  external scheduler every ~5 min. Stateless, reads `site_settings`, writes rows, logs to a table.
- `src/lib/db/site-settings.ts` — typed settings store.
- The admin panel already has an "Automation" section pattern we can mirror for a "Patch sync"
  status/review screen.

The new feature copies this shape — a new cron route + a new DB table + a small admin review UI.

## 4. Proposed architecture

```
Riot patch-notes page ──scrape──▶  /api/cron/patch-sync (every 6h, CRON_SECRET)
                                        │
                                        ├─ detect new patch version (vs latest in DB)
                                        ├─ fetch the notes HTML for that version
                                        ├─ LLM parse → structured change list (Claude API)
                                        └─ INSERT draft row (status='draft') into patch_entries
                                                       │
                          Admin ▶ /admin/patch  ──────┘  review, edit, set tier list, Publish
                                        │
                                        ▼
                          status='published'  ──▶  /patch and /patch/[version] read from DB
```

### 4.1 Data model — new table `patch_entries`

| column            | type        | notes                                                   |
|-------------------|-------------|---------------------------------------------------------|
| `id`              | uuid pk     |                                                         |
| `game`            | text        | `'valorant'` (room for bgmi/freefire later)             |
| `version`         | text        | e.g. `'11.00'`, unique per game                          |
| `title`           | text        | headline                                                |
| `released_at`     | date        | from notes                                              |
| `source_url`      | text        | the Riot notes URL parsed                               |
| `summary`         | text        | short editorial intro (LLM draft, human-edited)         |
| `changes`         | jsonb       | `[{category, target, change, kind:'buff'|'nerf'|'adjust'}]` |
| `tier_list`       | jsonb null  | set by editor, not the LLM                              |
| `status`          | text        | `'draft' | 'published'`                                 |
| `created_at`      | timestamptz |                                                         |
| `published_at`    | timestamptz null |                                                    |

Migration file: `infra/migrations/0NN_create_patch_entries.sql` (RLS: public SELECT where
`status='published'`; writes via admin/service role only — follow the role-based RLS direction
in CLAUDE.md, do **not** use a broad `allow_all`).

### 4.2 Read path migration

`valorant-patches.ts` becomes a fallback/seed. `/patch` and `/patch/[version]` read published
rows from `patch_entries` (ISR, `revalidate` ~1h). One-time: seed the existing `PATCHES[]` into
the table so nothing is lost.

### 4.3 The cron route — `GET /api/cron/patch-sync`

1. Auth: `Bearer ${CRON_SECRET}` (reuse existing helper).
2. Gate on a `patch_sync_enabled` site setting (so it has its own Start/Stop, like automation).
3. Scrape Riot's game-updates index for the latest `valorant-patch-notes-X-YY` link.
4. If that version already exists in `patch_entries`, exit (no-op — the common case).
5. Else fetch the notes page, send the relevant HTML to the Claude API with a strict JSON schema
   (the `changes[]` shape above), insert as `status='draft'`.
6. Notify admin (email via existing Resend, or just surface in `/admin/patch` with a badge).

### 4.4 Admin review UI — `/admin/patch`

List drafts + published. A draft opens an editor: fix the summary, tweak parsed changes, set the
tier list, then **Publish**. Mirror the existing admin section styling.

## 5. Sources & cost

- **Patch notes:** `https://playvalorant.com/en-us/news/game-updates/` — stable URL pattern
  `…/valorant-patch-notes-X-YY/`. No official API; scrape HTML. Fragile to redesigns → keep the
  selector logic small and log parse failures loudly (don't swallow like the auto_logs cleanup does).
- **LLM parse:** one Claude API call per *new* patch (~once every 2 weeks). Negligible cost
  (cents per patch). Use the latest Claude model; enforce a JSON schema so output is structured.
- **Agent/weapon canonical data:** `valorant-api.com` (already whitelisted) for names/icons to
  validate the LLM's targets against a known list.

## 6. Feasibility verdict on "current skin in market" — DROP

- Valorant's daily store is **per-account** and rotates per player; there is **no official Riot
  API** for it. Reading a player's store requires that player's own Riot credentials (an auth/
  liability burden we won't take on).
- The **featured bundle** (storefront banner) is global but has **no stable public JSON API**;
  community sites scrape Riot's marketing blog per bundle — brittle and low value.
- **Recommendation:** do not build. If we ever want "current bundle," it's a manual admin field
  on a featured-bundle card, not automation.

## 7. Phasing

- **Phase 1 (read-path):** create `patch_entries`, seed from `PATCHES[]`, switch `/patch` to read
  from DB. *No behavior change for users; unblocks everything else.*
- **Phase 2 (review UI):** `/admin/patch` CRUD + Publish. Now patches are editable without a deploy.
- **Phase 3 (cron draft):** `/api/cron/patch-sync` scrape + LLM draft + admin notify.
- **Phase 4 (polish):** parse-failure alerting, tier-list editor UX, optional BGMI/FF extension.

Phases 1–2 already remove the "needs a dev + redeploy" pain even before the scraper exists — good
incremental value if we want to stop early.

## 8. Open questions for the CEO

- OK to spend a few cents per patch on Claude API calls for parsing? (Tiny, but it's spend.)
- Email-on-new-draft via Resend, or just an in-panel badge?
- Keep `valorant-patches.ts` as a committed seed/fallback, or fully migrate to DB-only?
