import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Gift, Coins, Gem, Clock, Star } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { ShopItem } from '../../types/shop';

interface ShopItemCardProps {
  item: ShopItem;
  onPress?: () => void;
  onPurchase?: (currency: 'coins' | 'gems') => void;
}

const rarityColors = {
  common: colors.textMuted,
  rare: colors.accent,
  epic: colors.secondary,
  legendary: colors.warning,
};

export function ShopItemCard({ item, onPress, onPurchase }: ShopItemCardProps) {
  const rarityColor = rarityColors[item.rarity];

  const isLimited = item.is_limited && item.available_until;
  const timeRemaining = isLimited
    ? Math.max(0, new Date(item.available_until!).getTime() - Date.now())
    : 0;
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  return (
    <TouchableOpacity
      style={[styles.container, item.is_featured && styles.featured]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {item.is_featured && (
        <View style={styles.featuredBadge}>
          <Star size={12} color={colors.warning} fill={colors.warning} />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}

      <View style={[styles.imageContainer, { borderColor: rarityColor }]}>
        {item.preview_url || item.icon_url ? (
          <Image
            source={{ uri: item.preview_url || item.icon_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Gift size={40} color={rarityColor} />
        )}
      </View>

      <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
        <Text style={[styles.rarityText, { color: rarityColor }]}>
          {item.rarity.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.type}>{item.item_type.replace('_', ' ')}</Text>

      {isLimited && (
        <View style={styles.limitedBadge}>
          <Clock size={12} color={colors.error} />
          <Text style={styles.limitedText}>
            {daysRemaining > 0 ? `${daysRemaining}d left` : 'Last day!'}
          </Text>
        </View>
      )}

      <View style={styles.prices}>
        {item.price_coins && (
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => onPurchase?.('coins')}
          >
            <Coins size={14} color={colors.warning} />
            <Text style={styles.priceText}>{item.price_coins}</Text>
          </TouchableOpacity>
        )}
        {item.price_gems && (
          <TouchableOpacity
            style={[styles.priceButton, styles.gemButton]}
            onPress={() => onPurchase?.('gems')}
          >
            <Gem size={14} color={colors.accent} />
            <Text style={[styles.priceText, styles.gemText]}>{item.price_gems}</Text>
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
    width: '48%',
    marginBottom: spacing.md,
  },
  featured: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  featuredBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  featuredText: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  rarityText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  type: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  limitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  limitedText: {
    color: colors.error,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  prices: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  gemButton: {
    backgroundColor: `${colors.accent}15`,
  },
  priceText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  gemText: {
    color: colors.accent,
  },
});
