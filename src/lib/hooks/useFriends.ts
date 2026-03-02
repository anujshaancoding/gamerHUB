"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type {
  FriendWithProfile,
  SocialCounts,
  RelationshipStatus,
} from "@/types/database";
import { useSocket } from "@/lib/realtime/SocketProvider";

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
  const hasFetched = useRef(false);

  const { userId, search, limit = 50 } = options;

  const fetchFriends = useCallback(async () => {
    if (!hasFetched.current) {
      setLoading(true);
    }
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
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch friends");
    } finally {
      setLoading(false);
    }
  }, [userId, search, limit]);

  useEffect(() => {
    // Skip fetching if no userId is provided and auth is required server-side
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchFriends();
  }, [fetchFriends, userId]);

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
  const hasFetched = useRef(false);
  const { socket } = useSocket();

  const fetchCounts = useCallback(async () => {
    if (!hasFetched.current) {
      setLoading(true);
    }
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
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch counts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchCounts();
  }, [fetchCounts, userId]);

  // Listen for real-time friend request events to update counts instantly
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewRequest = () => {
      setCounts((prev) => ({
        ...prev,
        pending_requests: prev.pending_requests + 1,
      }));
    };

    const handleRequestRemoved = () => {
      setCounts((prev) => ({
        ...prev,
        pending_requests: Math.max(0, prev.pending_requests - 1),
      }));
    };

    const handleRequestAccepted = () => {
      // Friend count goes up when someone accepts our request
      setCounts((prev) => ({
        ...prev,
        friends: prev.friends + 1,
      }));
    };

    // New incoming friend request → increment pending
    socket.on("friend-request:new", handleNewRequest);
    // We accepted/declined a request → decrement our pending
    // (handled locally in useFriendRequests, but also update count)
    socket.on("friend-request:cancelled", handleRequestRemoved);
    // Someone accepted our sent request → increment friends
    socket.on("friend-request:accepted", handleRequestAccepted);

    return () => {
      socket.off("friend-request:new", handleNewRequest);
      socket.off("friend-request:cancelled", handleRequestRemoved);
      socket.off("friend-request:accepted", handleRequestAccepted);
    };
  }, [socket, userId]);

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
  const hasFetched = useRef(false);

  const fetchRelationship = useCallback(async () => {
    if (!targetUserId) {
      setRelationship(null);
      setLoading(false);
      return;
    }

    if (!hasFetched.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/friends/${targetUserId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch relationship");
      }

      setRelationship(data.relationship);
      hasFetched.current = true;
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

export function useFriendRequests(options: UseFriendRequestsOptions & { userId?: string } = {}) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const hasFetched = useRef(false);
  const { socket } = useSocket();

  const { type = "received", limit = 50, userId } = options;

  const fetchRequests = useCallback(async () => {
    if (!hasFetched.current) {
      setLoading(true);
    }
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
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch friend requests");
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchRequests();
  }, [fetchRequests, userId]);

  // Listen for real-time friend request events and refetch
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewRequest = () => {
      if (type === "received") {
        fetchRequests();
      }
    };

    const handleRequestCancelled = () => {
      if (type === "received") {
        fetchRequests();
      }
    };

    const handleRequestAccepted = () => {
      if (type === "sent") {
        fetchRequests();
      }
    };

    const handleRequestDeclined = () => {
      if (type === "sent") {
        fetchRequests();
      }
    };

    socket.on("friend-request:new", handleNewRequest);
    socket.on("friend-request:cancelled", handleRequestCancelled);
    socket.on("friend-request:accepted", handleRequestAccepted);
    socket.on("friend-request:declined", handleRequestDeclined);

    return () => {
      socket.off("friend-request:new", handleNewRequest);
      socket.off("friend-request:cancelled", handleRequestCancelled);
      socket.off("friend-request:accepted", handleRequestAccepted);
      socket.off("friend-request:declined", handleRequestDeclined);
    };
  }, [socket, userId, type, fetchRequests]);

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
