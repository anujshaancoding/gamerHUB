import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Coins, Gem, Plus } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';

interface WalletDisplayProps {
  coins: number;
  gems: number;
  onAddFunds?: () => void;
  compact?: boolean;
}

export function WalletDisplay({ coins, gems, onAddFunds, compact = false }: WalletDisplayProps) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactItem}>
          <Coins size={14} color={colors.warning} />
          <Text style={styles.compactValue}>{coins.toLocaleString()}</Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <Gem size={14} color={colors.accent} />
          <Text style={styles.compactValue}>{gems.toLocaleString()}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.currencySection}>
        <View style={styles.currencyItem}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}20` }]}>
            <Coins size={24} color={colors.warning} />
          </View>
          <View>
            <Text style={styles.currencyLabel}>Coins</Text>
            <Text style={styles.currencyValue}>{coins.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.currencyItem}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
            <Gem size={24} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.currencyLabel}>Gems</Text>
            <Text style={styles.currencyValue}>{gems.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {onAddFunds && (
        <TouchableOpacity style={styles.addButton} onPress={onAddFunds}>
          <Plus size={18} color={colors.background} />
          <Text style={styles.addButtonText}>Add Funds</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  compactValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  currencySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  currencyValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  addButtonText: {
    color: colors.background,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
});
