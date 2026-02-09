import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { LFGPost, LFGApplication } from '../types/lfg';

interface UseLFGOptions {
  gameId?: string;
  region?: string;
  micRequired?: boolean;
  status?: LFGPost['status'];
  limit?: number;
}

async function fetchLFGPosts(options: UseLFGOptions): Promise<LFGPost[]> {
  let query = supabase
    .from('lfg_posts')
    .select(`
      *,
      user:profiles(*),
      game:games(*),
      applications:lfg_applications(count)
    `)
    .in('status', ['open', 'full'])
    .order('created_at', { ascending: false });

  if (options.gameId) {
    query = query.eq('game_id', options.gameId);
  }

  if (options.region) {
    query = query.eq('region', options.region);
  }

  if (options.micRequired !== undefined) {
    query = query.eq('mic_required', options.micRequired);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as LFGPost[];
}

async function fetchLFGPost(postId: string): Promise<LFGPost | null> {
  const { data, error } = await supabase
    .from('lfg_posts')
    .select(`
      *,
      user:profiles(*),
      game:games(*),
      applications:lfg_applications(*, user:profiles(*))
    `)
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as LFGPost;
}

async function fetchMyLFGPosts(userId: string): Promise<LFGPost[]> {
  const { data, error } = await supabase
    .from('lfg_posts')
    .select(`
      *,
      game:games(*),
      applications:lfg_applications(*, user:profiles(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as LFGPost[];
}

export function useLFG(options: UseLFGOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['lfg-posts', options],
    queryFn: () => fetchLFGPosts(options),
    staleTime: 1000 * 60, // 1 minute
  });

  const myPostsQuery = useQuery({
    queryKey: ['my-lfg-posts', user?.id],
    queryFn: () => fetchMyLFGPosts(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  // Real-time subscription for LFG updates
  useEffect(() => {
    const channel = supabase
      .channel('lfg_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lfg_posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lfg-posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createPostMutation = useMutation({
    mutationFn: async (postData: Omit<LFGPost, 'id' | 'user_id' | 'user' | 'game' | 'applications' | 'created_at' | 'updated_at' | 'slots_filled'>) => {
      if (!user) throw new Error('Not authenticated');

      // Calculate expiration based on duration
      const durationMap = {
        '1hr': 1,
        '2hr': 2,
        '4hr': 4,
        '8hr': 8,
        'until_full': 24,
      };
      const hours = durationMap[postData.duration] || 4;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('lfg_posts')
        .insert({
          ...postData,
          user_id: user.id,
          slots_filled: 1, // Creator takes one slot
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-posts'] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, ...updates }: { postId: string } & Partial<LFGPost>) => {
      const { error } = await supabase
        .from('lfg_posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('lfg_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-posts'] });
    },
  });

  const applyToPostMutation = useMutation({
    mutationFn: async ({ postId, message, role }: { postId: string; message?: string; role?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('lfg_applications').insert({
        lfg_post_id: postId,
        user_id: user.id,
        message,
        role,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-posts'] });
    },
  });

  const handleApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: 'accepted' | 'rejected' }) => {
      const { data: app, error: fetchError } = await supabase
        .from('lfg_applications')
        .select('lfg_post_id')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('lfg_applications')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;

      // If accepted, increment slots_filled
      if (status === 'accepted') {
        await supabase.rpc('increment_lfg_slots', { post_id: app.lfg_post_id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-posts'] });
    },
  });

  return {
    posts: postsQuery.data ?? [],
    myPosts: myPostsQuery.data ?? [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error?.message || null,
    refetch: postsQuery.refetch,
    createPost: createPostMutation.mutateAsync,
    updatePost: updatePostMutation.mutateAsync,
    deletePost: deletePostMutation.mutateAsync,
    applyToPost: applyToPostMutation.mutateAsync,
    handleApplication: handleApplicationMutation.mutateAsync,
    isCreating: createPostMutation.isPending,
    isApplying: applyToPostMutation.isPending,
  };
}

export function useLFGPost(postId: string) {
  const { user } = useAuth();

  const postQuery = useQuery({
    queryKey: ['lfg-post', postId],
    queryFn: () => fetchLFGPost(postId),
    enabled: !!postId,
    staleTime: 1000 * 30,
  });

  const post = postQuery.data;
  const isOwner = post?.user_id === user?.id;
  const hasApplied = post?.applications?.some((a) => a.user_id === user?.id);
  const myApplication = post?.applications?.find((a) => a.user_id === user?.id);

  return {
    post,
    isOwner,
    hasApplied,
    myApplication,
    isLoading: postQuery.isLoading,
    error: postQuery.error?.message || null,
    refetch: postQuery.refetch,
  };
}
