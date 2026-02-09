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
import { Swords, Trophy, Target, Plus } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useChallenges, useCommunityChallenges, useAuth } from '../../hooks';
import { ChallengeCard } from '../../components/tournament';
import { Challenge, CommunityChallenge } from '../../types/tournament';

type TabType = 'my' | 'community';

export default function ChallengesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('my');

  const {
    activeChallenges,
    completedChallenges,
    isLoading: isLoadingChallenges,
    refetch: refetchChallenges,
    acceptChallenge,
  } = useChallenges();

  const {
    challenges: communityChallenges,
    isLoading: isLoadingCommunity,
    refetch: refetchCommunity,
    joinChallenge,
    isJoined,
  } = useCommunityChallenges();

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await acceptChallenge(challengeId);
    } catch (error) {
      console.error('Failed to accept challenge:', error);
    }
  };

  const handleJoinCommunityChallenge = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId);
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const renderChallenge = ({ item }: { item: Challenge }) => (
    <ChallengeCard
      challenge={item}
      currentUserId={user?.id}
      onAccept={() => handleAcceptChallenge(item.id)}
      onPress={() => navigation.navigate('ChallengeDetails', { challengeId: item.id })}
    />
  );

  const renderCommunityChallenge = ({ item }: { item: CommunityChallenge }) => (
    <TouchableOpacity
      style={styles.communityCard}
      onPress={() => navigation.navigate('CommunityChallengeDetails', { challengeId: item.id })}
    >
      <View style={styles.communityHeader}>
        <View style={styles.communityIcon}>
          <Target size={24} color={colors.accent} />
        </View>
        <View style={styles.communityInfo}>
          <Text style={styles.communityTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.communityType}>{item.challenge_type}</Text>
        </View>
        <View style={styles.rewardBadge}>
          <Trophy size={12} color={colors.warning} />
          <Text style={styles.rewardText}>+{item.xp_reward} XP</Text>
        </View>
      </View>

      <Text style={styles.communityDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.communityFooter}>
        <Text style={styles.participantsText}>
          {item.participants_count} participants
        </Text>
        {isJoined(item.id) ? (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinCommunityChallenge(item.id)}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Swords size={18} color={activeTab === 'my' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Challenges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.activeTab]}
          onPress={() => setActiveTab('community')}
        >
          <Target size={18} color={activeTab === 'community' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'community' && styles.activeTabText]}>
            Community
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my' ? (
        <FlatList
          data={[...activeChallenges, ...completedChallenges]}
          keyExtractor={(item) => item.id}
          renderItem={renderChallenge}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingChallenges}
              onRefresh={refetchChallenges}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Swords size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Challenges</Text>
              <Text style={styles.emptyText}>
                Create a challenge or accept one from another player!
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={communityChallenges}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunityChallenge}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingCommunity}
              onRefresh={refetchCommunity}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Target size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Community Challenges</Text>
              <Text style={styles.emptyText}>
                Check back later for community events!
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateChallenge')}
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
    paddingHorizontal: spacing.lg,
  },
  communityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentTransparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  communityTitle: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  communityType: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textTransform: 'capitalize',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  rewardText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  communityDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  communityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  joinedBadge: {
    backgroundColor: colors.successTransparent || `${colors.success}20`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  joinedText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  joinButtonText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: '600',
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
