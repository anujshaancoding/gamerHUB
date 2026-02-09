import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  Calendar,
  Users,
  Trophy,
  ChevronRight,
  Gamepad2,
  Zap,
} from 'lucide-react-native';

import { Card, Avatar, Badge, Button } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useMatches } from '../../hooks/useMatches';
import { useFriends } from '../../hooks/useFriends';
import { useNotifications } from '../../hooks/useNotifications';
import { colors, spacing, fontSize } from '../../lib/theme';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const { upcomingMatches, isLoading: matchesLoading } = useMatches();
  const { friends, pendingRequests } = useFriends();
  const { unreadCount } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refetch data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const onlineFriends = friends.filter((f: any) => f?.is_online);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>
            {profile?.display_name || profile?.username || 'Gamer'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Bell color={colors.text} size={24} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Users color={colors.primary} size={24} />
          <Text style={styles.statValue}>{friends.length}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </Card>
        <Card style={styles.statCard}>
          <Gamepad2 color={colors.accent} size={24} />
          <Text style={styles.statValue}>{upcomingMatches.length}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </Card>
        <Card style={styles.statCard}>
          <Trophy color={colors.warning} size={24} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </Card>
      </View>

      {/* Friend Requests */}
      {pendingRequests.length > 0 && (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            <Badge label={`${pendingRequests.length}`} variant="primary" size="sm" />
          </View>
          <View style={styles.requestsList}>
            {pendingRequests.slice(0, 3).map((request: any) => (
              <View key={request.id} style={styles.requestItem}>
                <Avatar
                  uri={request.sender?.avatar_url}
                  name={request.sender?.display_name || request.sender?.username}
                  size={40}
                />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>
                    {request.sender?.display_name || request.sender?.username}
                  </Text>
                  <Text style={styles.requestUsername}>
                    @{request.sender?.username}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <Button title="Accept" size="sm" onPress={() => {}} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Online Friends */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Online Friends</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineCount}>{onlineFriends.length} online</Text>
          </View>
        </View>
        {onlineFriends.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.friendsScroll}
          >
            {onlineFriends.map((friend: any) => (
              <TouchableOpacity key={friend.id} style={styles.friendItem}>
                <Avatar
                  uri={friend.avatar_url}
                  name={friend.display_name || friend.username}
                  size={56}
                  showOnlineStatus
                  isOnline
                />
                <Text style={styles.friendName} numberOfLines={1}>
                  {friend.display_name || friend.username}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>No friends online</Text>
        )}
      </Card>

      {/* Upcoming Matches */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Matches</Text>
          <TouchableOpacity>
            <ChevronRight color={colors.textMuted} size={20} />
          </TouchableOpacity>
        </View>
        {upcomingMatches.length > 0 ? (
          <View style={styles.matchesList}>
            {upcomingMatches.slice(0, 3).map((match: any) => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchItem}
                onPress={() => navigation.navigate('MatchDetails', { matchId: match.id })}
              >
                <View style={styles.matchIcon}>
                  <Gamepad2 color={colors.primary} size={20} />
                </View>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTitle}>{match.title}</Text>
                  <View style={styles.matchMeta}>
                    <Calendar color={colors.textMuted} size={14} />
                    <Text style={styles.matchDate}>
                      {new Date(match.scheduled_at).toLocaleDateString()}
                    </Text>
                    <Users color={colors.textMuted} size={14} />
                    <Text style={styles.matchPlayers}>
                      {match.max_players} players
                    </Text>
                  </View>
                </View>
                <ChevronRight color={colors.textMuted} size={20} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Calendar color={colors.textMuted} size={32} />
            <Text style={styles.emptyText}>No upcoming matches</Text>
            <Button
              title="Find a Match"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('FindGamers')}
            />
          </View>
        )}
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryTransparent }]}>
            <Zap color={colors.primary} size={24} />
          </View>
          <Text style={styles.actionText}>Quick Match</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: colors.accentTransparent }]}>
            <Users color={colors.accent} size={24} />
          </View>
          <Text style={styles.actionText}>Find Squad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: colors.secondaryTransparent }]}>
            <Trophy color={colors.secondary} size={24} />
          </View>
          <Text style={styles.actionText}>Tournaments</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {},
  greeting: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  username: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  friendsScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 70,
  },
  friendName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  requestsList: {
    gap: spacing.md,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  requestUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matchesList: {
    gap: spacing.md,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: 12,
  },
  matchIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryTransparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  matchPlayers: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
