import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.surfaceLight,
  },
  primary: {
    backgroundColor: colors.primaryTransparent,
  },
  accent: {
    backgroundColor: colors.accentTransparent,
  },
  success: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  warning: {
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
  },
  error: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  size_md: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontWeight: '500',
  },
  text_default: {
    color: colors.textSecondary,
  },
  text_primary: {
    color: colors.primary,
  },
  text_accent: {
    color: colors.accent,
  },
  text_success: {
    color: colors.success,
  },
  text_warning: {
    color: colors.warning,
  },
  text_error: {
    color: colors.error,
  },
  textSize_sm: {
    fontSize: fontSize.xs,
  },
  textSize_md: {
    fontSize: fontSize.sm,
  },
});
