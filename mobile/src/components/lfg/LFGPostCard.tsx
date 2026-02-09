import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Mic, MicOff, Clock, Globe, Gamepad2 } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { LFGPost } from '../../types/lfg';
import { Avatar } from '../ui/Avatar';

interface LFGPostCardProps {
  post: LFGPost;
  onPress?: () => void;
  onApply?: () => void;
  hasApplied?: boolean;
}

const statusColors = {
  open: colors.success,
  full: colors.warning,
  closed: colors.textMuted,
  expired: colors.error,
};

export function LFGPostCard({ post, onPress, onApply, hasApplied = false }: LFGPostCardProps) {
  const slotsAvailable = post.slots_total - post.slots_filled;
  const statusColor = statusColors[post.status];

  const getTimeRemaining = () => {
    const expires = new Date(post.expires_at);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Avatar
          imageUrl={post.user?.avatar_url}
          name={post.user?.display_name || post.user?.username}
          size={40}
          showOnlineStatus
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {post.user?.display_name || post.user?.username}
          </Text>
          <View style={styles.timeRow}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={styles.timeText}>{getTimeRemaining()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {post.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{post.title}</Text>

      <View style={styles.gameRow}>
        <Gamepad2 size={14} color={colors.primary} />
        <Text style={styles.gameName}>{post.game?.name}</Text>
        {post.game_mode && (
          <Text style={styles.gameMode}>• {post.game_mode}</Text>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Users size={14} color={colors.textMuted} />
          <Text style={styles.detailText}>
            {post.slots_filled}/{post.slots_total} players
          </Text>
        </View>
        {post.mic_required ? (
          <View style={styles.detailItem}>
            <Mic size={14} color={colors.success} />
            <Text style={[styles.detailText, { color: colors.success }]}>Mic Required</Text>
          </View>
        ) : (
          <View style={styles.detailItem}>
            <MicOff size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>No Mic</Text>
          </View>
        )}
        {post.region && (
          <View style={styles.detailItem}>
            <Globe size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{post.region}</Text>
          </View>
        )}
      </View>

      {post.roles_needed && post.roles_needed.length > 0 && (
        <View style={styles.rolesSection}>
          <Text style={styles.rolesLabel}>Looking for:</Text>
          <View style={styles.rolesList}>
            {post.roles_needed.slice(0, 3).map((role, index) => (
              <View key={index} style={styles.roleBadge}>
                <Text style={styles.roleText}>{role}</Text>
              </View>
            ))}
            {post.roles_needed.length > 3 && (
              <Text style={styles.moreRoles}>+{post.roles_needed.length - 3}</Text>
            )}
          </View>
        </View>
      )}

      {post.status === 'open' && slotsAvailable > 0 && !hasApplied && (
        <TouchableOpacity style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyButtonText}>Apply to Join</Text>
        </TouchableOpacity>
      )}

      {hasApplied && (
        <View style={styles.appliedBadge}>
          <Text style={styles.appliedText}>Application Sent</Text>
        </View>
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
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
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
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  gameMode: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  rolesSection: {
    marginBottom: spacing.md,
  },
  rolesLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  rolesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.accentTransparent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  roleText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  moreRoles: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    alignSelf: 'center',
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  appliedBadge: {
    backgroundColor: colors.accentTransparent,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  appliedText: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
