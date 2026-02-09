import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Bell,
  UserPlus,
  Gamepad2,
  Trophy,
  MessageCircle,
  Users,
  Check,
} from 'lucide-react-native';

import { useNotifications } from '../../hooks/useNotifications';
import { colors, spacing, fontSize } from '../../lib/theme';

// Mock notifications for demo
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'friend_request',
    title: 'New Friend Request',
    body: 'Arjun Singh wants to be your friend',
    is_read: false,
    created_at: '2m ago',
  },
  {
    id: '2',
    type: 'match_invite',
    title: 'Match Invitation',
    body: 'You have been invited to join a Valorant match',
    is_read: false,
    created_at: '15m ago',
  },
  {
    id: '3',
    type: 'clan_invite',
    title: 'Clan Invitation',
    body: 'Team Phoenix has invited you to join their clan',
    is_read: true,
    created_at: '1h ago',
  },
  {
    id: '4',
    type: 'message',
    title: 'New Message',
    body: 'Priya sent you a message',
    is_read: true,
    created_at: '2h ago',
  },
  {
    id: '5',
    type: 'achievement',
    title: 'Achievement Unlocked',
    body: 'You earned the "First Blood" badge',
    is_read: true,
    created_at: '1d ago',
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'friend_request':
      return { Icon: UserPlus, color: colors.primary };
    case 'match_invite':
      return { Icon: Gamepad2, color: colors.accent };
    case 'clan_invite':
      return { Icon: Users, color: colors.secondary };
    case 'message':
      return { Icon: MessageCircle, color: colors.warning };
    case 'achievement':
      return { Icon: Trophy, color: colors.success };
    default:
      return { Icon: Bell, color: colors.textMuted };
  }
};

export default function NotificationsScreen() {
  const { markAllAsRead } = useNotifications();

  const renderNotification = ({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) => {
    const { Icon, color } = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.is_read && styles.notificationUnread,
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Icon color={color} size={20} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>{item.created_at}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length} new
        </Text>
        <TouchableOpacity onPress={() => markAllAsRead()}>
          <View style={styles.markAllButton}>
            <Check color={colors.primary} size={16} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={MOCK_NOTIFICATIONS}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell color={colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyDescription}>
              You're all caught up!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  markAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  notificationUnread: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notificationBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
