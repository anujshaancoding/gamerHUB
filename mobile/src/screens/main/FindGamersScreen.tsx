import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Search,
  Filter,
  UserPlus,
  Gamepad2,
  MapPin,
  Star,
} from 'lucide-react-native';

import { Card, Avatar, Badge, Button, Input } from '../../components/ui';
import { colors, spacing, fontSize } from '../../lib/theme';

// Mock data for gamers
const MOCK_GAMERS = [
  {
    id: '1',
    username: 'ProPlayer99',
    display_name: 'Arjun Singh',
    avatar_url: null,
    gaming_style: 'competitive',
    region: 'Mumbai',
    games: ['Valorant', 'CS2'],
    rank: 'Diamond',
    is_online: true,
    rating: 4.8,
  },
  {
    id: '2',
    username: 'NinjaMaster',
    display_name: 'Priya Sharma',
    avatar_url: null,
    gaming_style: 'casual',
    region: 'Delhi',
    games: ['BGMI', 'Free Fire'],
    rank: 'Crown',
    is_online: true,
    rating: 4.5,
  },
  {
    id: '3',
    username: 'ApexHunter',
    display_name: 'Rahul Verma',
    avatar_url: null,
    gaming_style: 'pro',
    region: 'Bangalore',
    games: ['Apex Legends', 'Valorant'],
    rank: 'Predator',
    is_online: false,
    rating: 4.9,
  },
  {
    id: '4',
    username: 'GamerGirl',
    display_name: 'Sneha Patel',
    avatar_url: null,
    gaming_style: 'competitive',
    region: 'Chennai',
    games: ['League of Legends', 'Valorant'],
    rank: 'Platinum',
    is_online: true,
    rating: 4.6,
  },
];

const GAME_FILTERS = ['All', 'Valorant', 'CS2', 'BGMI', 'Apex', 'LoL'];

export default function FindGamersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('All');

  const filteredGamers = MOCK_GAMERS.filter((gamer) => {
    const matchesSearch =
      gamer.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gamer.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGame =
      selectedGame === 'All' ||
      gamer.games.some((g) => g.toLowerCase().includes(selectedGame.toLowerCase()));
    return matchesSearch && matchesGame;
  });

  const getStyleBadge = (style: string) => {
    switch (style) {
      case 'casual':
        return { label: 'Casual', variant: 'default' as const };
      case 'competitive':
        return { label: 'Competitive', variant: 'accent' as const };
      case 'pro':
        return { label: 'Pro', variant: 'primary' as const };
      default:
        return { label: style, variant: 'default' as const };
    }
  };

  const renderGamerCard = ({ item }: { item: typeof MOCK_GAMERS[0] }) => {
    const styleBadge = getStyleBadge(item.gaming_style);

    return (
      <Card style={styles.gamerCard}>
        <View style={styles.gamerHeader}>
          <Avatar
            uri={item.avatar_url}
            name={item.display_name}
            size={60}
            showOnlineStatus
            isOnline={item.is_online}
          />
          <View style={styles.gamerInfo}>
            <Text style={styles.gamerName}>{item.display_name}</Text>
            <Text style={styles.gamerUsername}>@{item.username}</Text>
            <View style={styles.gamerMeta}>
              <MapPin color={colors.textMuted} size={12} />
              <Text style={styles.gamerRegion}>{item.region}</Text>
              <Star color={colors.warning} size={12} />
              <Text style={styles.gamerRating}>{item.rating}</Text>
            </View>
          </View>
          <Badge {...styleBadge} size="sm" />
        </View>

        <View style={styles.gamerGames}>
          <Gamepad2 color={colors.textMuted} size={16} />
          <View style={styles.gamesList}>
            {item.games.map((game) => (
              <Badge key={game} label={game} variant="default" size="sm" />
            ))}
          </View>
        </View>

        <View style={styles.gamerRank}>
          <Text style={styles.rankLabel}>Rank:</Text>
          <Badge label={item.rank} variant="primary" size="sm" />
        </View>

        <View style={styles.gamerActions}>
          <Button
            title="View Profile"
            variant="outline"
            size="sm"
            onPress={() => {}}
            style={{ flex: 1 }}
          />
          <Button
            title="Add Friend"
            size="sm"
            onPress={() => {}}
            style={{ flex: 1 }}
            icon={<UserPlus color={colors.background} size={16} />}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Input
              placeholder="Search gamers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={<Search color={colors.textMuted} size={20} />}
              style={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GAME_FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedGame(item)}
              style={[
                styles.filterChip,
                selectedGame === item && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedGame === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results */}
      <FlatList
        data={filteredGamers}
        renderItem={renderGamerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search color={colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No gamers found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    paddingVertical: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.background,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  gamerCard: {
    gap: spacing.md,
  },
  gamerHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gamerInfo: {
    flex: 1,
  },
  gamerName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  gamerUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  gamerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gamerRegion: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  gamerRating: {
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: '500',
  },
  gamerGames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gamesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  gamerRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  gamerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
