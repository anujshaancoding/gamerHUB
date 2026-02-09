import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Clock, Gift, Lock, Zap } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useBattlePass } from '../../hooks';
import { BattlePassTrack } from '../../components/gamification';

export default function BattlePassScreen() {
  const {
    battlePass,
    progress,
    enrolled,
    isPremium,
    currentLevel,
    currentXp,
    xpPerLevel,
    xpProgress,
    maxLevel,
    daysRemaining,
    isLoading,
    claim,
    isClaiming,
    getRewardsForLevel,
    isRewardClaimed,
    canClaimReward,
    refetch,
  } = useBattlePass();

  const handleClaimReward = async (rewardId: string) => {
    try {
      await claim(rewardId);
      Alert.alert('Success', 'Reward claimed!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to claim reward');
    }
  };

  const handleUpgrade = () => {
    Alert.alert('Coming Soon', 'Battle Pass purchase coming soon!');
  };

  if (!battlePass) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.noBattlePass}>
          <Crown size={64} color={colors.textMuted} />
          <Text style={styles.noBattlePassTitle}>No Active Battle Pass</Text>
          <Text style={styles.noBattlePassText}>
            Check back soon for the next season!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.seasonInfo}>
            <Text style={styles.seasonName}>{battlePass.name}</Text>
            <View style={styles.timerRow}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.timerText}>
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Season ending soon!'}
              </Text>
            </View>
          </View>
          {!isPremium && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Crown size={16} color={colors.background} />
              <Text style={styles.upgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressCard}>
          <View style={styles.levelContainer}>
            <View style={[styles.levelBadge, isPremium && styles.premiumLevel]}>
              <Text style={styles.levelText}>{currentLevel}</Text>
            </View>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={10} color={colors.warning} fill={colors.warning} />
              </View>
            )}
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.levelLabel}>Level {currentLevel}</Text>
            <View style={styles.xpRow}>
              <Zap size={14} color={colors.primary} />
              <Text style={styles.xpText}>
                {currentXp} / {xpPerLevel} XP
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${xpProgress}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.tierInfo}>
          <View style={styles.tierItem}>
            <Gift size={18} color={colors.textMuted} />
            <Text style={styles.tierLabel}>Free Tier</Text>
          </View>
          <View style={styles.tierDivider} />
          <View style={styles.tierItem}>
            <Crown size={18} color={colors.warning} />
            <Text style={[styles.tierLabel, isPremium && styles.premiumTierLabel]}>
              Premium Tier {isPremium ? '(Active)' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.trackSection}>
          <Text style={styles.sectionTitle}>Rewards Track</Text>
          <BattlePassTrack
            rewards={battlePass.rewards}
            currentLevel={currentLevel}
            isPremium={isPremium}
            claimedRewards={progress?.claimed_rewards || []}
            onClaimReward={handleClaimReward}
          />
        </View>

        {!enrolled && (
          <View style={styles.enrollCard}>
            <Gift size={32} color={colors.primary} />
            <Text style={styles.enrollTitle}>Start Earning Rewards!</Text>
            <Text style={styles.enrollText}>
              Play matches, complete quests, and level up to unlock exclusive rewards.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  noBattlePass: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  noBattlePassTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  noBattlePassText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  seasonInfo: {
    flex: 1,
  },
  seasonName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  timerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  upgradeText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  levelContainer: {
    position: 'relative',
  },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  premiumLevel: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}20`,
  },
  levelText: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 4,
  },
  progressInfo: {
    flex: 1,
  },
  levelLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  xpText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tierLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  premiumTierLabel: {
    color: colors.warning,
  },
  tierDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
  trackSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  enrollCard: {
    alignItems: 'center',
    backgroundColor: colors.primaryTransparent,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  enrollTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  enrollText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
