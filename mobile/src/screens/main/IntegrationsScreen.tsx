import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Shield } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { useIntegrations } from '../../hooks';
import { ConnectionCard } from '../../components/integrations';
import { PlatformConnection } from '../../types/integrations';

const platforms: PlatformConnection['platform'][] = [
  'riot',
  'steam',
  'discord',
  'twitch',
  'playstation',
  'xbox',
  'nintendo',
];

export default function IntegrationsScreen() {
  const {
    connections,
    isLoading,
    refetch,
    connectPlatform,
    disconnectPlatform,
    syncPlatform,
    isConnected,
    getConnection,
    isSyncing,
  } = useIntegrations();

  const handleConnect = async (platform: PlatformConnection['platform']) => {
    try {
      await connectPlatform(platform);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect platform');
    }
  };

  const handleDisconnect = (platform: PlatformConnection['platform']) => {
    Alert.alert(
      'Disconnect Platform',
      'Are you sure you want to disconnect this platform? Your stats will no longer sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectPlatform(platform);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const handleSync = async (platform: PlatformConnection['platform']) => {
    try {
      const result = await syncPlatform(platform);
      if (result.success) {
        Alert.alert('Sync Complete', 'Your stats have been updated!');
      }
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message || 'Failed to sync platform data');
    }
  };

  const connectedCount = connections.filter((c) => c.is_active).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Link size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Connected Platforms</Text>
          <Text style={styles.subtitle}>
            Link your gaming accounts to sync stats and verify your ranks
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{connectedCount}</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{platforms.length - connectedCount}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gaming Platforms</Text>
          {platforms.map((platform) => (
            <ConnectionCard
              key={platform}
              platform={platform}
              connection={getConnection(platform)}
              onConnect={() => handleConnect(platform)}
              onDisconnect={() => handleDisconnect(platform)}
              onSync={() => handleSync(platform)}
              isSyncing={isSyncing}
            />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Shield size={24} color={colors.accent} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your data is secure</Text>
            <Text style={styles.infoText}>
              We only access public profile information and game stats. Your login credentials are never stored.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: fontSize['3xl'],
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.accentTransparent,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: colors.accent,
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
});
