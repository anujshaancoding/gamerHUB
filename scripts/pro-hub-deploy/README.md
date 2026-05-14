# Pro Hub — VPS Deploy Bundle

Everything you need to roll out the `/pro` section (Indian pro-player rankings,
stats, gear and tournaments) to the production VPS. Apply these in order.

This folder is **self-contained**. Once everything in here has been applied, the
`/pro/...` routes and the `/admin/pro` admin panel will be fully functional.

## Order of operations

| # | File | What it does |
|---|------|--------------|
| 1 | `01_schema.sql`         | Creates `pro_teams`, `pro_players`, `pro_player_stats`, `pro_player_gear` tables, indexes, triggers, ownership. |
| 2 | `02_valorant_seed.sql`  | 5 Indian Valorant teams + 6 placeholder players with PC gear. |
| 3 | `03_bgmi_seed.sql`      | 6 Indian BGMI teams + 6 placeholder players with **mobile** gear. |
| 4 | `04_freefire_seed.sql`  | 4 Indian Free Fire teams + 6 placeholder players with mobile gear. |
| 5 | `05_pro_events.sql`     | Creates `pro_events` table for the tournament calendar. |
| 6 | `06_events_seed.sql`    | Sample upcoming Indian tournaments (BMPS, VCT Challengers SA, FFWS India). |
| 7 | `07_pro_player_follows.sql` | Creates `pro_player_follows` table so logged-in users can follow pros. |

All seed files are idempotent (`ON CONFLICT (slug) DO UPDATE` everywhere), so
re-running them just overwrites placeholder data with whatever you've edited
in the file. Real data should be entered via `/admin/pro` once live.

## How to apply

### Option A — one-shot bash script (recommended)

```bash
# On the VPS:
cd /path/to/repo/scripts/pro-hub-deploy
chmod +x apply.sh
./apply.sh
```

The script connects as `postgres`, applies each `.sql` in numeric order, and
stops at the first error.

### Option B — manual, one at a time

```bash
sudo -u postgres psql -d gamerhub -f 01_schema.sql
sudo -u postgres psql -d gamerhub -f 02_valorant_seed.sql
sudo -u postgres psql -d gamerhub -f 03_bgmi_seed.sql
sudo -u postgres psql -d gamerhub -f 04_freefire_seed.sql
sudo -u postgres psql -d gamerhub -f 05_pro_events.sql
sudo -u postgres psql -d gamerhub -f 06_events_seed.sql
sudo -u postgres psql -d gamerhub -f 07_pro_player_follows.sql
```

### After applying

```bash
# Sanity-check counts
sudo -u postgres psql -d gamerhub -f verify.sql
```

You should see roughly:
- 15 pro_teams, 18 pro_players, 18 pro_player_stats, 18 pro_player_gear
- Some pro_events rows depending on what's in the seed.

Then redeploy the Next.js app and hit `/pro` — Valorant, BGMI and Free Fire
rankings should all render, the tournament calendar at `/pro/events` should
show upcoming events, and the compare tool at `/pro/compare` should let you
diff any two same-game pros.

## Rolling back

The Pro Hub schema is fully self-contained and does not touch any existing
tables. To remove it:

```sql
DROP TABLE IF EXISTS pro_player_follows CASCADE;
DROP TABLE IF EXISTS pro_player_gear    CASCADE;
DROP TABLE IF EXISTS pro_player_stats   CASCADE;
DROP TABLE IF EXISTS pro_players        CASCADE;
DROP TABLE IF EXISTS pro_teams          CASCADE;
DROP TABLE IF EXISTS pro_events         CASCADE;
DROP FUNCTION IF EXISTS pro_hub_set_updated_at();
```

## Verifying data once admins start editing

The app caches `/pro/...` pages for 5 minutes (`revalidate = 300`). Edits via
`/admin/pro` are immediate in the database but won't show on the public site
for up to 5 min. Force a redeploy or wait it out — no manual cache bust needed.

## Placeholder-data warning

The seed files contain best-effort rosters, stats and gear assembled for
**layout testing**. Verify everything via vlr.gg (Valorant), BMPS broadcasts /
Liquipedia (BGMI), FFWS India broadcasts (Free Fire), and player streams
before going public. The intended workflow once the schema is live is:

1. Apply schema + seeds (this folder)
2. Open `/admin/pro`, edit each placeholder player to real verified data, fix
   ranks, attach real photos, paste real crosshair codes, etc.
3. Toggle `is_active` off for any player you don't want public yet.
