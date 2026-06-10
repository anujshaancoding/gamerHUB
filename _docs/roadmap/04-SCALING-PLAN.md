# 04 - Scaling Plan

> Technical scaling roadmap. What to optimize, when, and why. Based on actual analysis of ggLobby's codebase.

---

## Current Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│   Browser    │────>│           VPS (Self-Hosted)               │
│   (React)    │     │   Next.js SSR + API Routes               │
│              │     │   PostgreSQL (database)                   │
│   Mobile     │     │   Auth.js (authentication)               │
│   (Expo RN)  │     │   Socket.io (realtime)                   │
│              │     │   File Storage                            │
│   PWA        │     │                                          │
└─────────────┘     └──────────────────────────────────────────┘
                                                      │
                                              ┌───────┼───────┐
                                              │       │       │
                                           Stripe  LiveKit  OpenAI
```

**Current bottlenecks identified in the codebase:**

| Bottleneck | Location | Impact |
|-----------|----------|--------|
| SELECT * on list queries | 20+ API routes | Unnecessary data transfer, slow responses |
| Global presence channel | `PresenceProvider.tsx` | Every user's state sent to every user |
| Duplicate Realtime channels | `chat-window.tsx` + `useMessages.ts` | 2x connection usage per chat |
| 5-second polling | `useReplayRoom.ts`, `useVerifiedQueue.ts` | Excessive API calls |
| Redundant polling + realtime | `useNotifications.ts` | 30s polling AND realtime subscription |
| Offset-based pagination | Every list endpoint | O(n) scan at large offsets |
| No view deduplication | Blog/news view increment | Inflated counts, unnecessary DB writes |
| No background jobs | All routes synchronous | Slow responses, no retry on failure |
| Single-region media serving | VPS file storage | High latency for distant users |

---

## Stage 1: 0-1,000 Users (Do Now — Zero Cost)

These optimizations cost nothing and should be done before or immediately after launch.

### 1.1 Fix SELECT * in List Queries

**Problem**: Routes like `/api/blog`, `/api/feed`, `/api/clans` fetch all columns including heavy content bodies.

**Fix**: Add explicit `.select()` with only needed columns for list queries.

```typescript
// BEFORE (blog list route):
const { data } = await supabase
  .from('blog_posts')
  .select()  // SELECT * — pulls full HTML content
  .eq('status', 'published')

// AFTER:
const { data } = await supabase
  .from('blog_posts')
  .select('id, title, slug, excerpt, featured_image_url, category, tags, views_count, likes_count, comments_count, published_at, author:blog_authors(user_id, profiles(username, avatar_url))')
  .eq('status', 'published')
```

**Impact**: 80-90% reduction in list API payload size.

**Files to fix** (minimum):
- `src/app/api/blog/route.ts` (GET handler)
- `src/app/api/feed/route.ts`
- `src/app/api/clans/route.ts`
- `src/app/api/clan-challenges/route.ts`
- `src/app/api/coaches/route.ts`
- `src/app/api/admin/news/route.ts`
- All other routes with `.select()` or `.select("*")`

### 1.2 Deduplicate View Counting

**Problem**: Every page load fires `increment_blog_view()` RPC.

**Fix**: Check sessionStorage before incrementing.

```typescript
// In blog post page or hook:
const viewKey = `viewed_${slug}`;
if (!sessionStorage.getItem(viewKey)) {
  sessionStorage.setItem(viewKey, '1');
  supabase.rpc('increment_blog_view', { post_slug: slug });
}
```

**Impact**: ~80% reduction in view-count DB writes.

### 1.3 Remove Duplicate Realtime Channels

**Problem**: `chat-window.tsx` (lines ~71-153) opens Realtime channels that `useMessages.ts` (lines ~74-284) already opens.

**Fix**: Remove the duplicate subscriptions from `chat-window.tsx`. Let `useMessages.ts` be the single source of Realtime subscriptions for messaging.

**Impact**: 50% reduction in Realtime connection usage for chat.

### 1.4 Remove Redundant Polling

**Problem**: `useNotifications.ts` has both `refetchInterval: 30000` AND a Socket.io subscription. The Socket.io subscription already triggers refetches.

**Fix**: Remove the `refetchInterval` from the notifications query. The Socket.io subscription handles updates.

**Impact**: Eliminates ~2 API calls per minute per active user.

### 1.5 Reduce Aggressive Polling

**Problem**: `useReplayRoom.ts` and `useVerifiedQueue.ts` poll every 5 seconds.

**Fix**: Replace 5-second polling with Socket.io subscriptions for these tables, or increase interval to 30 seconds minimum.

**Impact**: 6x reduction in API calls for these features.

### 1.6 Add HTTP Cache Headers Consistently

**Problem**: You have a `cache-headers.ts` utility but it's not used on most routes.

**Fix**: Add cache headers to all GET API routes:

```typescript
// For public data (games, leaderboards, public profiles):
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' }
});

// For private data (user-specific):
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
});
```

---

## Stage 2: 1,000-10,000 Users (Plan Now, Implement at ~2K Users)

### 2.1 Switch to Cursor-Based Pagination

**Problem**: All list endpoints use `LIMIT/OFFSET`. At offset 10,000, Postgres scans and discards 10,000 rows.

**Fix**: Use cursor-based pagination with the last item's sort key.

```typescript
// BEFORE (offset-based):
const offset = parseInt(searchParams.get('offset') || '0');
const limit = parseInt(searchParams.get('limit') || '20');
query.range(offset, offset + limit - 1);

// AFTER (cursor-based):
const cursor = searchParams.get('cursor'); // last item's published_at
const limit = parseInt(searchParams.get('limit') || '20');
if (cursor) {
  query.lt('published_at', cursor);
}
query.order('published_at', { ascending: false }).limit(limit);
```

**Client-side** (React Query infinite query):
```typescript
useInfiniteQuery({
  queryKey: ['blog', 'posts'],
  queryFn: ({ pageParam }) =>
    fetch(`/api/blog?limit=20${pageParam ? `&cursor=${pageParam}` : ''}`),
  getNextPageParam: (lastPage) => {
    const posts = lastPage.data;
    return posts.length === 20 ? posts[posts.length - 1].published_at : undefined;
  },
});
```

**Impact**: O(1) pagination regardless of page depth.

### 2.2 Scope the Presence Channel

**Problem**: `PresenceProvider.tsx` creates a single `online-users` channel. Every user tracks presence on it. At 1,000 concurrent users, each sync event broadcasts ~1,000 user objects to all 1,000 users = 1M presence events per sync.

**Fix**: Replace global presence with scoped presence:

```typescript
// BEFORE: One channel for everyone
socket.join('online-users');

// AFTER: Per-page or per-friend-list channels
// Only track presence for users whose profiles are currently visible
socket.join(`presence:friends:${userId}`);
// Or per-page:
socket.join(`presence:page:${currentRoute}`);
```

**Impact**: 100x reduction in Socket.io message volume at 1,000 users.

### 2.3 Add On-Demand ISR Revalidation

**Problem**: Blog posts use `revalidate = 300` (5 min). Stale content for up to 5 minutes after updates.

**Fix**: Use on-demand revalidation when content changes:

```typescript
// In blog PATCH/DELETE handler:
import { revalidatePath } from 'next/cache';

// After successful update:
revalidatePath(`/blog/${slug}`);
revalidatePath('/blog'); // Revalidate list page too
```

**Impact**: Instant content freshness without polling.

### 2.4 Add Postgres Full-Text Search

**Problem**: Blog/user search likely uses ILIKE which cannot use indexes.

**Fix**: Add a tsvector column with a GIN index.

```sql
-- Migration: add_blog_search_vector.sql
ALTER TABLE blog_posts
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
) STORED;

CREATE INDEX idx_blog_search ON blog_posts USING GIN(search_vector);

-- Query:
SELECT * FROM blog_posts
WHERE search_vector @@ plainto_tsquery('english', $1)
ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC;
```

**Impact**: 10-100x faster search queries.

### 2.5 Add CDN for Media

**Problem**: VPS file storage serves from a single region. Users far from your VPS get slow image loads.

**Fix**: Put Cloudflare (free) in front of your VPS storage URLs.

1. Set up a CNAME subdomain: `media.gglobby.com` → your VPS media endpoint
2. Enable Cloudflare proxy (orange cloud)
3. Cloudflare will cache at 200+ edge locations worldwide
4. Your images already have `cacheControl: "31536000"` (1 year) which is perfect for CDN caching

**Impact**: 2-10x faster image loads globally. Free.

---

## Stage 3: 10,000-50,000 Users (Plan at 5K, Implement at 10K)

### 3.1 Background Job System

**Problem**: Everything is synchronous. Sending notifications, processing images, updating feeds — all block the API response.

**Options for your stack:**

| Approach | Cost | Complexity | Best For |
|----------|------|-----------|----------|
| Node.js cron (node-cron) | Free (self-hosted) | Low | Scheduled tasks (daily digests, cleanup) |
| PostgreSQL LISTEN/NOTIFY | Free (built-in) | Medium | Event-triggered work (database hooks) |
| BullMQ (Redis queues) | Free (self-hosted) | Medium | React to INSERT/UPDATE/DELETE events |
| Inngest (serverless queues) | Free tier: 25K events/month | Low | Complex workflows with retries |
| Trigger.dev | Free tier available | Medium | Background jobs with dashboard |

**Recommended approach**: PostgreSQL LISTEN/NOTIFY + BullMQ + node-cron on VPS.

```
User creates post
  → INSERT into blog_posts (synchronous, fast)
  → Database webhook fires (async)
  → Webhook calls /api/internal/on-post-created
  → That endpoint: sends notifications, updates feeds, etc.
```

**Impact**: API responses 50-80% faster. Failed side-effects can be retried.

### 3.2 Precomputed Feed Table

**Problem**: Feed is computed on every request by querying activity_feed + joining follows.

**Fix**: Fanout-on-write pattern.

```sql
-- New table: user_feed (precomputed)
CREATE TABLE user_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),    -- the reader
  activity_id UUID REFERENCES activity_feed(id), -- the content
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_feed_user_created
  ON user_feed(user_id, created_at DESC);
```

When someone creates an activity:
1. Get their followers list
2. Insert one row per follower into `user_feed`
3. Reading the feed = simple `SELECT * FROM user_feed WHERE user_id = $me ORDER BY created_at DESC`

**Impact**: Feed reads go from O(followers * activities) to O(1). Massive at scale.

### 3.3 Connection Pooling

**Problem**: Each request creates a new database connection. With 150+ API routes, high traffic creates connection storms.

**Fix**: Use PgBouncer or the built-in PostgreSQL connection pooling.

```typescript
// Use a pooled connection URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
});
```

Set up PgBouncer on the VPS for efficient connection pooling, especially under high concurrency.

### 3.4 Separate Read and Write API Logic

**Problem**: All routes mix GET/POST/PATCH/DELETE in one file. This makes it hard to optimize reads and writes independently.

**Approach**: Not a full rewrite — just separate concerns:

```
/api/blog/route.ts          → GET (list, heavily cached)
/api/blog/route.ts          → POST (create, uncached)
/api/blog/[slug]/route.ts   → GET (read, cached), PATCH (update), DELETE

// Add specific cache strategies per handler:
export async function GET() {
  // Add aggressive caching for public reads
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  });
}

export async function POST() {
  // No caching for writes
  // Invalidate related caches
}
```

### 3.5 Upgrade VPS Resources

At 10K users, the initial VPS will need more resources:
- CPU and RAM for handling concurrent connections
- Disk space for growing database and media storage
- Socket.io connection capacity

Upgrade VPS or add dedicated servers:
- Separate database server (more RAM for PostgreSQL)
- Larger disk or object storage (S3-compatible) for media
- Consider a dedicated Redis server for caching and Socket.io adapter

---

## Stage 4: 50,000-500,000 Users (Plan at 30K, Implement at 50K)

### 4.1 Evaluate Infrastructure Scaling

At this scale, evaluate whether a single VPS is still sufficient.

**Decision matrix:**

| Single VPS | Multi-Server Setup |
|------------|-------------------|
| $30-80/month | $100-300/month |
| Simple management | Requires orchestration |
| Vertical scaling limits | Horizontal scaling possible |
| Single point of failure | Redundancy available |
| Best option if traffic is manageable | Best option for high availability |

**Recommended multi-server setup:**
- Hetzner CX41 (4 vCPU, 16 GB RAM): ~$15/month for DB server
- Hetzner CX31 (2 vCPU, 8 GB RAM): ~$8/month for app server
- Separate Redis server: ~$5/month
- Coolify (PaaS for self-hosting): Free
- Total: ~$28/month with better reliability

### 4.2 Read Replicas

Enable PostgreSQL read replicas to separate read and write workloads:
- Writes go to primary database
- Reads go to replica(s)
- Self-hosted with PostgreSQL streaming replication

### 4.3 Event-Driven Architecture

Replace direct API calls with an event system:

```
User Action → Publish Event → Multiple Consumers

Example: "user_joined_clan"
  → Consumer 1: Send notification to clan members
  → Consumer 2: Update clan member count
  → Consumer 3: Award "Clan Joiner" badge
  → Consumer 4: Update activity feed
  → Consumer 5: Send Discord webhook
```

Use PostgreSQL LISTEN/NOTIFY + Socket.io as the event bus initially, or add a dedicated system (BullMQ, Upstash Kafka, AWS SQS) when needed.

### 4.4 Image Processing Pipeline

Move from client-side compression to a proper pipeline:

```
User uploads image
  → Store original in cold storage (VPS storage / S3)
  → Generate variants via worker:
    - Thumbnail: 150px, WebP, quality 60
    - Card: 600px, WebP, quality 75
    - Full: 1200px, WebP + AVIF, quality 80
  → Serve variants via CDN
  → Lazy load with blur placeholder
```

Use Next.js `<Image>` component which handles resizing and format negotiation automatically, or Cloudinary/imgix for more control.

---

## Stage 5: 500,000+ Users (Future-Proofing)

At this scale, you're a real company with an engineering team. These are the decisions you'll face:

| Decision | Options |
|----------|---------|
| Database sharding | Horizontal partitioning by user_id or region |
| Microservices | Separate services for chat, feed, notifications, matchmaking |
| Geo-distributed databases | CockroachDB, PlanetScale, or multi-region PostgreSQL |
| Real-time infrastructure | Scaled Socket.io with Redis adapter, or dedicated services (Ably, Pusher) |
| Search infrastructure | Elasticsearch, Meilisearch, or Typesense |
| AI infrastructure | Dedicated GPU instances for matchmaking models |
| Observability | Datadog, Grafana + Prometheus, or equivalent |
| CI/CD | GitHub Actions, automated testing, staging environments |

**You do NOT need to plan for this now.** If you reach 500K users, you will have the revenue and team to make these decisions.

---

## Performance Monitoring Checklist

Set these up early to know when scaling is needed:

| What to Monitor | Tool | Alert Threshold |
|----------------|------|----------------|
| API response times | Grafana / custom monitoring | P95 > 2 seconds |
| Error rate | Sentry (free tier) | > 1% of requests |
| Database query time | pg_stat_statements / Grafana | Any query > 500ms |
| Socket.io connections | Server metrics | Approaching server limits |
| Storage usage | Disk monitoring | > 80% of disk capacity |
| Bandwidth usage | VPS provider dashboard | > 80% of plan limit |
| Core Web Vitals | Google Search Console | LCP > 2.5s, CLS > 0.1 |
| Database size | PostgreSQL monitoring | Approaching disk limits |

---

*Key principle: Optimize when you have data showing a bottleneck, not in anticipation of one. Premature optimization is the root of all evil — but MEASURED optimization is the root of all performance.*
