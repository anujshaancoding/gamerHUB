-- 010: Beginner Q&A — pinned community questions in the Valorant forum.
--
-- Seeds 15 pinned, "question"-type threads that cover the most-asked beginner
-- topics on r/VALORANT, VLR, and the Indian Valorant Discords. Each thread is
-- its own indexable /forum/valorant/<slug> page targeting a long-tail beginner
-- search ("valorant best agent for beginners", "valorant economy explained",
-- "how to get free skins in valorant", ...). Replies stay open so the
-- community can pile on extra tips StackOverflow-style.
--
-- Applied automatically by scripts/deploy.sh on the next `git pull` — recorded
-- in the _migrations table so it only ever runs once. Manual fallback:
--   sudo -u postgres psql -d gamerhub -f scripts/migrations/010_forum_beginner_qa_seed.sql
--
-- Idempotent regardless of how it's run: re-running updates title/content/tags.
-- Threads are uniquely identified by (category_id, slug).
--
-- Author: by default, the seed picks the first profile whose username is
-- one of ('gglobby','admin','system','mod'); failing that, the oldest profile.
-- Edit the candidate list in the DO block below to point at a specific
-- admin account if you have a different convention.
--
-- Content is plain text. The forum renders thread bodies with
-- `whitespace-pre-wrap` (no markdown), so blank lines + ASCII formatting
-- are used instead of headings/tables.

DO $$
DECLARE
  v_category_id UUID;
  v_author_id   UUID;
  v_thread      RECORD;
BEGIN
  -- ── 1. Resolve the Valorant section ────────────────────────────────────────
  SELECT id INTO v_category_id
  FROM forum_categories
  WHERE slug = 'valorant'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION
      'forum_categories: no row with slug=valorant. Run 02_forum_seed.sql first.';
  END IF;

  -- ── 2. Resolve an author profile ───────────────────────────────────────────
  SELECT id INTO v_author_id
  FROM profiles
  WHERE LOWER(username) IN ('gglobby','admin','system','mod')
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_author_id IS NULL THEN
    SELECT id INTO v_author_id FROM profiles ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION
      'profiles table is empty. Create at least one profile before seeding pinned Q&A.';
  END IF;

  RAISE NOTICE 'Seeding pinned beginner Q&A: category=% author=%',
    v_category_id, v_author_id;

  -- ── 3. The 15 questions ────────────────────────────────────────────────────
  FOR v_thread IN
    SELECT * FROM (VALUES

      ('which-agent-should-i-play-first',
       'Which Valorant agent should I play first as a beginner?',
       $body$Short answer: Brimstone (Controller) or Sage (Sentinel) for support-first players, Phoenix (Duelist) if you like aggression.

Why these:

• Brimstone — easiest smokes in the game. Top-down minimap, click and place. Great for learning map control without aim pressure.
• Sage — wall + heal + slows. Forgiving kit, you stay alive longer, every team wants a Sage.
• Phoenix — self-heal + self-flash + ult that respawns you. Lets you take aim duels and recover from mistakes.

Avoid first:

• Jett / Chamber — fragile, mechanical, punish positioning mistakes hard.
• Astra / Sova — high game-sense ceiling.
• Yoru — needs deep map knowledge to use clones / teleport correctly.

Once you have ~50 hours in the game, branch into the role that suits how you naturally play. See the full agent list at /agents.$body$,
       ARRAY['beginner','agents','meta']
      ),

      ('what-sensitivity-should-i-use',
       'What sensitivity / eDPI should I use in Valorant?',
       $body$Target eDPI: 200–400. (eDPI = mouse DPI × in-game sens.)

Most common pro range: 800 DPI × 0.3–0.5 sens = 240–400 eDPI.

How to pick yours:

1. Lower your DPI to 400 or 800 (not 1600+).
2. Start with in-game sens 0.35.
3. Play 20+ deathmatch / range sessions.
4. If you constantly over-flick → lower sens by 0.05. If you can't turn fast enough → raise it by 0.05.
5. Lock it in. Stop changing it daily — muscle memory matters more than the "perfect" number.

Scoped sens multiplier: keep at default 1.00.

Convert sens from CS2, Apex, or any other FPS at /tools/sens-converter.$body$,
       ARRAY['beginner','settings','aim']
      ),

      ('what-crosshair-should-i-use',
       'What crosshair should I use as a beginner?',
       $body$Default rule: small, static, single colour, no dot or outlines toggled to taste.

Starter code (cyan, used by many pros):

  0;P;c;5;h;0;m;1;0l;4;0o;2;0a;1;0f;0;1b;0

Why static + small:

• Dynamic / firing-error crosshairs distract during sprays.
• Big crosshairs hide enemy heads at long range.

Colour choice: cyan, green or yellow are most visible on Valorant's mostly-brown maps. Red blends with red-team outlines.

Browse 50+ pro crosshair codes with one-click copy at /crosshairs.$body$,
       ARRAY['beginner','crosshair','settings']
      ),

      ('how-does-ranked-work',
       'How does ranked / Competitive work and when do I unlock it?',
       $body$Unlock: account level 20 (~15–20 hours of Unrated).

Placement: play 5 placement matches to receive a starting rank.

Climbing:

• Each match awards or removes Rank Rating (RR) — usually +10 to +30 on a win, -10 to -30 on a loss.
• Your performance (kills, plants, clutches) modifies the swing in lower ranks.
• Win streaks do not boost RR meaningfully — consistency matters more than streaks.
• Promote at 100 RR with a winning match, then start the next rank at 10–30 RR.

Ascendant and above: queue restrictions tighten (3-stack max; Immortal+ is solo / duo only).

Episode reset: every ~6 months your rank soft-resets ~3 tiers down.

Track your rank progression at /tracker.$body$,
       ARRAY['beginner','ranked','meta']
      ),

      ('how-does-economy-work',
       'How does the Valorant economy work? When should I buy, eco or save?',
       $body$Start of game: everyone has 800 credits. First round is always a pistol round.

Round rewards:

• Win: +3000
• Loss: +1900 → +2400 → +2900 (loss bonus grows each consecutive loss, resets on win)
• Plant: +300 to every teammate
• Kill: +200 to the killer

Buy phases:

• Full buy (3900cr+): Rifle (Vandal / Phantom) + Light or Heavy shield + 1–2 abilities. Default plan.
• Half buy (~2500cr): Spectre / Bulldog + Light shield. Aggressive, sometimes wins rounds.
• Eco / save (≤1500cr): Pistols + maybe Light shield. Goal — do not die with weapons. Stack credits for next round.
• Force buy: spend everything because next round's loss bonus is high. Only do this if your team agrees.

Rule of thumb: if anyone on your team can't full-buy, the team should save together. Mixed buys = lost rounds.$body$,
       ARRAY['beginner','economy','strategy']
      ),

      ('how-to-improve-aim',
       'How do I improve my aim in Valorant?',
       $body$Three things, in this order:

1. Crosshair placement (90% of the gain)

• Always keep your crosshair at head height of the corner you're about to peek.
• Pre-aim BEFORE you see the enemy. By the time you see them, you should already be on their head.

2. Counter-strafing

• Valorant rewards still shots. Tap the opposite movement key (A then quick D) to stop instantly, then shoot.
• Moving and shooting = inaccurate even at 1 metre.

3. Daily aim routine (15–30 min)

• 10 min Range bots — "Hard" difficulty, strafing.
• 1 Deathmatch — focus on first-shot accuracy, not score.
• Optional: Aim Lab / Kovaak's "1-wall 6-targets" + a tracking task.

Do not spam-fire at long range. Vandal / Phantom 1-tap headshot at any distance — that's the whole point.$body$,
       ARRAY['beginner','aim','improvement']
      ),

      ('how-to-learn-callouts',
       'How do I learn map callouts quickly?',
       $body$The fastest path:

1. Play one map at a time. Don't try to learn all 7 in a week.
2. Open the interactive map at /maps, pick your map, hover the regions.
3. Play 5 unrated games on that map. Each round, name the spot you're standing on OUT LOUD.
4. When a teammate calls a spot you don't know — ask. People will tell you.

Universal callouts every map has:

• A site / B site / C site — where the spike is planted.
• Mid — connector between sites.
• Spawn / heaven / hell — vertical positioning (heaven = above site, hell = below).
• Default / box / pillar — common cover objects.

Don't memorise — just play. Callouts stick after 10–15 games on a map.$body$,
       ARRAY['beginner','maps','communication']
      ),

      ('how-to-learn-lineups',
       'How do I learn Valorant lineups?',
       $body$What counts as a lineup: a fixed-spot ability throw (smoke, molly, recon dart, ult) that lands on a predictable target — usually a default plant or a common hiding angle.

Easiest agents to start with:

• Brimstone smokes / molly — top-down placement, no aiming required.
• Killjoy ult lineups — long-range plant denial.
• Viper wall / Snake Bite mollies — one or two per site is enough.

How to practise:

1. Custom game → bots off → infinite credits / abilities.
2. Use /maps/<map>/lineups for the spot + alignment screenshot.
3. Throw it 5 times in a row until you can do it without checking the screenshot.
4. Use it in your next ranked game immediately — it'll stick.

Don't learn 30 lineups for one map. Learn 2 per site (1 default smoke + 1 post-plant molly) and you'll already win more rounds.$body$,
       ARRAY['beginner','lineups','improvement']
      ),

      ('what-is-a-smurf',
       'Why do I keep getting matched with smurfs?',
       $body$A smurf is a higher-ranked player on a low-rank alt account.

Reality check: in Iron–Gold, "they're smurfing" is usually wrong. The actual reasons matches feel unfair:

• Wide MMR ranges in low elo (a Bronze 3 lobby can include Iron 1 to Silver 2).
• Boosters / duo-stacks with one player carrying a friend.
• Players in a rank-down slump after a real demotion.

Real smurfs do exist — you'll see them more in Silver–Plat. Signs: 30+ frags, no deaths, knows every angle, plays a non-meta agent "for fun."

What to do: mute, focus on your own positioning, don't try to outaim them. Report at end of game (Riot does ban confirmed smurfs).

Don't quit ranked over one bad match. The system DOES correct itself across 20+ games.$body$,
       ARRAY['beginner','ranked','community']
      ),

      ('how-to-deal-with-toxic-teammates',
       'How do I deal with toxic teammates?',
       $body$The 3-step kill switch:

1. Mute fast.
   • Press F1–F5 to mute individual teammates' voice + text.
   • One round of flame = mute. Don't argue. Don't engage.

2. Don't reply.
   • Toxic players want a reaction. No reply = no fuel.
   • Never type during the round. Typing = dead in 3 seconds.

3. Report at end of game.
   • Tab → right-click name → Report.
   • Pick the right category (Verbal Abuse / Negative Attitude / Griefing). Riot's auto-detection uses the category.

Long-term fixes that actually help:

• Solo-queue with a duo you trust. One reliable teammate changes lobby dynamics.
• Take a 1-game break if YOU are tilted. Tilt costs more RR than smurfs.

You can also turn off all chat in Settings → General → Hide enemy chat.$body$,
       ARRAY['beginner','community','mental']
      ),

      ('how-to-rank-up-iron-bronze-silver',
       'How do I get out of Iron, Bronze or Silver?',
       $body$Skip all aim advice. In low elo, these win games:

1. Stop dying first.
   Most low-elo rounds are lost because the first 2 deaths are free for the enemy. Hold angles, don't peek without info, trade your teammate.

2. Use your utility every round.
   70% of Iron–Silver players hold full util into next round. Use every smoke, flash, molly every round — even imperfect util is better than unused util.

3. Pick a 2-agent pool.
   Don't autofill. Master one Duelist + one Sentinel (or one Controller + one Initiator) and play them every game on every map.

4. Plant the spike fast.
   Many low-elo rounds are lost because nobody plants. If you're alive and have the spike — plant immediately in a safe spot, even if it's the default.

5. Solo-queue, but stop after 2 losses.
   Tilt-queueing is the single biggest reason people are hardstuck.

Hit Gold 1 and stop reading guides — at that point you need VOD review of your own games, not generic tips.$body$,
       ARRAY['beginner','ranked','improvement']
      ),

      ('best-pc-settings-fps',
       'What are the best PC settings to maximise FPS in Valorant?',
       $body$Settings → Video → Graphics Quality (low-end / max-FPS preset):

  Multithreaded Rendering   ON
  Material Quality          Low
  Texture Quality           Low
  Detail Quality            Low
  UI Quality                Low
  Vignette                  Off
  VSync                     Off
  Anti-Aliasing             None (or MSAA 2x if you have headroom)
  Anisotropic Filtering     1x
  Improve Clarity           Off
  Experimental Sharpening   Off
  Bloom                     Off
  Distortion                Off
  Cast Shadows              Off

Display:

• Resolution — native. Don't drop below, it kills clarity.
• Display Mode — Fullscreen (lowest input lag).
• Limit FPS Always — cap to your monitor refresh ×1.1 (e.g. 165 → 180).

Windows:

• Game Mode On, hardware-accelerated GPU scheduling On.
• Close Chrome / Discord overlays before ranked.

Most non-potato PCs hit 200+ FPS with these. If you're below 100 FPS on max settings — drop to the preset above.

More FPS / monitor calcs at /tools/fov and /tools/monitor.$body$,
       ARRAY['beginner','settings','performance']
      ),

      ('how-to-get-free-skins',
       'How do I unlock skins for free in Valorant?',
       $body$Yes, free skins are real — just slow:

1. Agent Contracts
   • Each agent's contract has a free skin (sidearm or melee) at the end.
   • You earn XP automatically by playing — any mode counts.

2. Battlepass (free track)
   • Every Act, the free track gives 1–2 skins, sprays and cards.
   • You don't need to buy the premium pass.

3. Episode rewards
   • Hit certain Act ranks (gold-tier + win 9 ranked games) → exclusive gun buddy + card.

4. Twitch Drops & Riot events
   • Watch VCT broadcasts on Twitch with your Riot account linked.
   • Drops include sprays, cards and (occasionally) gun buddies.

5. ggLobby monthly giveaway
   • Free VP / skin draw every month — earn entries by referrals + sharing your rank card. See /giveaway.

No, you can't get knife skins or premium bundles without paying. Anyone offering "free VP generators" is a scam — your account WILL get banned.$body$,
       ARRAY['beginner','skins','rewards']
      ),

      ('game-modes-explained',
       'Difference between Unrated, Competitive, Swiftplay, Deathmatch and Premier?',
       $body$Quick reference:

  Unrated         25–45 min, first to 13, 5v5     Learning agents / maps, no rank pressure
  Competitive     25–45 min, first to 13, 5v5     Climbing rank (level 20+)
  Swiftplay       10–15 min, first to 5, 5v5      Casual full-team experience, fast
  Spike Rush      8 min, first to 4, 5v5          Goofing around, random weapon every round
  Deathmatch      9 min, FFA, 14 players          Pure aim warmup — don't play for K/D
  Team Deathmatch 9 min, 5v5                      Aim + agent practice with teammates
  Premier         Stage-based, scheduled, 5-stack Bracket play with a fixed team toward "playoffs"
  Custom          Anything, 1–10                  Lineup practice, scrims, 1v1s

Recommended beginner loop:

1 Deathmatch → 1 Unrated → 1 Competitive. Repeat. Don't queue 5 ranked in a row.$body$,
       ARRAY['beginner','modes','meta']
      ),

      ('solo-queue-vs-stack',
       'Should I solo queue or 5-stack in Valorant?',
       $body$Solo queue — faster, more games, you'll improve your own decision-making, but you depend on random teammates.

Duo (2-stack) — the sweet spot for most players. One reliable teammate fixes 80% of comms problems without inflating MMR matchmaking.

5-stack — the most fun, the most consistent comms, BUT: Riot puts 5-stacks against other 5-stacks with higher MMR. Expect tougher games and slightly lower RR per win.

3- and 4-stacks — worst of both worlds. Riot still matches you against tighter teams, but the random 5th often feels left out of the stack's comms.

Rule of thumb:

• Climbing ranked → solo or duo.
• Having fun on a Friday night → 5-stack Unrated / Premier.
• New to the game → solo Unrated, your future habits depend on it.

Looking for a duo? Try /find-gamers or /lfg.$body$,
       ARRAY['beginner','ranked','community']
      )

    ) AS t(slug, title, content, tags)
  LOOP
    INSERT INTO forum_posts (
      category_id, author_id, title, slug, content, post_type, tags,
      is_pinned, is_locked, last_reply_at
    )
    VALUES (
      v_category_id,
      v_author_id,
      v_thread.title,
      v_thread.slug,
      v_thread.content,
      'question',
      v_thread.tags::TEXT[],
      TRUE,        -- is_pinned
      FALSE,       -- is_locked — replies welcome (StackOverflow-style)
      NOW()
    )
    ON CONFLICT (category_id, slug) DO UPDATE
    SET title      = EXCLUDED.title,
        content    = EXCLUDED.content,
        tags       = EXCLUDED.tags,
        post_type  = 'question',
        is_pinned  = TRUE,
        updated_at = NOW();
  END LOOP;

  -- ── 4. Refresh the cached post_count on the category ───────────────────────
  UPDATE forum_categories
     SET post_count = (
       SELECT COUNT(*) FROM forum_posts
        WHERE category_id = v_category_id AND is_deleted = FALSE
     )
   WHERE id = v_category_id;

END $$;

-- ── Sanity check ─────────────────────────────────────────────────────────────
SELECT slug, title, is_pinned, post_type
FROM forum_posts
WHERE category_id = (SELECT id FROM forum_categories WHERE slug='valorant')
  AND is_pinned = TRUE
ORDER BY title;
