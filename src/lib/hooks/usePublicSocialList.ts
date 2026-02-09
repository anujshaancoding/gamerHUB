"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProfileWithRelationship } from "@/app/api/users/[userId]/social/route";

interface UsePublicSocialListOptions {
  userId: string;
  listType: "friends" | "followers" | "following";
  search?: string;
  limit?: number;
  enabled?: boolean;
}

interface UsePublicSocialListReturn {
  users: ProfileWithRelationship[];
  total: number;
  loading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  refetch: () => Promise<void>;
}

export function usePublicSocialList(options: UsePublicSocialListOptions): UsePublicSocialListReturn {
  const { userId, listType, search, limit = 50, enabled = true } = options;

  const [users, setUsers] = useState<ProfileWithRelationship[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async (loadMore = false) => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentOffset = loadMore ? offset : 0;
      const params = new URLSearchParams({
        type: listType,
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/users/${userId}/social?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch social list");
      }

      if (loadMore) {
        setUsers((prev) => [...prev, ...(data.users || [])]);
      } else {
        setUsers(data.users || []);
      }
      setTotal(data.total || 0);
      setOffset(currentOffset + limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId, listType, search, limit, offset, enabled]);

  // Reset and fetch when dependencies change
  useEffect(() => {
    setUsers([]);
    setOffset(0);
    fetchList(false);
  }, [userId, listType, search, enabled]);

  const loadMore = async () => {
    await fetchList(true);
  };

  const refetch = async () => {
    setUsers([]);
    setOffset(0);
    await fetchList(false);
  };

  return {
    users,
    total,
    loading,
    error,
    loadMore,
    hasMore: users.length < total,
    refetch,
  };
}
