# 03 - Growth Strategy

> How to get the first 100 users, then 1,000, then 10,000. No generic advice — every tactic is specific to ggLobby.

---

## The Core Problem

ggLobby is a social platform. Social platforms have a chicken-and-egg problem: nobody joins because nobody is there, and nobody is there because nobody has joined.

**How every successful gaming platform solved this:**
- **Discord (2015)**: Targeted specific gaming subreddits (r/MMORPG, r/FinalFantasy14). Offered bot integrations that servers needed. Grew community-by-community, not user-by-user.
- **Guilded (2017)**: Targeted clan/guild leaders specifically. Offered better team management tools than Discord. Got acquired by Roblox.
- **GamerLink (2016)**: Built an LFG app first. Focused on ONE game (Destiny) before expanding. Used App Store's gaming category for organic discovery.
- **GameTree (2018)**: Personality-based gamer matching. Launched on Product Hunt. Got initial traction from novelty of the "gamer personality quiz" concept.

**The pattern**: Every successful platform started by solving ONE specific problem for ONE specific community, not by being "everything for everyone."

---

## Phase 1: The First 100 Users (Month 1-2)

### Strategy: Solve the LFG Problem for 2-3 Games

ggLobby has 50+ features. For launch, market it as **ONE thing**: "The best way to find teammates for [Game]."

**Pick your 2-3 launch games based on:**
1. Games with the most active LFG demand (Valorant, CS2, and Dota 2 currently have the highest "looking for teammates" search volume)
2. Games YOU personally play (you need to be in those communities)
3. Games where existing LFG solutions are weak (Reddit megathreads, Discord servers with 10,000+ unread messages)

**Recommended launch games**: Valorant + CS2 + one of (Dota 2 / PUBG / Apex Legends)

### Tactics for First 100 Users

#### 1. Reddit (Free, High Impact)

**DO NOT post "Hey check out my app!" — you will get banned and downvoted.**

**Instead, become a useful member first:**

| Subreddit | Members | Strategy |
|-----------|---------|----------|
| r/VALORANT | 2.2M+ | Answer questions, share tips. After 2-3 weeks of genuine participation, post a "Show & Tell" about ggLobby |
| r/GlobalOffensive (CS2) | 1.7M+ | Same approach. Focus on LFG-related discussions |
| r/GamerPals | 200K+ | This is literally "find gaming friends." Post genuinely as a user looking for teammates, mention ggLobby naturally |
| r/gamingsuggestions | 400K+ | Answer "where to find teammates" questions |
| r/IndieGaming | 300K+ | Share development journey posts (people love seeing indie projects being built) |
| r/SideProject | 100K+ | Post the technical story of building ggLobby |
| r/webdev | 1M+ | "I built a gaming social platform with Next.js 16 and Supabase — here's what I learned" |

**Timeline:**
- Week 1-2: Be active on these subreddits. Comment helpfully. Build karma.
- Week 3: Post a genuine "Show & Tell" or "I built this" post with screenshots and the story behind ggLobby.
- Ongoing: Answer LFG questions with "I actually built a platform for this" (not spammy, genuinely helpful).

#### 2. Discord Server Partnerships (Free, High Impact)

**Target**: Find 10-20 Discord servers with 500-5,000 members (not the giant 100K+ servers — they won't care about you).

**How:**
1. Search Discord server directories (Disboard.org, Discord.me, top.gg) for your target games
2. Join servers focused on LFG, recruitment, or competitive play
3. Message the server owner/admin directly:
   > "Hey, I built ggLobby — a free platform for finding gaming teammates. I noticed your server has a #lfg channel. Would you be open to me sharing it with your members? Happy to give your server a featured spot on our platform."
4. Offer value: "I can set up a ggLobby bot that cross-posts LFG requests from your Discord to our platform, giving your members more visibility."

**Your Discord crosspost feature (`src/app/api/integrations/discord/crosspost/route.ts`) is a real selling point here.**

#### 3. Personal Network (Free, Immediate)

- Message every gamer you know personally. Not "please use my app" but "I need 20 beta testers — can you try it for a week and give honest feedback?"
- The beta feedback widget you already built (`src/components/feedback/feedback-widget.tsx`) makes this easy.
- Ask each person to invite 2 friends. Early users who bring friends are 3x more likely to stay.

#### 4. Gaming Forums & Communities (Free)

| Platform | Strategy |
|----------|----------|
| Steam Community forums | Post in game-specific forums: "Looking for [Game] teammates? I built a free tool for this" |
| Liquipedia (esports wiki) | If relevant, add ggLobby as a community resource |
| Game-specific forums (Blitz.gg, u.gg communities) | Participate, don't spam |
| Indian gaming communities (if targeting India first, based on your seed data) | NeoGaming, Indian Gaming Community Discord, r/IndianGaming |

---

## Phase 2: 100 to 1,000 Users (Month 2-4)

### Strategy: Content-Driven SEO + Micro-Influencers

At 100 users, you have enough activity to not look dead. Now scale acquisition channels.

#### 1. SEO Content Strategy

Your blog system is fully built. Use it.

**Target keywords with high intent, lower competition:**

| Keyword | Monthly Searches | Competition | Blog Post Topic |
|---------|-----------------|-------------|-----------------|
| "find valorant teammates" | 3,000-5,000 | Medium | "How to Find the Perfect Valorant Teammates in 2026" |
| "cs2 lfg" | 2,000-3,000 | Low | "CS2 LFG: The Complete Guide to Finding Players" |
| "gaming clan finder" | 1,000-2,000 | Low | "Top 5 Ways to Find a Gaming Clan (2026 Guide)" |
| "dota 2 find team" | 1,000-2,000 | Medium | "How to Build a Dota 2 Stack That Actually Wins" |
| "looking for group valorant" | 2,000+ | Low | "Valorant LFG: Stop Solo Queuing, Start Winning" |
| "best gaming social platforms" | 500-1,000 | Low | "5 Gaming Social Platforms Every Gamer Should Know" |
| "how to start a gaming clan" | 1,000-2,000 | Low | "How to Start a Gaming Clan That Doesn't Die in a Week" |
| "gamer profile builder" | 500-1,000 | Very Low | "Build Your Ultimate Gamer Profile (Free)" |

**Content creation schedule**: 2 blog posts per week. Each post should be:
- 1,500-3,000 words (Google favors comprehensive content)
- Includes screenshots of ggLobby features relevant to the topic
- Has a clear CTA: "Create your free ggLobby profile to find teammates now"
- Internally links to other ggLobby blog posts
- Uses your 6 blog templates to make posts visually unique

**SEO Technical Checklist (you already have most of the infrastructure):**
- [ ] Each blog post generates Open Graph + Twitter Card meta tags (already built in blog page.tsx)
- [ ] JSON-LD structured data on every blog post (already built)
- [ ] Internal linking between posts
- [ ] All images have alt text
- [ ] Blog loads in < 3 seconds
- [ ] Mobile-responsive (already with Tailwind)

#### 2. TikTok / YouTube Shorts / Instagram Reels (Free, High Reach)

Gaming content performs exceptionally well on short-form video. You do NOT need to be on camera.

**Content ideas that work for gaming platforms:**

| Format | Example | Why It Works |
|--------|---------|--------------|
| Screen recording + voiceover | "I found the PERFECT Valorant teammate in 30 seconds" | Shows the product in action |
| Before/after | "Solo queue: *toxic teammate clip*. With ggLobby: *fun squad clip*" | Relatable pain point |
| Tutorial | "How to build a gamer profile that actually gets squad invites" | Practical value |
| Behind the scenes | "Day 47 of building a gaming social platform" | Builder story resonates |
| Data/stats | "We analyzed 1,000 LFG posts. Here's what the best teammates have in common" | Authority building |

**Posting schedule**: 1 video per day on TikTok. Cross-post to YouTube Shorts and Instagram Reels.

**Equipment needed**: $0. Screen recording (OBS is free) + your phone's camera if you want to be on screen.

#### 3. Micro-Influencer Partnerships

**DO NOT pay big streamers. They charge $1,000-10,000+ per sponsored stream and deliver low conversion for social platforms.**

**Instead, target micro-influencers:**

| Tier | Follower Count | Cost | Expected ROI |
|------|---------------|------|-------------|
| Nano | 1K-5K followers | Free (product access) | 10-50 signups per partnership |
| Micro | 5K-25K followers | $50-200 per post | 50-200 signups per partnership |
| Small | 25K-100K followers | $200-500 per post | 100-500 signups per partnership |

**Where to find them:**
- Twitch streamers with 10-50 average viewers (they are hungry for partnerships)
- YouTube creators making game guides with 5K-50K subscribers
- TikTok gaming creators with 10K-100K followers
- Discord community leaders

**What to offer them:**
- Free premium account on ggLobby
- "Verified Creator" badge on their profile
- Their clan gets featured on the homepage
- Co-branded content (their guide published on ggLobby blog)
- Revenue share from any premium signups they drive (if applicable)

#### 4. Product Hunt Launch

**Preparation (2-3 weeks before):**
1. Find a "hunter" with a large PH following to submit your product
2. Create a 60-second demo video showing the core user flow
3. Prepare 5-10 animated GIFs showing key features
4. Write a compelling tagline: "Find gaming teammates who actually match your skill and vibe"
5. Write your "maker comment" — the personal story of why you built this

**Launch Day (pick a Tuesday or Wednesday):**
- Go live at 12:01 AM Pacific Time
- Share the PH link with your existing community immediately
- Respond to EVERY comment within minutes
- Post on Twitter/X, Reddit, Discord servers
- Target: Top 5 product of the day (needs 300-500+ upvotes)

**Expected results from a good PH launch:**
- 2,000-10,000 website visits
- 200-1,000 signups (10% conversion rate)
- Press/blog pickup
- Permanent backlinks (good for SEO)

#### 5. Hacker News "Show HN"

**Post between 8-10 AM ET on a weekday.**

**Title format that works**: "Show HN: I built a gaming social platform with Next.js 16, Supabase, and LiveKit"

**What HN values:**
- Technical depth (talk about your architecture decisions)
- Open discussion about challenges
- Respond to every comment

**What HN hates:**
- Marketing speak
- "Revolutionary" or "disrupting" language
- Asking for upvotes

---

## Phase 3: 1,000 to 10,000 Users (Month 4-8)

### Strategy: Community Flywheel + Partnerships

At 1,000 users, you have real communities forming. Now amplify.

#### 1. Ambassador Program

Recruit 20-50 "Community Ambassadors" — active users who evangelize ggLobby.

**What they get:**
- Exclusive "Ambassador" badge/title (you already have the badge system)
- Early access to new features
- Direct line to you for feedback
- Monthly GG$ bonus (virtual currency)
- Their profile featured in "Featured Gamers" section

**What they do:**
- Invite 5+ friends per month
- Create 2+ LFG posts or blog posts per month
- Moderate their game-specific community
- Report bugs and provide feedback

**How to select them:** Look at your analytics for users with highest engagement (most posts, most friends added, most time spent). Reach out personally.

#### 2. Game Publisher/Developer Partnerships

Once you have 5,000+ users, you become interesting to game publishers.

**What to offer them:**
- "Official Community" status for their game on ggLobby
- Dedicated LFG matching for their game
- Tournament infrastructure for community events
- Analytics on their player community

**What to ask for:**
- In-game rewards for ggLobby users (exclusive skins, titles)
- Co-marketing (mention on their social media, website)
- API access for better stat tracking
- Featured in their community resources page

**Start with indie game studios** — they're more accessible and grateful for community support. Target games launching in the next 3-6 months that need community building.

#### 3. Gaming Event Presence

| Event Type | Cost | Strategy |
|-----------|------|----------|
| Local LAN parties | $0-50 | Show up with a laptop, demo ggLobby, get people to sign up on the spot |
| College esports events | $0-100 | Partner with college esports clubs. Offer free "Clan Setup" for their team on ggLobby |
| Online gaming tournaments | $0 | Host tournaments ON ggLobby using your tournament system |
| Gaming conventions | $200-2000 | Only when budget allows. Have a booth with quick signup QR code |

#### 4. Cross-Platform Content Syndication

Your blog posts should appear everywhere:

- Republish on Medium (with canonical link back to ggLobby)
- Share on LinkedIn (gaming industry professionals, esports job seekers)
- Post on IndieHackers (growth updates)
- Submit to gaming news aggregators (GameSpot community, DualShockers tips section)

---

## Phase 4: 10,000 to 100,000 Users (Month 8-18)

### Strategy: Paid Acquisition + Mobile + Viral Loops

At 10K users, you likely have revenue from premium subscriptions. Reinvest into growth.

#### 1. Paid Advertising (When Budget Allows)

| Channel | CPC | Best For | Monthly Budget |
|---------|-----|----------|----------------|
| Reddit Ads (gaming subreddits) | $0.50-2.00 | Targeted gamers by game interest | $500-1,000 |
| TikTok Ads | $0.50-1.50 | Young gamers, viral creative | $500-2,000 |
| Google Ads (search) | $1.00-3.00 | High-intent "find teammates" queries | $300-1,000 |
| Discord Ads (if available) | Varies | Direct gaming audience | $200-500 |
| Instagram/Facebook | $0.80-2.50 | Broader gaming audience | $300-800 |

**Do NOT start paid ads until you have:**
- A proven conversion funnel (user lands > signs up > completes profile > adds friend)
- At least 20% day-7 retention rate
- Understanding of your CAC (Customer Acquisition Cost) vs LTV (Lifetime Value)

#### 2. Mobile App Launch

Your Expo app (`mobile/app.json`, bundle: `com.gglobby.mobile`) is scaffolded. Polish and launch it.

**App Store Optimization:**

*Apple App Store:*
- Title (30 chars): "ggLobby - Find Game Teammates"
- Subtitle (30 chars): "LFG, Clans & Gamer Profiles"
- Keywords (100 chars): `lfg,find teammates,gaming friends,gamer,valorant,cs2,dota,clan,esports,team finder,gaming social`
- Category: Social Networking (primary), Games (secondary)

*Google Play Store:*
- Title (50 chars): "ggLobby: LFG & Gaming Friends"
- Short description (80 chars): "Find teammates, join clans, and build your gamer profile. LFG made easy."
- Full description: Keyword-rich, include all supported game names

**Both stores:**
- Target 4.5+ star rating (below 4.0 you won't show in search)
- Respond to every review (stores factor this into ranking)
- Update screenshots each season

#### 3. Viral Mechanics (Built Into the Product)

Features you already have that can drive virality — make sure they work well:

| Feature | Viral Mechanic | How to Amplify |
|---------|---------------|----------------|
| Clan invites | Users invite friends to join their clan | Add "Share Clan" link that generates a preview card |
| LFG posts | Users share posts outside ggLobby | Add "Share to Discord/Twitter" with rich preview |
| Gamer profiles | Users show off their profiles | Add "Share Profile Card" that generates a beautiful image |
| Blog posts | Authors share their articles | Social share buttons (already built) |
| Tournament brackets | Participants share results | Add "Share Tournament Results" with bracket image |
| Leaderboards | Top players share ranking | Add "Share Ranking" with shareable position card |

**The single highest-impact viral feature**: A shareable "Gamer Card" — a beautiful image of your profile (stats, rank, badges) that users post on Twitter, Discord, and Instagram. Make it look so good that people WANT to share it.

#### 4. Referral Program

At 10K users, implement a formal referral system:

- **User invites friend > friend signs up > both get 500 GG$**
- **User invites friend > friend reaches level 5 > inviter gets a rare badge**
- Track referral source to understand which channels work
- Leaderboard: "Top Recruiters This Month" with exclusive rewards

---

## Metrics to Track at Each Stage

| Stage | Key Metrics | Target |
|-------|------------|--------|
| 0-100 users | Signups per day, profile completion rate, first action after signup | 3-5 signups/day, 60%+ completion |
| 100-1K | DAU/MAU ratio, D7 retention, friends added per user | 20%+ DAU/MAU, 25%+ D7 retention |
| 1K-10K | Organic vs paid signups, CAC, feature usage distribution | 50%+ organic, CAC < $5 |
| 10K-100K | LTV, churn rate, viral coefficient, revenue per user | LTV > 3x CAC, K-factor > 0.5 |

### Retention Warning Signs

If you see these, fix them before scaling:

| Signal | Problem | Fix |
|--------|---------|-----|
| Users sign up but never complete profile | Onboarding too long or confusing | Simplify to 2 steps max |
| Users complete profile but never return | Nothing to do after signup | Send "Your first teammate match" email within 1 hour |
| Users add friends but stop engaging | Feed is empty/boring | Seed content, add daily quests |
| Users are active for a week then disappear | Novelty wore off, no habit loop | Implement daily login rewards, streak badges |

---

## What NOT to Do

1. **Don't try to compete with Discord directly** — Position as "the platform you use TO find people, then you play together on Discord/in-game." Discord is infrastructure; ggLobby is discovery.

2. **Don't buy followers/fake signups** — Inflated numbers destroy your ability to measure real traction. Investors will also see through it instantly.

3. **Don't launch on all games at once** — Depth > breadth. 100 active Valorant users is better than 10 users each across 10 games.

4. **Don't spend money on marketing before product-market fit** — If users aren't retaining organically, paid acquisition just burns cash faster.

5. **Don't ignore negative feedback** — Early users who complain are telling you what to fix. Users who silently leave tell you nothing.

---

*Key takeaway: ggLobby's growth will come from being the BEST place to find gaming teammates for 2-3 specific games, not from being an "everything platform" on day one.*
