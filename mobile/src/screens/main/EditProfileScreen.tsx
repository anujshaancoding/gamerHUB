import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Camera, Check } from 'lucide-react-native';

import { Button, Input, Avatar, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fontSize } from '../../lib/theme';

const GAMING_STYLES = [
  { id: 'casual', label: 'Casual' },
  { id: 'competitive', label: 'Competitive' },
  { id: 'pro', label: 'Pro' },
];

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile, fetchProfile, user } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [region, setRegion] = useState(profile?.region || '');
  const [gamingStyle, setGamingStyle] = useState(profile?.gaming_style || 'casual');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio,
          region,
          gaming_style: gamingStyle as 'casual' | 'competitive' | 'pro',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={profile?.avatar_url}
            name={displayName || profile?.username || 'User'}
            size={100}
          />
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Camera color={colors.background} size={20} />
          </TouchableOpacity>
        </View>
        <Text style={styles.changeAvatarText}>Change Photo</Text>
      </View>

      {/* Form */}
      <Card style={styles.formCard}>
        <Input
          label="Display Name"
          placeholder="Enter your display name"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Input
          label="Bio"
          placeholder="Tell others about yourself"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <Input
          label="Region"
          placeholder="e.g., Mumbai, Delhi, Bangalore"
          value={region}
          onChangeText={setRegion}
        />

        {/* Gaming Style */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Gaming Style</Text>
          <View style={styles.styleOptions}>
            {GAMING_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                onPress={() => setGamingStyle(style.id)}
                style={[
                  styles.styleOption,
                  gamingStyle === style.id && styles.styleOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.styleOptionText,
                    gamingStyle === style.id && styles.styleOptionTextSelected,
                  ]}
                >
                  {style.label}
                </Text>
                {gamingStyle === style.id && (
                  <Check color={colors.background} size={16} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      {/* Save Button */}
      <Button
        title="Save Changes"
        onPress={handleSave}
        loading={isLoading}
        style={styles.saveButton}
      />
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  changeAvatarText: {
    marginTop: spacing.sm,
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  styleOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  styleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  styleOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  styleOptionText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  styleOptionTextSelected: {
    color: colors.background,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
