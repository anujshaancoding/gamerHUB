import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { PlatformConnection, IntegrationSyncResult } from '../types/integrations';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

async function fetchConnections(userId: string): Promise<PlatformConnection[]> {
  const { data, error } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PlatformConnection[];
}

export function useIntegrations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: () => fetchConnections(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const connectPlatformMutation = useMutation({
    mutationFn: async (platform: PlatformConnection['platform']) => {
      // Open OAuth URL in browser
      const authUrl = `${SUPABASE_URL}/api/integrations/${platform}/connect`;
      await Linking.openURL(authUrl);
    },
  });

  const disconnectPlatformMutation = useMutation({
    mutationFn: async (platform: PlatformConnection['platform']) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('platform_connections')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  const syncPlatformMutation = useMutation({
    mutationFn: async (platform: PlatformConnection['platform']): Promise<IntegrationSyncResult> => {
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`${SUPABASE_URL}/api/integrations/sync/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sync failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['user-games'] });
    },
  });

  const connections = connectionsQuery.data ?? [];

  const isConnected = (platform: PlatformConnection['platform']) =>
    connections.some((c) => c.platform === platform && c.is_active);

  const getConnection = (platform: PlatformConnection['platform']) =>
    connections.find((c) => c.platform === platform && c.is_active);

  return {
    connections,
    isLoading: connectionsQuery.isLoading,
    error: connectionsQuery.error?.message || null,
    refetch: connectionsQuery.refetch,
    connectPlatform: connectPlatformMutation.mutateAsync,
    disconnectPlatform: disconnectPlatformMutation.mutateAsync,
    syncPlatform: syncPlatformMutation.mutateAsync,
    isConnected,
    getConnection,
    isConnecting: connectPlatformMutation.isPending,
    isSyncing: syncPlatformMutation.isPending,
  };
}

export function useGameStats(gameId: string) {
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ['game-stats', user?.id, gameId],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    },
    enabled: !!user && !!gameId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error?.message || null,
    refetch: statsQuery.refetch,
  };
}
