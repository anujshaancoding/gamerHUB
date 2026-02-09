import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Users, Shield, Globe, Gamepad2 } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { ClanDetails } from '../../types/clan';

interface ClanCardProps {
  clan: ClanDetails;
  onPress?: () => void;
  onJoin?: () => void;
  showJoinButton?: boolean;
}

export function ClanCard({ clan, onPress, onJoin, showJoinButton = false }: ClanCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        {clan.avatar_url ? (
          <Image source={{ uri: clan.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Shield size={24} color={colors.primary} />
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.tag}>[{clan.tag}]</Text>
            <Text style={styles.name} numberOfLines={1}>{clan.name}</Text>
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {clan.description || 'No description'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Users size={14} color={colors.textMuted} />
          <Text style={styles.detailText}>
            {clan.member_count}/{clan.max_members}
          </Text>
        </View>
        {clan.primary_game && (
          <View style={styles.detailItem}>
            <Gamepad2 size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{clan.primary_game.name}</Text>
          </View>
        )}
        {clan.region && (
          <View style={styles.detailItem}>
            <Globe size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{clan.region}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.badges}>
          {clan.is_recruiting && (
            <View style={styles.recruitingBadge}>
              <Text style={styles.recruitingText}>Recruiting</Text>
            </View>
          )}
          {!clan.is_public && (
            <View style={styles.privateBadge}>
              <Text style={styles.privateText}>Private</Text>
            </View>
          )}
        </View>
        {showJoinButton && clan.is_public && clan.is_recruiting && (
          <TouchableOpacity style={styles.joinButton} onPress={onJoin}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  tag: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  description: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recruitingBadge: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  recruitingText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  privateBadge: {
    backgroundColor: `${colors.textMuted}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  privateText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  joinButtonText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
