import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Settings,
  Edit2,
  Gamepad2,
  Trophy,
  Users,
  Star,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react-native';

import { Card, Avatar, Badge, Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useGames } from '../../hooks/useGames';
import { colors, spacing, fontSize } from '../../lib/theme';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { profile, signOut } = useAuth();
  const { userGames } = useGames();

  const getStyleBadge = (style: string | null) => {
    switch (style) {
      case 'casual':
        return { label: 'Casual', variant: 'default' as const };
      case 'competitive':
        return { label: 'Competitive', variant: 'accent' as const };
      case 'pro':
        return { label: 'Pro', variant: 'primary' as const };
      default:
        return null;
    }
  };

  const styleBadge = getStyleBadge(profile?.gaming_style || null);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.profileInfo}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.display_name || profile?.username || 'User'}
              size={100}
            />
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Edit2 color={colors.background} size={16} />
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>
            {profile?.display_name || profile?.username}
          </Text>
          <Text style={styles.username}>@{profile?.username}</Text>

          {styleBadge && (
            <Badge {...styleBadge} style={styles.styleBadge} />
          )}

          {profile?.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userGames.length}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </View>
      </View>

      {/* My Games */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Gamepad2 color={colors.primary} size={20} />
            <Text style={styles.sectionTitle}>My Games</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MyGames')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {userGames.length > 0 ? (
          <View style={styles.gamesList}>
            {userGames.slice(0, 4).map((userGame: any) => (
              <View key={userGame.id} style={styles.gameItem}>
                <View style={styles.gameIcon}>
                  <Gamepad2 color={colors.primary} size={20} />
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{userGame.game?.name}</Text>
                  {userGame.rank && (
                    <Badge label={userGame.rank} variant="primary" size="sm" />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyGames}>
            <Text style={styles.emptyText}>No games added yet</Text>
            <Button
              title="Add Games"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('MyGames')}
            />
          </View>
        )}
      </Card>

      {/* Quick Stats */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Trophy color={colors.warning} size={20} />
            <Text style={styles.sectionTitle}>Stats</Text>
          </View>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Star color={colors.warning} size={24} />
            <Text style={styles.quickStatValue}>4.8</Text>
            <Text style={styles.quickStatLabel}>Rating</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Trophy color={colors.primary} size={24} />
            <Text style={styles.quickStatValue}>0</Text>
            <Text style={styles.quickStatLabel}>Wins</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Users color={colors.accent} size={24} />
            <Text style={styles.quickStatValue}>0</Text>
            <Text style={styles.quickStatLabel}>Teams</Text>
          </View>
        </View>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.menuItemLeft}>
            <Edit2 color={colors.primary} size={20} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <ChevronRight color={colors.textMuted} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.menuItemLeft}>
            <Settings color={colors.textMuted} size={20} />
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
          <ChevronRight color={colors.textMuted} size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Shield color={colors.textMuted} size={20} />
            <Text style={styles.menuItemText}>Privacy</Text>
          </View>
          <ChevronRight color={colors.textMuted} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={signOut}
        >
          <View style={styles.menuItemLeft}>
            <LogOut color={colors.error} size={20} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    position: 'relative',
  },
  headerBackground: {
    height: 120,
    backgroundColor: colors.surface,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
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
  styleBadge: {
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  gamesList: {
    gap: spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameName: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  emptyGames: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickStatValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  quickStatLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  menuSection: {
    marginHorizontal: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '500',
  },
});
