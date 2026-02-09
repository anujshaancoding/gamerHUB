import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Users, Globe } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useLeaderboard, useAuth } from '../../hooks';
import { LeaderboardEntry } from '../../components/gamification';
import { LeaderboardEntry as LeaderboardEntryType } from '../../types/gamification';

type LeaderboardType = 'global' | 'friends';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('global');

  const { leaderboard, userRank, currentSeason, isLoading, refetch } = useLeaderboard({
    type: leaderboardType,
    limit: 100,
  });

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardEntryType }) => (
    <LeaderboardEntry
      entry={item}
      isCurrentUser={item.user_id === user?.id}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {currentSeason && (
        <View style={styles.seasonHeader}>
          <Trophy size={20} color={colors.warning} />
          <Text style={styles.seasonName}>{currentSeason.name}</Text>
          <Text style={styles.seasonInfo}>Season {currentSeason.number}</Text>
        </View>
      )}

      {userRank && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankLabel}>Your Global Rank</Text>
          <Text style={styles.userRankValue}>#{userRank}</Text>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, leaderboardType === 'global' && styles.activeTab]}
          onPress={() => setLeaderboardType('global')}
        >
          <Globe size={18} color={leaderboardType === 'global' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, leaderboardType === 'global' && styles.activeTabText]}>
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, leaderboardType === 'friends' && styles.activeTab]}
          onPress={() => setLeaderboardType('friends')}
        >
          <Users size={18} color={leaderboardType === 'friends' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, leaderboardType === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        renderItem={renderLeaderboardEntry}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Trophy size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyText}>
              {leaderboardType === 'friends'
                ? 'Add friends to see how you compare!'
                : 'Start playing to appear on the leaderboard'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  seasonName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  seasonInfo: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  userRankCard: {
    backgroundColor: colors.primaryTransparent,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  userRankLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  userRankValue: {
    color: colors.primary,
    fontSize: fontSize['3xl'],
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primaryTransparent,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
