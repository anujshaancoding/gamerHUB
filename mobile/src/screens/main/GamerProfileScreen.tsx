import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  MapPin,
  Star,
  Gamepad2,
  Users,
  Trophy,
  MessageCircle,
  UserPlus,
} from 'lucide-react-native';

import { Card, Avatar, Badge, Button } from '../../components/ui';
import { colors, spacing, fontSize } from '../../lib/theme';

// Mock profile data
const MOCK_PROFILE = {
  id: '1',
  username: 'ProPlayer99',
  display_name: 'Arjun Singh',
  avatar_url: null,
  bio: 'Competitive Valorant player from Mumbai. Always looking for teammates to grind ranked with. Diamond+ only please!',
  gaming_style: 'competitive',
  region: 'Mumbai, India',
  is_online: true,
  rating: 4.8,
  games: [
    { name: 'Valorant', rank: 'Diamond 3', role: 'Duelist' },
    { name: 'CS2', rank: 'DMG', role: 'Entry' },
  ],
  stats: {
    friends: 156,
    matches: 342,
    wins: 198,
  },
};

export default function GamerProfileScreen() {
  const route = useRoute();
  const userId = (route.params as { userId: string })?.userId;

  const profile = MOCK_PROFILE;

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

  const styleBadge = getStyleBadge(profile.gaming_style);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          uri={profile.avatar_url}
          name={profile.display_name}
          size={100}
          showOnlineStatus
          isOnline={profile.is_online}
        />
        <Text style={styles.displayName}>{profile.display_name}</Text>
        <Text style={styles.username}>@{profile.username}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin color={colors.textMuted} size={14} />
            <Text style={styles.metaText}>{profile.region}</Text>
          </View>
          <View style={styles.metaItem}>
            <Star color={colors.warning} size={14} />
            <Text style={styles.metaText}>{profile.rating} rating</Text>
          </View>
        </View>

        <Badge {...styleBadge} style={styles.styleBadge} />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Add Friend"
          onPress={() => {}}
          icon={<UserPlus color={colors.background} size={18} />}
          style={styles.actionButton}
        />
        <Button
          title="Message"
          variant="outline"
          onPress={() => {}}
          icon={<MessageCircle color={colors.primary} size={18} />}
          style={styles.actionButton}
        />
      </View>

      {/* Bio */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bio}>{profile.bio}</Text>
      </Card>

      {/* Stats */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Users color={colors.primary} size={24} />
            <Text style={styles.statValue}>{profile.stats.friends}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statItem}>
            <Gamepad2 color={colors.accent} size={24} />
            <Text style={styles.statValue}>{profile.stats.matches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statItem}>
            <Trophy color={colors.warning} size={24} />
            <Text style={styles.statValue}>{profile.stats.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
        </View>
      </Card>

      {/* Games */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Games</Text>
        <View style={styles.gamesList}>
          {profile.games.map((game, index) => (
            <View key={index} style={styles.gameItem}>
              <View style={styles.gameIcon}>
                <Gamepad2 color={colors.primary} size={20} />
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameRole}>{game.role}</Text>
              </View>
              <Badge label={game.rank} variant="primary" />
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  displayName: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
  },
  username: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  styleBadge: {
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  gamesList: {
    gap: spacing.md,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
  },
  gameIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryTransparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  gameRole: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
