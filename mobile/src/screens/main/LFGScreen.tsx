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
import { Users, Plus, Filter, Mic, Globe } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useLFG, useAuth, useGames } from '../../hooks';
import { LFGPostCard } from '../../components/lfg';
import { LFGPost } from '../../types/lfg';

export default function LFGScreen({ navigation }: any) {
  const { user } = useAuth();
  const { games } = useGames();
  const [selectedGame, setSelectedGame] = useState<string | undefined>();
  const [micRequired, setMicRequired] = useState<boolean | undefined>();
  const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse');

  const { posts, myPosts, isLoading, refetch, applyToPost, isApplying } = useLFG({
    gameId: selectedGame,
    micRequired,
  });

  const displayPosts = activeTab === 'my' ? myPosts : posts;

  const handleApply = async (postId: string) => {
    try {
      await applyToPost({ postId });
    } catch (error) {
      console.error('Failed to apply:', error);
    }
  };

  const handlePostPress = (post: LFGPost) => {
    navigation.navigate('LFGDetails', { postId: post.id });
  };

  const renderPost = ({ item }: { item: LFGPost }) => {
    const hasApplied = item.applications?.some((a) => a.user_id === user?.id);

    return (
      <LFGPostCard
        post={item}
        onPress={() => handlePostPress(item)}
        onApply={() => handleApply(item.id)}
        hasApplied={hasApplied}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
            Find Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Posts
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'browse' && (
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              micRequired !== undefined && styles.activeFilter,
            ]}
            onPress={() => setMicRequired(micRequired === true ? undefined : true)}
          >
            <Mic size={16} color={micRequired ? colors.primary : colors.textMuted} />
            <Text style={[styles.filterText, micRequired && styles.activeFilterText]}>
              Mic
            </Text>
          </TouchableOpacity>

          <View style={styles.gameFilter}>
            {games.slice(0, 3).map((game) => (
              <TouchableOpacity
                key={game.id}
                style={[
                  styles.gameChip,
                  selectedGame === game.id && styles.activeGameChip,
                ]}
                onPress={() => setSelectedGame(selectedGame === game.id ? undefined : game.id)}
              >
                <Text
                  style={[
                    styles.gameChipText,
                    selectedGame === game.id && styles.activeGameChipText,
                  ]}
                  numberOfLines={1}
                >
                  {game.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={displayPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
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
            <Users size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'my' ? 'No Posts Created' : 'No Groups Found'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'my'
                ? 'Create a post to find teammates!'
                : 'Try adjusting your filters or check back later'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateLFG')}
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
    gap: spacing.md,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  activeFilter: {
    backgroundColor: colors.primaryTransparent,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: '600',
  },
  gameFilter: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gameChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeGameChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gameChipText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  activeGameChipText: {
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
    paddingHorizontal: spacing.lg,
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
