"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query";

interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: "skill" | "social" | "milestone" | "seasonal" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  xp_reward: number;
  game_id: string | null;
  is_secret: boolean;
  unlock_criteria: Record<string, unknown>;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress: Record<string, unknown>;
  season: string | null;
  badge: BadgeDefinition;
}

interface UseBadgesOptions {
  userId?: string;
  category?: string;
  rarity?: string;
}

async function fetchUserBadges(
  options: UseBadgesOptions
): Promise<UserBadge[]> {
  const { userId, category, rarity } = options;
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (rarity) params.set("rarity", rarity);

  const endpoint = userId
    ? `/api/badges/user/${userId}?${params}`
    : `/api/badges/user?${params}`;

  const response = await fetch(endpoint);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch badges");
  }

  return data.badges || [];
}

async function fetchAllBadges(
  options: Pick<UseBadgesOptions, "category" | "rarity">
): Promise<BadgeDefinition[]> {
  const { category, rarity } = options;
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (rarity) params.set("rarity", rarity);

  const response = await fetch(`/api/badges?${params}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch badges");
  }

  return data.badges || [];
}

export function useBadges(options: UseBadgesOptions = {}) {
  const { userId, category, rarity } = options;

  const {
    data: badges,
    isLoading: badgesLoading,
    error: badgesError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.badges(userId),
    queryFn: () => fetchUserBadges(options),
    staleTime: STALE_TIMES.USER_BADGES,
  });

  const {
    data: allBadges,
    isLoading: allBadgesLoading,
  } = useQuery({
    queryKey: queryKeys.badgeDefinitions,
    queryFn: () => fetchAllBadges({ category, rarity }),
    staleTime: STALE_TIMES.BADGES,
  });

  const badgesList = badges ?? [];
  const allBadgesList = allBadges ?? [];

  // Group badges by category (memoized)
  const badgesByCategory = useMemo(() => {
    return badgesList.reduce(
      (acc, badge) => {
        const cat = badge.badge.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(badge);
        return acc;
      },
      {} as Record<string, UserBadge[]>
    );
  }, [badgesList]);

  // Group badges by rarity (memoized)
  const badgesByRarity = useMemo(() => {
    return badgesList.reduce(
      (acc, badge) => {
        const rar = badge.badge.rarity;
        if (!acc[rar]) acc[rar] = [];
        acc[rar].push(badge);
        return acc;
      },
      {} as Record<string, UserBadge[]>
    );
  }, [badgesList]);

  // Calculate completion stats (memoized)
  const stats = useMemo(() => {
    const earnedCount = badgesList.length;
    const totalCount = allBadgesList.filter((b) => !b.is_secret).length;
    const completionPercentage =
      totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
    return { earnedCount, totalCount, completionPercentage };
  }, [badgesList, allBadgesList]);

  // Check if a badge is earned (memoized Set for O(1) lookup)
  const earnedBadgeIds = useMemo(
    () => new Set(badgesList.map((b) => b.badge_id)),
    [badgesList]
  );

  const hasBadge = (badgeId: string) => earnedBadgeIds.has(badgeId);

  return {
    badges: badgesList,
    allBadges: allBadgesList,
    badgesByCategory,
    badgesByRarity,
    loading: badgesLoading || allBadgesLoading,
    error: badgesError instanceof Error ? badgesError.message : null,
    refetch,
    earnedCount: stats.earnedCount,
    totalCount: stats.totalCount,
    completionPercentage: stats.completionPercentage,
    hasBadge,
  };
}
