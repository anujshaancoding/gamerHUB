"use client";

import { useEffect, useState, useCallback } from "react";
import type { Profile } from "@/types/database";

interface ProfileWithFollowDate extends Profile {
  followed_at?: string;
}

interface UseFollowingOptions {
  userId?: string;
  search?: string;
  limit?: number;
}

export function useFollowing(options: UseFollowingOptions = {}) {
  const [following, setFollowing] = useState<ProfileWithFollowDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { userId, search, limit = 50 } = options;

  const fetchFollowing = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (search) params.set("search", search);
      params.set("limit", limit.toString());

      const response = await fetch(`/api/friends/following?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch following");
      }

      setFollowing(data.following);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch following"
      );
    } finally {
      setLoading(false);
    }
  }, [userId, search, limit]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  return {
    following,
    total,
    loading,
    error,
    refetch: fetchFollowing,
  };
}

export function useFollowers(options: UseFollowingOptions = {}) {
  const [followers, setFollowers] = useState<ProfileWithFollowDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { userId, search, limit = 50 } = options;

  const fetchFollowers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (search) params.set("search", search);
      params.set("limit", limit.toString());

      const response = await fetch(`/api/friends/followers?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch followers");
      }

      setFollowers(data.followers);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch followers"
      );
    } finally {
      setLoading(false);
    }
  }, [userId, search, limit]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  return {
    followers,
    total,
    loading,
    error,
    refetch: fetchFollowers,
  };
}
