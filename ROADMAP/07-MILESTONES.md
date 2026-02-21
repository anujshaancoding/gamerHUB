# 07 - Milestones

> The master timeline. What to do, when, and how to measure success. Organized by user count — because user milestones matter more than calendar dates.

---

## How to Read This Timeline

Each milestone has:
- **Trigger**: When to start this phase (user count or event)
- **Goals**: What you're trying to achieve
- **Actions**: Specific things to do
- **Metrics**: How to measure success
- **Exit criteria**: What must be true before moving to the next phase
- **Budget**: Expected monthly cost

---

## Milestone 0: Pre-Launch (Now — Before First User)

**Trigger**: Code is built, not yet deployed

**Duration**: 1-2 weeks of focused work

### Goals
- Get legally ready to accept users
- Fix critical technical issues
- Prepare marketing materials
- Deploy to production

### Actions

**Week 1 — Legal & Technical**
| # | Task | Time | Priority |
|---|------|------|----------|
| 1 | Write Privacy Policy (use Termly.io generator + customize) | 2 hours | BLOCKER |
| 2 | Write Terms of Service | 2 hours | BLOCKER |
| 3 | Write Community Guidelines | 1 hour | BLOCKER |
| 4 | Add age gate (13+ DOB check) to registration | 1 hour | BLOCKER |
| 5 | Register domain (gglobby.com or .gg) | 30 min | BLOCKER |
| 6 | Deploy to Vercel, configure env vars | 1 hour | BLOCKER |
| 7 | Fix SELECT * in top 5 list API routes | 2 hours | HIGH |
| 8 | Add `sitemap.ts` and `robots.ts` | 1 hour | HIGH |
| 9 | Add per-page metadata to all public routes | 2 hours | HIGH |
| 10 | Fix duplicate Realtime channels in chat | 30 min | HIGH |

**Week 2 — Content & Marketing Prep**
| # | Task | Time | Priority |
|---|------|------|----------|
| 11 | Register Google Search Console + submit sitemap | 30 min | HIGH |
| 12 | Register Bing Webmaster Tools | 15 min | HIGH |
| 13 | Write 3 seed blog posts (SEO-targeted for launch games) | 4 hours | HIGH |
| 14 | Create 3 seed clans for launch games | 30 min | HIGH |
| 15 | Create OG image (1200x630) for social sharing | 1 hour | MEDIUM |
| 16 | Take 5-6 polished screenshots for marketing | 1 hour | MEDIUM |
| 17 | Create accounts: Reddit, TikTok, Twitter/X, IndieHackers | 1 hour | MEDIUM |
| 18 | Full smoke test of critical flows | 2 hours | HIGH |
| 19 | Enable beta feedback widget | 15 min | HIGH |
| 20 | Set up Sentry (free) for error monitoring | 30 min | MEDIUM |

### Metrics
- [ ] All BLOCKER items complete
- [ ] Production deployment stable (no 500 errors for 24 hours)
- [ ] Registration flow works end-to-end
- [ ] Google Search Console verified

### Budget: $1/month (domain only)

### Exit Criteria
All blockers resolved. Site is live. You can register, create a profile, find gamers, join a clan, and send a message without errors.

---

## Milestone 1: First 100 Users

**Trigger**: Site is live

**Duration**: 4-8 weeks

### Goals
- Validate that people actually want this
- Get qualitative feedback
- Find product-market fit signal for one specific use case
- Zero marketing budget — all organic

### Actions

**Community Building (Ongoing)**
| Action | Frequency | Channel |
|--------|-----------|---------|
| Be active on r/GamerPals, r/VALORANT, r/GlobalOffensive | Daily, 30 min | Reddit |
| Join 10-20 Discord servers for target games, participate genuinely | Daily, 30 min | Discord |
| Post development journey content | 3x/week | TikTok/Shorts |
| Message 5 clan/guild leaders per week about ggLobby | Weekly | Discord DMs |
| Ask every user for direct feedback | Every signup | In-app + DMs |
| Message personal network asking for beta testers | Once | WhatsApp/Telegram |

**Product Improvements Based on Feedback**
| Priority | Focus |
|----------|-------|
| 1 | Fix every bug users report within 24 hours |
| 2 | Improve whatever feature users ask for most |
| 3 | Remove/hide features nobody uses (simplify the UI) |
| 4 | Make onboarding faster based on drop-off data |

### Metrics to Track
| Metric | Target | How to Measure |
|--------|--------|---------------|
| Total signups | 100 | Supabase auth dashboard |
| Profile completion rate | > 60% | Custom query: profiles with avatar + 1 game |
| D7 retention | > 20% | Users active 7 days after signup |
| First action after signup | Track what users do first | PostHog event tracking |
| Feedback submissions | > 20 | beta_feedback table count |
| NPS or qualitative sentiment | "Would you recommend?" | Ask directly |

### Key Questions to Answer
1. **Which game's users are most engaged?** (Focus there)
2. **What is the #1 thing users do after signing up?** (Double down on it)
3. **Why do users leave?** (Ask churned users directly)
4. **Is the LFG system being used?** (Core value prop validation)

### Budget: $26/month (Supabase Pro + domain)

### Exit Criteria
- 100 registered users
- At least 20 users who returned after day 1
- Clear understanding of which game's community engages most
- At least 5 pieces of qualitative feedback that confirm value

---

## Milestone 2: First 1,000 Users

**Trigger**: 100 users reached + D7 retention > 20%

**Duration**: 2-4 months

### Goals
- Prove organic growth (not just your personal network)
- Achieve 20%+ DAU/MAU ratio
- Launch first revenue stream
- Establish content marketing engine

### Actions

**Growth**
| Action | When |
|--------|------|
| Post "Show HN" on Hacker News | Month 1 |
| Launch on Product Hunt | Month 2 (after polishing based on feedback) |
| Post on IndieHackers (product page + first growth update) | Month 1 |
| Publish 2 SEO blog posts per week | Ongoing |
| Reach out to 5 micro-influencers (Twitch streamers, 10-50 viewers) | Month 2 |
| Host first community tournament on ggLobby | Month 2 |
| Start ambassador program (recruit 10 active users) | Month 3 |

**Product**
| Action | When |
|--------|------|
| Implement cookie consent banner (GDPR) | Month 1 |
| Add "Download My Data" and "Delete Account" flows | Month 1 |
| Switch to cursor-based pagination on highest-traffic endpoints | Month 2 |
| Add view count deduplication | Month 1 |
| Optimize onboarding based on drop-off data | Month 2 |

**Monetization**
| Action | When |
|--------|------|
| Launch ggLobby Pro ($4.99/month) — cosmetics only | At 1,000 WAU |
| Create 10 premium profile items (frames, themes, titles) | Before Pro launch |
| Set up Stripe products and webhook handling | Before Pro launch |

### Metrics to Track
| Metric | Target | Why |
|--------|--------|-----|
| MAU | 1,000 | Growth |
| DAU/MAU ratio | > 20% | Engagement quality |
| D7 retention | > 25% | Stickiness improving |
| Organic signups (non-referral) | > 30% of total | Real discovery |
| Blog traffic | > 500 visits/month | SEO working |
| LFG posts created | > 100/month | Core feature adoption |
| Clans with 5+ active members | > 10 | Community forming |
| Pro conversion | 3-5% of MAU | Revenue validation |
| MRR | > $150 | Covers infrastructure costs |

### Budget: $55/month (Supabase Pro + Vercel Pro + domain)

### Exit Criteria
- 1,000 registered users, 200+ monthly active
- DAU/MAU > 20%
- Organic growth visible (users you didn't directly recruit)
- First paying customers
- MRR > $0

---

## Milestone 3: 10,000 Users

**Trigger**: 1,000 MAU + DAU/MAU > 20% + positive revenue

**Duration**: 4-6 months

### Goals
- Establish ggLobby as the go-to LFG platform for your target games
- Reach sustainable revenue (costs fully covered by subscriptions)
- Build a community that grows on its own (viral coefficient > 0.3)
- Begin mobile app launch

### Actions

**Growth & Marketing**
| Action | Budget |
|--------|--------|
| Reddit Ads targeting gaming subreddits | $500/month |
| TikTok Ads (short-form video) | $500/month |
| Partner with 10-20 micro-streamers | $100-200/month |
| Host monthly tournaments with prizes | $200/month in GG$ prizes |
| Expand ambassador program to 50 users | Free (GG$ rewards) |
| Guest posts on gaming blogs | Free |
| Launch referral program (invite friend → both get 500 GG$) | Cost of GG$ earned |

**Product**
| Action | When |
|--------|------|
| Launch Battle Pass Season 1 | Month 1 |
| Launch GG$ currency store | Month 2 |
| Launch Clan Pro subscriptions | Month 3 |
| Add shareable "Gamer Card" (viral mechanic) | Month 1 |
| Implement background job system | Month 2 |
| Add Postgres full-text search | Month 1 |
| Scope presence channel for performance | Month 1 |
| Polish and launch mobile app (iOS + Android) | Month 3-4 |

**Operational**
| Action | When |
|--------|------|
| Commission legal review of Privacy Policy + ToS ($500-2K) | Month 1 |
| Set up automated content moderation (basic profanity filter) | Month 2 |
| Hire part-time community manager (if budget allows) | Month 3 |
| Set up DMCA process | Month 2 |

### Metrics to Track
| Metric | Target | Why |
|--------|--------|-----|
| MAU | 10,000 | Growth |
| DAU/MAU | > 25% | Deepening engagement |
| D30 retention | > 15% | Long-term stickiness |
| Viral coefficient (K-factor) | > 0.3 | Each user brings 0.3 new users |
| MRR | > $3,000 | Sustainable revenue |
| Pro conversion | 5% | Maturing monetization |
| Battle Pass purchase rate | 8% | Seasonal revenue |
| App Store rating | 4.5+ | Mobile quality |
| CAC (if running ads) | < $5 | Efficient acquisition |
| SEO traffic | > 5,000 visits/month | Content engine working |
| Blog posts published | > 50 total | Content library |

### Budget: $200-400/month (infrastructure) + $1,000-1,500/month (marketing)

### Exit Criteria
- 10,000 MAU
- MRR > $3,000 (profitable)
- Viral coefficient > 0.3
- Mobile app live and rated 4.5+
- Community self-moderating (ambassadors handling basic issues)

---

## Milestone 4: 50,000 Users

**Trigger**: 10K MAU + profitable + mobile app live

**Duration**: 6-12 months

### Goals
- Become the default LFG platform for your top 3 games
- Establish multiple revenue streams
- Build a team (at least part-time)
- Explore game publisher partnerships

### Actions

**Growth**
- Increase ad budget to $3,000-5,000/month across Reddit, TikTok, Google
- Launch in new game communities (expand from 3 to 8-10 games)
- Partner with college esports clubs (free clan setup for every college team)
- Attend/sponsor 2-3 gaming events per year
- Launch creator monetization (content creators earn from their guides)

**Product**
- Implement event-driven architecture (decouple write operations)
- Add read replicas or upgrade Supabase tier
- Implement image CDN pipeline (Bunny CDN or Cloudflare Images)
- Add sponsored tournament system
- Launch "Verified Pro" program for known competitive players
- Add regional communities (expand beyond English-speaking markets)

**Team**
- Hire community manager (full-time or part-time)
- Hire content creator/social media manager
- Consider co-founder for marketing/business side

### Budget: $1,000-2,000/month (infrastructure) + $5,000-10,000/month (marketing + team)

### Exit Criteria
- 50,000 MAU
- MRR > $18,000
- 3+ revenue streams active
- Team of at least 2-3 (you + community + content)
- At least 1 game publisher partnership

---

## Milestone 5: 100,000+ Users

**Trigger**: 50K MAU + $18K+ MRR + team in place

**Duration**: Ongoing

### Goals
- Sustain growth and profitability
- Evaluate funding (if needed for acceleration)
- Build competitive moat through data and community
- Expand internationally

### Actions
- Evaluate Series A fundraise ($500K-2M) if growth justifies it
- Hire engineering team (2-3 developers)
- Implement microservices for high-traffic features (chat, feed, matchmaking)
- Add AI-powered features (smarter matchmaking, content recommendations)
- Explore game API integrations for live stats
- Launch official API for third-party developers
- Build competitive intelligence (track Guilded, GameTree, Discord alternatives)
- Consider acquisition opportunities or being acquired

### Budget: $3,000-5,000/month (infrastructure) + team salaries

---

## The Decision Points

At each milestone, you face strategic decisions. Here's a framework:

### At 1,000 Users
| Decision | Option A | Option B |
|----------|----------|----------|
| Go full-time? | Keep day job, build on side | Quit and go all-in |
| **Recommendation** | Keep day job until MRR covers living expenses or you raise funding |

### At 10,000 Users
| Decision | Option A | Option B |
|----------|----------|----------|
| Raise money? | Bootstrap (slower, keep 100% equity) | Raise pre-seed ($100-300K for 10-15% equity) |
| **Recommendation** | Bootstrap if MRR > $5K. Raise if growth rate > 20% MoM and you want to accelerate |

### At 50,000 Users
| Decision | Option A | Option B |
|----------|----------|----------|
| Build vs buy? | Build all features in-house | Acquire smaller tools/communities |
| Scale infrastructure? | Stay on managed services | Move to self-hosted for cost savings |
| **Recommendation** | Depends on revenue and team. Managed services save time; self-hosted saves money |

### At 100,000 Users
| Decision | Option A | Option B |
|----------|----------|----------|
| Stay indie? | Bootstrap, stay small team, high margins | Raise Series A, hire aggressively, chase scale |
| **Recommendation** | Depends on your personal goals. Both are valid paths |

---

## Summary: The Roadmap at a Glance

```
NOW          MONTH 1-2      MONTH 3-5      MONTH 6-10     MONTH 12-18    MONTH 18+
─────────────────────────────────────────────────────────────────────────────────────

PRE-LAUNCH   FIRST 100      FIRST 1K       FIRST 10K      FIRST 50K      100K+
$1/mo        $26/mo         $55/mo         $400/mo        $2K/mo         $4K/mo

Legal docs   Reddit         Product Hunt   Battle Pass    Paid ads       Series A?
Deploy       Discord        SEO blog       Mobile app     Publisher      Microservices
Fix bugs     Personal       HN/IH         Referrals      partnerships   International
Sitemap      network        Pro launch     Background     Creator $      AI features
Seed content Feedback       Ambassadors    jobs           Events         API platform
             loop           Cursor paging  Full-text      Team hiring

Revenue: $0  Revenue: $0    Revenue: $250  Revenue: $6.9K Revenue: $37K  Revenue: $79K+
```

---

## What Happens If Growth Stalls?

If you're not hitting milestone targets, diagnose:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Users sign up but don't return | Onboarding is broken or value isn't clear | Simplify, A/B test, ask users |
| Users are active but don't invite others | No viral mechanics or nothing worth sharing | Add shareable gamer cards, referral program |
| Lots of traffic but low signup rate | Landing page doesn't convert | A/B test copy, add social proof |
| Users love it but only for one feature | That's fine — double down on it | Make that one feature best in class |
| Revenue flat despite growing users | Monetization not visible enough or not valuable enough | Experiment with pricing, add more premium items |
| Can't break into new game communities | Each game community is different | Find a champion user in each game |

---

*The most important thing about this roadmap: It's a guide, not a contract. Adapt based on what your users actually tell you. The best plan is the one that responds to reality.*
