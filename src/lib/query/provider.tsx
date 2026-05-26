"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

// Re-export from ./keys so the existing `@/lib/query` consumers keep working.
export { queryKeys, blogKeys, friendPostKeys } from "./keys";

// Default stale times for different data types
export const STALE_TIMES = {
  // Static data that rarely changes
  GAMES: 1000 * 60 * 60 * 24, // 24 hours
  BADGES: 1000 * 60 * 60 * 24, // 24 hours
  TITLES: 1000 * 60 * 60 * 24, // 24 hours
  FRAMES: 1000 * 60 * 60 * 24, // 24 hours
  THEMES: 1000 * 60 * 60 * 24, // 24 hours

  // Semi-static data
  SEASON: 1000 * 60 * 30, // 30 minutes
  QUEST_DEFINITIONS: 1000 * 60 * 30, // 30 minutes

  // Dynamic but not real-time
  LEADERBOARD: 1000 * 60 * 5, // 5 minutes
  TOURNAMENTS: 1000 * 60 * 5, // 5 minutes
  CLANS: 1000 * 60 * 5, // 5 minutes
  PROFILES: 1000 * 60 * 5, // 5 minutes
  CLAN_DETAILS: 1000 * 60 * 2, // 2 minutes
  NEWS_ARTICLES: 1000 * 30, // 30 seconds
  BLOG_POSTS: 1000 * 60 * 2, // 2 minutes
  FRIEND_POSTS: 1000 * 60 * 1, // 1 minute
  SIDEBAR_ACTIVITY: 1000 * 60 * 2, // 2 minutes
  BLOG_POST_DETAIL: 1000 * 60 * 5, // 5 minutes
  BLOG_COMMENTS: 1000 * 60 * 1, // 1 minute
  FIND_GAMERS: 1000 * 60 * 2, // 2 minutes
  CLAN_ACTIVITY: 1000 * 60 * 2, // 2 minutes

  // User-specific data (more frequently updated)
  USER_PROGRESSION: 1000 * 60 * 2, // 2 minutes
  USER_QUESTS: 1000 * 60 * 2, // 2 minutes
  USER_BADGES: 1000 * 60 * 2, // 2 minutes
  USER_GAMES: 1000 * 60 * 2, // 2 minutes
  DASHBOARD: 1000 * 60 * 1, // 1 minute

  // Search
  SEARCH: 1000 * 60, // 1 minute

  // Real-time data
  MATCHES: 1000 * 30, // 30 seconds
  ONLINE_USERS: 1000 * 30, // 30 seconds
  CONVERSATIONS: 1000 * 30, // 30 seconds
  MESSAGES: 1000 * 10, // 10 seconds (mostly realtime)
} as const;

// Cache times (how long to keep in cache after becoming inactive)
export const CACHE_TIMES = {
  DEFAULT: 1000 * 60 * 30, // 30 minutes
  STATIC: 1000 * 60 * 60 * 24, // 24 hours
  SHORT: 1000 * 60 * 5, // 5 minutes
} as const;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - data is considered fresh for 60 seconds
        staleTime: 1000 * 60,
        // Keep unused data in cache for 30 minutes
        gcTime: CACHE_TIMES.DEFAULT,
        // Retry failed requests 1 time
        retry: 1,
        // Refetch on window focus (but only if stale)
        refetchOnWindowFocus: false,
        // Refetch on mount if data is stale - ensures fresh data on navigation
        refetchOnMount: true,
        // Refetch on reconnect to get latest data after connection loss
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  // Server: always make a new query client
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  // Browser: reuse client across re-renders
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </QueryClientProvider>
  );
}

// Helper to invalidate related queries after mutations
export function getInvalidationHelpers(queryClient: QueryClient) {
  return {
    invalidateProgression: () => {
      queryClient.invalidateQueries({ queryKey: ["progression"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
    invalidateQuests: () => {
      queryClient.invalidateQueries({ queryKey: ["quests"] });
    },
    invalidateLeaderboards: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["season-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["my-ranking"] });
    },
    invalidateTournaments: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
    invalidateClans: () => {
      queryClient.invalidateQueries({ queryKey: ["clans"] });
      queryClient.invalidateQueries({ queryKey: ["clan"] });
    },
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    invalidateConversations: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-message-count"] });
    },
    invalidateUserGames: () => {
      queryClient.invalidateQueries({ queryKey: ["user-games"] });
    },
    invalidateBlog: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
    },
    invalidateFriendPosts: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-posts"] });
    },
    invalidateBattlePass: () => {
      queryClient.invalidateQueries({ queryKey: ["battle-pass"] });
      queryClient.invalidateQueries({ queryKey: ["battle-pass-progress"] });
    },
    invalidateWallet: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    invalidateShop: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    invalidateNotifications: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    invalidateSubscription: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  };
}
