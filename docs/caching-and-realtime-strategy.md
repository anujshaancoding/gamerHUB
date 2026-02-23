# Caching & Real-Time Data Strategy

> How GG Lobby handles data freshness, cache invalidation, and real-time updates
> compared against industry best practices from Facebook, Twitter/X, Instagram, and Reddit.

---

## Table of Contents

1. [How the Big Players Do It](#1-how-the-big-players-do-it)
2. [Our Current Architecture](#2-our-current-architecture)
3. [What We Do Well](#3-what-we-do-well)
4. [Where We Fall Short](#4-where-we-fall-short)
5. [Best Practices Checklist](#5-best-practices-checklist)
6. [Recommendation Roadmap](#6-recommendation-roadmap)

---

## 1. How the Big Players Do It

### Facebook / Meta

| Concern | Approach |
|---------|----------|
| **Likes** | Write to source-of-truth `Likes` table, async counter aggregation via CDC + Kafka to a separate `PostLikesCount` table. UI reads from the count table (eventually consistent within seconds). |
| **Optimistic Updates** | Relay's `optimisticUpdater` updates the local store immediately. Server response rolls back the optimistic change and applies the real value. Handles concurrent in-flight mutations. |
| **Cache Layer** | TAO (distributed graph store) with write-through cache. 99.99999999% (ten nines) consistency within 5 minutes. |
| **Real-Time Push** | MQTT over WebSocket (2-byte headers vs 16+ for HTTP). GraphQL Subscriptions backed by MQTT topics. |
| **Consistency Model** | Strong read-after-write for the actor, eventually consistent for everyone else. |

**Key takeaway:** The user who performs an action sees the result immediately (optimistic update). Other users see it within seconds via background propagation. Exact counts are not critical.

### Twitter / X

| Concern | Approach |
|---------|----------|
| **Timeline** | Fanout-on-write: when a user tweets, the tweet ID is written into every follower's Redis timeline (max 800 entries per user). |
| **Celebrity Accounts** | Hybrid: fanout-on-write for normal users, fanout-on-read for celebrities (avoids millions of Redis writes per tweet). |
| **Cache** | Redis-based timeline cache. 300K queries/sec, 30 billion Redis updates/day. |
| **Dormant Users** | Timeline cache evicted after inactivity. Reconstructed on-demand when user returns. |

**Key takeaway:** Pre-compute feeds at write time so reads are trivially fast. Accept that writes are expensive.

### Instagram

| Concern | Approach |
|---------|----------|
| **Feed** | Cassandra for activity feeds + Memcached in front of PostgreSQL for counts/profiles. |
| **Web Client** | Cache-first rendering: IndexedDB stores a subset of Redux state. On load, cached feed is shown immediately while fresh data loads in background (stale-while-revalidate). |
| **Thundering Herd** | Memcache Lease mechanism: on cache miss, only ONE server queries the DB. All other concurrent requesters wait or use stale value. |

**Key takeaway:** Show cached/stale data immediately, refresh in background. The user perceives instant load times.

### Reddit

| Concern | Approach |
|---------|----------|
| **Votes** | Kafka event stream, batched writes to Cassandra every 30 seconds. Vote fuzzing (~5% noise) on displayed counts. |
| **Caching** | Memcached in front of PostgreSQL. Denormalized precomputed lists on cache servers. |
| **Consistency** | Fully eventual. Vote counts are intentionally imprecise. |

**Key takeaway:** For social metrics like votes, exact precision doesn't matter. Batch processing + eventual consistency scales better than per-event writes.

### Common Pattern Across All Platforms

```
User Action --> Optimistic UI Update (instant)
           --> Server Write (async)
           --> Cache Invalidation / Event Propagation (seconds)
           --> Other Users See Update (eventually)
```

Every major platform follows this model:
1. **Instant feedback** for the user performing the action
2. **Eventual consistency** for everyone else
3. **Separate read and write paths** to avoid contention

---

## 2. Our Current Architecture

### Tech Stack

- **Frontend:** Next.js 15 (App Router) + React 19
- **Data Fetching:** TanStack React Query v5
- **Backend/DB:** Supabase (PostgreSQL) with Supabase Realtime
- **Real-Time:** Supabase Realtime (Postgres Changes + Presence channels)

### How Data Flows

```
                    +------------------+
                    |  Supabase (DB)   |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     API Routes (/api/*)          Direct Supabase Client
              |                             |
     useMutation (React Query)    Raw .insert()/.update()
              |                             |
     onSuccess: invalidateQueries   (no cache invalidation)
              |                             |
     React Query Cache refreshed    Local state only
```

### Query Key Architecture

We maintain two query key systems (historical, now cross-invalidated):

**Centralized keys** (in `src/lib/query/provider.tsx`):
```typescript
queryKeys.blogPosts        // ["blog-posts"]
queryKeys.blogPost(id)     // ["blog-post", id]
queryKeys.blogComments(id) // ["blog-comments", id]
queryKeys.friendPosts(g)   // ["friend-posts", { isGuest }]
queryKeys.dashboard        // ["dashboard"]
queryKeys.findGamers(p)    // ["find-gamers", params]
queryKeys.clanActivity(id) // ["clan-activity", id]
```

**Domain-specific keys** (in `src/lib/hooks/useBlog.ts`):
```typescript
blogKeys.posts(filters)     // ["blog", "posts", filters]
blogKeys.post(slug)         // ["blog", "post", slug]
blogKeys.comments(postSlug) // ["blog", "comments", postSlug]
```

Both systems are now cross-invalidated: mutations in `useBlog.ts` also invalidate the centralized keys and vice versa.

### Stale Time Configuration

| Data Type | Stale Time | Rationale |
|-----------|-----------|-----------|
| Static catalogs (games, badges, titles) | 24 hours | Almost never changes |
| Seasons, quest definitions | 30 minutes | Changes infrequently |
| Leaderboards, profiles, clans | 2-5 minutes | Updates periodically |
| Blog posts, find gamers | 2 minutes | Social content, moderate refresh |
| Friend posts, blog comments | 1 minute | More interactive content |
| Dashboard | 1 minute | Personal data, want freshness |
| Matches, online users | 30 seconds | Near real-time |
| Messages | 10 seconds | Fallback polling (Realtime is primary) |

### Supabase Realtime Usage

| Feature | Tables Subscribed | Channel Type |
|---------|-------------------|-------------|
| Messaging | `messages`, `conversations`, `conversation_participants` | postgres_changes |
| Notifications | `notifications` | postgres_changes |
| Presence/Online | `profiles` | Presence channel |
| Calls | `calls`, `call_participants` | postgres_changes |
| Tournaments | `tournaments`, `tournament_participants`, `tournament_matches` | postgres_changes |

**Not using Realtime (relying on stale-time + refetchOnWindowFocus):**
- Blog post likes/comments
- Friend post likes
- Community feed updates
- Leaderboards
- Dashboard stats

### Invalidation Flow for Blog Mutations

```
User likes a blog post
  --> useLikeBlogPost() fires
    --> POST /api/blog/{slug}/like
    --> onSuccess:
      --> invalidate ["blog", "post", slug]     (useBlog.ts cache)
      --> invalidate ["blog", "posts"]           (useBlog.ts list cache)
      --> invalidate ["blog-posts"]              (community page cache)
      --> invalidate ["blog-post"]               (community detail cache)
```

---

## 3. What We Do Well

### Stale-While-Revalidate Pattern
Every page now uses React Query with configured `staleTime`. Users see cached data instantly on navigation, with background refetch when data is stale. This mirrors Instagram's cache-first web approach.

### Sensible Stale Time Tiers
Our tiered stale times (24h for static, 2-5min for social, 30s for real-time) align with industry practice. Not all data needs the same freshness.

### Centralized Query Key Management
`queryKeys` in `provider.tsx` provides a single source of truth for cache keys across the app, preventing typos and making invalidation predictable.

### Realtime for Chat/Messaging
Messages use Supabase Realtime subscriptions (not polling), which is the correct approach. Messages need sub-second delivery, and we deliver that.

### RefetchOnWindowFocus
Enabled globally. When a user switches back to the tab, stale data is refreshed automatically. This is a high-value, zero-effort freshness mechanism that all major platforms implement.

### Global Query Client Configuration
Retry (1), gcTime (30 min), refetchOnReconnect (true) are all correctly configured with sensible defaults.

---

## 4. Where We Fall Short

### No Optimistic Updates (Critical Gap)

**Industry standard:** Every major platform uses optimistic updates for likes, follows, and reactions.

**Our current state:** Zero `onMutate` usage across the entire codebase. All mutations wait for server confirmation before updating the UI. This means:
- User clicks "Like" -> waits 200-500ms for API response -> sees the count update
- On slow connections, the delay is noticeable and feels unresponsive

**Impact:** Users perceive the app as slower than Instagram/Twitter where likes feel instant.

**What it should look like:**
```typescript
// Current (pessimistic):
useMutation({
  mutationFn: (slug) => fetch(`/api/blog/${slug}/like`, { method: "POST" }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: blogKeys.post(slug) });
  },
});

// Best practice (optimistic):
useMutation({
  mutationFn: (slug) => fetch(`/api/blog/${slug}/like`, { method: "POST" }),
  onMutate: async (slug) => {
    await queryClient.cancelQueries({ queryKey: blogKeys.post(slug) });
    const previous = queryClient.getQueryData(blogKeys.post(slug));
    queryClient.setQueryData(blogKeys.post(slug), (old) => ({
      ...old,
      likes_count: old.likes_count + 1,
      is_liked: true,
    }));
    return { previous };
  },
  onError: (err, slug, context) => {
    queryClient.setQueryData(blogKeys.post(slug), context.previous);
  },
  onSettled: (_, __, slug) => {
    queryClient.invalidateQueries({ queryKey: blogKeys.post(slug) });
  },
});
```

### Direct Supabase Mutations Without Cache Invalidation

Several components write directly to Supabase without going through React Query mutations:

| Component | Action | Problem |
|-----------|--------|---------|
| `profile-header.tsx` | Follow/Unfollow | Updates local state but never invalidates `useRelationship()` or `useSocialCounts()` cache |
| `gamer-card.tsx` | Follow/Unfollow | Same issue as profile-header |
| `chat-window.tsx` | Send message | Direct insert, relies on Realtime subscription for UI update |
| `community/page.tsx` | Like friend post | Direct Supabase update (now fixed with cache invalidation) |

**Risk:** Other components showing the same data (e.g., follower counts) will show stale values until their stale time expires or the window is refocused.

### No Realtime for Social Interactions

Blog likes, comments, and friend post updates rely entirely on stale-time expiry and window refocus. If User A likes a post while User B is viewing it, User B won't see the like count change for up to 2 minutes.

**Industry comparison:**
- Facebook: MQTT push, sub-second
- Twitter: Kafka fanout, seconds
- Reddit: Eventual, up to 30 seconds
- **GG Lobby: Up to 2 minutes** (stale time dependent)

This is acceptable for our current scale but should be improved as the user base grows.

### Dual Query Key System

Two separate key namespaces exist for the same blog data (`blogKeys` vs `queryKeys`). While now cross-invalidated, this adds maintenance overhead and cognitive load. Every new mutation must remember to invalidate both systems.

---

## 5. Best Practices Checklist

| Practice | Status | Notes |
|----------|--------|-------|
| Stale-while-revalidate pattern | Done | All pages use React Query |
| Tiered stale times by data type | Done | Configured in provider.tsx |
| Centralized query key management | Done | queryKeys + blogKeys |
| RefetchOnWindowFocus | Done | Enabled globally |
| RefetchOnReconnect | Done | Enabled globally |
| Retry on failure | Done | 1 retry configured |
| Realtime for chat/messaging | Done | Supabase Realtime channels |
| Realtime for notifications | Done | Supabase Realtime + 30s polling fallback |
| Optimistic updates for likes | Not Done | All mutations are pessimistic |
| Optimistic updates for follows | Not Done | Direct Supabase calls, no cache update |
| Realtime for social interactions | Not Done | Relies on stale time only |
| All mutations through useMutation | Not Done | ~7 direct Supabase mutations exist |
| Unified query key namespace | Partial | Two systems, cross-invalidated |
| Thundering herd protection | N/A | Not yet at scale to need this |
| Supabase cache helpers library | Not Used | Manual cache management throughout |

---

## 6. Recommendation Roadmap

### Priority 1: Optimistic Updates for Key Actions

Add `onMutate` with rollback to these mutations:
- `useLikeBlogPost()` - Like/unlike blog posts
- `useAddBlogComment()` - Adding comments
- Follow/Unfollow in `profile-header.tsx` and `gamer-card.tsx`
- Friend post likes in `community/page.tsx`

**Why:** Biggest perceived performance improvement for minimal effort. This is the single most impactful change.

### Priority 2: Wrap Direct Mutations in useMutation

Move these out of components into proper hooks with cache invalidation:
- `profile-header.tsx` follow handler -> `useFollowUser()` mutation hook
- `gamer-card.tsx` follow handler -> reuse `useFollowUser()`
- `community/page.tsx` friend post like -> `useLikeFriendPost()` mutation hook

**Why:** Prevents cache desync bugs. Every write should flow through React Query.

### Priority 3: Supabase Realtime for Blog/Social Updates

Add Realtime subscriptions that trigger `invalidateQueries`:
```typescript
// In community page or a shared hook:
supabase
  .channel('blog-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'blog_posts' },
    () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] })
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'friend_posts' },
    () => queryClient.invalidateQueries({ queryKey: ["friend-posts"] })
  )
  .subscribe();
```

**Why:** Reduces the update gap from 2 minutes to seconds. Other users see likes/comments almost immediately.

### Priority 4: Unify Query Key Namespace

Consolidate `blogKeys` (in `useBlog.ts`) and `queryKeys` (in `provider.tsx`) into a single system. This eliminates the need for cross-invalidation and reduces the risk of forgetting to invalidate one system.

**Why:** Reduces maintenance overhead and prevents future cache bugs.

---

## Summary

**Where we stand relative to industry:**

| Dimension | Industry Standard | GG Lobby | Gap |
|-----------|------------------|----------|-----|
| Caching layer | stale-while-revalidate | stale-while-revalidate | None |
| User's own action feedback | Optimistic (instant) | Pessimistic (waits for server) | Significant |
| Other users seeing changes | Real-time push (seconds) | Stale time expiry (1-2 min) | Moderate |
| Chat/messaging delivery | Real-time push | Real-time push | None |
| Cache consistency | Write-through / event-driven | Manual invalidation | Acceptable at our scale |

**Bottom line:** Our caching foundation is solid (React Query + good stale times + refetchOnWindowFocus). The two biggest gaps are (1) no optimistic updates, making interactions feel slower than they should, and (2) no Realtime subscriptions for social content, meaning other users experience a delay. Both are incremental improvements on top of our existing architecture.
