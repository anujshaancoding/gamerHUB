import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserBadge, BadgeDefinition } from '../types/gamification';

interface UseBadgesOptions {
  userId?: string;
  category?: string;
  rarity?: string;
}

async function fetchUserBadges(userId: string, options: UseBadgesOptions): Promise<UserBadge[]> {
  let query = supabase
    .from('user_badges')
    .select(`
      *,
      badge:badge_definitions(*)
    `)
    .eq('user_id', userId);

  if (options.category) {
    query = query.eq('badge.category', options.category);
  }

  if (options.rarity) {
    query = query.eq('badge.rarity', options.rarity);
  }

  const { data, error } = await query.order('earned_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UserBadge[];
}

async function fetchAllBadges(options: Pick<UseBadgesOptions, 'category' | 'rarity'>): Promise<BadgeDefinition[]> {
  let query = supabase
    .from('badge_definitions')
    .select('*');

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.rarity) {
    query = query.eq('rarity', options.rarity);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return (data || []) as BadgeDefinition[];
}

export function useBadges(options: UseBadgesOptions = {}) {
  const { user } = useAuth();
  const targetUserId = options.userId || user?.id;

  const userBadgesQuery = useQuery({
    queryKey: ['user-badges', targetUserId, options.category, options.rarity],
    queryFn: () => fetchUserBadges(targetUserId!, options),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const allBadgesQuery = useQuery({
    queryKey: ['badge-definitions', options.category, options.rarity],
    queryFn: () => fetchAllBadges(options),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const badges = userBadgesQuery.data ?? [];
  const allBadges = allBadgesQuery.data ?? [];

  const badgesByCategory = useMemo(() => {
    return badges.reduce((acc, badge) => {
      const cat = badge.badge.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(badge);
      return acc;
    }, {} as Record<string, UserBadge[]>);
  }, [badges]);

  const badgesByRarity = useMemo(() => {
    return badges.reduce((acc, badge) => {
      const rar = badge.badge.rarity;
      if (!acc[rar]) acc[rar] = [];
      acc[rar].push(badge);
      return acc;
    }, {} as Record<string, UserBadge[]>);
  }, [badges]);

  const stats = useMemo(() => {
    const earnedCount = badges.length;
    const totalCount = allBadges.filter((b) => !b.is_secret).length;
    const completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
    return { earnedCount, totalCount, completionPercentage };
  }, [badges, allBadges]);

  const earnedBadgeIds = useMemo(
    () => new Set(badges.map((b) => b.badge_id)),
    [badges]
  );

  const hasBadge = (badgeId: string) => earnedBadgeIds.has(badgeId);

  return {
    badges,
    allBadges,
    badgesByCategory,
    badgesByRarity,
    isLoading: userBadgesQuery.isLoading || allBadgesQuery.isLoading,
    error: userBadgesQuery.error?.message || allBadgesQuery.error?.message || null,
    refetch: userBadgesQuery.refetch,
    earnedCount: stats.earnedCount,
    totalCount: stats.totalCount,
    completionPercentage: stats.completionPercentage,
    hasBadge,
  };
}
