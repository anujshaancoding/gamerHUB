import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Zap, Star, Target } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { UserProgression } from '../../types/gamification';

interface ProgressionOverviewProps {
  progression: UserProgression;
  compact?: boolean;
}

export function ProgressionOverview({ progression, compact = false }: ProgressionOverviewProps) {
  const progressPercentage = Math.round(
    (progression.current_level_xp / progression.xp_to_next_level) * 100
  );

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{progression.level}</Text>
        </View>
        <View style={styles.compactProgress}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.xpText}>{progression.current_level_xp} XP</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelContainer}>
          <View style={styles.levelBadgeLarge}>
            <Text style={styles.levelTextLarge}>{progression.level}</Text>
          </View>
          {progression.prestige_level > 0 && (
            <View style={styles.prestigeBadge}>
              <Star size={12} color={colors.warning} fill={colors.warning} />
              <Text style={styles.prestigeText}>P{progression.prestige_level}</Text>
            </View>
          )}
        </View>
        <View style={styles.xpInfo}>
          <Text style={styles.totalXp}>{progression.total_xp.toLocaleString()} XP</Text>
          <Text style={styles.nextLevel}>
            {progression.xp_to_next_level - progression.current_level_xp} XP to Level {progression.level + 1}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFillLarge, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{progressPercentage}%</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Trophy size={18} color={colors.primary} />
          <Text style={styles.statValue}>{progression.stats.matches_won}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Target size={18} color={colors.accent} />
          <Text style={styles.statValue}>{progression.stats.matches_played}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statItem}>
          <Zap size={18} color={colors.warning} />
          <Text style={styles.statValue}>{progression.stats.current_win_streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Star size={18} color={colors.secondary} />
          <Text style={styles.statValue}>{progression.stats.quests_completed}</Text>
          <Text style={styles.statLabel}>Quests</Text>
        </View>
      </View>
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
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeLarge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primaryDark,
  },
  levelText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  levelTextLarge: {
    color: colors.background,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  prestigeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    gap: 2,
  },
  prestigeText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  xpInfo: {
    flex: 1,
  },
  totalXp: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  nextLevel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  compactProgress: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  xpText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
