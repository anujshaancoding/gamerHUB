import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Conversation, ChatMessage, ConversationParticipant } from '../types/chat';

async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation:conversations(
        *,
        participants:conversation_participants(*, user:profiles(*)),
        last_message:messages(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data?.map((p) => {
    const conv = p.conversation as any;
    // Get unread count
    const participant = conv.participants?.find((part: any) => part.user_id === userId);
    const lastReadAt = participant?.last_read_at ? new Date(participant.last_read_at) : new Date(0);
    const unreadCount = conv.last_message?.created_at && new Date(conv.last_message.created_at) > lastReadAt ? 1 : 0;

    return {
      ...conv,
      unread_count: unreadCount,
    };
  }) || []) as Conversation[];
}

async function fetchMessages(conversationId: string, limit = 50): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(*),
      reply_to:messages!reply_to_id(*, sender:profiles(*)),
      reactions:message_reactions(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).reverse() as ChatMessage[];
}

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
    staleTime: 1000 * 30,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const createConversationMutation = useMutation({
    mutationFn: async ({ userIds, name, type = 'direct' }: { userIds: string[]; name?: string; type?: 'direct' | 'group' }) => {
      if (!user) throw new Error('Not authenticated');

      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type,
          name: type === 'group' ? name : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [user.id, ...userIds].map((userId) => ({
        conversation_id: conv.id,
        user_id: userId,
        role: userId === user.id ? 'owner' : 'member',
      }));

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      return conv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const totalUnread = conversationsQuery.data?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;

  return {
    conversations: conversationsQuery.data ?? [],
    totalUnread,
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error?.message || null,
    refetch: conversationsQuery.refetch,
    createConversation: createConversationMutation.mutateAsync,
    isCreating: createConversationMutation.isPending,
  };
}

export function useChat(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 1000 * 10,
  });

  // Real-time subscription for new messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, replyToId }: { content: string; replyToId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: 'text',
          reply_to_id: replyToId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true, content: '[Message deleted]' })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('message_reactions').insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error?.message || null,
    refetch: messagesQuery.refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutate,
    deleteMessage: deleteMessageMutation.mutateAsync,
    addReaction: addReactionMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
}
