import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, Shield, User, MoreVertical } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { ClanMember } from '../../types/clan';
import { Avatar } from '../ui/Avatar';

interface ClanMemberCardProps {
  member: ClanMember;
  onPress?: () => void;
  onOptions?: () => void;
  showOptions?: boolean;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  moderator: Shield,
  member: User,
};

const roleColors = {
  owner: colors.warning,
  admin: colors.accent,
  moderator: colors.secondary,
  member: colors.textMuted,
};

export function ClanMemberCard({ member, onPress, onOptions, showOptions = false }: ClanMemberCardProps) {
  const RoleIcon = roleIcons[member.role];
  const roleColor = roleColors[member.role];
  const user = member.user;

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Avatar
        imageUrl={user?.avatar_url}
        name={user?.display_name || user?.username}
        size={48}
        showOnlineStatus={user?.is_online}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user?.display_name || user?.username || 'Unknown'}
        </Text>
        <View style={styles.roleRow}>
          <RoleIcon size={12} color={roleColor} />
          <Text style={[styles.roleText, { color: roleColor }]}>
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.joinDate}>Joined {formatJoinDate(member.joined_at)}</Text>
        {showOptions && (
          <TouchableOpacity style={styles.optionsButton} onPress={onOptions}>
            <MoreVertical size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  joinDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  optionsButton: {
    padding: spacing.xs,
  },
});
