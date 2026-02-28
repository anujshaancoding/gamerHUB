/**
 * Typed RPC function helpers for PostgreSQL database.
 *
 * Provides typed wrappers around db.rpc() calls for friend,
 * social, and suggestion-related database functions.
 */

import type { DatabaseClient } from "./query-builder";
import type { Json } from "@/types/database";

// ============================================
// RPC FUNCTION RESULT TYPES
// ============================================

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

export async function getFriends(db: DatabaseClient, userId: string) {
  return db.rpc<GetFriendsResult[]>("get_friends", { p_user_id: userId });
}

export async function getRelationshipStatus(
  db: DatabaseClient,
  currentUserId: string,
  targetUserId: string
) {
  return db.rpc<RelationshipStatusResult[]>("get_relationship_status", {
    current_user_id: currentUserId,
    target_user_id: targetUserId,
  });
}

export async function areFriends(
  db: DatabaseClient,
  user1Id: string,
  user2Id: string
) {
  return db.rpc<boolean>("are_friends", {
    user1_id: user1Id,
    user2_id: user2Id,
  });
}

export async function sendFriendRequest(
  db: DatabaseClient,
  senderId: string,
  recipientId: string,
  message?: string | null
) {
  return db.rpc<string>("send_friend_request", {
    p_sender_id: senderId,
    p_recipient_id: recipientId,
    p_message: message || null,
  });
}

export async function acceptFriendRequest(
  db: DatabaseClient,
  requestId: string,
  recipientId: string
) {
  return db.rpc<boolean>("accept_friend_request", {
    p_request_id: requestId,
    p_recipient_id: recipientId,
  });
}

export async function declineFriendRequest(
  db: DatabaseClient,
  requestId: string,
  recipientId: string
) {
  return db.rpc<boolean>("decline_friend_request", {
    p_request_id: requestId,
    p_recipient_id: recipientId,
  });
}

export async function cancelFriendRequest(
  db: DatabaseClient,
  requestId: string,
  senderId: string
) {
  return db.rpc<boolean>("cancel_friend_request", {
    p_request_id: requestId,
    p_sender_id: senderId,
  });
}

export async function removeFriend(
  db: DatabaseClient,
  userId: string,
  friendId: string
) {
  return db.rpc<boolean>("remove_friend", {
    p_user_id: userId,
    p_friend_id: friendId,
  });
}

export async function getFriendCount(db: DatabaseClient, userId: string) {
  return db.rpc<number>("get_friend_count", { p_user_id: userId });
}

export async function getFollowersOnlyCount(
  db: DatabaseClient,
  userId: string
) {
  return db.rpc<number>("get_followers_only_count", { p_user_id: userId });
}

export async function getFollowingOnlyCount(
  db: DatabaseClient,
  userId: string
) {
  return db.rpc<number>("get_following_only_count", { p_user_id: userId });
}

export async function getUserSocialCounts(
  db: DatabaseClient,
  userId: string
) {
  return db.rpc<UserSocialCountsResult[]>("get_user_social_counts", {
    p_user_id: userId,
  });
}

export async function getUserFriendsList(
  db: DatabaseClient,
  userId: string,
  viewerId: string | null,
  limit: number = 50,
  offset: number = 0,
  search: string | null = null
) {
  return db.rpc<UserFriendsListResult[]>("get_user_friends_list", {
    p_user_id: userId,
    p_viewer_id: viewerId,
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  });
}

export async function getUserFollowersList(
  db: DatabaseClient,
  userId: string,
  viewerId: string | null,
  limit: number = 50,
  offset: number = 0,
  search: string | null = null
) {
  return db.rpc<UserFollowersListResult[]>("get_user_followers_list", {
    p_user_id: userId,
    p_viewer_id: viewerId,
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  });
}

export async function getUserFollowingList(
  db: DatabaseClient,
  userId: string,
  viewerId: string | null,
  limit: number = 50,
  offset: number = 0,
  search: string | null = null
) {
  return db.rpc<UserFollowingListResult[]>("get_user_following_list", {
    p_user_id: userId,
    p_viewer_id: viewerId,
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  });
}

export async function getMutualFriends(
  db: DatabaseClient,
  userId: string,
  limit: number = 10
) {
  return db.rpc<MutualFriendsResult[]>("get_mutual_friends", {
    p_user_id: userId,
    p_limit: limit,
  });
}

export async function getSimilarRankPlayers(
  db: DatabaseClient,
  userId: string,
  rankTolerance: number = 2,
  limit: number = 10
) {
  return db.rpc<SimilarRankPlayersResult[]>("get_similar_rank_players", {
    p_user_id: userId,
    p_rank_tolerance: rankTolerance,
    p_limit: limit,
  });
}

export async function getProPlayersByGames(
  db: DatabaseClient,
  userId: string,
  limit: number = 10
) {
  return db.rpc<ProPlayersByGamesResult[]>("get_pro_players_by_games", {
    p_user_id: userId,
    p_limit: limit,
  });
}

export async function getPopularProPlayers(
  db: DatabaseClient,
  limit: number = 10
) {
  return db.rpc<PopularProPlayersResult[]>("get_popular_pro_players", {
    p_limit: limit,
  });
}
