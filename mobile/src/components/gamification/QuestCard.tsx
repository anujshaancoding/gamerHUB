import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Gift, CheckCircle, Zap } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { UserQuest } from '../../types/gamification';

interface QuestCardProps {
  quest: UserQuest;
  onClaim?: () => void;
  isClaiming?: boolean;
}

export function QuestCard({ quest, onClaim, isClaiming }: QuestCardProps) {
  const progress = quest.progress;
  const progressPercentage = Math.round((progress.current / progress.target) * 100);
  const isCompleted = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';

  return (
    <View style={[styles.container, isClaimed && styles.claimed]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {isClaimed ? (
            <CheckCircle size={24} color={colors.success} />
          ) : (
            <Zap size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {quest.quest.name}
          </Text>
          {quest.quest.description && (
            <Text style={styles.description} numberOfLines={2}>
              {quest.quest.description}
            </Text>
          )}
        </View>
        <View style={styles.reward}>
          <Gift size={14} color={colors.warning} />
          <Text style={styles.rewardText}>+{quest.quest.xp_reward} XP</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` },
              isClaimed && styles.progressFillClaimed
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress.current} / {progress.target}
        </Text>
      </View>

      {isCompleted && !isClaimed && (
        <TouchableOpacity
          style={styles.claimButton}
          onPress={onClaim}
          disabled={isClaiming}
        >
          <Gift size={16} color={colors.background} />
          <Text style={styles.claimButtonText}>
            {isClaiming ? 'Claiming...' : 'Claim Reward'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  claimed: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  rewardText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressFillClaimed: {
    backgroundColor: colors.success,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    minWidth: 50,
    textAlign: 'right',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  claimButtonText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
