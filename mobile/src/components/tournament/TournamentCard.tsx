import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, Users, Trophy, Gamepad2 } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { Tournament } from '../../types/tournament';

interface TournamentCardProps {
  tournament: Tournament;
  onPress?: () => void;
}

const statusColors = {
  draft: colors.textMuted,
  registration: colors.accent,
  in_progress: colors.success,
  completed: colors.textMuted,
  cancelled: colors.error,
};

const statusLabels = {
  draft: 'Draft',
  registration: 'Registration Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function TournamentCard({ tournament, onPress }: TournamentCardProps) {
  const statusColor = statusColors[tournament.status];
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {tournament.banner_url && (
        <Image source={{ uri: tournament.banner_url }} style={styles.banner} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabels[tournament.status]}
            </Text>
          </View>
          <Text style={styles.format}>{tournament.format.replace('_', ' ')}</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>{tournament.name}</Text>

        {tournament.game && (
          <View style={styles.gameRow}>
            <Gamepad2 size={14} color={colors.textMuted} />
            <Text style={styles.gameName}>{tournament.game.name}</Text>
          </View>
        )}

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Calendar size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{formatDate(tournament.starts_at)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Users size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {tournament.participants_count || 0}/{tournament.max_participants}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Trophy size={14} color={colors.warning} />
            <Text style={styles.detailText}>{tournament.team_size}v{tournament.team_size}</Text>
          </View>
        </View>

        {tournament.prize_pool && Object.keys(tournament.prize_pool).length > 0 && (
          <View style={styles.prizePool}>
            <Trophy size={16} color={colors.warning} />
            <Text style={styles.prizeText}>Prize Pool Available</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  banner: {
    width: '100%',
    height: 100,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  format: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
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
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  prizePool: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  prizeText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
