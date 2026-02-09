import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Shield, Check, X, Clock } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { ClanInvite } from '../../types/clan';

interface ClanInviteCardProps {
  invite: ClanInvite;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function ClanInviteCard({ invite, onAccept, onDecline }: ClanInviteCardProps) {
  const clan = invite.clan;
  const inviter = invite.inviter;

  const formatExpiry = () => {
    const expires = new Date(invite.expires_at);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return 'Expired';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {clan?.avatar_url ? (
          <Image source={{ uri: clan.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Shield size={24} color={colors.primary} />
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.tag}>[{clan?.tag}]</Text>
            <Text style={styles.name} numberOfLines={1}>{clan?.name}</Text>
          </View>
          <Text style={styles.invitedBy}>
            Invited by {inviter?.display_name || inviter?.username}
          </Text>
        </View>
      </View>

      {invite.message && (
        <Text style={styles.message} numberOfLines={2}>
          "{invite.message}"
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.expiryRow}>
          <Clock size={12} color={colors.textMuted} />
          <Text style={styles.expiry}>{formatExpiry()}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <X size={18} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Check size={18} color={colors.background} />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
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
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
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
  },
  tag: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
    flex: 1,
  },
  invitedBy: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  message: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  expiry: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  acceptText: {
    color: colors.background,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
