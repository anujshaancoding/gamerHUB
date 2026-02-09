import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Users, Search, Plus, Shield, Crown } from 'lucide-react-native';

import { Card, Avatar, Badge, Button, Input } from '../../components/ui';
import { colors, spacing, fontSize } from '../../lib/theme';

// Mock data for clans
const MOCK_CLANS = [
  {
    id: '1',
    name: 'Team Phoenix',
    tag: 'PHX',
    description: 'Competitive Valorant team based in Mumbai',
    avatar_url: null,
    member_count: 24,
    games: ['Valorant', 'CS2'],
    is_public: true,
  },
  {
    id: '2',
    name: 'Dragon Squad',
    tag: 'DRG',
    description: 'BGMI clan looking for skilled players',
    avatar_url: null,
    member_count: 56,
    games: ['BGMI', 'Free Fire'],
    is_public: true,
  },
  {
    id: '3',
    name: 'Apex Predators',
    tag: 'APEX',
    description: 'Top-tier Apex Legends players',
    avatar_url: null,
    member_count: 18,
    games: ['Apex Legends'],
    is_public: true,
  },
];

const TABS = ['Discover', 'My Clans', 'Invites'];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('Discover');
  const [searchQuery, setSearchQuery] = useState('');

  const renderClanCard = ({ item }: { item: typeof MOCK_CLANS[0] }) => (
    <Card style={styles.clanCard}>
      <View style={styles.clanHeader}>
        <Avatar
          uri={item.avatar_url}
          name={item.name}
          size={56}
        />
        <View style={styles.clanInfo}>
          <View style={styles.clanNameRow}>
            <Text style={styles.clanName}>{item.name}</Text>
            <Badge label={`[${item.tag}]`} variant="primary" size="sm" />
          </View>
          <View style={styles.clanMeta}>
            <Users color={colors.textMuted} size={14} />
            <Text style={styles.clanMemberCount}>{item.member_count} members</Text>
          </View>
        </View>
      </View>

      <Text style={styles.clanDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.clanGames}>
        {item.games.map((game) => (
          <Badge key={game} label={game} variant="default" size="sm" />
        ))}
      </View>

      <View style={styles.clanActions}>
        <Button
          title="View"
          variant="outline"
          size="sm"
          onPress={() => {}}
          style={{ flex: 1 }}
        />
        <Button
          title="Join"
          size="sm"
          onPress={() => {}}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Shield color={colors.textMuted} size={48} />
      <Text style={styles.emptyTitle}>No clans found</Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'My Clans'
          ? "You haven't joined any clans yet"
          : activeTab === 'Invites'
          ? "You don't have any pending invites"
          : 'Try adjusting your search'}
      </Text>
      {activeTab === 'My Clans' && (
        <Button
          title="Create a Clan"
          onPress={() => {}}
          icon={<Plus color={colors.background} size={20} />}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search clans..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search color={colors.textMuted} size={20} />}
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'Discover' ? MOCK_CLANS : []}
        renderItem={renderClanCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Clan FAB */}
      <TouchableOpacity style={styles.fab}>
        <Plus color={colors.background} size={24} />
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
    paddingBottom: 0,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.md,
  },
  clanCard: {
    gap: spacing.md,
  },
  clanHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  clanInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  clanNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  clanName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  clanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clanMemberCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  clanDescription: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  clanGames: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  clanActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    marginBottom: spacing.md,
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
