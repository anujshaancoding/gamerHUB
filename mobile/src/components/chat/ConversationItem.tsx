import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { Conversation } from '../../types/chat';
import { Avatar } from '../ui/Avatar';

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId?: string;
  onPress?: () => void;
}

export function ConversationItem({ conversation, currentUserId, onPress }: ConversationItemProps) {
  const isGroup = conversation.type === 'group';

  // Get the other participant for direct messages
  const otherParticipant = !isGroup
    ? conversation.participants?.find((p) => p.user_id !== currentUserId)?.user
    : null;

  const displayName = isGroup
    ? conversation.name || 'Group Chat'
    : otherParticipant?.display_name || otherParticipant?.username || 'Unknown';

  const avatarUrl = isGroup ? conversation.avatar_url : otherParticipant?.avatar_url;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  return (
    <TouchableOpacity
      style={[styles.container, unreadCount > 0 && styles.unread]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        {isGroup ? (
          <View style={styles.groupAvatar}>
            <Users size={24} color={colors.primary} />
          </View>
        ) : (
          <Avatar
            imageUrl={avatarUrl}
            name={displayName}
            size={50}
            showOnlineStatus={otherParticipant?.is_online}
          />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, unreadCount > 0 && styles.unreadText]} numberOfLines={1}>
            {displayName}
          </Text>
          {lastMessage && (
            <Text style={styles.time}>{formatTime(lastMessage.created_at)}</Text>
          )}
        </View>
        <View style={styles.messageRow}>
          {lastMessage ? (
            <Text style={[styles.message, unreadCount > 0 && styles.unreadText]} numberOfLines={1}>
              {lastMessage.sender_id === currentUserId ? 'You: ' : ''}
              {lastMessage.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>No messages yet</Text>
          )}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unread: {
    backgroundColor: colors.primaryTransparent,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadText: {
    fontWeight: '700',
  },
  time: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  noMessages: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
