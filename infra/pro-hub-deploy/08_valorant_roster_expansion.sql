-- 008c: Pro Hub roster expansion — fill out current VCSA Indian rosters.
--
-- The base seed (02_valorant_seed.sql) curated the two VCSA 2026 Split 1
-- finalists in depth (S8UL + Revenant XSpark). This adds the remaining roster
-- members for those two teams plus Gods Reign, so the national ranking shows a
-- fuller, real Indian-scene roster instead of just the headline names.
--
-- Sourced from vlr.gg + Liquipedia VCL South Asia 2026 (IGNs/teams verified).
-- Fields we are NOT certain about (real_name, role, city, stats) are left NULL
-- on purpose — the admin Pro CRUD (/admin/pro) and the stats pipeline enrich
-- them later. Global Esports' VCT Pacific roster is intentionally NOT listed as
-- "Indian pros" (it is international) — GE stays a team entry only, per 02.
--
-- Apply via:  sudo -u postgres psql -d gamerhub -f .../03_valorant_roster_expansion.sql
-- Safe to re-run: ON CONFLICT (slug) DO NOTHING (never overwrites curated rows).

INSERT INTO pro_players (slug, game, ign, team_id, country, is_active)
SELECT v.slug, 'valorant', v.ign,
       (SELECT id FROM pro_teams WHERE slug = v.team_slug),
       'IN', TRUE
FROM (VALUES
  -- S8UL Esports (Split 1 champions) — remaining starters
  ('s8ul-yuvi',          'Yuvi',          's8ul-esports'),
  ('s8ul-anq',           'Anq',           's8ul-esports'),
  ('s8ul-xexxar',        'xexxar',        's8ul-esports'),
  -- Revenant XSpark (Split 1 finalists) — remaining starters
  ('rntx-consz',         'consz',         'revenant-xspark'),
  ('rntx-k1ngkappa',     'k1ngkappa',     'revenant-xspark'),
  -- Gods Reign
  ('gr-lightningfast',   'Lightningfast', 'gods-reign'),
  ('gr-hellff',          'Hellff',        'gods-reign'),
  ('gr-deecee',          'deecee',        'gods-reign'),
  ('gr-kishi',           'Kishi',         'gods-reign'),
  ('gr-b00nrealcul',     'b00nrealcul',   'gods-reign')
) AS v(slug, ign, team_slug)
WHERE EXISTS (SELECT 1 FROM pro_teams WHERE slug = v.team_slug)
ON CONFLICT (slug) DO NOTHING;
