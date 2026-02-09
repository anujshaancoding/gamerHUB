"use client";

import { useEffect, useState, useCallback } from "react";
import type { FriendRequestWithProfiles } from "@/types/database";

interface UseFriendRequestsOptions {
  type?: "received" | "sent";
  limit?: number;
}

export function useFriendRequests(options: UseFriendRequestsOptions = {}) {
  const [requests, setRequests] = useState<FriendRequestWithProfiles[]>([]);
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
      setError(
        err instanceof Error ? err.message : "Failed to fetch friend requests"
      );
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
