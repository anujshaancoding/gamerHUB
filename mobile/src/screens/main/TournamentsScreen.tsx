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
import { Trophy, Plus, Filter } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useTournaments } from '../../hooks';
import { TournamentCard } from '../../components/tournament';
import { Tournament } from '../../types/tournament';

type FilterStatus = 'all' | 'registration' | 'in_progress' | 'completed';

export default function TournamentsScreen({ navigation }: any) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const { tournaments, myTournaments, isLoading, refetch, joinTournament, isJoining } = useTournaments(
    filterStatus === 'all' ? {} : { status: filterStatus as Tournament['status'] }
  );

  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse');

  const displayTournaments = activeTab === 'my' ? myTournaments : tournaments;

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'registration', label: 'Open' },
    { key: 'in_progress', label: 'Live' },
    { key: 'completed', label: 'Completed' },
  ];

  const handleTournamentPress = (tournament: Tournament) => {
    navigation.navigate('TournamentDetails', { tournamentId: tournament.id });
  };

  const renderTournament = ({ item }: { item: Tournament }) => (
    <TournamentCard
      tournament={item}
      onPress={() => handleTournamentPress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
            Browse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Tournaments
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'browse' && (
        <View style={styles.filters}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                filterStatus === filter.key && styles.activeFilterChip,
              ]}
              onPress={() => setFilterStatus(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === filter.key && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={displayTournaments}
        keyExtractor={(item) => item.id}
        renderItem={renderTournament}
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
            <Text style={styles.emptyTitle}>
              {activeTab === 'my' ? 'No Tournaments Joined' : 'No Tournaments Found'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'my'
                ? 'Join a tournament to compete with others!'
                : 'Check back later for new tournaments'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTournament')}
      >
        <Plus size={24} color={colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  activeFilterText: {
    color: colors.background,
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
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
