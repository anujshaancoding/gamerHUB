import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  Calendar,
  Clock,
  Users,
  Gamepad2,
  MapPin,
  Mic,
} from 'lucide-react-native';

import { Card, Avatar, Badge, Button } from '../../components/ui';
import { colors, spacing, fontSize } from '../../lib/theme';

// Mock match data
const MOCK_MATCH = {
  id: '1',
  title: 'Valorant Ranked Push',
  description: 'Looking for skilled players to push ranked. Must have mic and good comms.',
  game: 'Valorant',
  game_mode: 'Competitive',
  max_players: 5,
  current_players: 3,
  scheduled_at: '2024-01-20T18:00:00Z',
  host: {
    username: 'ProPlayer99',
    display_name: 'Arjun Singh',
    avatar_url: null,
    rank: 'Diamond',
  },
  participants: [
    { id: '1', username: 'ProPlayer99', display_name: 'Arjun Singh', avatar_url: null },
    { id: '2', username: 'NinjaMaster', display_name: 'Priya Sharma', avatar_url: null },
    { id: '3', username: 'ApexHunter', display_name: 'Rahul Verma', avatar_url: null },
  ],
  requirements: [
    'Diamond+ rank',
    'Must have mic',
    'Good comms required',
    'No toxic players',
  ],
};

export default function MatchDetailsScreen() {
  const route = useRoute();
  const matchId = (route.params as { matchId: string })?.matchId;

  const match = MOCK_MATCH;
  const scheduledDate = new Date(match.scheduled_at);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.gameIconLarge}>
          <Gamepad2 color={colors.primary} size={32} />
        </View>
        <Text style={styles.title}>{match.title}</Text>
        <View style={styles.badges}>
          <Badge label={match.game} variant="primary" />
          <Badge label={match.game_mode} variant="accent" />
        </View>
      </View>

      {/* Host Info */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Hosted by</Text>
        <View style={styles.hostInfo}>
          <Avatar
            uri={match.host.avatar_url}
            name={match.host.display_name}
            size={48}
          />
          <View style={styles.hostDetails}>
            <Text style={styles.hostName}>{match.host.display_name}</Text>
            <Text style={styles.hostUsername}>@{match.host.username}</Text>
          </View>
          <Badge label={match.host.rank} variant="primary" />
        </View>
      </Card>

      {/* Match Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Calendar color={colors.primary} size={20} />
          </View>
          <View>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {scheduledDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Clock color={colors.accent} size={20} />
          </View>
          <View>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {scheduledDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Users color={colors.warning} size={20} />
          </View>
          <View>
            <Text style={styles.detailLabel}>Players</Text>
            <Text style={styles.detailValue}>
              {match.current_players}/{match.max_players} joined
            </Text>
          </View>
        </View>
      </Card>

      {/* Description */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{match.description}</Text>
      </Card>

      {/* Requirements */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Requirements</Text>
        <View style={styles.requirements}>
          {match.requirements.map((req, index) => (
            <View key={index} style={styles.requirementItem}>
              <View style={styles.requirementBullet} />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Participants */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>
          Participants ({match.current_players}/{match.max_players})
        </Text>
        <View style={styles.participants}>
          {match.participants.map((participant) => (
            <View key={participant.id} style={styles.participantItem}>
              <Avatar
                uri={participant.avatar_url}
                name={participant.display_name}
                size={40}
              />
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>
                  {participant.display_name}
                </Text>
                <Text style={styles.participantUsername}>
                  @{participant.username}
                </Text>
              </View>
            </View>
          ))}
          {/* Empty slots */}
          {Array.from({ length: match.max_players - match.current_players }).map(
            (_, index) => (
              <View key={`empty-${index}`} style={styles.emptySlot}>
                <View style={styles.emptySlotIcon}>
                  <Users color={colors.textMuted} size={20} />
                </View>
                <Text style={styles.emptySlotText}>Waiting for player...</Text>
              </View>
            )
          )}
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Join Match"
          onPress={() => {}}
          style={styles.joinButton}
        />
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  gameIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primaryTransparent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  hostUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  requirements: {
    gap: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requirementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  requirementText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  participants: {
    gap: spacing.md,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
  },
  participantUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptySlotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  actions: {
    marginTop: spacing.lg,
  },
  joinButton: {
    width: '100%',
  },
});
