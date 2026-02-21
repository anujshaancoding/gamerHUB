# 05 - Monetization Strategy

> What to charge for, what stays free forever, and when to start making money. Based on what actually works in gaming communities.

---

## The Golden Rule

**Never paywall social features.** The moment you charge for messaging, finding teammates, or joining clans, users leave. The value of a social platform IS the network — every paid wall shrinks the network.

**What works in gaming**: Free social + premium cosmetics + battle pass. This is the model that Discord, Fortnite, and every successful F2P game uses.

---

## Revenue Model: The ggLobby Approach

### Free Tier (Forever Free)

Everything that makes the platform useful must stay free:

| Feature | Why It's Free |
|---------|--------------|
| Create profile & showcase games | Core identity — can't paywall identity |
| Find teammates (LFG) | Core value proposition |
| Join/create clans (up to 50 members) | Network building |
| Direct messaging | Social infrastructure |
| Voice/video calls | Can limit minutes later, but core must be free |
| Blog/content publishing | Content creators bring users |
| News & community feed | Engagement driver |
| Friend system | Network growth |
| Basic badges & progression | Gamification keeps users engaged |
| Community forums | UGC is free content |
| Tournaments (join/spectate) | Competitive draw |
| 3 daily quests | Engagement loop |

### Premium Tier: "ggLobby Pro" ($4.99/month or $39.99/year)

Cosmetic and convenience features — things users WANT but don't NEED:

| Feature | Why Users Pay |
|---------|--------------|
| **Animated profile banner** | Flex/status symbol |
| **Custom profile themes** (you have 6 palettes) | Personalization |
| **Exclusive profile frames** (you have frame system) | Visual distinction |
| **Exclusive titles** (you have title system) | Status |
| **Priority in LFG matching** | Convenience (NOT blocking free users from matching) |
| **Extended clan size** (up to 200 members) | Convenience for serious clans |
| **Ad-free experience** (if ads are introduced) | Quality of life |
| **Custom clan badges** | Clan pride |
| **Unlimited blog templates** | Creator enhancement |
| **Advanced analytics** (profile views, engagement stats) | Curiosity/ego |
| **Pro badge** next to username | Most powerful motivator — visible status |
| **Early access to new features** | Exclusivity |
| **5 daily quests** (instead of 3) | More progression |
| **Monthly GG$ bonus** (500 GG$) | Virtual currency top-up |

**Pricing psychology:**
- $4.99/month is the sweet spot — same as Discord Nitro Basic
- $39.99/year ($3.33/month effective) — 33% discount drives annual commitments
- Annual subscribers churn 60% less than monthly

### Battle Pass: Seasonal ($7.99 per season, ~3 months)

You already have the battle pass system built (`src/app/api/battle-pass/`).

| Tier | Rewards | Notes |
|------|---------|-------|
| Free track (20 tiers) | Basic badges, small GG$ rewards, common titles | Keeps free users engaged |
| Premium track (20 tiers) | Exclusive animated badges, rare frames, themed profile effects, large GG$ rewards | The paid content |
| Premium+ (bonus 10 tiers) | Ultra-rare cosmetics, "Season X Veteran" title | For completionists |

**Battle pass economics:**
- Content needed: ~50 unique rewards per season (mix of badges, titles, frames, GG$, themes)
- Revenue at 5% purchase rate: 10K users × 5% × $7.99 = $3,995/season
- Revenue at 10% purchase rate: 10K users × 10% × $7.99 = $7,990/season

**Keys to a successful battle pass:**
1. Free track must feel generous (users should feel they're missing out, not locked out)
2. Premium rewards must be visually impressive and exclusive
3. Season themes tied to real game events (e.g., "Valorant Champions Season" when VCT happens)
4. FOMO: Rewards expire when season ends — if you didn't earn them, they're gone forever

### Virtual Currency Store (GG$)

You already have the wallet system (`src/app/api/wallet/`) and shop (`src/app/api/shop/`).

| Currency Pack | Price | GG$ | Bonus |
|--------------|-------|-----|-------|
| Starter | $0.99 | 100 | — |
| Popular | $4.99 | 550 | +10% |
| Value | $9.99 | 1,200 | +20% |
| Mega | $24.99 | 3,500 | +40% |

**What GG$ buys:**
- Individual cosmetic items (badges, frames, themes): 100-500 GG$
- Profile effects (animated elements): 200-800 GG$
- Clan upgrades: 500-1,000 GG$
- Gift items to friends: Any item price
- Tournament entry fees (for prize pool tournaments): 50-200 GG$

**Psychology:** Players who spend any money (even $0.99) are 10x more likely to spend again. The $0.99 pack is a loss leader designed to convert free users into spenders.

### Clan Subscriptions ($9.99/month per clan)

For clan leaders who want advanced management:

| Feature | Free Clan | Pro Clan |
|---------|-----------|----------|
| Members | 50 max | 200 max |
| Clan challenges | 1 active | Unlimited |
| Clan analytics | Basic | Advanced (member activity, growth) |
| Custom clan page theme | No | Yes |
| Recruitment posts | 1 active | 5 active |
| Clan tournaments | Join only | Create & host |
| Clan Discord integration | No | Yes |
| Clan badge customization | No | Yes |

---

## When to Introduce Each Revenue Stream

| Milestone | Revenue Stream | Why This Timing |
|-----------|---------------|-----------------|
| **1,000 WAU** | Premium subscription (Pro) | You have engaged users. Start with cosmetics only. |
| **2,500 WAU** | Virtual currency (GG$) | Users understand the value of in-app items |
| **5,000 WAU** | Battle Pass (Season 1) | Enough content to fill 50 reward tiers |
| **10,000 WAU** | Clan subscriptions | Clans are established, leaders want more |
| **25,000 WAU** | Sponsored LFG posts | Game publishers want to reach your audience |
| **50,000 WAU** | Creator monetization | Creators can earn from their content |

**WAU = Weekly Active Users (not registered users)**

---

## Revenue Projections

### Conservative Estimates

| Users (MAU) | Pro Subs (5%) | Battle Pass (8%) | GG$ (3%) | Other | Total Monthly |
|-------------|--------------|-------------------|----------|-------|---------------|
| 1,000 | $250 | — | — | — | **$250** |
| 5,000 | $1,250 | $1,200 | $750 | — | **$3,200** |
| 10,000 | $2,500 | $2,400 | $1,500 | $500 | **$6,900** |
| 25,000 | $6,250 | $6,000 | $3,750 | $2,000 | **$18,000** |
| 50,000 | $12,500 | $12,000 | $7,500 | $5,000 | **$37,000** |
| 100,000 | $25,000 | $24,000 | $15,000 | $15,000 | **$79,000** |

**Assumptions:**
- Pro conversion rate: 5% of MAU (Discord achieves ~5% for Nitro)
- Battle Pass purchase: 8% of MAU per season (Fortnite achieves 10-15%, but they have a bigger game)
- GG$ spend rate: 3% of MAU buying ~$5/month average
- Other: Clan subs, sponsored content, creator revenue share

### ARPU (Average Revenue Per User) Benchmarks

| Platform | ARPU | Notes |
|----------|------|-------|
| Discord | ~$1.30/month | ~5% subscribe at $9.99/month |
| Fortnite | ~$2.50/month | Battle pass + item shop |
| Roblox | ~$1.80/month | Robux purchases |
| **ggLobby target** | **$0.50-1.50/month** | Conservative start, grow with content |

---

## What NOT to Monetize

| Feature | Why It Should Stay Free |
|---------|----------------------|
| Basic messaging | Paywalling communication kills the platform |
| Finding teammates | Core value proposition — must be free |
| Profile creation | Identity is the foundation |
| Joining clans | Network growth depends on this |
| Basic badges/progression | Engagement loop that drives retention |
| Content publishing | Creators bring users; don't charge creators |
| Public profiles | SEO value — Google indexes these |
| News reading | Content consumption drives engagement |

---

## Advertising (Handle With Care)

**When**: Only after 50,000 MAU. Before that, ad revenue is negligible and the UX cost is high.

**What works for gaming platforms:**

| Ad Type | Revenue | UX Impact | Recommendation |
|---------|---------|-----------|---------------|
| Banner ads | $0.50-2.00 CPM | HIGH — looks cheap | Avoid |
| Sponsored LFG posts | $5-20 CPM | LOW — feels native | Yes, after 25K users |
| Sponsored tournaments | Flat fee $500-5K | LOW — adds value | Yes, after 10K users |
| Game launch promotions | Flat fee $200-2K | MEDIUM | Yes, if curated |
| Pre-roll on clips | $3-8 CPM | MEDIUM | Maybe, after 50K users |

**The best gaming ad format**: "Sponsored by [Game Publisher]" on tournaments and challenges. The sponsor ADDS value (prize pool, exclusive rewards) instead of interrupting the experience.

---

## Stripe Integration Checklist

Your Stripe integration (`src/app/api/stripe/`) is already built. Verify these are configured:

- [ ] Products created in Stripe Dashboard:
  - ggLobby Pro Monthly ($4.99/month, recurring)
  - ggLobby Pro Annual ($39.99/year, recurring)
  - Battle Pass Season X ($7.99, one-time)
  - GG$ packs (4 one-time products)
  - Clan Pro ($9.99/month, recurring)
- [ ] Webhook endpoint handles these events:
  - `checkout.session.completed` — Grant premium access
  - `customer.subscription.deleted` — Remove premium access
  - `customer.subscription.updated` — Handle plan changes
  - `invoice.payment_failed` — Grace period logic
- [ ] Billing portal access for users to manage subscriptions
- [ ] Coupon system for promotional discounts (you have `src/app/api/coupons/`)

---

## Key Metrics to Track

| Metric | Formula | Target |
|--------|---------|--------|
| **Conversion rate** | Paying users / MAU | 5-10% |
| **ARPU** | Total revenue / MAU | $0.50-1.50 |
| **MRR** | Monthly Recurring Revenue | Track growth rate |
| **Churn rate** | Cancellations / Active subs | < 5% monthly |
| **LTV** | ARPU × Average lifespan (months) | > 3× CAC |
| **CAC** | Marketing spend / New users | < $5 initially |
| **Payback period** | CAC / ARPU | < 3 months |

---

*The #1 monetization mistake for social platforms: monetizing too early. The #2 mistake: never monetizing at all. ggLobby should monetize at ~1,000 WAU with cosmetics-only Pro tier, then expand revenue streams as the community grows.*
