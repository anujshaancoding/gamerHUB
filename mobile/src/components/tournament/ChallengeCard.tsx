import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swords, Clock, Trophy, Gamepad2 } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { Challenge } from '../../types/tournament';
import { Avatar } from '../ui/Avatar';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId?: string;
  onAccept?: () => void;
  onPress?: () => void;
}

const statusColors = {
  pending: colors.warning,
  accepted: colors.accent,
  in_progress: colors.success,
  completed: colors.textMuted,
  cancelled: colors.error,
  disputed: colors.error,
};

export function ChallengeCard({ challenge, currentUserId, onAccept, onPress }: ChallengeCardProps) {
  const isCreator = challenge.creator_id === currentUserId;
  const canAccept = !isCreator && challenge.status === 'pending' && !challenge.opponent_id;

  const formatTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(challenge.expires_at);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.vsContainer}>
          <Avatar
            imageUrl={challenge.creator?.avatar_url}
            name={challenge.creator?.display_name || challenge.creator?.username}
            size={40}
          />
          <View style={styles.vsIcon}>
            <Swords size={16} color={colors.primary} />
          </View>
          {challenge.opponent ? (
            <Avatar
              imageUrl={challenge.opponent.avatar_url}
              name={challenge.opponent.display_name || challenge.opponent.username}
              size={40}
            />
          ) : (
            <View style={styles.emptyOpponent}>
              <Text style={styles.questionMark}>?</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColors[challenge.status]}20` }]}>
          <Text style={[styles.statusText, { color: statusColors[challenge.status] }]}>
            {challenge.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{challenge.title}</Text>

      {challenge.game && (
        <View style={styles.gameRow}>
          <Gamepad2 size={14} color={colors.textMuted} />
          <Text style={styles.gameName}>{challenge.game.name}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Clock size={14} color={colors.textMuted} />
          <Text style={styles.footerText}>{formatTimeRemaining()}</Text>
        </View>
        {challenge.wager_amount > 0 && (
          <View style={styles.footerItem}>
            <Trophy size={14} color={colors.warning} />
            <Text style={styles.wagerText}>{challenge.wager_amount} coins</Text>
          </View>
        )}
      </View>

      {canAccept && (
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Swords size={16} color={colors.background} />
          <Text style={styles.acceptButtonText}>Accept Challenge</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vsIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  emptyOpponent: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  questionMark: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  gameName: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  wagerText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  acceptButtonText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
