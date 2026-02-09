import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Crown, Medal, Award } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { LeaderboardEntry as LeaderboardEntryType } from '../../types/gamification';
import { Avatar } from '../ui/Avatar';

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  isCurrentUser?: boolean;
}

export function LeaderboardEntry({ entry, isCurrentUser = false }: LeaderboardEntryProps) {
  const getRankIcon = () => {
    switch (entry.rank) {
      case 1:
        return <Crown size={20} color="#FFD700" fill="#FFD700" />;
      case 2:
        return <Medal size={20} color="#C0C0C0" />;
      case 3:
        return <Medal size={20} color="#CD7F32" />;
      default:
        return null;
    }
  };

  const getRankStyle = () => {
    switch (entry.rank) {
      case 1:
        return styles.goldRank;
      case 2:
        return styles.silverRank;
      case 3:
        return styles.bronzeRank;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isCurrentUser && styles.currentUser, getRankStyle()]}>
      <View style={styles.rankContainer}>
        {getRankIcon() || (
          <Text style={styles.rankText}>#{entry.rank}</Text>
        )}
      </View>

      <Avatar
        imageUrl={entry.avatar_url}
        name={entry.display_name || entry.username}
        size={40}
      />

      <View style={styles.userInfo}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.display_name || entry.username}
        </Text>
        <Text style={styles.username}>@{entry.username}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lvl {entry.level}</Text>
        </View>
        <Text style={styles.xpText}>{entry.total_xp.toLocaleString()} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentUser: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTransparent,
  },
  goldRank: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  silverRank: {
    borderColor: '#C0C0C0',
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
  },
  bronzeRank: {
    borderColor: '#CD7F32',
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  username: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  levelText: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  xpText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
