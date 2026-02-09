import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Lock, Check, Gift, Crown } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { BattlePassReward } from '../../types/gamification';

interface BattlePassTrackProps {
  rewards: BattlePassReward[];
  currentLevel: number;
  isPremium: boolean;
  claimedRewards: string[];
  onClaimReward?: (rewardId: string) => void;
}

export function BattlePassTrack({
  rewards,
  currentLevel,
  isPremium,
  claimedRewards,
  onClaimReward,
}: BattlePassTrackProps) {
  // Group rewards by level
  const rewardsByLevel: Record<number, { free?: BattlePassReward; premium?: BattlePassReward }> = {};
  rewards.forEach((reward) => {
    if (!rewardsByLevel[reward.level]) {
      rewardsByLevel[reward.level] = {};
    }
    if (reward.tier === 'free') {
      rewardsByLevel[reward.level].free = reward;
    } else {
      rewardsByLevel[reward.level].premium = reward;
    }
  });

  const levels = Object.keys(rewardsByLevel).map(Number).sort((a, b) => a - b);

  const renderRewardItem = (reward: BattlePassReward | undefined, isPremiumReward: boolean) => {
    if (!reward) {
      return <View style={styles.emptyReward} />;
    }

    const isUnlocked = currentLevel >= reward.level && (!isPremiumReward || isPremium);
    const isClaimed = claimedRewards.includes(reward.id);
    const canClaim = isUnlocked && !isClaimed;

    return (
      <TouchableOpacity
        style={[
          styles.rewardItem,
          isPremiumReward && styles.premiumReward,
          !isUnlocked && styles.lockedReward,
          isClaimed && styles.claimedReward,
        ]}
        onPress={() => canClaim && onClaimReward?.(reward.id)}
        disabled={!canClaim}
      >
        {isPremiumReward && !isPremium && (
          <View style={styles.premiumLock}>
            <Crown size={12} color={colors.warning} />
          </View>
        )}
        {!isUnlocked ? (
          <Lock size={20} color={colors.textDim} />
        ) : isClaimed ? (
          <Check size={20} color={colors.success} />
        ) : reward.icon_url ? (
          <Image source={{ uri: reward.icon_url }} style={styles.rewardIcon} />
        ) : (
          <Gift size={20} color={isPremiumReward ? colors.warning : colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {levels.map((level) => {
        const levelRewards = rewardsByLevel[level];
        const isCurrentLevel = level === currentLevel;

        return (
          <View key={level} style={styles.levelColumn}>
            {/* Premium reward */}
            {renderRewardItem(levelRewards.premium, true)}

            {/* Level indicator */}
            <View style={[styles.levelIndicator, isCurrentLevel && styles.currentLevel]}>
              <Text style={[styles.levelText, isCurrentLevel && styles.currentLevelText]}>
                {level}
              </Text>
              {level <= currentLevel && (
                <View style={styles.levelLine} />
              )}
            </View>

            {/* Free reward */}
            {renderRewardItem(levelRewards.free, false)}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  levelColumn: {
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    width: 60,
  },
  rewardItem: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumReward: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}10`,
  },
  lockedReward: {
    opacity: 0.5,
  },
  claimedReward: {
    backgroundColor: `${colors.success}10`,
    borderColor: colors.success,
  },
  emptyReward: {
    width: 50,
    height: 50,
  },
  premiumLock: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  rewardIcon: {
    width: 30,
    height: 30,
  },
  levelIndicator: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  currentLevel: {
    backgroundColor: colors.primary,
  },
  levelText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  currentLevelText: {
    color: colors.background,
  },
  levelLine: {
    position: 'absolute',
    left: 30,
    width: 20,
    height: 2,
    backgroundColor: colors.primary,
  },
});
