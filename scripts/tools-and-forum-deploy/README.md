# Tools + Forum + Pick'em — VPS Deploy Bundle

Schema and seeds for the new gamer-tools rollout:

- **Forum** (sectioned threads, nested replies, vote toggle)
- **Sensitivity Share** (community-uploaded sens configs across PC + mobile)
- **Pick'em** (tournament-bracket predictions attached to `pro_events`)

The other tools in this rollout (FOV calc, monitor guide, rank percentile,
tier list maker, Valorant crosshair gallery, skin estimator) are 100 %
client-side or read from existing tables — they need **no** database changes.

## Order of operations

| # | File | What it does |
|---|------|--------------|
| 1 | `01_forum_schema.sql`     | `forum_categories`, `forum_posts`, `forum_replies`, `forum_votes` + `create_forum_post` / `create_forum_reply` / `toggle_forum_vote` RPCs. |
| 2 | `02_forum_seed.sql`       | 2 default sections (Valorant + pinned Announcements). Idempotent. V2 is Valorant-only; `scripts/migrations/009_forum_valorant_only.sql` removes pre-V2 multi-game sections from existing deployments. |
| 3 | `03_sens_share_schema.sql`| `sens_shares` + `sens_share_votes` + `toggle_sens_share_vote`. |
| 4 | `04_pickem_schema.sql`    | `pickem_matches` + `pickem_predictions` + `pickem_leaderboard` view. |

## How to apply

```bash
cd /path/to/repo/scripts/tools-and-forum-deploy
chmod +x apply.sh
./apply.sh
```

## Rolling back

```sql
DROP VIEW  IF EXISTS pickem_leaderboard;
DROP TABLE IF EXISTS pickem_predictions  CASCADE;
DROP TABLE IF EXISTS pickem_matches      CASCADE;
DROP TABLE IF EXISTS sens_share_votes    CASCADE;
DROP TABLE IF EXISTS sens_shares         CASCADE;
DROP TABLE IF EXISTS forum_votes         CASCADE;
DROP TABLE IF EXISTS forum_replies       CASCADE;
DROP TABLE IF EXISTS forum_posts         CASCADE;
DROP TABLE IF EXISTS forum_categories    CASCADE;
DROP FUNCTION IF EXISTS create_forum_post(UUID, UUID, TEXT, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS create_forum_reply(UUID, UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS toggle_forum_vote(UUID, SMALLINT, UUID, UUID);
DROP FUNCTION IF EXISTS toggle_sens_share_vote(UUID, UUID, SMALLINT);
DROP FUNCTION IF EXISTS forum_slugify(TEXT);
DROP FUNCTION IF EXISTS forum_set_updated_at();
```

## Notes

- All tables grant ownership to `gamerhub_app`, same as the pro-hub bundle.
- Forum RPCs (`create_forum_post`, `create_forum_reply`, `toggle_forum_vote`)
  match the signatures already used in `/src/app/api/forums/*` — those routes
  were shipped first and were unusable until this schema lands.
- The `pickem_leaderboard` view auto-computes points whenever an admin sets
  `pickem_matches.winner` on a row.
