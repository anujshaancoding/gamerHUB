import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { LeaderboardEntry, Season } from '../types/gamification';

interface UseLeaderboardOptions {
  type?: 'global' | 'friends' | 'region';
  seasonId?: string;
  limit?: number;
}

async function fetchLeaderboard(
  options: UseLeaderboardOptions,
  userId?: string
): Promise<LeaderboardEntry[]> {
  const limit = options.limit || 100;

  let query = supabase
    .from('user_progression')
    .select(`
      user_id,
      total_xp,
      level,
      prestige_level,
      user:profiles!user_id(
        username,
        display_name,
        avatar_url,
        region
      )
    `)
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (options.type === 'friends' && userId) {
    const { data: friends } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    const friendIds = friends?.map((f) => f.friend_id) || [];
    friendIds.push(userId);

    query = query.in('user_id', friendIds);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((entry, index) => ({
    rank: index + 1,
    user_id: entry.user_id,
    username: (entry.user as any)?.username || 'Unknown',
    display_name: (entry.user as any)?.display_name,
    avatar_url: (entry.user as any)?.avatar_url,
    total_xp: entry.total_xp,
    level: entry.level,
    prestige_level: entry.prestige_level,
    score: entry.total_xp,
  }));
}

async function fetchUserRank(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('user_progression')
    .select('total_xp')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  const { count } = await supabase
    .from('user_progression')
    .select('*', { count: 'exact', head: true })
    .gt('total_xp', data.total_xp);

  return (count || 0) + 1;
}

async function fetchCurrentSeason(): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .order('number', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Season;
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { user } = useAuth();

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', options.type, options.seasonId, options.limit],
    queryFn: () => fetchLeaderboard(options, user?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const userRankQuery = useQuery({
    queryKey: ['user-rank', user?.id],
    queryFn: () => fetchUserRank(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const seasonQuery = useQuery({
    queryKey: ['current-season'],
    queryFn: fetchCurrentSeason,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const leaderboard = leaderboardQuery.data ?? [];
  const userEntry = leaderboard.find((e) => e.user_id === user?.id);

  return {
    leaderboard,
    userRank: userRankQuery.data,
    userEntry,
    currentSeason: seasonQuery.data,
    isLoading: leaderboardQuery.isLoading,
    error: leaderboardQuery.error?.message || null,
    refetch: leaderboardQuery.refetch,
  };
}
