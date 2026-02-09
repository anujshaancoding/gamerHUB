"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  FriendWithProfile,
  SocialCounts,
  RelationshipStatus,
} from "@/types/database";

interface UseFriendsOptions {
  userId?: string;
  search?: string;
  limit?: number;
}

export function useFriends(options: UseFriendsOptions = {}) {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { userId, search, limit = 50 } = options;

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (search) params.set("search", search);
      params.set("limit", limit.toString());

      const response = await fetch(`/api/friends?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch friends");
      }

      setFriends(data.friends);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch friends");
    } finally {
      setLoading(false);
    }
  }, [userId, search, limit]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = async (recipientId: string, message?: string) => {
    const response = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to send friend request") };
    }

    return { data };
  };

  const removeFriend = async (friendId: string) => {
    const response = await fetch(`/api/friends/${friendId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to remove friend") };
    }

    setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
    return { success: true };
  };

  return {
    friends,
    total,
    loading,
    error,
    refetch: fetchFriends,
    sendFriendRequest,
    removeFriend,
  };
}

export function useSocialCounts(userId?: string) {
  const [counts, setCounts] = useState<SocialCounts>({
    friends: 0,
    following: 0,
    followers: 0,
    pending_requests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);

      const response = await fetch(`/api/friends/counts?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch counts");
      }

      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch counts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts,
  };
}

export function useRelationship(targetUserId: string | null) {
  const [relationship, setRelationship] = useState<RelationshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelationship = useCallback(async () => {
    if (!targetUserId) {
      setRelationship(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/friends/${targetUserId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch relationship");
      }

      setRelationship(data.relationship);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch relationship"
      );
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchRelationship();
  }, [fetchRelationship]);

  return {
    relationship,
    loading,
    error,
    refetch: fetchRelationship,
  };
}

interface FriendRequest {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string | null;
  status: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    gaming_style: string | null;
    region: string | null;
  };
  recipient?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    gaming_style: string | null;
    region: string | null;
  };
}

interface UseFriendRequestsOptions {
  type?: "received" | "sent";
  limit?: number;
}

export function useFriendRequests(options: UseFriendRequestsOptions = {}) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { type = "received", limit = 50 } = options;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("type", type);
      params.set("limit", limit.toString());

      const response = await fetch(`/api/friends/requests?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch friend requests");
      }

      setRequests(data.requests);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch friend requests");
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const acceptRequest = async (requestId: string) => {
    const response = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to accept request") };
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    return { success: true };
  };

  const declineRequest = async (requestId: string) => {
    const response = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline" }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to decline request") };
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    return { success: true };
  };

  const cancelRequest = async (requestId: string) => {
    const response = await fetch(`/api/friends/requests/${requestId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: new Error(data.error || "Failed to cancel request") };
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    return { success: true };
  };

  return {
    requests,
    total,
    loading,
    error,
    refetch: fetchRequests,
    acceptRequest,
    declineRequest,
    cancelRequest,
  };
}
