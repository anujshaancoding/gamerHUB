import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserProgression } from '../types/gamification';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

async function fetchProgression(userId: string): Promise<UserProgression | null> {
  const { data, error } = await supabase
    .from('user_progression')
    .select(`
      *,
      active_title:titles(*),
      active_frame:profile_frames(*),
      active_theme:profile_themes(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as UserProgression;
}

export function useProgression(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  const progressionQuery = useQuery({
    queryKey: ['progression', targetUserId],
    queryFn: () => fetchProgression(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const equipTitleMutation = useMutation({
    mutationFn: async (titleId: string | null) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_progression')
        .update({ active_title_id: titleId })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression'] });
    },
  });

  const equipFrameMutation = useMutation({
    mutationFn: async (frameId: string | null) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_progression')
        .update({ active_frame_id: frameId })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression'] });
    },
  });

  const equipThemeMutation = useMutation({
    mutationFn: async (themeId: string | null) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_progression')
        .update({ active_theme_id: themeId })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression'] });
    },
  });

  const updateShowcaseBadgesMutation = useMutation({
    mutationFn: async (badgeIds: string[]) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_progression')
        .update({ showcase_badges: badgeIds })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression'] });
    },
  });

  const progression = progressionQuery.data;
  const progressPercentage = progression
    ? Math.round((progression.current_level_xp / progression.xp_to_next_level) * 100)
    : 0;

  return {
    progression,
    isLoading: progressionQuery.isLoading,
    error: progressionQuery.error?.message || null,
    refetch: progressionQuery.refetch,
    progressPercentage,
    equipTitle: equipTitleMutation.mutateAsync,
    equipFrame: equipFrameMutation.mutateAsync,
    equipTheme: equipThemeMutation.mutateAsync,
    updateShowcaseBadges: updateShowcaseBadgesMutation.mutateAsync,
    isEquipping: equipTitleMutation.isPending || equipFrameMutation.isPending || equipThemeMutation.isPending,
  };
}
