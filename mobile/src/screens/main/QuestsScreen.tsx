import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Zap, Gift } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useQuests, useProgression } from '../../hooks';
import { QuestCard, ProgressionOverview } from '../../components/gamification';

export default function QuestsScreen() {
  const { progression } = useProgression();
  const {
    dailyQuests,
    weeklyQuests,
    isLoading,
    refetch,
    claimQuest,
    isClaiming,
    getTimeUntilReset,
    formatTimeRemaining,
    dailyCompleted,
    weeklyCompleted,
    claimableXP,
  } = useQuests();

  const [dailyTimer, setDailyTimer] = useState('');
  const [weeklyTimer, setWeeklyTimer] = useState('');

  useEffect(() => {
    const updateTimers = () => {
      setDailyTimer(formatTimeRemaining(getTimeUntilReset('daily')));
      setWeeklyTimer(formatTimeRemaining(getTimeUntilReset('weekly')));
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [getTimeUntilReset, formatTimeRemaining]);

  const handleClaimQuest = async (questId: string) => {
    try {
      await claimQuest(questId);
    } catch (error) {
      console.error('Failed to claim quest:', error);
    }
  };

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
        {progression && (
          <View style={styles.progressionSection}>
            <ProgressionOverview progression={progression} />
          </View>
        )}

        {claimableXP > 0 && (
          <View style={styles.claimableCard}>
            <Gift size={24} color={colors.warning} />
            <View style={styles.claimableInfo}>
              <Text style={styles.claimableTitle}>Rewards Available!</Text>
              <Text style={styles.claimableText}>
                You have {claimableXP} XP ready to claim
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Zap size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Daily Quests</Text>
            </View>
            <View style={styles.timerRow}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.timerText}>Resets in {dailyTimer}</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(dailyCompleted / Math.max(dailyQuests.length, 1)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {dailyCompleted}/{dailyQuests.length} Completed
          </Text>
          {dailyQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={() => handleClaimQuest(quest.id)}
              isClaiming={isClaiming}
            />
          ))}
          {dailyQuests.length === 0 && (
            <Text style={styles.emptyText}>No daily quests available</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Zap size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>Weekly Quests</Text>
            </View>
            <View style={styles.timerRow}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={styles.timerText}>Resets in {weeklyTimer}</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                styles.weeklyProgress,
                { width: `${(weeklyCompleted / Math.max(weeklyQuests.length, 1)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {weeklyCompleted}/{weeklyQuests.length} Completed
          </Text>
          {weeklyQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={() => handleClaimQuest(quest.id)}
              isClaiming={isClaiming}
            />
          ))}
          {weeklyQuests.length === 0 && (
            <Text style={styles.emptyText}>No weekly quests available</Text>
          )}
        </View>
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
  progressionSection: {
    marginBottom: spacing.lg,
  },
  claimableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: spacing.md,
  },
  claimableInfo: {
    flex: 1,
  },
  claimableTitle: {
    color: colors.warning,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  claimableText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  weeklyProgress: {
    backgroundColor: colors.accent,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
