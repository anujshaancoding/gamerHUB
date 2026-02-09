import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Reply, MoreHorizontal } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { Avatar } from '../ui/Avatar';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: () => void;
  onLongPress?: () => void;
}

export function ChatMessage({
  message,
  isOwn,
  showAvatar = true,
  onReply,
  onLongPress,
}: ChatMessageProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (message.is_deleted) {
    return (
      <View style={[styles.container, isOwn && styles.ownContainer]}>
        <View style={[styles.deletedBubble]}>
          <Text style={styles.deletedText}>Message deleted</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, isOwn && styles.ownContainer]}
      onLongPress={onLongPress}
      activeOpacity={0.9}
    >
      {!isOwn && showAvatar && (
        <Avatar
          imageUrl={message.sender?.avatar_url}
          name={message.sender?.display_name || message.sender?.username}
          size={32}
        />
      )}

      <View style={[styles.bubbleContainer, isOwn && styles.ownBubbleContainer]}>
        {message.reply_to && (
          <View style={styles.replyPreview}>
            <Reply size={12} color={colors.textMuted} />
            <Text style={styles.replyName}>
              {message.reply_to.sender?.display_name || message.reply_to.sender?.username}
            </Text>
            <Text style={styles.replyContent} numberOfLines={1}>
              {message.reply_to.content}
            </Text>
          </View>
        )}

        <View style={[styles.bubble, isOwn && styles.ownBubble]}>
          {!isOwn && showAvatar && (
            <Text style={styles.senderName}>
              {message.sender?.display_name || message.sender?.username}
            </Text>
          )}
          <Text style={[styles.content, isOwn && styles.ownContent]}>
            {message.content}
          </Text>
          <View style={styles.meta}>
            <Text style={[styles.time, isOwn && styles.ownTime]}>
              {formatTime(message.created_at)}
            </Text>
            {message.is_edited && (
              <Text style={[styles.edited, isOwn && styles.ownTime]}>edited</Text>
            )}
          </View>
        </View>

        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactions}>
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <View key={emoji} style={styles.reaction}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {!isOwn && (
        <TouchableOpacity style={styles.replyButton} onPress={onReply}>
          <Reply size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  ownContainer: {
    flexDirection: 'row-reverse',
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  ownBubbleContainer: {
    alignItems: 'flex-end',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  replyName: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  replyContent: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    flex: 1,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderTopLeftRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.sm,
    borderColor: colors.primaryDark,
  },
  senderName: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: 2,
  },
  content: {
    color: colors.text,
    fontSize: fontSize.base,
  },
  ownContent: {
    color: colors.background,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  time: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  ownTime: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  edited: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: fontSize.sm,
  },
  reactionCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  replyButton: {
    padding: spacing.xs,
    opacity: 0.5,
  },
  deletedBubble: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  deletedText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
});
