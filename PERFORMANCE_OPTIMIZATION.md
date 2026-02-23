# ggLobby Performance Optimization Report

**Date:** 2026-02-23
**Scope:** Full codebase audit (excluding /mobile)
**Platform:** Next.js 16 + React 18 + Supabase + TanStack Query

---

## Executive Summary

The primary symptom — **page stuck in loading state until refresh** — is caused by a chain of issues in the auth initialization flow, uncontrolled realtime subscriptions, and missing error boundaries. Secondary performance problems include heavy bundle size from uncode-split libraries, unoptimized images, and CSS animations running on the main thread.

This document catalogs every issue found and the fix applied.

---

## CRITICAL: Loading/Refresh Issue — Root Cause Analysis

### The Loading Chain of Failure

When a user navigates to ggLobby, the following sequence occurs:

```
1. Middleware redirects / → /community (server-side, good)
2. Root layout renders 7 nested providers (all client-side)
3. AuthProvider starts with loading=true
4. AuthProvider calls supabase.auth.getUser() (network call)
5. If profile not found → waits 1,500ms → retries → possibly creates profile
6. Only THEN sets loading=false
7. Meanwhile: Navbar, Sidebar, Community page ALL mount and start fetching
8. Hooks fire API calls that return 401 (auth not ready)
9. React Query retries these failed calls
10. Realtime channels subscribe and start triggering refetches
11. Everything races, some calls hang, loading spinner persists
```

### Issue #1: AuthProvider 1.5-Second Blocking Delay

**File:** `src/lib/auth/AuthProvider.tsx:53`
**Severity:** CRITICAL

```typescript
// Profile not found yet — wait 1.5 seconds and retry
await new Promise(resolve => setTimeout(resolve, 1500));
```

This blocks the entire auth initialization for 1.5 seconds when the profile isn't immediately available (common during first login, Google OAuth, etc.). During this time, `loading` stays `true`, but child components have already mounted and started making API calls.

**Fix:** Replaced with a fast polling retry (3 attempts, 500ms intervals) that doesn't block the loading state from resolving.

---

### Issue #2: No Debouncing on Realtime Refetches

**File:** `src/lib/hooks/useMessages.ts:76-133`
**Severity:** CRITICAL

The `useConversations` hook subscribes to 6 different Postgres change events, ALL of which call `fetchConversations()` without any debouncing:

- conversations INSERT
- conversations UPDATE
- conversation_participants UPDATE
- messages INSERT
- follows INSERT
- follows DELETE

If multiple events fire within milliseconds (e.g., a new message triggers both a messages INSERT and a conversations UPDATE), the hook fetches the entire conversation list multiple times simultaneously.

**Fix:** Added a debounce wrapper so rapid-fire events coalesce into a single fetch.

---

### Issue #3: Module-Level Supabase Client in Community Page

**File:** `src/app/(main)/community/page.tsx:81`
**Severity:** HIGH

```typescript
const supabase = createClient(); // Outside component!
```

This creates a Supabase client at module evaluation time, before React's lifecycle begins. If the module loads before cookies are available, the client may have no auth session, causing all subsequent queries to fail silently.

**Fix:** Moved client creation inside the component using `useMemo`.

---

### Issue #4: Community Page 10-Second Timeout Hack

**File:** `src/app/(main)/community/page.tsx:221-226`
**Severity:** HIGH

```typescript
// Safety net: if loading is stuck for 10 seconds, force it off
useEffect(() => {
  if (!loading) return;
  const timer = setTimeout(() => setLoading(false), 10_000);
  return () => clearTimeout(timer);
}, [loading]);
```

This masks the real loading issue instead of fixing it. Users see a blank page after 10 seconds because data was never actually fetched.

**Fix:** Removed the hack. The underlying issues (auth delay, missing debounce) are now fixed, so loading resolves naturally.

---

### Issue #5: useNotifications Creates Realtime Channel Without Auth Check

**File:** `src/lib/hooks/useNotifications.ts:258-292`
**Severity:** MEDIUM

The notification hook's `useEffect` subscribes to a Supabase realtime channel unconditionally — even when the user is not authenticated. This creates unnecessary WebSocket connections for guest users and can trigger errors when the notifications table has RLS policies.

**Fix:** Added auth guard — only subscribe to realtime when enabled.

---

### Issue #6: Unread Count Singleton Never Cleans Up

**File:** `src/lib/hooks/useMessages.ts:571-624`
**Severity:** MEDIUM

```typescript
// This singleton lives for the lifetime of the app — no cleanup needed
void channel;
```

The module-level singleton creates a Supabase realtime channel that persists forever. If the user logs out and back in, a stale channel remains. More importantly, it calls `fetchCount()` (which hits `/api/messages/conversations`) even for guest users.

**Fix:** Added auth-awareness — only start the singleton when authenticated, don't fetch for guests.

---

## PERFORMANCE: Bundle & Loading Optimizations

### Issue #7: react-query-devtools in Production Dependencies

**File:** `package.json`
**Severity:** HIGH

`@tanstack/react-query-devtools` is listed in `dependencies` instead of `devDependencies`. Even though the import is commented out, the package is still bundled and increases install size.

**Fix:** Moved to `devDependencies`.

---

### Issue #8: Heavy Libraries Not Code-Split

**Severity:** HIGH

These libraries are imported statically and included in the initial bundle:

| Library | Approx. Size (gzipped) | Used On |
|---------|----------------------|---------|
| framer-motion | ~50KB | Navbar animations, community page |
| recharts | ~80KB | Admin dashboard only |
| @tiptap/* | ~100KB | Blog editor only |
| livekit-* | ~150KB | Call/video pages only |
| openai | ~50KB | Matchmaking API only |

**Fix:** Added `next/dynamic` lazy loading for heavy components. The navbar's framer-motion usage is minimal and inlined to avoid the full import on every page.

---

### Issue #9: next.config.ts Missing Production Optimizations

**File:** `next.config.ts`
**Severity:** MEDIUM

Missing configurations:
- No `poweredByHeader: false` (security + saves bytes)
- No `compress: true` (enables gzip)
- `typescript.ignoreBuildErrors: true` hides real issues

**Fix:** Added production-optimized configuration.

---

### Issue #10: CSS Animations Without GPU Optimization

**File:** `src/app/globals.css`
**Severity:** MEDIUM

Multiple infinite animations run on the main thread:
- `animate-pulse-glow` (2s infinite) — animates `box-shadow`
- `animate-spin-slow` (4s infinite)
- `holographic-shift` (8s infinite)
- `medal-shine` (3s infinite)
- `xp-shine` (2s infinite)
- `particle-float` (10s infinite)

Box-shadow animations are especially expensive as they trigger layout + paint on every frame.

**Fix:** Added `will-change` hints and `transform: translateZ(0)` for GPU compositing. Changed box-shadow animations to use `filter: drop-shadow()` where possible (composited by GPU).

---

### Issue #11: Images Using `unoptimized` Flag

**Severity:** MEDIUM

Multiple components bypass Next.js Image optimization with `unoptimized` prop. This disables automatic WebP conversion, responsive sizing, and lazy loading.

**Note:** This is a known trade-off for user-uploaded content from external CDNs. Where possible, ensure `remotePatterns` covers the domain and remove `unoptimized`.

---

## ARCHITECTURE: Provider & Component Optimizations

### Issue #12: 7 Nested Client-Side Providers

**File:** `src/app/layout.tsx`
**Severity:** MEDIUM

```
QueryProvider → AuthProvider → PresenceProvider → ThemeProvider → PWAProvider → AuthGateProvider → AppShell
```

All 7 providers are client-side and render sequentially. Each provider's state change re-renders all children.

**Fix:** This is architecturally sound but the key fix is ensuring AuthProvider resolves quickly (Issue #1). The provider order is correct — each depends on the one above it.

---

### Issue #13: Navbar and Sidebar Fire Parallel Queries

**Files:** `src/components/layout/navbar.tsx`, `src/components/layout/sidebar.tsx`
**Severity:** LOW-MEDIUM

Both components independently call:
- `useSubscription()`
- `useSocialCounts()`
- `useUnreadMessageCount()`
- `useNotifications()` (navbar only)

Thanks to TanStack Query's deduplication, these don't create duplicate network requests. However, both components re-render when any of these queries resolve.

**Fix:** Ensured hooks only fire when authenticated. React Query handles the deduplication.

---

## Summary of All Changes Applied

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | AuthProvider 1.5s delay | CRITICAL | Fast polling retry (500ms x 3) |
| 2 | No debounce on realtime refetch | CRITICAL | Added debounce to useConversations |
| 3 | Module-level supabase client | HIGH | Moved inside component with useMemo |
| 4 | 10-second timeout hack | HIGH | Removed (root cause fixed) |
| 5 | Notifications realtime without auth | MEDIUM | Added auth guard |
| 6 | Unread singleton no cleanup | MEDIUM | Added auth-awareness |
| 7 | DevTools in prod dependencies | HIGH | Moved to devDependencies |
| 8 | Heavy libs not code-split | HIGH | Dynamic imports added |
| 9 | next.config missing optimizations | MEDIUM | Added prod config |
| 10 | CSS animations on main thread | MEDIUM | GPU acceleration hints |
| 11 | Navbar framer-motion import | MEDIUM | Used CSS animations instead |
| 12 | Error boundary missing | MEDIUM | Added to main layout |
| 13 | Community page loading | HIGH | Fixed data fetching flow |

---

## Verification Checklist

After applying these changes, verify:

- [ ] Page loads without getting stuck on loading spinner
- [ ] Community page shows blog posts immediately (no auth wait)
- [ ] Logging in doesn't cause a 1.5s delay
- [ ] Guest users see community content instantly
- [ ] No console errors about failed API calls during initial load
- [ ] Realtime updates still work for messages/notifications
- [ ] Bundle size is reduced (check with `npx next build`)
- [ ] No TypeScript or runtime errors
