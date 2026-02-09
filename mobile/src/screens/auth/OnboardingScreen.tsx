import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gamepad2, Users, Trophy, Zap, Check } from 'lucide-react-native';

import { Button, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fontSize } from '../../lib/theme';

const GAMING_STYLES = [
  { id: 'casual', label: 'Casual', icon: Gamepad2, description: 'Playing for fun and relaxation' },
  { id: 'competitive', label: 'Competitive', icon: Trophy, description: 'Playing to win and improve' },
  { id: 'pro', label: 'Pro/Aspiring Pro', icon: Zap, description: 'Pursuing gaming professionally' },
];

const POPULAR_GAMES = [
  { id: 'valorant', name: 'Valorant' },
  { id: 'cs2', name: 'Counter-Strike 2' },
  { id: 'pubg-mobile', name: 'PUBG Mobile' },
  { id: 'freefire', name: 'Free Fire' },
  { id: 'coc', name: 'Clash of Clans' },
  { id: 'cod-mobile', name: 'COD Mobile' },
  { id: 'other', name: 'Other' },
];

export default function OnboardingScreen() {
  const { user, fetchProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [gamingStyle, setGamingStyle] = useState<string | null>(null);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
    );
  };

  const handleComplete = async () => {
    if (!user || !gamingStyle) return;

    setIsLoading(true);
    try {
      // Update profile with gaming style
      const { error } = await supabase
        .from('profiles')
        .update({
          gaming_style: gamingStyle as 'casual' | 'competitive' | 'pro',
        })
        .eq('id', user.id);

      if (error) throw error;

      // Add selected games
      if (selectedGames.length > 0) {
        // First get game IDs from slugs
        const { data: games } = await supabase
          .from('games')
          .select('id, slug')
          .in('slug', selectedGames);

        if (games && games.length > 0) {
          const userGames = games.map((game) => ({
            user_id: user.id,
            game_id: game.id,
          }));

          await supabase.from('user_games').insert(userGames);
        }
      }

      // Refresh profile to trigger navigation
      await fetchProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What's your gaming style?</Text>
      <Text style={styles.stepDescription}>
        This helps us personalize your experience
      </Text>

      <View style={styles.optionsContainer}>
        {GAMING_STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = gamingStyle === style.id;
          return (
            <TouchableOpacity
              key={style.id}
              onPress={() => setGamingStyle(style.id)}
              activeOpacity={0.8}
            >
              <Card
                style={[
                  styles.styleCard,
                  isSelected && styles.styleCardSelected,
                ]}
              >
                <View style={styles.styleCardContent}>
                  <View
                    style={[
                      styles.styleIconContainer,
                      isSelected && styles.styleIconContainerSelected,
                    ]}
                  >
                    <Icon
                      color={isSelected ? colors.background : colors.primary}
                      size={24}
                    />
                  </View>
                  <View style={styles.styleTextContainer}>
                    <Text style={styles.styleLabel}>{style.label}</Text>
                    <Text style={styles.styleDescription}>
                      {style.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check color={colors.primary} size={24} />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What games do you play?</Text>
      <Text style={styles.stepDescription}>
        Select the games you're interested in (you can add more later)
      </Text>

      <View style={styles.gamesGrid}>
        {POPULAR_GAMES.map((game) => {
          const isSelected = selectedGames.includes(game.id);
          return (
            <TouchableOpacity
              key={game.id}
              onPress={() => toggleGame(game.id)}
              activeOpacity={0.8}
              style={[styles.gameChip, isSelected && styles.gameChipSelected]}
            >
              <Text
                style={[
                  styles.gameChipText,
                  isSelected && styles.gameChipTextSelected,
                ]}
              >
                {game.name}
              </Text>
              {isSelected && (
                <Check color={colors.background} size={16} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Gamepad2 color={colors.primary} size={32} />
          </View>
          <Text style={styles.title}>Let's set up your profile</Text>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressDot,
                step >= 1 && styles.progressDotActive,
              ]}
            />
            <View style={styles.progressLine} />
            <View
              style={[
                styles.progressDot,
                step >= 2 && styles.progressDotActive,
              ]}
            />
          </View>
        </View>

        {/* Step Content */}
        {step === 1 ? renderStep1() : renderStep2()}

        {/* Navigation */}
        <View style={styles.navigation}>
          {step > 1 && (
            <Button
              title="Back"
              variant="outline"
              onPress={() => setStep(step - 1)}
              style={styles.navButton}
            />
          )}
          {step < 2 ? (
            <Button
              title="Continue"
              onPress={() => setStep(2)}
              disabled={!gamingStyle}
              style={[styles.navButton, step === 1 && { flex: 1 }]}
            />
          ) : (
            <Button
              title="Get Started"
              onPress={handleComplete}
              loading={isLoading}
              style={[styles.navButton, { flex: 1 }]}
            />
          )}
        </View>

        {step === 2 && (
          <TouchableOpacity onPress={handleComplete} disabled={isLoading}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
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
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  styleCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  styleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight,
  },
  styleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  styleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleIconContainerSelected: {
    backgroundColor: colors.primary,
  },
  styleTextContainer: {
    flex: 1,
  },
  styleLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  styleDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gameChipText: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '500',
  },
  gameChipTextSelected: {
    color: colors.background,
  },
  navigation: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  navButton: {
    flex: 1,
  },
  skipText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginTop: spacing.lg,
  },
});
