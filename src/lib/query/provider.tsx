"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

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
  BLOG_POSTS: 1000 * 60 * 2, // 2 minutes
  FRIEND_POSTS: 1000 * 60 * 1, // 1 minute
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

// Query keys for consistent cache management
export const queryKeys = {
  // Games
  games: ["games"] as const,
  game: (id: string) => ["games", id] as const,

  // User & Auth
  user: ["user"] as const,
  profile: (username: string) => ["profile", username] as const,

  // Progression
  progression: (userId?: string) => userId ? ["progression", userId] as const : ["progression"] as const,
  badges: (userId?: string) => userId ? ["badges", userId] as const : ["badges"] as const,
  badgeDefinitions: ["badge-definitions"] as const,
  titles: ["titles"] as const,
  frames: ["frames"] as const,
  themes: ["themes"] as const,

  // Quests
  activeQuests: ["quests", "active"] as const,
  questDefinitions: ["quests", "definitions"] as const,

  // Leaderboards
  leaderboard: (params: { type?: string; gameId?: string; region?: string; limit?: number }) =>
    ["leaderboard", params] as const,
  seasonLeaderboard: (params: { seasonId?: string; gameId?: string; region?: string; limit?: number; offset?: number }) =>
    ["season-leaderboard", params] as const,
  myRanking: (params: { seasonId?: string; gameId?: string }) =>
    ["my-ranking", params] as const,

  // Seasons
  currentSeason: ["season", "current"] as const,
  season: (id: string) => ["season", id] as const,
  seasonRewards: (seasonId: string) => ["season-rewards", seasonId] as const,

  // Tournaments
  tournaments: (params: { status?: string; gameId?: string; search?: string; limit?: number; offset?: number }) =>
    ["tournaments", params] as const,
  tournament: (id: string) => ["tournament", id] as const,
  tournamentBracket: (id: string) => ["tournament-bracket", id] as const,
  tournamentMatches: (id: string) => ["tournament-matches", id] as const,

  // Clans
  clans: (params: { search?: string; game?: string; region?: string; recruiting?: boolean; limit?: number; offset?: number }) =>
    ["clans", params] as const,
  clan: (id: string) => ["clan", id] as const,
  clanMembers: (id: string) => ["clan-members", id] as const,
  clanInvites: (clanId: string) => ["clan-invites", clanId] as const,
  userClanMembership: ["user-clan-membership"] as const,
  clanChallenges: (clanId?: string) => clanId ? ["clan-challenges", clanId] as const : ["clan-challenges"] as const,

  // Community / Blog / Friends — keys now live in:
  //   blogKeys (src/lib/hooks/useBlog.ts)
  //   friendPostKeys (src/lib/hooks/useFriendPosts.ts)

  // Community Challenges
  communityChallenges: (params?: { status?: string; gameId?: string }) =>
    ["community-challenges", params || {}] as const,
  communityChallenge: (id: string) => ["community-challenge", id] as const,

  // Dashboard
  dashboard: ["dashboard"] as const,
  dashboardMatches: ["dashboard", "matches"] as const,
  dashboardChallenges: ["dashboard", "challenges"] as const,
  dashboardStats: ["dashboard", "stats"] as const,

  // Matches
  matches: (params?: { status?: string; userId?: string }) =>
    ["matches", params || {}] as const,
  match: (id: string) => ["match", id] as const,

  // User Games
  userGames: (userId?: string) => userId ? ["user-games", userId] as const : ["user-games"] as const,

  // Search
  search: (query: string) => ["search", query] as const,
  searchUsers: (query: string) => ["search", "users", query] as const,
  searchBlogs: (query: string) => ["search", "blogs", query] as const,
  searchListings: (query: string) => ["search", "listings", query] as const,
  searchClans: (query: string) => ["search", "clans", query] as const,

  // Find Gamers
  findGamers: (params: { game?: string; rank?: string; region?: string; language?: string; style?: string }) =>
    ["find-gamers", params] as const,

  // Clan Activity
  clanActivity: (clanId: string) => ["clan-activity", clanId] as const,

  // Activity
  activity: (userId: string) => ["activity", userId] as const,

  // Messages
  conversations: ["conversations"] as const,
  conversation: (id: string) => ["conversation", id] as const,
  conversationMessages: (id: string) => ["conversation-messages", id] as const,
  unreadMessages: ["unread-message-count"] as const,

  // Battle Pass
  battlePass: ["battle-pass"] as const,
  battlePassProgress: ["battle-pass-progress"] as const,

  // Wallet & Shop
  wallet: ["wallet"] as const,
  currencyPacks: ["currency-packs"] as const,
  walletTransactions: (params?: { limit?: number; currency?: string }) =>
    ["wallet-transactions", params || {}] as const,
  shopItems: (params?: { category?: string; type?: string; rarity?: string }) =>
    ["shop-items", params || {}] as const,

  // Notifications
  notifications: (options?: { limit?: number; unreadOnly?: boolean }) =>
    ["notifications", options || {}] as const,
  notificationPreferences: ["notification-preferences"] as const,
  discordConnection: ["discord-connection"] as const,

  // Subscriptions
  subscriptionPlans: ["subscription-plans"] as const,
  userSubscription: ["user-subscription"] as const,
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
        refetchOnWindowFocus: true,
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
    // Blog/FriendPost invalidation now handled by blogKeys.all and friendPostKeys.all
    // in their respective hook files (useBlog.ts, useFriendPosts.ts)
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
