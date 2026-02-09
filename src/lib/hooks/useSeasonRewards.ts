"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserRewardWithDetails } from "@/types/database";

interface UseSeasonRewardsOptions {
  seasonId?: string;
  status?: string;
  equipped?: boolean;
  limit?: number;
}

interface UseSeasonRewardsReturn {
  rewards: UserRewardWithDetails[];
  total: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  claimReward: (rewardId: string) => Promise<boolean>;
  equipReward: (rewardId: string, equip: boolean) => Promise<boolean>;
  claiming: boolean;
  equipping: boolean;
}

export function useSeasonRewards(
  options: UseSeasonRewardsOptions = {}
): UseSeasonRewardsReturn {
  const [rewards, setRewards] = useState<UserRewardWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = options.limit || 50;

  const fetchRewards = useCallback(
    async (newOffset = 0, append = false) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set("limit", limit.toString());
        params.set("offset", newOffset.toString());

        if (options.seasonId) params.set("season_id", options.seasonId);
        if (options.status) params.set("status", options.status);
        if (options.equipped !== undefined) {
          params.set("equipped", options.equipped.toString());
        }

        const response = await fetch(`/api/rewards?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setRewards([]);
            setTotal(0);
            return;
          }
          throw new Error(data.error || "Failed to fetch rewards");
        }

        if (append) {
          setRewards((prev) => [...prev, ...data.rewards]);
        } else {
          setRewards(data.rewards);
        }
        setTotal(data.total);
        setOffset(newOffset);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [options.seasonId, options.status, options.equipped, limit]
  );

  useEffect(() => {
    fetchRewards(0, false);
  }, [fetchRewards]);

  const loadMore = async () => {
    if (!loading && rewards.length < total) {
      await fetchRewards(offset + limit, true);
    }
  };

  const claimReward = async (rewardId: string): Promise<boolean> => {
    try {
      setClaiming(true);
      setError(null);

      const response = await fetch(`/api/rewards/${rewardId}/claim`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim reward");
      }

      // Update local state
      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? data.reward : r))
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setClaiming(false);
    }
  };

  const equipReward = async (
    rewardId: string,
    equip: boolean
  ): Promise<boolean> => {
    try {
      setEquipping(true);
      setError(null);

      const response = await fetch(`/api/rewards/${rewardId}/equip`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ equip }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update reward");
      }

      // Update local state - unequip others of same type if equipping
      if (equip) {
        const equippedReward = rewards.find((r) => r.id === rewardId);
        setRewards((prev) =>
          prev.map((r) => {
            if (r.id === rewardId) return data.reward;
            if (r.reward_type === equippedReward?.reward_type) {
              return { ...r, is_equipped: false };
            }
            return r;
          })
        );
      } else {
        setRewards((prev) =>
          prev.map((r) => (r.id === rewardId ? data.reward : r))
        );
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    } finally {
      setEquipping(false);
    }
  };

  return {
    rewards,
    total,
    loading,
    error,
    hasMore: rewards.length < total,
    loadMore,
    refetch: () => fetchRewards(0, false),
    claimReward,
    equipReward,
    claiming,
    equipping,
  };
}
