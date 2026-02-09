-- =============================================
-- SEED: Demo Community Posts (Gaming Content)
-- =============================================
-- Creates demo_community_posts table for sample blog/community posts
-- Focused on Valorant, CS2, PUBG Mobile, Free Fire, COC, and COD Mobile content with Indian gamer authors
-- =============================================

-- Create demo_community_posts table
CREATE TABLE IF NOT EXISTS demo_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('guide', 'news', 'analysis', 'opinion', 'tips', 'esports', 'announcement')),
  game VARCHAR(50) NOT NULL CHECK (game IN ('valorant', 'cs2', 'pubg-mobile', 'freefire', 'coc', 'cod-mobile', 'other', 'general')),
  tags TEXT[] DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demo_post_comments table
CREATE TABLE IF NOT EXISTS demo_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES demo_community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES demo_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_demo_posts_author ON demo_community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_demo_posts_slug ON demo_community_posts(slug);
CREATE INDEX IF NOT EXISTS idx_demo_posts_game ON demo_community_posts(game);
CREATE INDEX IF NOT EXISTS idx_demo_posts_category ON demo_community_posts(category);
CREATE INDEX IF NOT EXISTS idx_demo_posts_featured ON demo_community_posts(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_comments_post ON demo_post_comments(post_id);

-- Enable RLS
ALTER TABLE demo_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_post_comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Demo posts are viewable by everyone" ON demo_community_posts
  FOR SELECT USING (true);

CREATE POLICY "Demo comments are viewable by everyone" ON demo_post_comments
  FOR SELECT USING (true);

-- =============================================
-- INSERT DEMO COMMUNITY POSTS
-- =============================================

-- Clear existing demo posts
TRUNCATE demo_community_posts CASCADE;

-- Post 1: Valorant Guide by SkRoshanOP
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, is_pinned, created_at)
SELECT
  id,
  'Mastering Jett in 2024: The Complete Guide to Dominating Ranked',
  'mastering-jett-2024-complete-guide',
  'From entry fragging to clutch plays, learn how to maximize Jett''s kit and climb to Radiant. Includes advanced dash mechanics, updraft spots, and ult management tips.',
  '## Introduction

Jett remains one of the most impactful duelists in Valorant, and mastering her can single-handedly carry games. After 4000+ hours on Jett, I''m sharing everything I''ve learned.

## Why Jett in 2024?

Despite nerfs, Jett''s kit offers unmatched mobility and entry potential. Her ability to take aggressive angles and escape makes her perfect for creating space.

## Core Mechanics

### Dash Timing
The key to Jett is understanding when to dash. Don''t use it reactively - plan your escape route before taking a fight.

**Pro tip:** Bind dash to a comfortable key. I use Mouse Button 4.

### Updraft Spots
Every map has updraft positions that give you off-angles:
- **Ascent A Site:** Updraft to generator for the unexpected peek
- **Haven C Site:** Updraft to window for site control
- **Split Mid:** Updraft vent peek catches everyone off-guard

### Blade Storm Management
Your ult isn''t just for eco rounds. Use it to:
1. Take aggressive peeks without buying rifles
2. Clutch situations where you need accuracy
3. Post-plant scenarios with unlimited ammo

## Entry Fragging 101

The best Jetts don''t just W-key. Here''s my approach:
1. **Call for utility** - Ask your initiator for flashes
2. **Dry peek information** - Shoulder peek to bait shots
3. **Commit with dash ready** - Entry and dash to safety
4. **Trade setup** - Position so teammates can refrag

## Ranked Climbing Tips

- Play 2-3 agents, but one-trick Jett in crucial games
- Watch your VODs - identify death patterns
- Aim train 20 mins daily - Jett requires crisp aim
- Communicate early rotates - duelists often see rotations first

## Common Mistakes

1. **Dashing into site alone** - Wait for utility
2. **Using knives on eco** - Sometimes the Spectre is better
3. **Predictable updraft angles** - Mix it up
4. **No comms** - Entry info is crucial

## Conclusion

Jett rewards mechanical skill and game sense equally. Master the fundamentals, and the flashy plays will come naturally. See you in Radiant!

*DM me on Discord for VOD reviews: SkRoshanOP#1337*',
  '/images/banners/gaming-1.svg',
  'guide',
  'valorant',
  ARRAY['jett', 'duelist', 'guide', 'ranked', 'tips', 'mechanics'],
  15420,
  892,
  156,
  8,
  true,
  true,
  NOW() - INTERVAL '3 days'
FROM demo_profiles WHERE username = 'SkRoshanOP';

-- Post 2: CS2 Analysis by AadityaAWP
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'AWP Positioning in CS2: 15 Spots That Will Get You Free Kills',
  'awp-positioning-cs2-free-kills-guide',
  'Tired of getting traded after your first AWP kill? Learn the angles that let you get picks and survive to tell the tale. Tested in 25K+ Premier matches.',
  '## The Philosophy of AWP Positioning

Every good AWPer knows: the best position is one you haven''t used before. But there are fundamentals that work at every level.

## What Makes a Good AWP Position?

1. **Cover after the shot** - Can you hide immediately?
2. **Escape route** - Where do you fall back?
3. **Multiple angles** - Can you adjust if they smoke you?
4. **Trade protection** - Is your team in position?

## Top 15 Positions

### Mirage

**1. Jungle Window (A)**
From jungle, you can hold palace and ramp. The window gives cover after shots.

**2. Van (B)**
Classic but effective. Crouch behind van, peek over for the shot.

**3. Top Mid**
Hold window room from top mid. Most players don''t expect it.

### Inferno

**4. Pit Back (A)**
Deep in pit, you control the entire A long approach.

**5. Coffins Angle (B)**
From coffins, angle towards banana. Free information and picks.

**6. Arch Side (Mid)**
Unexpected angle watching mid-to-B rotates.

### Dust 2

**7. Plat (A)**
Elevation advantage, hold long doors with ease.

**8. Window Room (Mid)**
Classic for a reason. Control mid completely.

**9. Back B**
Deep in B site, catch players rushing through tunnels.

### Ancient

**10. Temple (A)**
Hold main and donut simultaneously.

**11. Mid Top**
Control cave and mid push with one angle.

### Anubis

**12. Heaven (A)**
The new elite position. High ground advantage.

**13. Bridge (Mid)**
Hold connector and mid simultaneously.

### Nuke

**14. Heaven**
Classic vertical angle covering A site entirely.

**15. Outside Silo**
Unconventional but catches rotations.

## Movement After the Shot

The AWP is loud. Everyone knows where you are. Your movement in the next 3 seconds determines survival.

**Rule:** Never repeek the same angle twice in a row.

## Practice Routine

1. **10 mins:** Flick training in aim_botz
2. **15 mins:** Position practice in private server
3. **5 mins:** Quick scope drills

## Final Thoughts

AWPing isn''t just about aim - it''s chess. Think three steps ahead, and you''ll be hitting clips in no time.

*Join my Discord for AWP training sessions: AadityaAWP#2048*',
  '/images/banners/gaming-2.svg',
  'guide',
  'cs2',
  ARRAY['awp', 'positioning', 'guide', 'premier', 'tips', 'spots'],
  12850,
  734,
  98,
  10,
  true,
  NOW() - INTERVAL '5 days'
FROM demo_profiles WHERE username = 'AadityaAWP';

-- Post 3: Valorant Esports News by PriyaSmokeQueen
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'VCT 2024 India: Why Controller Players Are the Unsung Heroes',
  'vct-2024-india-controller-players-unsung-heroes',
  'While duelists get the highlight reels, controller players are winning championships. A deep dive into the Indian VCT scene''s smoke metas.',
  '## The Smoke Meta Evolution

The VCT 2024 season has shown us something interesting: teams with elite controller players are consistently outperforming. Let''s analyze why.

## The Numbers Don''t Lie

Looking at Indian VCT Challengers data:
- Teams with dedicated controller mains: **67% win rate**
- Teams flexing controller role: **43% win rate**

The difference? Consistency and depth of knowledge.

## Why Controllers Win Games

### 1. Execute Enablers
A perfect smoke is the difference between a successful site take and a disaster. Consistent smoke placement means:
- Duelists can entry safely
- Initiator utility lands effectively
- The team takes less damage overall

### 2. Post-Plant Anchors
In post-plant scenarios, controllers shine:
- One-ways for information
- Deep smokes to delay defuse
- Mollies/stars for area denial

### 3. Retake Potential
Controllers are clutch machines. Their utility refreshes the fight:
- Isolate angles one by one
- Create safe passages for teammates
- Deny information to attackers

## Top Indian Controllers to Watch

### Omen Players
The one-way king. Indian Omen players have developed unique lineups that the global scene is now adopting.

### Astra Mains
High skill ceiling, massive reward. The best Astra players control entire maps.

### Viper Specialists
Post-plant Viper is terrifying. The lineups Indian players have developed are championship-caliber.

## The Girls in Gaming Perspective

As a female controller main, I want to highlight: there''s a path to pro play that doesn''t require insane mechanics. Game sense, communication, and utility mastery matter equally.

## What This Means for Ranked

If you''re hardstuck, consider:
1. Learning controller as your secondary role
2. Understanding smoke timings deeply
3. Watching pro controller POVs

## Conclusion

The best teams are built on solid controller play. If you want to go pro or just rank up, respect the smoke diff.

*Follow my journey: @PriyaGamingBLR*',
  '/images/banners/gaming-3.svg',
  'analysis',
  'valorant',
  ARRAY['vct', 'esports', 'controller', 'india', 'analysis', 'meta'],
  9845,
  567,
  89,
  7,
  false,
  NOW() - INTERVAL '7 days'
FROM demo_profiles WHERE username = 'PriyaSmokeQueen';

-- Post 4: CS2 IGL Guide by VenkatIGL
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'From Pug Star to IGL: Building a Championship-Caliber CS2 Team',
  'pug-star-to-igl-building-championship-cs2-team',
  'After years on Entity Gaming and coaching countless players, here''s everything I know about leading a CS2 team to victory.',
  '## The IGL Mindset

Being an IGL isn''t about having the best aim or the most hours. It''s about making everyone around you better.

## My Journey

I started as a fragger. Good aim, zero game sense. It took losing countless important matches to realize: someone needs to think while everyone else shoots.

## What Makes a Great IGL?

### 1. Reading the Game
- **Kill feed awareness** - Who died? Where? What does this mean?
- **Utility tracking** - They used two smokes? Push now.
- **Economy management** - When to force, when to save

### 2. Communication
The best call is useless if delivered poorly:
- Short, clear callouts
- Positive reinforcement mid-round
- Save criticism for post-game

### 3. Adaptation
No plan survives contact with the enemy. You need:
- Default plays for information
- Planned executes for key rounds
- Mid-round calls based on info

## Building Your Team

### Finding the Right Players
Look for:
1. **Coachability** - Can they take feedback?
2. **Consistency** - Do they show up every practice?
3. **Communication** - Do they give useful info?

### Role Distribution
A balanced CS2 team needs:
- 1 IGL (can be any role)
- 1 Primary AWP
- 1 Entry
- 1-2 Support/Utility
- 1 Lurk

### Practice Structure
Our Entity Gaming routine:
- **Monday:** VOD review of weekend matches
- **Tuesday-Thursday:** Scrims (3-4 hours each)
- **Friday:** Anti-strat session
- **Weekend:** Matches

## Anti-Stratting

The difference between good and great teams:
1. Watch opponent demos
2. Identify patterns
3. Prepare specific counters
4. Execute in crucial rounds

## Managing Tilt

Your team will tilt. Here''s how to handle it:
- Call timeout immediately
- Acknowledge the frustration
- Refocus on the next round
- Save detailed discussion for later

## Building HydCS Academy

I''m now focused on developing the next generation of Indian CS talent. The scene needs:
- More organized tournaments
- Better coaching infrastructure
- Mental health support for players

## Final Thoughts

IGLing is thankless work. Your stats will suffer. But winning? That feeling makes it all worth it.

*Interested in coaching? DM me: VenkatIGL#1001*',
  '/images/banners/gaming-4.svg',
  'guide',
  'cs2',
  ARRAY['igl', 'leadership', 'team', 'coaching', 'strategy', 'india'],
  11230,
  623,
  134,
  12,
  true,
  NOW() - INTERVAL '10 days'
FROM demo_profiles WHERE username = 'VenkatIGL';

-- Post 5: Valorant Tips by NehaDuelist
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'Breaking Into VCT Game Changers: A Roadmap for Aspiring Female Pros',
  'breaking-vct-game-changers-roadmap-female-pros',
  'The path to Game Changers isn''t just about skill - it''s about building your presence, finding the right team, and staying mentally strong.',
  '## My Game Changers Dream

Two years ago, I was hardstuck Platinum. Today, I''m Immortal and grinding for Game Changers. Here''s what I learned.

## The Reality Check

Let''s be honest about what you need:
- **Minimum Immortal rank** - Most teams require this
- **Consistent schedule** - 4-6 hours daily for practice
- **Thick skin** - The journey has its challenges

## Building Your Foundation

### Rank Up First
Before team tryouts:
1. Hit Immortal minimum (Diamond 3 for very new scenes)
2. Have VODs ready showing your best plays
3. Maintain a positive tracker.gg history

### Role Mastery
Don''t be a fill player. Master 2-3 agents in one role:
- **Duelists:** Jett, Raze, Neon (my specialty)
- **Controllers:** Omen, Astra, Viper
- **Initiators:** Sova, Fade, Skye
- **Sentinels:** Killjoy, Cypher, Chamber

## Finding a Team

### Where to Look
- Game Changers Discord servers
- Twitter/X gaming communities
- Reddit recruitment threads
- GamerHub LFT posts

### What Teams Want
1. **Coachability** - Can you take criticism?
2. **Availability** - Consistent practice schedule
3. **Communication** - Clear, positive comms
4. **Mental fortitude** - Can you handle pressure?

## The Tryout Process

Expect:
- 1v1 duels to test mechanics
- Team scrims to test chemistry
- VOD review sessions
- Personality/vibe checks

### How to Stand Out
- Be early to everything
- Communicate clearly
- Stay positive even when losing
- Ask thoughtful questions

## Dealing with Toxicity

It exists. Here''s how I handle it:
- Mute immediately, report after game
- Build a supportive community around you
- Focus on improvement, not validation
- Remember: their words reflect them, not you

## Content Creation

Building your brand helps:
- Stream your ranked games
- Post clips on Twitter/TikTok
- Engage with the community
- Show your personality

## The Girls Squad

I''m recruiting for a team focused on Game Changers. We need:
- Dedicated players (Immortal+)
- Positive attitudes
- Willingness to improve
- Schedule flexibility

## Final Advice

The path is long but rewarding. Every female pro you see started exactly where you are. The difference? They didn''t quit.

*Join my Discord for girls-only 10-mans: NehaDuelist#8888*',
  '/images/banners/gaming-5.svg',
  'guide',
  'valorant',
  ARRAY['game-changers', 'female', 'esports', 'career', 'tips', 'guide'],
  8920,
  712,
  203,
  9,
  false,
  NOW() - INTERVAL '4 days'
FROM demo_profiles WHERE username = 'NehaDuelist';

-- Post 6: Valorant Agent Guide by ArjunSova
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Sova Lineups That Pros Don''t Want You to Know (Every Map Updated)',
  'sova-lineups-pros-dont-want-you-know-every-map',
  'After spending 2000+ hours perfecting Sova, here are the lineups that consistently get me free kills and info in Ranked.',
  '## Why Sova in 2024?

Despite Fade''s popularity, Sova remains S-tier for one reason: consistent, reliable information. His dart and drone combo is unmatched for methodical team play.

## The Lineup Philosophy

Good lineups share these traits:
1. **Quick setup** - Under 3 seconds to execute
2. **Hard to destroy** - Places dart in protected spots
3. **Maximum coverage** - Reveals common positions
4. **Repeatability** - Works every time

## Ascent Lineups

### A Site from A Main
**Post-plant dart:** Stand in default corner, aim at the tower tip, jump+throw for a dart that reveals heaven and hell.

### B Site from B Main
**Entry dart:** From B main cubby, aim at the roof corner, no-jump throw lands behind site.

### Mid from Bottom Mid
**Info dart:** Wall lineup that reveals market and pizza without exposure.

## Bind Lineups

### A Site from Showers
**Classic entry:** From showers entrance, aim at lamp, reveals short and triple.

### B Site from Hookah
**Window dart:** Reveals garden and CT without entering site.

## Haven Lineups

### A Site from A Long
**Deep dart:** Reveals heaven, hell, and short with one dart.

### C Site from C Long
**Post-plant special:** Dart that scans site continuously during defuse.

## Icebox Lineups

### A Site from A Main
**Kitchen dart:** The famous lineup that wins A takes.

### B Site from B Main
**Tube dart:** Catches stackers and default players.

## Lotus Lineups

### A Site from A Main
**Rubble dart:** New lineup covering 70% of site.

### C Site from C Main
**Waterfall dart:** Reveals mound and back site.

## Practice Routine

1. **10 mins:** Lineup review in custom
2. **20 mins:** Execute timing practice
3. **Ranked application:** Use 2-3 new lineups per game

## Advanced Tech

### Shock Dart Kills
Post-plant shock dart kills require:
- Knowing exact plant position
- Having 2 shock darts
- Timing (5 seconds before defuse completes)

### Drone Economy
Only drone when:
- You have ult for follow-up
- Your team is ready to trade
- The round is important

## Resources

All lineups available on my YouTube with timestamps:
- @ArjunSovaLineups
- Each map has a dedicated video
- Updating monthly with new spots

*Rajasthan represent!*',
  '/images/banners/gaming-1.svg',
  'guide',
  'valorant',
  ARRAY['sova', 'lineups', 'initiator', 'guide', 'tips', 'maps'],
  14320,
  845,
  167,
  11,
  NOW() - INTERVAL '6 days'
FROM demo_profiles WHERE username = 'ArjunSova';

-- Post 7: CS2 Opinion by HarshLurk
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'The Lost Art of Lurking: Why CS2''s Fast Meta is Missing Something',
  'lost-art-lurking-cs2-fast-meta-missing',
  'Everyone wants to entry, but the best lurkers still win championships. A deep dive into why patience is underrated in modern CS.',
  '## The Problem with CS2 Pugs

Queue up for any Premier match, and you''ll see it: five players rushing to be the first one into site. Lurking? That''s "baiting" apparently.

## What Is Lurking, Actually?

Lurking isn''t hiding in spawn. It''s:
- **Map control** - Taking space the enemy assumes is clear
- **Information** - Calling rotations before they happen
- **Timing** - Hitting flanks at the perfect moment
- **Economy disruption** - Getting exit frags on force buys

## Why It''s Dying

### 1. The Content Culture
Highlight reels show entries, not lurks. Nobody clips "HarshLurk holds flank for 45 seconds."

### 2. FaceIT/Premier Mentality
Random teammates want visible impact. A 0-0-3 lurker at halftime gets flamed, even if they''re enabling every round.

### 3. Pro Scene Influence
Modern pro CS is fast. But pros have rehearsed executes - pugs don''t.

## The Value of a Good Lurk

Consider this scenario:
- Your team fakes A on Mirage
- You''re lurking palace
- Enemies rotate through connector
- You get a 2-3k from behind

That''s not baiting. That''s reading the game.

## When to Lurk

### DO Lurk When:
- Your team has info to execute without you
- You can hear rotations
- The enemy is predictable
- You have a timing in mind

### DON''T Lurk When:
- Your team needs bodies on site
- You''re down players
- The enemy has already rotated
- You''re lurking just to pad K/D

## My Favorite Lurk Spots

### Mirage
- **Palace** - Classic for a reason
- **Underpass** - Control mid secretly
- **B apps hold** - After A contact

### Inferno
- **Banana** - Solo B lurk while team executes A
- **Library** - Post-plant flanker

### Dust 2
- **Upper tunnels** - A Long fake, B lurk
- **Long doors** - B split lurk

## The Mental Game

Lurking requires patience. You need to:
- Be okay with low round impact sometimes
- Trust your teammates
- Time your moves perfectly
- Accept that people won''t understand

## Communication for Lurkers

Call everything:
- "One rotating through mid"
- "Connector clear, pushing B"
- "I have timing in 10 seconds"
- "Don''t peek, I have flank"

## Final Thoughts

The best teams have dedicated lurkers. If you have game sense but average aim, this might be your path to improvement.

*Solo queue warriors: sometimes lurking is the play.*',
  '/images/banners/gaming-2.svg',
  'opinion',
  'cs2',
  ARRAY['lurking', 'strategy', 'opinion', 'meta', 'tips', 'positioning'],
  7650,
  456,
  89,
  8,
  NOW() - INTERVAL '8 days'
FROM demo_profiles WHERE username = 'HarshLurk';

-- Post 8: Valorant News by RahulAstra
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Astra After the Nerfs: Still Galaxy Brain or Time to Switch?',
  'astra-after-nerfs-still-galaxy-brain-time-switch',
  'Riot nerfed Astra''s stars again. Here''s my honest take on whether she''s still worth the effort in Ranked.',
  '## The Nerfs Explained

Patch 9.0 brought significant changes:
- Star recall time increased
- Gravity well size reduced
- Ultimate cost increased

## The Community Reaction

Twitter was on fire. "Astra is dead," they said. But is she?

## My Testing Results

After 50 games post-patch:
- **Win rate:** 52% (down from 56%)
- **Impact per round:** Similar
- **Difficulty:** Higher

## What Changed Practically

### Star Management
Previously: Place stars liberally, recall freely
Now: Every star placement must be intentional

### Gravity Well
The smaller radius means:
- Harder to catch multiple enemies
- Positioning needs to be more precise
- Less forgiving on reads

### Ultimate
Five orbs instead of four. This means:
- Fewer walls per game
- More commitment per use
- Higher value required

## Is She Still Worth It?

**Yes, but...**

Astra''s skill floor went up. If you''re not willing to:
- Study pro Astra gameplay
- Practice star placement extensively
- Accept a learning curve

Then Omen or Harbor might serve you better.

## Who Should Still Play Astra?

- **Dedicated controller mains** - Your investment pays off
- **Team players** - Astra shines with coordination
- **Big brain players** - If you predict well, she''s still OP

## Who Should Switch?

- **Casual controller players** - Omen is more forgiving
- **Solo queue warriors** - Astra needs team support
- **Struggling mechanically** - Focus on aim, not utility

## Patch Wishlist

What I''d like to see:
1. Faster recall on unused stars
2. Slightly larger gravity well
3. Ultimate back to 4 orbs

## Conclusion

Astra isn''t dead - she''s more skill-indexed. If you love the cosmic controller fantasy, keep grinding. If not, Omen awaits.

*The stars align for those who persist.*

*Join MP Gaming Discord for Astra discussions: RahulAstra#7890*',
  '/images/banners/gaming-3.svg',
  'analysis',
  'valorant',
  ARRAY['astra', 'controller', 'patch', 'analysis', 'nerfs', 'meta'],
  6890,
  398,
  67,
  6,
  NOW() - INTERVAL '2 days'
FROM demo_profiles WHERE username = 'RahulAstra';

-- Post 9: CS2 Tips by GurpreetAK
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'AK-47 Spray Control: The 30-Day Challenge That Changed My Game',
  'ak-47-spray-control-30-day-challenge-changed-game',
  'I went from Silver spray to Global spray in 30 days. Here''s the exact routine, with daily practice guides.',
  '## The Challenge Origin

I was hardstuck LEM for six months. Great positioning, okay utility, but my spray? Embarrassing. Time for drastic measures.

## The 30-Day Structure

### Week 1: Foundation
**Focus:** First 10 bullets only

Daily routine (45 mins):
- 15 mins: Static spray on wall
- 15 mins: Recoil Master workshop map
- 15 mins: Bot practice (standing targets)

### Week 2: Movement Integration
**Focus:** Spray transfers

Daily routine (45 mins):
- 10 mins: Wall spray (full 30)
- 20 mins: Spray transfer practice
- 15 mins: Bot practice (moving targets)

### Week 3: Real Application
**Focus:** Peeking + spray

Daily routine (60 mins):
- 10 mins: Warmup spray
- 20 mins: Peek + spray drills
- 30 mins: Deathmatch (AK only)

### Week 4: Mastery
**Focus:** Any situation competence

Daily routine (60 mins):
- 5 mins: Warmup
- 25 mins: Advanced spray scenarios
- 30 mins: Ranked practice

## The Results

**Before:**
- First 5 bullets: 70% accuracy
- Full spray: 30% accuracy
- Spray transfer: Non-existent

**After:**
- First 5 bullets: 90% accuracy
- Full spray: 60% accuracy
- Spray transfer: Functional

## Key Insights

### Insight 1: Muscle Memory Takes Time
Day 1-7 felt like nothing was improving. Day 8+ everything clicked.

### Insight 2: Practice Correctly
Bad practice = bad habits. Focus on the pattern, not speed.

### Insight 3: Rest Matters
My best improvement came after rest days.

## The Pattern Breakdown

### Bullets 1-10
Pull straight down. This is where most kills happen.

### Bullets 11-20
Start the left sweep, then right.

### Bullets 21-30
Finish the right sweep. Rarely needed.

## Workshop Maps

Must-haves:
1. **Recoil Master** - Visual feedback
2. **Aim Botz** - Bot practice
3. **YPRAC Maps** - Scenario practice

## Common Mistakes

1. **Overcomplicating** - The AK pattern is simpler than you think
2. **Speed over accuracy** - Slow is smooth, smooth is fast
3. **Ignoring crosshair placement** - Spray starts at head level

## Beyond the Challenge

Maintenance routine (15 mins daily):
- 5 mins: Wall spray
- 10 mins: DM warmup

## LAN Tournament Moment

Last month, Punjab LAN finals. 1v3 post-plant. Three spray downs in 6 seconds. That moment made 30 days of grinding worth it.

*Punjab CS crew, let''s go!*

*DM for practice partner: GurpreetAK#4747*',
  '/images/banners/gaming-4.svg',
  'tips',
  'cs2',
  ARRAY['ak-47', 'spray', 'practice', 'tips', 'improvement', 'guide'],
  10540,
  623,
  112,
  9,
  NOW() - INTERVAL '12 days'
FROM demo_profiles WHERE username = 'GurpreetAK';

-- Post 10: Valorant Esports by AnkitNeon
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'The Rise of Neon: How Slide Mechanics Are Changing Valorant''s Pro Meta',
  'rise-of-neon-slide-mechanics-changing-pro-meta',
  'Once considered a troll pick, Neon is now appearing in VCT. Let''s analyze why the fastest agent in Valorant is having a moment.',
  '## Neon''s Pro Scene Emergence

VCT Pacific showed us something unexpected: Neon picks on crucial rounds. Not just for fun - for wins.

## Why Now?

### 1. Map Pool Changes
New maps favor mobility:
- **Lotus:** Long rotations benefit speed
- **Sunset:** Multiple entry points reward aggression
- **Pearl:** Mid control is everything

### 2. Anti-Utility Meta
Traditional smokes get destroyed by:
- Fade clears
- Sova reveals
- Chamber trips

Neon? She''s through before utility lands.

## The Slide Mechanics Deep Dive

### Basic Slide
Shift+W+Crouch = Standard slide. 70% of players stop here.

### Bunny Hop Slide
Slide + Jump at end = Momentum carry. This is the key to advanced Neon.

### Slide Cancel
Slide + Weapon switch = Cancel animation. Instant shooting.

### Super Jump
Slide + Jump + Updraft = Maximum distance. Site entries from unexpected angles.

## Pro Player Analysis

### DRX BuZz
His Neon on Lotus A site is textbook:
1. Slide into A main
2. High ground with wall
3. Instant trade potential

### PRX Something
Aggressive mid control:
1. Fast ball to detect
2. Slide through for information
3. Wall for safe retreat

## Ranked Application

### When to Pick Neon
- Maps with long rotates
- Against slow, methodical teams
- When you have mechanical confidence
- Attack-sided halves

### When to Avoid
- Tight maps (Bind, Split)
- Against heavy utility
- If your aim isn''t warmed up
- Against Chamber on site

## My Neon Routine

Pre-game warmup (15 mins):
- 5 mins: Slide mechanics in range
- 5 mins: DM with slide entries
- 5 mins: Lineup review

## The MP Valorant Scene

I started the MP Valorant community to push this kind of innovation. We need:
- More local tournaments
- Content creator support
- Organized practice groups

## Final Thoughts

Neon isn''t just viable - she''s potentially S-tier with the right hands. The skill ceiling is sky-high, and we''re just scratching the surface.

*Speed is key. Let''s go fast.*

*MP Gaming Discord: AnkitNeon#6565*',
  '/images/banners/gaming-5.svg',
  'analysis',
  'valorant',
  ARRAY['neon', 'duelist', 'esports', 'meta', 'mechanics', 'analysis'],
  8760,
  534,
  78,
  8,
  true,
  NOW() - INTERVAL '1 day'
FROM demo_profiles WHERE username = 'AnkitNeon';

-- Post 11: General FPS Tips by KarthikWalls
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'The Sentinel Mindset: How to Think Like a Site Anchor',
  'sentinel-mindset-think-like-site-anchor',
  'Sentinels don''t just hold sites - they create puzzles for attackers. Learn the mental framework behind great sentinel play.',
  '## Beyond Setup Videos

YouTube is full of Killjoy setup guides. What''s missing? The thinking behind when and why to use them.

## The Sentinel Philosophy

Your job isn''t kills. It''s:
1. **Delay** - Slow the execute
2. **Inform** - Tell your team what''s coming
3. **Deny** - Make the site uncomfortable
4. **Anchor** - Be the last line

## Reading Attacker Patterns

### Early Round Reads
- **Fast footsteps** - Prepare for rush, molly ready
- **Slow/default** - Setup lurk watch, save utility
- **Fake indicators** - Don''t rotate on first contact

### Mid-Round Adaptations
Your setup should change based on:
- How many times they''ve hit your site
- What utility they''ve shown
- Player tendencies you''ve noticed

## The Economy Game

### Full Buy
Full setup. All abilities placed optimally.

### Half Buy
Choose: Information OR delay. Not both.

### Eco
Play for exit frags. Don''t waste utility.

## Killjoy Specifics

### Turret Placement Philosophy
- **Early round:** Info gathering position
- **Post-plant:** Sightline denial
- **Retake:** Trade enabler

### Lockdown Timing
Use when:
- You need to retake
- Stopping a push in its tracks
- Forcing an early rotate

## Cypher Specifics

### Tripwire Psychology
Place wires where they''ll think you didn''t. Obvious spots get destroyed.

### Camera Value
One good camera call > one kill. Information wins rounds.

## Chamber Specifics

### Trademark Economy
It''s free info. Use it liberally.

### When to OP
Chamber OP is broken when:
- You have angles to escape
- The enemy AWP is dead
- You''re playing for picks

## The Mental Game

### Don''t Tilt on Broken Setups
They droned your setup? Fine. Adapt.

### Patience is Power
Let them walk into your trap. Don''t peek unnecessarily.

### Communication Priority
"They''re hitting B" > "I killed one"

## Training Regimen

Daily practice:
- 10 mins: New setup discovery
- 20 mins: Retake scenarios
- 30 mins: Ranked application

## My Journey

Started as a duelist main. Hardstuck Plat. Switched to Killjoy, hit Diamond in two acts. Sometimes, your role is the problem.

*Setup diff is real.*',
  '/images/banners/gaming-1.svg',
  'guide',
  'valorant',
  ARRAY['sentinel', 'killjoy', 'cypher', 'guide', 'mindset', 'strategy'],
  7230,
  412,
  56,
  10,
  NOW() - INTERVAL '9 days'
FROM demo_profiles WHERE username = 'KarthikWalls';

-- Post 12: CS2 Esports News by SouravRUSH
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Indian CS2 Scene 2024: The Teams, The Talent, The Future',
  'indian-cs2-scene-2024-teams-talent-future',
  'A comprehensive look at where Indian CS2 stands, who to watch, and what needs to change for global recognition.',
  '## State of the Scene

Let''s be honest: Indian CS2 is in a rebuild phase. Post-pandemic, the scene fragmented. But there''s hope.

## Top Teams to Watch

### Enigma Gaming
The most consistent Indian org in CS2:
- Multiple domestic titles
- Solid infrastructure
- Active content presence

### Orangutan Gaming
Rising contender:
- Young hungry roster
- Strong coaching
- Investment in development

### Team Exploit
Dark horse potential:
- Experienced core
- Tactical depth
- LAN experience

## Standout Players

### AWPers
The Indian AWP talent pool is deep:
- **Marzil** - Veteran consistency
- **Developer** - Flashy potential
- **JEMIN** - Rising talent

### Riflers
Pure fraggers worth watching:
- **Excali** - Entry excellence
- **Rossi** - Clutch performances
- **Rexy** - Young prodigy

### IGLs
The leadership gap:
- Few dedicated IGLs exist
- Most teams use hybrid roles
- This needs development

## Infrastructure Analysis

### What''s Working
- Growing tournament circuit
- Improved streaming production
- Org investment increasing

### What Needs Work
- **Player salaries** - Still below sustainability
- **Practice facilities** - Most teams play from home
- **International exposure** - Need more invites

## The Path to Global Recognition

### Short-term (6 months)
- Dominate APAC qualifiers
- Build LAN experience
- Maintain roster stability

### Medium-term (1-2 years)
- Secure RMR slots
- Major qualification attempts
- International bootcamps

### Long-term (3-5 years)
- Major playoff contention
- Top 20 HLTV ranking
- Self-sustaining scene

## What Players Can Do

1. **Stream regularly** - Build personal brands
2. **Create content** - Clips, VODs, tutorials
3. **Stay professional** - Orgs are watching
4. **Keep grinding** - The scene needs dedicated players

## What Orgs Can Do

1. **Invest in coaching** - The KR approach
2. **International scrims** - Quality practice
3. **Mental health support** - Player longevity
4. **Content pipelines** - Fan engagement

## My Role

As someone pushing the Kolkata scene, I see the potential daily. We need:
- More grassroots tournaments
- Better infrastructure
- Community support

## Conclusion

Indian CS2 isn''t dying - it''s transforming. The players are talented. The passion is there. We just need the ecosystem to catch up.

*KOL CS scene, we rise together.*',
  '/images/banners/gaming-2.svg',
  'esports',
  'cs2',
  ARRAY['india', 'esports', 'scene', 'teams', 'future', 'analysis'],
  9870,
  567,
  134,
  11,
  NOW() - INTERVAL '14 days'
FROM demo_profiles WHERE username = 'SouravRUSH';

-- Post 13: PUBG Guide by BiswajitFlex
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'PUBG Erangel Masterclass: Rotations, Loot Paths, and Circle Predictions',
  'pubg-erangel-masterclass-rotations-loot-circle',
  'Stop dying to the zone. Learn the rotation routes, high-tier loot paths, and circle prediction techniques that top PUBG players use to win consistently.',
  '## Why Erangel Still Matters

Every PUBG player starts on Erangel, but few truly master it. After 3000+ hours and countless chicken dinners, here''s what separates survivors from the lobby.

## The Loot Path Philosophy

### Hot Drops vs Smart Drops
Hot dropping Pochinki every game is content, not strategy. Smart drops consider:
- **Flight path angle** - Which side of the map is less contested?
- **Circle probability** - Center-ish drops have better odds
- **Vehicle spawns** - Can you rotate if zone is far?

### Top 5 Underrated Loot Spots

**1. Mylta Power**
Full squad loot with vehicle spawns nearby. Most lobbies ignore it.

**2. Primorsk**
Coastal town with warehouse loot. Great for south circles.

**3. Ruins + Shooting Range Combo**
Quick compound clear, then rotate to shooting range for military-tier loot.

**4. Mansion**
Solo/duo goldmine. Level 3 gear spawns regularly.

**5. Water Town**
Risky but rewarding. Master the bridge camp and you own mid-map.

## Rotation Framework

### Phase 1: Early Game (0-5 min)
- Loot efficiently, don''t over-loot
- Secure a vehicle immediately
- Listen for nearby gunfights

### Phase 2: Mid Game (5-15 min)
- Move to zone edge, not center
- Use terrain for cover during rotation
- Engage only when advantageous

### Phase 3: Late Game (15+ min)
- Play compounds and ridgelines
- Let others fight, third-party the winner
- Save smokes for final circles

## Circle Prediction

The zone isn''t random. It follows patterns:
- **First circle:** Usually covers 60% of map, biased toward center
- **Phase 2-3:** Tends to shift toward terrain features (hills, compounds)
- **Final circles:** Favor open terrain more than buildings

### Reading the Circle
1. Check terrain elevation in white zone
2. Identify compound clusters
3. Position between zone edge and nearest cover

## Vehicle Management

Rules of driving in PUBG:
- Always park facing your exit route
- Never drive in final 3 circles (too loud)
- Bikes > cars for solo/duo (smaller target)
- Boats are underrated for coastal rotations

## The Indian PUBG Scene

BGMI brought millions of Indian players to PUBG. The competitive scene is growing:
- BGIS (Battlegrounds India Series) is massive
- LAN events are getting bigger
- Content creators are thriving

## Squad Communication

Call these things ALWAYS:
- "Vehicle at 220" - Direction + distance
- "One knocked behind tree, northeast compound"
- "Zone pulling south, rotate now"
- "I need meds" - Don''t die in silence

## Final Thoughts

PUBG rewards patience and positioning over pure aim. Master Erangel''s terrain, respect the circle, and you''ll see more chicken dinners than ever.

*NE India PUBG squad, let''s run customs!*

*DM: BiswajitFlex#3210*',
  '/images/banners/gaming-3.svg',
  'guide',
  'pubg-mobile',
  ARRAY['pubg-mobile', 'erangel', 'rotation', 'guide', 'loot', 'strategy'],
  11340,
  678,
  92,
  10,
  true,
  NOW() - INTERVAL '2 days'
FROM demo_profiles WHERE username = 'BiswajitFlex';

-- Post 14: PUBG Tips by AmitSupport
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'The Support Role in PUBG Squads: Why Your Team Needs a Dedicated Medic',
  'pubg-support-role-squads-dedicated-medic',
  'Everyone wants to frag, but the player who keeps the squad alive wins tournaments. A complete guide to playing support in PUBG.',
  '## The Unsung Hero

In every great PUBG squad, there''s someone who carries meds, shares ammo, and makes calls. That''s the support player, and they''re the reason your team survives to top 5.

## What Does a PUBG Support Do?

### 1. Resource Management
- Carry extra first aid kits and boosters
- Share ammo when teammates run low
- Pick up throwables others ignore (smokes, stuns)

### 2. Callouts and Intel
- Constantly scan surroundings
- Track enemy positions during fights
- Call rotations and vehicle positions

### 3. Revive Priority
- Position yourself to revive safely
- Smoke before reviving (always!)
- Know when to revive vs when to fight

## The Support Loadout

### Primary: DMR or AR
M416 or Beryl for mid-range fights. You''re not the entry fragger.

### Secondary: Sniper or Shotgun
Mini14 for long range intel, or S12K for building clears.

### Must-Carry Items
- 10+ First Aid Kits
- 10+ Boosters (energy drinks + painkillers)
- 4+ Smoke Grenades
- 2+ Stun Grenades

## Positioning in Squad Fights

### During Engagement
- Stay behind the fraggers
- Cover flanks they can''t see
- Be ready to trade or revive

### During Rotation
- Take the rear vehicle seat
- Watch behind during movement
- Call out followers

### During Final Circle
- Anchor one side of your team''s position
- Smoke for repositions
- Keep everyone boosted

## Communication Framework

What to call as support:
- **"Team health check"** - Before rotations
- **"Smoke out, push now"** - Enabling aggression
- **"Hold, I''m reviving [name]"** - Revive calls
- **"Boosters ready, top up after this fight"** - Resource calls

## Why PUBG India Needs More Supports

Watching BGIS, the teams that win have clear role definitions. The fraggers get clips, but the support players win trophies.

## Training Routine

- Practice smoke throwing (distance + accuracy)
- Learn vehicle driving routes on every map
- Watch pro support player POVs
- Custom room 1v4 revive-under-fire drills

## Final Thoughts

Being support isn''t glamorous. Your K/D will be lower. But your win rate? Through the roof. The best squads know: a living teammate is worth more than a kill.

*Lucknow PUBG crew represent!*

*Support mains unite: AmitSupport#5050*',
  '/images/banners/gaming-4.svg',
  'guide',
  'pubg-mobile',
  ARRAY['pubg-mobile', 'support', 'squad', 'guide', 'medic', 'strategy'],
  7890,
  445,
  67,
  8,
  NOW() - INTERVAL '6 days'
FROM demo_profiles WHERE username = 'AmitSupport';

-- Post 15: PUBG Esports Analysis by DeepakEntry
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'BGIS 2024 Meta Analysis: What the Top Indian PUBG Teams Are Doing Differently',
  'bgis-2024-meta-analysis-top-indian-pubg-teams',
  'Breaking down the strategies, drop spots, and rotation patterns that dominated BGIS 2024. Data-driven analysis of 50+ matches.',
  '## BGIS 2024: The Numbers

After analyzing 50+ BGIS matches, clear patterns emerge. The top teams aren''t just better aimers - they''re better strategists.

## Drop Spot Trends

### Most Contested
1. **Pochinki** - 40% of teams attempt, 15% survive
2. **Georgopol** - Popular for aggressive squads
3. **Military Base** - High risk, high reward

### Most Successful
1. **Mylta Power** - Teams that drop here average 2.3 more survival points
2. **Primorsk** - Consistent top 10 finishes
3. **Severny** - Underrated, great for Erangel north circles

## The Winning Formula

### Placement > Kills
Top 5 teams in BGIS prioritized placement:
- Average finish: Top 8
- Average kills: 6.2 per game
- Win rate: 15%

Compare to aggressive teams:
- Average finish: Top 12
- Average kills: 8.7 per game
- Win rate: 8%

**The math is clear:** Consistent placement wins tournaments.

## Rotation Patterns

### Early Rotation Meta
The best teams moved to zone **2 minutes before close**. This gives:
- First pick on compounds
- Less contested rotations
- Better position for next circle

### Vehicle Hoarding
Top teams secured 2 vehicles minimum:
- One for rotation
- One as mobile cover

## Weapon Meta

### Most Used (Top 10 Teams)
1. **M416** - 78% pick rate
2. **Beryl M762** - 45% pick rate
3. **Mini14** - 62% pick rate
4. **AWM** - 100% pick rate (when available)

### Underused but Effective
- **DP-28** - Prone meta is back
- **VSS** - Stealth kills in mid-game

## What Indian Teams Need to Improve

1. **Late-game decision making** - Too many teams panic in final circles
2. **Zone prediction** - Not enough compound scouting
3. **Utility usage** - Smokes are thrown reactively, not proactively
4. **Consistent rosters** - Too much shuffling between tournaments

## Predictions for Next Season

- More teams will adopt the slow-rotation meta
- Vehicle plays will become more strategic
- Support role will become more defined
- Content creator teams will struggle against disciplined squads

## Conclusion

Indian PUBG is maturing. The spray-and-pray era is ending. Teams that study the meta, respect rotations, and play for placement will dominate.

*Data is the new chicken dinner.*',
  '/images/banners/gaming-5.svg',
  'analysis',
  'pubg-mobile',
  ARRAY['pubg-mobile', 'bgis', 'esports', 'analysis', 'meta', 'india'],
  9450,
  534,
  78,
  9,
  NOW() - INTERVAL '11 days'
FROM demo_profiles WHERE username = 'DeepakEntry';

-- Post 16: Free Fire Guide by YashSkye
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, is_featured, created_at)
SELECT
  id,
  'Free Fire Character Combos That Dominate Ranked in 2024',
  'free-fire-character-combos-dominate-ranked-2024',
  'The right character combo can turn an average player into a ranked beast. Here are the top 10 character combinations tested in Heroic+ lobbies.',
  '## Why Character Combos Matter

Free Fire''s unique character system is what separates it from other battle royales. The right combo gives you abilities that stack to create unfair advantages.

## How Character Combos Work

- 1 Active ability (main character)
- 3 Passive abilities (combo slots)
- Abilities must complement your playstyle

## Top 10 Combos for 2024

### Combo 1: The Rusher
**Active: Alok** (Drop the Beat)
- Passive 1: Jota (Sustained Raids)
- Passive 2: Kelly (Dash)
- Passive 3: Hayato (Bushido)

**Why it works:** Heal while running, move faster, deal more damage at low HP. Pure aggression.

### Combo 2: The Sniper
**Active: Chrono** (Time Turner)
- Passive 1: Rafael (Dead Silent)
- Passive 2: Moco (Hacker''s Eye)
- Passive 3: Laura (Sharp Shooter)

**Why it works:** Shield for safety, silent kills, enemy tagging, scope accuracy boost.

### Combo 3: The Survivor
**Active: K** (Master of All)
- Passive 1: Jota (Sustained Raids)
- Passive 2: Dimitri (Healing Heartbeat)
- Passive 3: Kapella (Healing Song)

**Why it works:** EP and HP regeneration stacked. Nearly unkillable in sustained fights.

### Combo 4: The Flanker
**Active: Alok**
- Passive 1: Moco (Hacker''s Eye)
- Passive 2: Kelly (Dash)
- Passive 3: Luqueta (Hat Trick)

**Why it works:** Speed, tracking, and HP gain per kill. Made for flanking and multi-kills.

### Combo 5: The Support
**Active: Dimitri**
- Passive 1: Kapella (Healing Song)
- Passive 2: A124 (Thrill of Battle)
- Passive 3: Olivia (Healing Touch)

**Why it works:** Team healer. Your squad stays alive longer, wins more fights.

### Combo 6-10: Situational Picks

**Combo 6 (Bermuda Rush):** Wukong + Jota + Kelly + Hayato
**Combo 7 (Kalahari Snipe):** Clu + Rafael + Laura + Moco
**Combo 8 (Purgatory Control):** Skyler + Jota + Moco + Luqueta
**Combo 9 (Clash Squad):** Alok + Jota + Luqueta + Hayato
**Combo 10 (Solo Ranked):** Chrono + Jota + Kelly + Hayato

## Free Fire India Scene

The Indian Free Fire scene is massive:
- **FFIC** brings together the best teams
- Content creators like Total Gaming have millions of fans
- Clash Squad tournaments are growing at grassroots level

## Ranked Climbing with Combos

### Bronze to Gold
Use any Alok combo. Healing advantage wins at this level.

### Gold to Diamond
Switch to Chrono or K combos. You need defensive abilities.

### Diamond to Heroic
Master the Rusher or Flanker combo. Aggression wins in high ranks.

### Heroic to Grandmaster
Situational combos. Adapt per match, per map, per lobby.

## Training Tips

1. Test combos in Clash Squad before ranked
2. Watch pro player combo setups on YouTube
3. Adapt to balance patches (combos change every update)
4. Don''t copy blindly - match combo to YOUR playstyle

## Conclusion

Free Fire rewards preparation and strategy through its character system. Master the combos, and you''ll climb faster than you thought possible.

*Dehradun Free Fire fam, let''s go Grandmaster!*

*Join my coaching server: YashSkye#9090*',
  '/images/banners/gaming-1.svg',
  'guide',
  'freefire',
  ARRAY['freefire', 'characters', 'combos', 'ranked', 'guide', 'tips'],
  13560,
  823,
  145,
  11,
  true,
  NOW() - INTERVAL '3 days'
FROM demo_profiles WHERE username = 'YashSkye';

-- Post 17: Free Fire Tips by NikhilGOA
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Clash Squad Domination: Advanced Strategies for Free Fire''s Most Competitive Mode',
  'clash-squad-domination-advanced-strategies-freefire',
  'Clash Squad is where Free Fire gets truly competitive. Economy management, buy strategies, and round-by-round tactics to crush opponents.',
  '## Why Clash Squad Is the Real Game

Battle Royale is fun, but Clash Squad is where skill shines. 4v4, round-based, economy system - it''s Free Fire''s answer to tactical shooters.

## Economy Basics

### Round 1
Everyone starts with the same money. Buy:
- **Pistol upgrade** (Desert Eagle)
- **1 Grenade**
- Save the rest

### Win Round 1 → Round 2
- Buy SMG (MP40 or UMP)
- Light armor
- 1 Utility

### Lose Round 1 → Round 2
- Full save (pistol only)
- Or force buy SMG if 1-0 down and desperate

### Full Buy Round
- AR (SCAR or M4A1) or Sniper (AWM if you''re confident)
- Level 2+ armor
- Full utility (grenades + gloo walls)

## Gloo Wall Mastery

Gloo walls define Free Fire combat:

### Offensive Gloo
- Push with gloo in front
- Place wall, peek right side
- Double gloo for crossing open ground

### Defensive Gloo
- Instant wall when caught in open
- One-way peek positions
- Block doorways during defuse

### Advanced Tech
- **Gloo peek:** Place wall, crouch, peek, shoot, re-crouch
- **Gloo stack:** Double wall for extra cover
- **Gloo bait:** Place wall, don''t peek, rotate behind them

## Map Callouts

### Bermuda
- **Clock Tower** (center) - High ground dominance
- **Factory** (east) - Loot and fights
- **Peak** (west) - Sniper heaven

### Kalahari
- **Command Post** - Best loot
- **Refinery** - Vehicle spawns
- **Sub Zone** - Underground advantage

## Team Roles in Clash Squad

### Entry (1 player)
First one in. Uses Alok/Chrono ability, creates space.

### Support (1 player)
Heals, provides cover fire, trades entry.

### Sniper (1 player)
Holds angles, gets opening picks, covers rotations.

### Anchor (1 player)
Watches flank, clutches rounds, plays patient.

## Round-by-Round Strategy

### Winning Side
- Don''t get overconfident
- Save money for full buys
- Maintain position advantage

### Losing Side
- Eco rounds are fine (save for full buy)
- Force buy only on crucial rounds
- Change strategy mid-match

## The Goa Free Fire Scene

We''re building something special here:
- Beach LAN tournaments every month
- Clash Squad leagues for amateurs
- Community customs for practice

## Final Thoughts

Clash Squad rewards teamwork and tactical thinking. If you want to improve at Free Fire, grind Clash Squad - the skills transfer to BR.

*Goa gamers, let''s make this scene grow!*

*Custom rooms every weekend: NikhilGOA#7070*',
  '/images/banners/gaming-2.svg',
  'tips',
  'freefire',
  ARRAY['freefire', 'clash-squad', 'strategy', 'tips', 'gloo-wall', 'competitive'],
  8760,
  512,
  86,
  9,
  NOW() - INTERVAL '5 days'
FROM demo_profiles WHERE username = 'NikhilGOA';

-- Post 18: Free Fire Esports by RajViper
INSERT INTO demo_community_posts (author_id, title, slug, excerpt, content, cover_image, category, game, tags, views_count, likes_count, comments_count, read_time_minutes, created_at)
SELECT
  id,
  'Free Fire India Championship 2024: The Teams, The Drama, The Takeaways',
  'free-fire-india-championship-2024-teams-drama-takeaways',
  'FFIC 2024 was a rollercoaster. Upsets, clutches, and a new champion. Here''s everything that happened and what it means for Indian FF esports.',
  '## FFIC 2024: A Recap

The Free Fire India Championship 2024 delivered one of the most competitive seasons in Indian mobile esports history. Let''s break it down.

## The Format

- 18 teams qualified through open qualifiers
- League stage: 3 weeks of round-robin
- Finals: Top 12 teams, 6 matches over 2 days
- Prize pool: Massive for Indian standards

## Standout Moments

### The Underdog Run
A team from Tier 2 city qualifiers made it to the top 6. They had no org, no salary - just raw talent and practice room customs.

### The Clutch King
One player had 3 separate 1v4 clutches across the finals. Free Fire''s character abilities made each one a highlight reel.

### The Strategy Shift
Mid-tournament, the meta shifted from aggressive rushing to zone control. Teams adapted in real-time.

## Meta Analysis

### What Worked
- **Zone edge play** - Teams camping edge and rotating late won more rounds
- **Alok + Jota combo** - Healing advantage in extended fights
- **Sniper openings** - AWM picks to start rounds gave huge advantages

### What Failed
- **Hot drops** - Teams that forced fights early consistently placed bottom
- **Solo carries** - No single player can win a BR tournament alone
- **Static strategies** - Teams that didn''t adapt got figured out

## What This Means for Indian FF

### Growth is Real
- Viewership doubled from 2023
- More orgs are investing
- Grassroots tournaments are emerging everywhere

### Challenges Remain
- **Device disparity** - Not everyone has gaming phones
- **Network issues** - Lag in competitive is unacceptable
- **Regional imbalance** - South and West India dominate

### Opportunities
- **Content + competitive pipeline** - Content creators transitioning to pro
- **College esports** - University leagues are starting
- **Regional leagues** - State-level competitions needed

## Player Development

For aspiring pros:
1. **Grind Clash Squad** - Tactical skills matter
2. **Join custom rooms** - Pro practice lobbies
3. **Study VODs** - Watch FFIC replays
4. **Build a team** - Solo talent isn''t enough
5. **Stay consistent** - Show up to every qualifier

## The Bihar Perspective

From Patna, I see incredible untapped talent. Players here have the skill but lack:
- Tournament awareness
- Organized practice
- Equipment access

We need community-driven solutions.

## Conclusion

FFIC 2024 proved that Indian Free Fire esports is legit. The skill ceiling is rising, the community is passionate, and the future is bright.

*Let''s put Bihar Free Fire on the map.*',
  '/images/banners/gaming-3.svg',
  'esports',
  'freefire',
  ARRAY['freefire', 'ffic', 'esports', 'india', 'tournament', 'analysis'],
  10230,
  612,
  94,
  10,
  NOW() - INTERVAL '8 days'
FROM demo_profiles WHERE username = 'RajViper';

-- =============================================
-- INSERT DEMO POST COMMENTS
-- =============================================

-- Comments on Post 1 (Jett Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'This guide actually helped me hit Immortal! The dash timing section changed everything.',
  45,
  NOW() - INTERVAL '2 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'mastering-jett-2024-complete-guide' AND d.username = 'NehaDuelist';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Roshan bhai always delivering! When''s the next stream?',
  23,
  NOW() - INTERVAL '2 days 3 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'mastering-jett-2024-complete-guide' AND d.username = 'ArjunSova';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'As a controller main, I appreciate Jett players who actually wait for utility. Good guide!',
  34,
  NOW() - INTERVAL '1 day'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'mastering-jett-2024-complete-guide' AND d.username = 'PriyaSmokeQueen';

-- Comments on Post 2 (AWP Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The Mirage spots are insane. Got 3 kills from the jungle window angle yesterday.',
  28,
  NOW() - INTERVAL '4 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'awp-positioning-cs2-free-kills-guide' AND d.username = 'VigneshScope';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Finally someone explaining the movement after shot concept. This is what separates good from great AWPers.',
  19,
  NOW() - INTERVAL '3 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'awp-positioning-cs2-free-kills-guide' AND d.username = 'HarshLurk';

-- Comments on Post 4 (IGL Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Venkat sir, any tips for dealing with teammates who don''t listen to calls?',
  15,
  NOW() - INTERVAL '8 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pug-star-to-igl-building-championship-cs2-team' AND d.username = 'SouravRUSH';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The anti-stratting section is gold. Our team has never properly done this.',
  22,
  NOW() - INTERVAL '7 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pug-star-to-igl-building-championship-cs2-team' AND d.username = 'GurpreetAK';

-- Comments on Post 5 (Game Changers Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Needed this! Trying out for a team next month. The tryout section is super helpful.',
  31,
  NOW() - INTERVAL '3 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'breaking-vct-game-changers-roadmap-female-pros' AND d.username = 'AnuRaze';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'As a fellow female gamer, thank you for this. The toxicity section is so real.',
  47,
  NOW() - INTERVAL '2 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'breaking-vct-game-changers-roadmap-female-pros' AND d.username = 'PriyaSmokeQueen';

-- Comments on Post 10 (Neon Analysis)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The slide mechanics breakdown is what I needed. Practicing the bunny hop slide now!',
  18,
  NOW() - INTERVAL '12 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'rise-of-neon-slide-mechanics-changing-pro-meta' AND d.username = 'ArunPhoenix';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'As a Jett main, Neon looks interesting. Might try her on Lotus.',
  12,
  NOW() - INTERVAL '6 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'rise-of-neon-slide-mechanics-changing-pro-meta' AND d.username = 'SkRoshanOP';

-- Comments on Post 13 (PUBG Erangel Guide)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Bhai the Mylta Power drop is so underrated! Been using it since reading this, easy top 5 every game.',
  32,
  NOW() - INTERVAL '1 day'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pubg-erangel-masterclass-rotations-loot-circle' AND d.username = 'AmitSupport';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Circle prediction section is gold. Never thought about terrain features affecting zone placement.',
  24,
  NOW() - INTERVAL '1 day 5 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'pubg-erangel-masterclass-rotations-loot-circle' AND d.username = 'DeepakEntry';

-- Comments on Post 16 (Free Fire Character Combos)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The Rusher combo with Alok + Jota is insane! Hit Heroic for the first time using Combo 1.',
  41,
  NOW() - INTERVAL '2 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'free-fire-character-combos-dominate-ranked-2024' AND d.username = 'NikhilGOA';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Combo 5 support build saved our squad so many times. Great guide Yash bhai!',
  27,
  NOW() - INTERVAL '2 days 4 hours'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'free-fire-character-combos-dominate-ranked-2024' AND d.username = 'RajViper';

-- Comments on Post 17 (Clash Squad)
INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'The gloo wall tech section changed how I play. Gloo peek is so OP once you get the timing.',
  19,
  NOW() - INTERVAL '4 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'clash-squad-domination-advanced-strategies-freefire' AND d.username = 'SantoshSilent';

INSERT INTO demo_post_comments (post_id, author_id, content, likes_count, created_at)
SELECT
  p.id,
  d.id,
  'Economy management section is what most FF players miss. This isn''t just spray and pray!',
  15,
  NOW() - INTERVAL '3 days'
FROM demo_community_posts p, demo_profiles d
WHERE p.slug = 'clash-squad-domination-advanced-strategies-freefire' AND d.username = 'YashSkye';

-- =============================================
-- Create view for demo posts with author info
-- =============================================
CREATE OR REPLACE VIEW demo_posts_complete AS
SELECT
  p.id,
  p.title,
  p.slug,
  p.excerpt,
  p.content,
  p.cover_image,
  p.category,
  p.game,
  p.tags,
  p.views_count,
  p.likes_count,
  p.comments_count,
  p.read_time_minutes,
  p.is_featured,
  p.is_pinned,
  p.created_at,
  p.updated_at,
  json_build_object(
    'id', a.id,
    'username', a.username,
    'display_name', a.display_name,
    'avatar_url', a.avatar_url,
    'bio', a.bio,
    'gaming_style', a.gaming_style,
    'region', a.region,
    'is_verified', a.is_verified
  ) as author,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', c.id,
      'content', c.content,
      'likes_count', c.likes_count,
      'created_at', c.created_at,
      'author', json_build_object(
        'id', ca.id,
        'username', ca.username,
        'display_name', ca.display_name,
        'avatar_url', ca.avatar_url
      )
    ) ORDER BY c.created_at DESC)
    FROM demo_post_comments c
    JOIN demo_profiles ca ON c.author_id = ca.id
    WHERE c.post_id = p.id),
    '[]'::json
  ) as comments
FROM demo_community_posts p
JOIN demo_profiles a ON p.author_id = a.id
ORDER BY p.is_pinned DESC, p.is_featured DESC, p.created_at DESC;

-- Grant access
GRANT SELECT ON demo_posts_complete TO anon, authenticated;
GRANT SELECT ON demo_community_posts TO anon, authenticated;
GRANT SELECT ON demo_post_comments TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Demo Community Posts Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: demo_community_posts, demo_post_comments';
  RAISE NOTICE 'View: demo_posts_complete';
  RAISE NOTICE 'Posts created: 18 gaming articles';
  RAISE NOTICE 'Comments created: 16 sample comments';
  RAISE NOTICE 'Games covered: Valorant, CS2, PUBG Mobile, Free Fire';
  RAISE NOTICE '========================================';
END $$;
