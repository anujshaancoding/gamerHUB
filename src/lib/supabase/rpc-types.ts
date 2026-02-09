/**
 * Typed RPC function helpers for Supabase
 *
 * This file provides type definitions for RPC function calls
 * since Supabase's automatic type inference doesn't always work correctly.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type SupabaseClientType = SupabaseClient<Database>;

// ============================================
// RPC FUNCTION TYPES
// ============================================

// Friend-related function results
export interface GetFriendsResult {
  friend_id: string;
  friends_since: string;
}

export interface RelationshipStatusResult {
  is_friend: boolean;
  is_following: boolean;
  is_follower: boolean;
  has_pending_request_sent: boolean;
  has_pending_request_received: boolean;
  is_blocked: boolean;
  is_blocked_by: boolean;
}

export interface UserSocialCountsResult {
  friends_count: number;
  followers_count: number;
  following_count: number;
}

export interface UserFriendsListResult {
  friend_id: string;
  friends_since: string;
  is_viewer_friend: boolean;
  is_viewer_following: boolean;
}

export interface UserFollowersListResult {
  follower_id: string;
  followed_since: string;
  is_viewer_friend: boolean;
  is_viewer_following: boolean;
}

export interface UserFollowingListResult {
  following_id: string;
  following_since: string;
  is_viewer_friend: boolean;
  is_viewer_following: boolean;
}

// Suggestion-related function results
export interface MutualFriendsResult {
  user_id: string;
  mutual_friend_count: number;
  mutual_friend_ids: string[];
}

export interface SimilarRankPlayersResult {
  user_id: string;
  common_games_count: number;
  matching_games: Json;
}

export interface ProPlayersByGamesResult {
  user_id: string;
  follower_count: number;
  common_games: Json;
}

export interface PopularProPlayersResult {
  user_id: string;
  follower_count: number;
}

// ============================================
// TYPED RPC HELPER FUNCTIONS
// ============================================

/**
 * Get friends for a user
 */
export async function getFriends(
  supabase: SupabaseClientType,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_friends", {
    p_user_id: userId,
  } as unknown as undefined);

  return {
    data: data as GetFriendsResult[] | null,
    error,
  };
}

/**
 * Get relationship status between two users
 */
export async function getRelationshipStatus(
  supabase: SupabaseClientType,
  currentUserId: string,
  targetUserId: string
) {
  const { data, error } = await supabase.rpc("get_relationship_status", {
    current_user_id: currentUserId,
    target_user_id: targetUserId,
  } as unknown as undefined);

  return {
    data: data as RelationshipStatusResult[] | null,
    error,
  };
}

/**
 * Check if two users are friends
 */
export async function areFriends(
  supabase: SupabaseClientType,
  user1Id: string,
  user2Id: string
) {
  const { data, error } = await supabase.rpc("are_friends", {
    user1_id: user1Id,
    user2_id: user2Id,
  } as unknown as undefined);

  return {
    data: data as boolean | null,
    error,
  };
}

/**
 * Send friend request
 */
export async function sendFriendRequest(
  supabase: SupabaseClientType,
  senderId: string,
  recipientId: string,
  message?: string | null
) {
  const { data, error } = await supabase.rpc("send_friend_request", {
    p_sender_id: senderId,
    p_recipient_id: recipientId,
    p_message: message || null,
  } as unknown as undefined);

  return {
    data: data as string | null,
    error,
  };
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(
  supabase: SupabaseClientType,
  requestId: string,
  recipientId: string
) {
  const { data, error } = await supabase.rpc("accept_friend_request", {
    p_request_id: requestId,
    p_recipient_id: recipientId,
  } as unknown as undefined);

  return {
    data: data as boolean | null,
    error,
  };
}

/**
 * Decline friend request
 */
export async function declineFriendRequest(
  supabase: SupabaseClientType,
  requestId: string,
  recipientId: string
) {
  const { data, error } = await supabase.rpc("decline_friend_request", {
    p_request_id: requestId,
    p_recipient_id: recipientId,
  } as unknown as undefined);

  return {
    data: data as boolean | null,
    error,
  };
}

/**
 * Cancel friend request
 */
export async function cancelFriendRequest(
  supabase: SupabaseClientType,
  requestId: string,
  senderId: string
) {
  const { data, error } = await supabase.rpc("cancel_friend_request", {
    p_request_id: requestId,
    p_sender_id: senderId,
  } as unknown as undefined);

  return {
    data: data as boolean | null,
    error,
  };
}

/**
 * Remove friend
 */
export async function removeFriend(
  supabase: SupabaseClientType,
  userId: string,
  friendId: string
) {
  const { data, error } = await supabase.rpc("remove_friend", {
    p_user_id: userId,
    p_friend_id: friendId,
  } as unknown as undefined);

  return {
    data: data as boolean | null,
    error,
  };
}

/**
 * Get friend count
 */
export async function getFriendCount(
  supabase: SupabaseClientType,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_friend_count", {
    p_user_id: userId,
  } as unknown as undefined);

  return {
    data: data as number | null,
    error,
  };
}

/**
 * Get followers only count (excluding friends)
 */
export async function getFollowersOnlyCount(
  supabase: SupabaseClientType,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_followers_only_count", {
    p_user_id: userId,
  } as unknown as undefined);

  return {
    data: data as number | null,
    error,
  };
}

/**
 * Get following only count (excluding friends)
 */
export async function getFollowingOnlyCount(
  supabase: SupabaseClientType,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_following_only_count", {
    p_user_id: userId,
  } as unknown as undefined);

  return {
    data: data as number | null,
    error,
  };
}

/**
 * Get user social counts
 */
export async function getUserSocialCounts(
  supabase: SupabaseClientType,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_user_social_counts", {
    p_user_id: userId,
  } as unknown as undefined);

  return {
    data: data as UserSocialCountsResult[] | null,
    error,
  };
}

/**
 * Get user friends list
 */
export async function getUserFriendsList(
  supabase: SupabaseClientType,
  userId: string,
  viewerId: string | null,
  limit: number = 50,
  offset: number = 0,
  search: string | null = null
) {
  const { data, error } = await supabase.rpc("get_user_friends_list", {
    p_user_id: userId,
    p_viewer_id: viewerId,
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  } as unknown as undefined);

  return {
    data: data as UserFriendsListResult[] | null,
    error,
  };
}

/**
 * Get user followers list
 */
export async function getUserFollowersList(
  supabase: SupabaseClientType,
  userId: string,
  viewerId: string | null,
  limit: number = 50,
  offset: number = 0,
  search: string | null = null
) {
  const { data, error } = await supabase.rpc("get_user_followers_list", {
    p_user_id: userId,
    p_viewer_id: viewerId,
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  } as unknown as undefined);

  return {
    data: data as UserFollowersListResult[] | null,
    error,
  };
}

/**
 * Get user following list
 */
export async function getUserFollowingList(
  supabase: SupabaseClientType,
  userId: string,
  viewerId: string | null,
  limit: number = 50,
  offset: number = 0,
  search: string | null = null
) {
  const { data, error } = await supabase.rpc("get_user_following_list", {
    p_user_id: userId,
    p_viewer_id: viewerId,
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  } as unknown as undefined);

  return {
    data: data as UserFollowingListResult[] | null,
    error,
  };
}

/**
 * Get mutual friends suggestions
 */
export async function getMutualFriends(
  supabase: SupabaseClientType,
  userId: string,
  limit: number = 10
) {
  const { data, error } = await supabase.rpc("get_mutual_friends", {
    p_user_id: userId,
    p_limit: limit,
  } as unknown as undefined);

  return {
    data: data as MutualFriendsResult[] | null,
    error,
  };
}

/**
 * Get similar rank players suggestions
 */
export async function getSimilarRankPlayers(
  supabase: SupabaseClientType,
  userId: string,
  rankTolerance: number = 2,
  limit: number = 10
) {
  const { data, error } = await supabase.rpc("get_similar_rank_players", {
    p_user_id: userId,
    p_rank_tolerance: rankTolerance,
    p_limit: limit,
  } as unknown as undefined);

  return {
    data: data as SimilarRankPlayersResult[] | null,
    error,
  };
}

/**
 * Get pro players by games
 */
export async function getProPlayersByGames(
  supabase: SupabaseClientType,
  userId: string,
  limit: number = 10
) {
  const { data, error } = await supabase.rpc("get_pro_players_by_games", {
    p_user_id: userId,
    p_limit: limit,
  } as unknown as undefined);

  return {
    data: data as ProPlayersByGamesResult[] | null,
    error,
  };
}

/**
 * Get popular pro players
 */
export async function getPopularProPlayers(
  supabase: SupabaseClientType,
  limit: number = 10
) {
  const { data, error } = await supabase.rpc("get_popular_pro_players", {
    p_limit: limit,
  } as unknown as undefined);

  return {
    data: data as PopularProPlayersResult[] | null,
    error,
  };
}
