import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Award, Lock } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { UserBadge, BadgeDefinition } from '../../types/gamification';

interface BadgeCardProps {
  badge?: UserBadge;
  definition?: BadgeDefinition;
  locked?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const rarityColors = {
  common: colors.textMuted,
  rare: colors.accent,
  epic: colors.secondary,
  legendary: colors.warning,
};

export function BadgeCard({ badge, definition, locked = false, size = 'medium' }: BadgeCardProps) {
  const badgeDef = badge?.badge || definition;
  if (!badgeDef) return null;

  const sizeStyles = {
    small: { container: styles.containerSmall, icon: 24 },
    medium: { container: styles.containerMedium, icon: 36 },
    large: { container: styles.containerLarge, icon: 48 },
  };

  const currentSize = sizeStyles[size];
  const rarityColor = rarityColors[badgeDef.rarity];

  return (
    <View style={[styles.container, currentSize.container, locked && styles.locked]}>
      <View style={[styles.iconContainer, { borderColor: rarityColor }]}>
        {locked ? (
          <Lock size={currentSize.icon * 0.6} color={colors.textMuted} />
        ) : badgeDef.icon_url ? (
          <Image
            source={{ uri: badgeDef.icon_url }}
            style={{ width: currentSize.icon, height: currentSize.icon }}
          />
        ) : (
          <Award size={currentSize.icon} color={rarityColor} />
        )}
      </View>
      {size !== 'small' && (
        <>
          <Text style={[styles.name, locked && styles.lockedText]} numberOfLines={1}>
            {badgeDef.name}
          </Text>
          {size === 'large' && badgeDef.description && (
            <Text style={[styles.description, locked && styles.lockedText]} numberOfLines={2}>
              {badgeDef.description}
            </Text>
          )}
          <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {badgeDef.rarity.toUpperCase()}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    padding: spacing.md,
  },
  containerSmall: {
    padding: spacing.sm,
    width: 60,
    height: 60,
  },
  containerMedium: {
    width: 100,
    height: 130,
  },
  containerLarge: {
    width: '100%',
    flexDirection: 'column',
    height: 'auto',
  },
  locked: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  lockedText: {
    color: colors.textDim,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  rarityText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
