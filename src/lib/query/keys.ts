// Single source of truth for React Query keys across the app. Previously the
// keys lived in three places (provider.tsx, useBlog.ts, useFriendPosts.ts),
// which made cross-feature invalidation easy to miss. Anything new goes here.

import type { BlogFilters } from "@/types/blog";

// Core domain keys (games, profiles, clans, tournaments, etc.)
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
  sidebarActivity: ["sidebar-activity"] as const,

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

// Blog keys (moved here from useBlog.ts)
export const blogKeys = {
  all: ["blog"] as const,
  posts: (filters?: BlogFilters) => ["blog", "posts", filters || {}] as const,
  post: (slug: string) => ["blog", "post", slug] as const,
  postById: (id: string) => ["blog", "post-by-id", id] as const,
  postLiked: (id: string) => ["blog", "post-liked", id] as const,
  myPosts: (status?: string) => ["blog", "my-posts", status || "all"] as const,
  comments: (postSlug: string) => ["blog", "comments", postSlug] as const,
  commentsById: (postId: string) => ["blog", "comments-by-id", postId] as const,
  authors: (verified?: boolean) => ["blog", "authors", verified] as const,
  myAuthor: ["blog", "my-author"] as const,
};

// Friend post keys (moved here from useFriendPosts.ts)
export const friendPostKeys = {
  all: ["friend-posts"] as const,
  list: (isGuest: boolean) => ["friend-posts", "list", { isGuest }] as const,
  detail: (postId: string) => ["friend-posts", "detail", postId] as const,
  liked: (postId: string) => ["friend-posts", "liked", postId] as const,
  bookmarked: (postId: string) => ["friend-posts", "bookmarked", postId] as const,
  comments: (postId: string) => ["friend-posts", "comments", postId] as const,
};
