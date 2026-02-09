import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { TournamentMatch } from '../../types/tournament';
import { Avatar } from '../ui/Avatar';

interface BracketMatchProps {
  match: TournamentMatch;
  compact?: boolean;
}

export function BracketMatch({ match, compact = false }: BracketMatchProps) {
  const renderParticipant = (
    participant: TournamentMatch['participant1'],
    score: number | null,
    isWinner: boolean
  ) => {
    if (!participant) {
      return (
        <View style={[styles.participant, styles.empty]}>
          <Text style={styles.emptyText}>TBD</Text>
        </View>
      );
    }

    const user = participant.user;

    return (
      <View style={[styles.participant, isWinner && styles.winner]}>
        {!compact && user && (
          <Avatar
            imageUrl={user.avatar_url}
            name={user.display_name || user.username}
            size={24}
          />
        )}
        <Text style={[styles.participantName, isWinner && styles.winnerText]} numberOfLines={1}>
          {user?.display_name || user?.username || 'Unknown'}
        </Text>
        {score !== null && (
          <Text style={[styles.score, isWinner && styles.winnerScore]}>{score}</Text>
        )}
      </View>
    );
  };

  const isPlayer1Winner = match.winner_id === match.participant1_id;
  const isPlayer2Winner = match.winner_id === match.participant2_id;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.matchNumber}>
        <Text style={styles.matchNumberText}>M{match.match_number}</Text>
      </View>
      <View style={styles.participants}>
        {renderParticipant(match.participant1, match.score1, isPlayer1Winner)}
        <View style={styles.divider} />
        {renderParticipant(match.participant2, match.score2, isPlayer2Winner)}
      </View>
      {match.status === 'completed' && (
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    width: 180,
  },
  compact: {
    width: 140,
  },
  matchNumber: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  matchNumberText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  participants: {
    padding: spacing.xs,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  empty: {
    backgroundColor: colors.surfaceLight,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  winner: {
    backgroundColor: `${colors.success}15`,
  },
  participantName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
  },
  winnerText: {
    fontWeight: '600',
  },
  score: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'right',
  },
  winnerScore: {
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  statusIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
