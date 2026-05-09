-- 006: Expand automation personas + add exploreable post templates
--
-- Adds 8 more Indian gamer personas (total 13) and ~80 new post/comment
-- templates spread across: polls, mini-stories, tier lists, hot takes,
-- LFG with personality, rate-my-X, nostalgia, shitposts, this-or-that,
-- predictions, gear chatter, self-roast, Hinglish flavor, streak diaries.
--
-- Run on VPS:
--   sudo -u postgres psql -d gamerhub -f /var/www/gglobby/scripts/migrations/006_expand_automation_personas_and_templates.sql
-- ============================================================================

-- ── Step 1: Add 8 more Indian gamer personas ────────────────────────────────

DO $$
DECLARE
  pw_hash TEXT := '$2a$12$placeholder000000000000000000000000000000000000000000';

  id6  UUID := gen_random_uuid();  -- aarav_gg
  id7  UUID := gen_random_uuid();  -- noobmaster_aditya
  id8  UUID := gen_random_uuid();  -- priya_clutches
  id9  UUID := gen_random_uuid();  -- chennai_sniper
  id10 UUID := gen_random_uuid();  -- pubg_pandit
  id11 UUID := gen_random_uuid();  -- ff_kavya
  id12 UUID := gen_random_uuid();  -- jaipur_jatt
  id13 UUID := gen_random_uuid();  -- soloq_arjun
BEGIN

  -- 6: aarav_gg (Valorant, Pune, college student)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id6, 'persona.aarav.gg@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id6, 'aarav_gg', 'Aarav',
    'Pune | Valo Plat 2 | college se time milte hi ranked | Reyna main 💜',
    'casual', 'Maharashtra', 'en',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=aarav_gg', false)
  ON CONFLICT (id) DO NOTHING;

  -- 7: noobmaster_aditya (BGMI + Valo, Lucknow, meme account energy)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id7, 'persona.noobmaster.aditya@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id7, 'noobmaster_aditya', 'Aditya',
    'Lucknow boy | Gold lobby legend | I die first every game and I''m proud of it 💀',
    'casual', 'Uttar Pradesh', 'hi',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=noobmaster_aditya', false)
  ON CONFLICT (id) DO NOTHING;

  -- 8: priya_clutches (Valo competitive, Bangalore, rare female persona)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id8, 'persona.priya.clutches@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id8, 'priya_clutches', 'Priya',
    'Bangalore | Immortal 1 | Killjoy + Cypher diff | tired of toxic lobbies but still playing',
    'competitive', 'Karnataka', 'en',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=priya_clutches', false)
  ON CONFLICT (id) DO NOTHING;

  -- 9: chennai_sniper (BGMI, Chennai, sniper-only player)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id9, 'persona.chennai.sniper@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id9, 'chennai_sniper', 'Vignesh',
    'Chennai | BGMI Ace | AWM only or I uninstall | TPP supremacy',
    'competitive', 'Tamil Nadu', 'en',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=chennai_sniper', false)
  ON CONFLICT (id) DO NOTHING;

  -- 10: pubg_pandit (BGMI veteran, Patna, OG player vibe)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id10, 'persona.pubg.pandit@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id10, 'pubg_pandit', 'Rohit',
    'Patna | PUBG since 2018 | Conqueror x4 | back jab achi recoil thi 🔫',
    'tryhard', 'Bihar', 'hi',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=pubg_pandit', false)
  ON CONFLICT (id) DO NOTHING;

  -- 11: ff_kavya (Free Fire focused, Kolkata)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id11, 'persona.ff.kavya@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id11, 'ff_kavya', 'Kavya',
    'Kolkata | Free Fire Heroic | DJ Alok user, fight me | mobile gaming gang',
    'casual', 'West Bengal', 'en',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=ff_kavya', false)
  ON CONFLICT (id) DO NOTHING;

  -- 12: jaipur_jatt (BGMI + FF, Jaipur, weekend warrior)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id12, 'persona.jaipur.jatt@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id12, 'jaipur_jatt', 'Manjeet',
    'Jaipur ka launda | weekend warrior | BGMI Crown 5 | sniper ke piche pagal 🎯',
    'casual', 'Rajasthan', 'hi',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=jaipur_jatt', false)
  ON CONFLICT (id) DO NOTHING;

  -- 13: soloq_arjun (Valorant solo queue grinder, Noida)
  INSERT INTO users (id, email, password_hash, email_confirmed_at, provider)
  VALUES (id13, 'persona.soloq.arjun@gglobby.local', pw_hash, NOW(), 'email')
  ON CONFLICT (email) DO NOTHING;
  INSERT INTO profiles (id, username, display_name, bio, gaming_style, region, preferred_language, avatar_url, is_verified)
  VALUES (id13, 'soloq_arjun', 'Arjun',
    'Noida | Valo Diamond 3 | solo queue is my therapy and my trauma | sentinels main',
    'tryhard', 'Uttar Pradesh', 'en',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=soloq_arjun', false)
  ON CONFLICT (id) DO NOTHING;

  -- Link as automation personas
  INSERT INTO auto_personas (profile_id, persona_style, preferred_games, posting_style, bio_note)
  VALUES
    (id6,  'casual',      ARRAY['valorant'],            'questions',  'Pune college student, Reyna main'),
    (id7,  'meme',        ARRAY['bgmi', 'valorant'],    'reactions',  'Lucknow meme account, gold lobby vibes'),
    (id8,  'competitive', ARRAY['valorant'],            'hot_takes',  'Female immortal player from Bangalore'),
    (id9,  'tryhard',     ARRAY['bgmi'],                'hot_takes',  'Chennai BGMI sniper specialist'),
    (id10, 'tryhard',     ARRAY['bgmi'],                'mixed',      'BGMI/PUBG OG from Patna, multi-conq'),
    (id11, 'casual',      ARRAY['freefire'],            'mixed',      'Free Fire main from Kolkata'),
    (id12, 'casual',      ARRAY['bgmi', 'freefire'],    'mixed',      'Weekend gamer from Jaipur'),
    (id13, 'tryhard',     ARRAY['valorant'],            'mixed',      'Solo queue grinder from Noida')
  ON CONFLICT (profile_id) DO NOTHING;

  -- Stagger creation dates so they don't all show up new on the same day
  UPDATE profiles SET created_at = NOW() - interval '47 days' WHERE id = id6;
  UPDATE profiles SET created_at = NOW() - interval '41 days' WHERE id = id7;
  UPDATE profiles SET created_at = NOW() - interval '36 days' WHERE id = id8;
  UPDATE profiles SET created_at = NOW() - interval '31 days' WHERE id = id9;
  UPDATE profiles SET created_at = NOW() - interval '27 days' WHERE id = id10;
  UPDATE profiles SET created_at = NOW() - interval '21 days' WHERE id = id11;
  UPDATE profiles SET created_at = NOW() - interval '12 days' WHERE id = id12;
  UPDATE profiles SET created_at = NOW() - interval '4 days'  WHERE id = id13;

  UPDATE users SET created_at = NOW() - interval '47 days' WHERE id = id6;
  UPDATE users SET created_at = NOW() - interval '41 days' WHERE id = id7;
  UPDATE users SET created_at = NOW() - interval '36 days' WHERE id = id8;
  UPDATE users SET created_at = NOW() - interval '31 days' WHERE id = id9;
  UPDATE users SET created_at = NOW() - interval '27 days' WHERE id = id10;
  UPDATE users SET created_at = NOW() - interval '21 days' WHERE id = id11;
  UPDATE users SET created_at = NOW() - interval '12 days' WHERE id = id12;
  UPDATE users SET created_at = NOW() - interval '4 days'  WHERE id = id13;

  -- Lock passwords so nobody can log in as these accounts
  UPDATE users
  SET password_hash = '$2a$12$INVALID.' || encode(gen_random_bytes(30), 'hex')
  WHERE id IN (id6, id7, id8, id9, id10, id11, id12, id13);

  RAISE NOTICE '✓ Added 8 personas (total 13), staggered dates, locked passwords';
END $$;


-- ── Step 2: Add exploreable post templates ──────────────────────────────────

INSERT INTO auto_templates (type, category, content, game_slug, mood) VALUES

  -- ── Polls / Either-or ─────────────────────────────────────────────────
  ('community_post', 'discussion', '1 immortal smurf vs 4 silver teammates — who you picking for ranked?', 'valorant', 'curious'),
  ('community_post', 'discussion', '{agent} pre-buff or {agent} post-buff, which era was actually peak?', 'valorant', 'curious'),
  ('community_post', 'discussion', 'Pochinki rush or Georgopol slow push? no wrong answer (there is)', 'bgmi', 'chill'),
  ('community_post', 'discussion', 'TPP or FPP in {game}? and don''t lie, which one are you actually better at', 'bgmi', 'curious'),
  ('community_post', 'discussion', 'headphones at full volume or earphones at 50% — what''s your ranked setup?', NULL, 'curious'),
  ('community_post', 'discussion', 'wired mouse or wireless? and is the price difference worth it for ranked?', NULL, 'curious'),
  ('community_post', 'discussion', '{map} or {map} — pick one, the other gets deleted from {game} forever', 'valorant', 'curious'),
  ('community_post', 'discussion', 'AWM 1-tap or M416 spray? bgmi players, what''s your weapon of faith', 'bgmi', 'curious'),

  -- ── Mini-stories / 3-line punchlines ──────────────────────────────────
  ('community_post', 'reaction', 'Round 1: popping off. Round 12: 0/8. Round 23: clutch with classic. {game} is a drug.', 'valorant', 'excited'),
  ('community_post', 'reaction', 'queued solo. got 3 randoms who only spoke a language I don''t know. won the match. best squad ever 😭', NULL, 'excited'),
  ('community_post', 'reaction', 'Mom: "last game?" Me: "last game." Three hours later I''m in overtime. send help.', NULL, 'frustrated'),
  ('community_post', 'reaction', 'told my squad I''d play 1 match. it''s been 4 hours. I''ve forgotten what sunlight looks like.', NULL, 'chill'),
  ('community_post', 'reaction', 'started ranked at 9pm thinking "just one game". now it''s 3am and I''m demoted. {game} hates me specifically.', NULL, 'frustrated'),
  ('community_post', 'reaction', 'enemy team had 1 hp. I had a Vandal. I missed the spray. they won the round. I am not okay.', 'valorant', 'frustrated'),
  ('community_post', 'reaction', 'taught my little brother {game}. he''s now higher rank than me. I have created a monster.', NULL, 'frustrated'),

  -- ── Tier lists / Rankings ─────────────────────────────────────────────
  ('community_post', 'hot_take', 'ranking {game} maps from goated to dogwater: top 1 = {map}, bottom 1 = {map}. fight me in comments', 'valorant', 'hyped'),
  ('community_post', 'hot_take', 'top 3 most annoying agents to play against in low elo, go. I''ll start: {agent} no skill needed', 'valorant', 'frustrated'),
  ('community_post', 'discussion', 'ranking Indian gaming creators — Dynamo still top 3 or has the meta moved on?', NULL, 'curious'),
  ('community_post', 'hot_take', 'tier list of {game} weapons: S-tier is crowded but A-tier is where the skill lives. agree?', 'bgmi', 'curious'),
  ('community_post', 'hot_take', 'ranking the worst types of teammates: 1. instalockers 2. mic toxic 3. mute everyone 4. quits round 2. who else?', 'valorant', 'frustrated'),

  -- ── Confessions / Hot takes with reasoning ───────────────────────────
  ('community_post', 'hot_take', 'controversial: ranked is more fun than tournaments. no pressure, no commitment, just chaos.', NULL, 'chill'),
  ('community_post', 'hot_take', 'I uninstalled {game} for a week and came back better. burnout is real, take breaks.', NULL, 'chill'),
  ('community_post', 'hot_take', 'aim trainers don''t help if your game sense is trash. change my mind in the comments.', 'valorant', 'hyped'),
  ('community_post', 'hot_take', 'BGMI esports peaked in 2022 and we''ve been coping ever since. someone had to say it.', 'bgmi', 'frustrated'),
  ('community_post', 'hot_take', 'voice comms are overrated below {rank}. half the lobby is screaming, the other half is silent.', 'valorant', 'frustrated'),
  ('community_post', 'hot_take', 'Indian servers are not the problem, your wifi is. accept it and move on.', NULL, 'hyped'),

  -- ── LFG with personality ──────────────────────────────────────────────
  ('community_post', 'question', '{rank} lobby, mic on, no rage quitters, no smokers, must laugh at bad jokes — drop IGN', 'valorant', 'chill'),
  ('community_post', 'question', 'anyone awake right now? need 2 more for {game}, lobby is dying without 4th', NULL, 'chill'),
  ('community_post', 'question', 'looking for a duo partner who doesn''t flame after one bad round, is this too much to ask in 2026?', 'valorant', 'chill'),
  ('community_post', 'question', 'ladki gamers — looking for non-toxic squad, my last one got me banned for THEIR toxicity 💀', NULL, 'chill'),
  ('community_post', 'question', 'tryhard scrim partners {rank}+ for {game}, need to grind to next tier this weekend. drop IGN + role', 'valorant', 'hyped'),
  ('community_post', 'question', 'casual {game} squad for late night runs, no pressure no rank push, vibes only', NULL, 'chill'),

  -- ── Rate-my-X ─────────────────────────────────────────────────────────
  ('community_post', 'question', 'rate my crosshair: green dot, no outline, 1 thickness, 0 gap. honest opinions, no roasting', 'valorant', 'curious'),
  ('community_post', 'question', 'my warmup routine: 10 min aim trainer → 1 deathmatch → 1 unrated → ranked. cooked or chef? 🍳', 'valorant', 'curious'),
  ('community_post', 'question', 'rate my {game} sensitivity setup: 400 DPI, 0.4 in-game, scoped 0.8. is it normal or am I griefing myself?', 'valorant', 'curious'),
  ('community_post', 'question', 'BGMI sensitivity: gyro 300, no-scope 90, 4x 25, 6x 20. honest review please', 'bgmi', 'curious'),
  ('community_post', 'question', 'rate my drop strategy on {map}: hot drop early, rotate mid, edge late. solid plan or copium?', 'bgmi', 'curious'),
  ('community_post', 'question', 'my crosshair color is pink because I read it improves visibility on {map}. placebo or actual W?', 'valorant', 'curious'),

  -- ── Nostalgia ─────────────────────────────────────────────────────────
  ('community_post', 'discussion', 'remember when {map} got vaulted and we all cried? bring it back you cowards', 'valorant', 'frustrated'),
  ('community_post', 'discussion', 'old BGMI > new BGMI. they hit different in 2020. anyone else feeling old?', 'bgmi', 'chill'),
  ('community_post', 'discussion', 'first Conqueror season hit different. no recoil scripts, no hackers, just vibes. miss those days.', 'bgmi', 'chill'),
  ('community_post', 'discussion', 'who else remembers grinding {game} during lockdown 2020? best era for Indian gaming, change my mind', NULL, 'chill'),
  ('community_post', 'discussion', 'old Valo characters had drip. new ones look like mobile game ads. someone agree with me please', 'valorant', 'chill'),
  ('community_post', 'discussion', 'PUBG Mobile India era was peak gaming culture in this country. fight me on this.', 'bgmi', 'frustrated'),

  -- ── Shitposts / Humor ─────────────────────────────────────────────────
  ('community_post', 'reaction', 'POV: parents walk in mid-clutch and you can''t scream', NULL, 'frustrated'),
  ('community_post', 'reaction', 'me telling my squad "one more game" for the 7th time tonight', NULL, 'chill'),
  ('community_post', 'reaction', 'every {game} player has a "this is my last ranked of the night" streak that lasted 9 hours', NULL, 'excited'),
  ('community_post', 'reaction', 'why does {game} only give me good teammates when I''m playing unrated, why', 'valorant', 'frustrated'),
  ('community_post', 'reaction', 'my brain on a 4-game losing streak: "one more, just one more, the next one we win for sure"', NULL, 'frustrated'),
  ('community_post', 'reaction', '"bro just don''t tilt" the bro in question after losing 3 ranked in a row:', NULL, 'frustrated'),

  -- ── This-or-that / "you''re a real X if" ──────────────────────────────
  ('community_post', 'discussion', 'you''re a true {game} player if you''ve thrown your phone at least once 📱💀', 'bgmi', 'excited'),
  ('community_post', 'discussion', 'Indian gamers be like: jio recharge ✅ snacks ✅ mom asleep ✅ now we ranked 😎', NULL, 'chill'),
  ('community_post', 'discussion', 'name a more iconic duo than me and 80 ping at 11pm', NULL, 'frustrated'),
  ('community_post', 'discussion', 'real {game} fans remember when {map} actually had broken angles. cope is real for the new gen.', 'valorant', 'chill'),
  ('community_post', 'discussion', 'you''re officially old if you remember playing {game} on 3G data. wild times.', 'bgmi', 'chill'),

  -- ── Predictions / Current-event hooks ────────────────────────────────
  ('community_post', 'discussion', 'VCT pacific predictions, who''s lifting the trophy this split? drop your top 3', 'valorant', 'curious'),
  ('community_post', 'discussion', '{game} update dropping soon, what''s the ONE thing you want fixed?', 'bgmi', 'curious'),
  ('community_post', 'discussion', 'who do you think is the best Indian {game} player right now? not asking for friends, asking honestly', 'valorant', 'curious'),
  ('community_post', 'discussion', 'next big BGMI event predictions — which org is taking it home this year?', 'bgmi', 'curious'),

  -- ── Setup / gear chatter ──────────────────────────────────────────────
  ('community_post', 'question', 'finally upgraded from mobile to PC for {game}, mind = blown 🤯 PC players, what was YOUR moment?', 'valorant', 'excited'),
  ('community_post', 'question', '₹1500 mouse vs ₹6000 mouse — does it actually matter at gold rank? help a budget gamer decide', NULL, 'curious'),
  ('community_post', 'question', 'best wired earphones under 1k for {game}? Boat hits or skip? need real reviews', NULL, 'curious'),
  ('community_post', 'question', 'looking for budget {game} mouse recommendations under 2k, no Amazon influencer ads please', NULL, 'curious'),
  ('community_post', 'question', 'monitor refresh rate matters more than I thought after switching from 60Hz to 144Hz. anyone else had this realization?', NULL, 'curious'),

  -- ── Self-roast / fail stories ─────────────────────────────────────────
  ('community_post', 'reaction', 'ran into 3 enemies with full shield and a knife. died in 0.4 seconds. send help.', 'valorant', 'frustrated'),
  ('community_post', 'reaction', 'muted my squad, started talking to enemies instead, won the round. {game} is therapy.', NULL, 'excited'),
  ('community_post', 'reaction', 'missed a 1-tap with {agent} from 10m. uninstalling. (no I''m not. ranked starts in 10 min)', 'valorant', 'frustrated'),
  ('community_post', 'reaction', 'died to an afk enemy because I peeked the wrong angle. my K/D will never recover from this.', 'valorant', 'frustrated'),
  ('community_post', 'reaction', 'won a 1v4 clutch in {game}. didn''t record. nobody believes me. this is my villain origin story.', NULL, 'frustrated'),
  ('community_post', 'reaction', 'spent 30 min adjusting sensitivity. got worse. reverted to default. now I''m 30 min poorer in life.', NULL, 'frustrated'),

  -- ── Hinglish / regional flavor ────────────────────────────────────────
  ('community_post', 'reaction', 'yaar ye {game} ka matchmaking system kis ne banaya hai? har game mein ek tryhard milta hai 😤', 'bgmi', 'frustrated'),
  ('community_post', 'question', 'bhai 90 ping pe rank push karna mental torture hai, koi acha VPN suggest karo', NULL, 'frustrated'),
  ('community_post', 'discussion', 'subah 5 baje ki ranked hits different bhai — koi aur insomniac gamer hai yahan?', NULL, 'chill'),
  ('community_post', 'reaction', 'mummy bolti hai "thoda padhai bhi kar lo", main: "ranked match chal raha hai mummy"', NULL, 'chill'),
  ('community_post', 'discussion', 'sirf weekend pe khelne wale aur daily grinders mein farak ye hai ki — actually doesn''t matter, both rage same 😭', NULL, 'excited'),
  ('community_post', 'reaction', 'jab teammate Hindi mein gaali deta hai aur tum samajh nahi paate to confidence high rehta hai 💀', NULL, 'excited'),
  ('community_post', 'question', 'bhaiyon, koi {game} discord server suggest karo jaha actually log bolte ho, dead servers se thak gaya hu', NULL, 'curious'),
  ('community_post', 'discussion', 'apni chat se {agent} ko gaali dene ka apna hi maza hai. real ones know.', 'valorant', 'excited'),

  -- ── Streak / progress diaries ────────────────────────────────────────
  ('community_post', 'hype', 'Day 7 of grinding to {rank} in {game}: lost 3 in a row, mental is shot. tomorrow we go again 💪', 'valorant', 'frustrated'),
  ('community_post', 'hype', '30-day no-emote challenge in {game}, day 4: I almost broke today. squad keeps mocking me 😤', 'bgmi', 'frustrated'),
  ('community_post', 'hype', '14 days into solo queue grind, finally hit {rank}! to anyone stuck — keep going, you''ll get there', NULL, 'excited'),
  ('community_post', 'hype', 'committed to only playing {agent} until I hit {rank}. 50 games in. send copium and good vibes 🙏', 'valorant', 'curious')

ON CONFLICT DO NOTHING;


-- ── Step 3: Add more comment templates (variety in tone/length) ─────────────

INSERT INTO auto_templates (type, category, content, game_slug, mood) VALUES
  ('comment', 'reaction', 'this is so accurate it hurts 💀', NULL, 'frustrated'),
  ('comment', 'reaction', 'bro spilled tea ☕', NULL, 'excited'),
  ('comment', 'reaction', 'okay but who hurt you', NULL, 'chill'),
  ('comment', 'reaction', 'this hits different at 2am ngl', NULL, 'chill'),
  ('comment', 'reaction', 'fr this changed my whole perspective', NULL, 'curious'),
  ('comment', 'reaction', 'naah this is the realest take I''ve seen here', NULL, 'hyped'),
  ('comment', 'reaction', 'main character energy 💯', NULL, 'hyped'),
  ('comment', 'reaction', 'someone screenshot this and pin it', NULL, 'excited'),
  ('comment', 'reaction', 'every word of this 🙌', NULL, 'hyped'),
  ('comment', 'reaction', 'as a {rank} player, can confirm', NULL, 'chill'),
  ('comment', 'reaction', 'tagging my squad in this rn', NULL, 'excited'),
  ('comment', 'reaction', 'why is this so personal lmao', NULL, 'frustrated'),
  ('comment', 'reaction', 'you don''t understand how hard I felt this', NULL, 'frustrated'),
  ('comment', 'reaction', 'okay this is going on my wall', NULL, 'excited'),
  ('comment', 'reaction', 'sirji aap to genius ho', NULL, 'chill'),
  ('comment', 'reaction', 'arre wah, finally koi sahi baat bola', NULL, 'excited'),
  ('comment', 'reaction', 'matlab pure heart se feel kiya ye 😭', NULL, 'frustrated'),
  ('comment', 'reaction', 'isko pin karo mods', NULL, 'hyped'),
  ('comment', 'reaction', 'bata bhai, mai tera fan ho gaya', NULL, 'excited'),
  ('comment', 'reaction', 'bilkul sahi pakde hain bhai 🎯', NULL, 'chill')

ON CONFLICT DO NOTHING;


-- ── Done ────────────────────────────────────────────────────────────────────
-- Summary:
--   + 8 new personas (total 13)
--   + ~80 new community_post templates across 14 exploreable categories
--   + 20 new comment templates with regional flavor
