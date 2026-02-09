import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Search, Edit, MessageCircle } from 'lucide-react-native';

import { Avatar, Input } from '../../components/ui';
import { colors, spacing, fontSize } from '../../lib/theme';

// Mock data for conversations
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    name: 'Arjun Singh',
    username: 'ProPlayer99',
    avatar_url: null,
    last_message: 'Hey, ready for the match tonight?',
    last_message_time: '2m ago',
    unread_count: 2,
    is_online: true,
  },
  {
    id: '2',
    name: 'Team Phoenix',
    username: null,
    avatar_url: null,
    last_message: 'Rahul: Good game everyone!',
    last_message_time: '15m ago',
    unread_count: 0,
    is_online: false,
    is_group: true,
    member_count: 5,
  },
  {
    id: '3',
    name: 'Priya Sharma',
    username: 'NinjaMaster',
    avatar_url: null,
    last_message: 'Thanks for the tips!',
    last_message_time: '1h ago',
    unread_count: 0,
    is_online: true,
  },
  {
    id: '4',
    name: 'Match #2847',
    username: null,
    avatar_url: null,
    last_message: "Let's coordinate in voice chat",
    last_message_time: '3h ago',
    unread_count: 5,
    is_online: false,
    is_group: true,
    member_count: 10,
  },
];

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = MOCK_CONVERSATIONS.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: typeof MOCK_CONVERSATIONS[0] }) => (
    <TouchableOpacity style={styles.conversationItem}>
      <View style={styles.avatarContainer}>
        <Avatar
          uri={item.avatar_url}
          name={item.name}
          size={52}
          showOnlineStatus={!item.is_group}
          isOnline={item.is_online}
        />
        {item.is_group && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{item.member_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.conversationTime}>{item.last_message_time}</Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text
            style={[
              styles.lastMessage,
              item.unread_count > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.last_message}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unread_count > 9 ? '9+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search color={colors.textMuted} size={20} />}
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageCircle color={colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDescription}>
              Start a conversation with other gamers
            </Text>
          </View>
        }
      />

      {/* New Message FAB */}
      <TouchableOpacity style={styles.fab}>
        <Edit color={colors.background} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  groupBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  groupBadgeText: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  conversationTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.sm,
  },
  lastMessageUnread: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
