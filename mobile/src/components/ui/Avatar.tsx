import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors, borderRadius } from '../../lib/theme';

interface AvatarProps {
  uri?: string | null;
  imageUrl?: string | null;  // Alias for uri
  name?: string;
  size?: number;
  style?: ViewStyle;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export function Avatar({
  uri,
  imageUrl,
  name = '?',
  size = 48,
  style,
  showOnlineStatus = false,
  isOnline = false,
}: AvatarProps) {
  const imageSource = uri || imageUrl;

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const textSize = size * 0.4;

  return (
    <View style={[styles.container, containerStyle, style]}>
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={[styles.image, containerStyle]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.placeholder, containerStyle]}>
          <Text style={[styles.initials, { fontSize: textSize }]}>
            {initials}
          </Text>
        </View>
      )}
      {showOnlineStatus && (
        <View
          style={[
            styles.statusIndicator,
            isOnline ? styles.online : styles.offline,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

export default Avatar;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: colors.surfaceLight,
  },
  placeholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  online: {
    backgroundColor: colors.success,
  },
  offline: {
    backgroundColor: colors.textMuted,
  },
});
