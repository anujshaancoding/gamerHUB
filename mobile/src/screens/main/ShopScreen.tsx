import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Star, Sparkles, Crown } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useShop, useWallet } from '../../hooks';
import { ShopItemCard, WalletDisplay } from '../../components/shop';
import { ShopItem } from '../../types/shop';

type ShopCategory = 'all' | 'title' | 'frame' | 'theme' | 'badge';

export default function ShopScreen() {
  const [category, setCategory] = useState<ShopCategory>('all');
  const { items, featuredItems, isLoading, refetch, purchaseItem, isPurchasing } = useShop();
  const { coins, gems } = useWallet();

  const categories: { key: ShopCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'title', label: 'Titles' },
    { key: 'frame', label: 'Frames' },
    { key: 'theme', label: 'Themes' },
    { key: 'badge', label: 'Badges' },
  ];

  const filteredItems = category === 'all'
    ? items
    : items.filter((item) => item.item_type === category);

  const handlePurchase = async (item: ShopItem, currency: 'coins' | 'gems') => {
    const price = currency === 'coins' ? item.price_coins : item.price_gems;
    const balance = currency === 'coins' ? coins : gems;

    if (!price) {
      Alert.alert('Error', 'This item cannot be purchased with this currency');
      return;
    }

    if (balance < price) {
      Alert.alert('Insufficient Balance', `You need ${price - balance} more ${currency} to purchase this item.`);
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${item.name} for ${price} ${currency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              await purchaseItem({ itemId: item.id, currency });
              Alert.alert('Success', `You purchased ${item.name}!`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to purchase item');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <ShopItemCard
      item={item}
      onPurchase={(currency) => handlePurchase(item, currency)}
    />
  );

  const renderHeader = () => (
    <>
      <WalletDisplay
        coins={coins}
        gems={gems}
        onAddFunds={() => Alert.alert('Coming Soon', 'In-app purchases coming soon!')}
      />

      {featuredItems.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Star size={20} color={colors.warning} fill={colors.warning} />
            <Text style={styles.sectionTitle}>Featured</Text>
          </View>
          <FlatList
            horizontal
            data={featuredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.featuredItem}>
                <ShopItemCard
                  item={item}
                  onPurchase={(currency) => handlePurchase(item, currency)}
                />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      <View style={styles.categories}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryChip,
              category === cat.key && styles.activeCategoryChip,
            ]}
            onPress={() => setCategory(cat.key)}
          >
            <Text
              style={[
                styles.categoryText,
                category === cat.key && styles.activeCategoryText,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.allItemsTitle}>All Items</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ShoppingBag size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Items Available</Text>
            <Text style={styles.emptyText}>Check back later for new items!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  featuredSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  featuredList: {
    paddingRight: spacing.md,
  },
  featuredItem: {
    width: 160,
    marginRight: spacing.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  activeCategoryText: {
    color: colors.background,
    fontWeight: '600',
  },
  allItemsTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginTop: spacing.sm,
  },
});
