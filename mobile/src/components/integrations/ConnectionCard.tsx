import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, Unlink, RefreshCw, Check } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { PlatformConnection } from '../../types/integrations';

interface ConnectionCardProps {
  platform: PlatformConnection['platform'];
  connection?: PlatformConnection;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
}

const platformInfo: Record<string, { name: string; color: string; icon: string }> = {
  riot: { name: 'Riot Games', color: '#D32936', icon: 'https://cdn.example.com/riot.png' },
  steam: { name: 'Steam', color: '#171A21', icon: 'https://cdn.example.com/steam.png' },
  twitch: { name: 'Twitch', color: '#9146FF', icon: 'https://cdn.example.com/twitch.png' },
  discord: { name: 'Discord', color: '#5865F2', icon: 'https://cdn.example.com/discord.png' },
  playstation: { name: 'PlayStation', color: '#003791', icon: 'https://cdn.example.com/playstation.png' },
  xbox: { name: 'Xbox', color: '#107C10', icon: 'https://cdn.example.com/xbox.png' },
  nintendo: { name: 'Nintendo', color: '#E60012', icon: 'https://cdn.example.com/nintendo.png' },
};

export function ConnectionCard({
  platform,
  connection,
  onConnect,
  onDisconnect,
  onSync,
  isSyncing = false,
}: ConnectionCardProps) {
  const info = platformInfo[platform];
  const isConnected = !!connection?.is_active;

  const formatLastSync = () => {
    if (!connection?.last_synced_at) return 'Never synced';
    const date = new Date(connection.last_synced_at);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Synced just now';
    if (hours < 24) return `Synced ${hours}h ago`;
    return `Synced ${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View style={[styles.container, isConnected && { borderColor: info.color }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${info.color}20` }]}>
          <Text style={[styles.platformIcon, { color: info.color }]}>
            {info.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.platformName}>{info.name}</Text>
          {isConnected ? (
            <View style={styles.connectedRow}>
              <Check size={12} color={colors.success} />
              <Text style={styles.connectedText}>
                {connection.platform_username}
              </Text>
            </View>
          ) : (
            <Text style={styles.notConnected}>Not connected</Text>
          )}
        </View>
        <View style={[styles.statusDot, isConnected ? styles.statusConnected : styles.statusDisconnected]} />
      </View>

      {isConnected && (
        <Text style={styles.lastSync}>{formatLastSync()}</Text>
      )}

      <View style={styles.actions}>
        {isConnected ? (
          <>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={onSync}
              disabled={isSyncing}
            >
              <RefreshCw
                size={16}
                color={colors.primary}
                style={isSyncing ? { transform: [{ rotate: '360deg' }] } : undefined}
              />
              <Text style={styles.syncText}>{isSyncing ? 'Syncing...' : 'Sync'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
              <Unlink size={16} color={colors.error} />
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: info.color }]}
            onPress={onConnect}
          >
            <Link size={16} color="#FFFFFF" />
            <Text style={styles.connectText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformIcon: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  platformName: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  connectedText: {
    color: colors.success,
    fontSize: fontSize.sm,
  },
  notConnected: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusConnected: {
    backgroundColor: colors.success,
  },
  statusDisconnected: {
    backgroundColor: colors.textDim,
  },
  lastSync: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTransparent,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  syncText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error}15`,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  disconnectText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
