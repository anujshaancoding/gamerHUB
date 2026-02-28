# 06 - Costs & Budget

> Real dollar amounts for running ggLobby at every stage. Based on actual analysis of the codebase's infrastructure dependencies.

---

## ggLobby's Cost Drivers (Specific to Our Codebase)

Before looking at numbers, understand WHAT generates costs in our app:

| Cost Driver | Where in Code | Why It Matters |
|-------------|--------------|---------------|
| **Socket.io connections** | `PresenceProvider.tsx`, `useMessages.ts`, `chat-window.tsx`, `useNotifications.ts` | Every logged-in user opens 3-6 Socket.io channels |
| **API route invocations** | 150+ routes in `src/app/api/` | Each is a server-side API handler |
| **Media storage** | `src/lib/upload.ts` (avatars, banners, posts) | WebP compressed but accumulates |
| **Database size** | 100+ tables, messages, posts, feeds | Grows with user activity |
| **OpenAI calls** | Matchmaking (3 routes), translation | Per-token billing |
| **LiveKit (voice/video)** | `src/components/call/` | Per-minute billing |
| **Stripe fees** | `src/app/api/stripe/` | 2.9% + $0.30 per transaction |
| **Polling intervals** | 5s (replay/queue), 30s (notifications), 60s (streams) | Multiplied by concurrent users |

---

## Cost at Each Stage

### Stage 0: Development (Current — $5-15/month)

| Service | Tier | Cost |
|---------|------|------|
| VPS (app + DB + Socket.io) | Entry-level | $5-10/month |
| GitHub | Free | $0 |
| Domain (.com) | — | ~$12/year = $1/month |
| Cloudflare | Free | $0 |
| OpenAI | — | $0 (not active yet) |
| LiveKit | — | $0 (not active yet) |
| Stripe | — | $0 (no transactions) |
| **Total** | | **~$6-11/month** |

**VPS resource limits to watch:**
| Resource | Entry VPS Limit | Estimate When Hit |
|----------|----------------|-------------------|
| CPU/RAM | 2 vCPU / 4 GB | ~500-1,000 concurrent users |
| Disk | 40-80 GB SSD | ~5,000-10,000 active users (with media) |
| Bandwidth | 20 TB/month typical | Not a concern until very high scale |
| Socket.io connections | ~2,000-5,000 per server | ~500-1,500 concurrent users |

**The first limit you'll hit is CPU/RAM.** High concurrent users with Socket.io + PostgreSQL + Next.js will saturate a small VPS. This is your trigger to upgrade.

---

### Stage 1: Launch (0-1,000 Users — ~$25-50/month)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| VPS (app + DB + Socket.io) | Mid-tier (4 GB RAM) | $10-15/month | Handles Next.js + PostgreSQL + Socket.io |
| Domain | .com | $1/month | |
| Email (Resend) | Free | $0 | 100 emails/day, 3,000/month |
| Error monitoring (Sentry) | Free | $0 | 5K errors/month |
| Analytics (PostHog) | Free | $0 | 1M events/month |
| OpenAI | Pay-as-you-go | $5-15/month | Matchmaking + translation |
| LiveKit | Free tier | $0-10/month | 50 participant-minutes free |
| CDN (Cloudflare) | Free | $0 | DNS + CDN proxy |
| **Total** | | **$16-41/month** |

**When to upgrade VPS**: As soon as you have 100+ concurrent users regularly.

---

### Stage 2: Growing (1,000-10,000 Users — ~$80-200/month)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| VPS (app server) | 8 GB RAM | $15-25/month | Next.js + Socket.io |
| VPS (DB server) | 8 GB RAM | $15-25/month | Dedicated PostgreSQL |
| Redis server | Small | $5-10/month | Caching + Socket.io adapter |
| Domain | .com + .gg (optional) | $1-5/month | |
| Email (Resend) | Pro | $20/month | Higher volume |
| Error monitoring (Sentry) | Team | $26/month | More error quota |
| Analytics (PostHog) | Free | $0 | Still within 1M events |
| OpenAI | Moderate usage | $30-60/month | More matchmaking/translation |
| LiveKit | Pay-as-you-go | $20-50/month | $0.004/participant-minute |
| CDN (Cloudflare) | Free | $0 | |
| **Total** | | **$132-221/month typical** |

**Key decision point at 5K users**: Is revenue covering costs? If Pro subscriptions at 5% conversion = $1,250/month revenue vs ~$250/month costs, you're profitable.

---

### Stage 3: Scaling (10,000-50,000 Users — ~$200-600/month)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| VPS (app servers x2) | 16 GB RAM each | $50-100 | Load-balanced Next.js + Socket.io |
| VPS (DB server) | 16 GB RAM | $30-50 | Dedicated PostgreSQL with replicas |
| Redis server | Medium | $10-20 | Caching + queues + Socket.io adapter |
| Object storage (S3-compatible) | ~200 GB | $5-10 | Media files |
| Domain(s) | .com + .gg | $5 | |
| Email (Resend) | Business | $50-100 | |
| Error monitoring (Sentry) | Team | $26 | |
| Analytics (PostHog) | Paid | $0-50 | May need paid if > 1M events |
| OpenAI | Heavy usage | $80-200 | |
| LiveKit | Growth | $100-300 | Voice/video at scale |
| CDN (Bunny) | Standard | $10-30 | For global media delivery |
| **Total** | | **$366-891/month typical** |

---

### Stage 4: Scale (100,000+ Users — ~$800-2,500/month)

| Service | Cost Range | Notes |
|---------|-----------|-------|
| VPS cluster (app + DB + workers) | $200-600 | Multiple servers, load balanced |
| Managed PostgreSQL (optional) | $100-300 | For HA and automated backups |
| Redis cluster | $30-80 | High availability |
| OpenAI | $200-500 | Cache aggressively to reduce |
| LiveKit | $500-2,000 | Major cost at scale |
| Email | $100-200 | High volume transactional |
| CDN (Bunny/Cloudflare Pro) | $30-100 | |
| Monitoring stack | $100-200 | Sentry + PostHog + Grafana |
| **Total** | **$1,260-3,980/month** |

**Revenue at this scale** (conservative): $79,000/month. Costs are ~2-6% of revenue.

---

## The Cheapest Possible Path

If bootstrapping on a very tight budget:

### Absolute Minimum Stack ($6-10/month)

| Service | Cost | Trade-off |
|---------|------|-----------|
| Entry VPS (2 vCPU, 2 GB RAM) | $5/month | Limited concurrent users |
| Cloudflare DNS | $0 | |
| Domain (.com) | $1/month | |
| **Total: $6/month** | | **Max ~50-100 concurrent users** |

### Budget Stack for Launch ($14-25/month)

| Service | Cost | Notes |
|---------|------|-------|
| Hetzner CX31 (app + DB) | $8/month | 2 vCPU, 8 GB RAM, 80 GB SSD |
| Hetzner CX21 (DB) | $5/month | 2 vCPU, 4 GB RAM, 40 GB SSD |
| Coolify (PaaS) | $0 | Self-hosted deployment manager |
| Cloudflare Free | $0 | CDN + DNS + SSL |
| Domain | $1 | |
| Resend Free | $0 | 100 emails/day |
| Sentry Free | $0 | 5K errors |
| PostHog Free | $0 | 1M events |
| **Total: $14/month** | | **Handles up to ~5,000-10,000 users** |

**Trade-off**: You manage your own infrastructure. DIY backups. If the server goes down at 3 AM, you fix it. But you have full control and no vendor limits.

---

## Third-Party Service Costs Deep Dive

### OpenAI (Currently Used For Matchmaking + Translation)

| Model | Input Cost | Output Cost | ggLobby Usage |
|-------|-----------|-------------|---------------|
| GPT-4o-mini | $0.15/1M tokens | $0.60/1M tokens | Matchmaking suggestions |
| GPT-4o | $2.50/1M tokens | $10.00/1M tokens | Complex analysis |

**Cost estimate per feature:**
- Teammate suggestion: ~500 input + 200 output tokens = $0.0002 per request
- Team balance analysis: ~1,000 input + 500 output tokens = $0.0005 per request
- Translation: ~200 input + 200 output tokens = $0.00015 per request

**At 10K MAU, ~5,000 AI requests/month** = ~$1-3/month (GPT-4o-mini)

**Optimization**: Cache AI responses. Same matchmaking query with same parameters should return cached result for 5 minutes.

### LiveKit (Voice/Video Calls)

| Tier | Cost | Included |
|------|------|----------|
| Free | $0 | 50 participant-minutes/month |
| Pay-as-you-go | $0.004/participant-minute | Unlimited |
| Growth | Custom | Volume discounts |

**Cost estimate:**
- Average call: 3 participants × 15 minutes = 45 participant-minutes
- 100 calls/month (1K users): 4,500 minutes = $18/month
- 1,000 calls/month (10K users): 45,000 minutes = $180/month

**Optimization**: Consider using Discord/in-game voice for group calls and reserving LiveKit for 1-on-1 or small group calls only.

### Stripe (Payment Processing)

| Fee Type | Rate |
|----------|------|
| Standard processing | 2.9% + $0.30 per transaction |
| International cards | +1.5% |
| Disputed charges | $15 per dispute |

**At $5K MRR**: ~$175/month in Stripe fees (3.5% effective rate)
**At $50K MRR**: ~$1,750/month in Stripe fees

**No way to avoid this** — it's the cost of accepting payments.

---

## Cost vs Revenue Break-Even Analysis

| Users (MAU) | Monthly Cost | Monthly Revenue (Conservative) | Profit/Loss |
|-------------|-------------|-------------------------------|-------------|
| 100 | $1 | $0 | -$1 |
| 500 | $26 | $0 | -$26 |
| 1,000 | $55 | $250 | +$195 |
| 2,500 | $100 | $1,000 | +$900 |
| 5,000 | $200 | $3,200 | +$3,000 |
| 10,000 | $400 | $6,900 | +$6,500 |
| 25,000 | $800 | $18,000 | +$17,200 |
| 50,000 | $1,500 | $37,000 | +$35,500 |
| 100,000 | $3,000 | $79,000 | +$76,000 |

**Break-even point**: ~800-1,000 MAU with 5% premium conversion rate.

**Key insight**: Infrastructure costs are NOT the bottleneck for ggLobby. Even at the most expensive stage, costs are < 5% of revenue. The real cost is your time and the opportunity cost of building vs marketing.

---

## Investment: Is External Funding Needed?

### Self-Funded (Bootstrapped) Path

| Phase | Duration | Monthly Cost | Total Investment |
|-------|----------|-------------|-----------------|
| Development (done) | — | $0 | Your time (most valuable asset) |
| Pre-launch prep | 1 month | $1 | $1 |
| Launch to 1K users | 3 months | $55/month | $165 |
| 1K to 10K users | 6 months | $200/month | $1,200 |
| **Total cash needed** | **~10 months** | | **~$1,366** |

**You do NOT need external investment to reach 10K users.** The total infrastructure cost from zero to 10K users is under $1,500 spread over 10 months.

### When External Funding Makes Sense

Only consider raising money if:
1. You want to hire people (designer, community manager, marketer)
2. You want to run paid advertising at scale
3. You want to quit your job to go full-time

| Hire | Monthly Cost (India/Remote) | When Needed |
|------|---------------------------|-------------|
| Part-time community manager | $300-800/month | At 5,000 users |
| Part-time content creator | $500-1,000/month | At 5,000 users |
| UI/UX designer (contract) | $1,000-3,000 one-time | Before launch |
| Full-time developer | $1,500-4,000/month | At 25,000+ users |

**If raising a seed round:** Gaming social platforms typically raise $100K-500K at pre-seed for 10-15% equity. This is only worth it if you want to go full-time and scale aggressively.

---

## Cost Optimization Checklist

Quick wins to reduce costs at any stage:

- [ ] **Fix global presence channel** — Single biggest Socket.io cost driver
- [ ] **Remove duplicate Socket.io subscriptions** — 50% less connection usage
- [ ] **Replace 5-second polling with Socket.io** — 6x fewer API calls
- [ ] **Cache OpenAI responses** — 80% fewer AI API calls
- [ ] **Add Cloudflare in front of everything** — Free CDN, reduces VPS bandwidth
- [ ] **Use PgBouncer for connection pooling** — Fewer DB connections, lower compute needs
- [ ] **Compress API responses** — Already using WebP for images, ensure gzip on API
- [ ] **Lazy load heavy components** — Reduce initial bundle, fewer serverless invocations

---

*Bottom line: ggLobby can launch and grow to 10K users on less than $200/month. The technology is not the expensive part — user acquisition is.*
