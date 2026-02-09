import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  Users,
  Gamepad2,
  Trophy,
  MessageCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../lib/theme';
import { Button } from '../ui';

const { width } = Dimensions.get('window');

interface AuthGateModalProps {
  visible: boolean;
  onSignUp: () => void;
  onSignIn: () => void;
  onContinueAsGuest: () => void;
}

interface FeatureItemProps {
  icon: React.ReactNode;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

export function AuthGateModal({
  visible,
  onSignUp,
  onSignIn,
  onContinueAsGuest,
}: AuthGateModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Top gradient accent */}
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topAccent}
          />

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconGlow} />
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Lock color={colors.text} size={40} />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>Join the Gaming Community</Text>
            <Text style={styles.subtitle}>
              Sign up to unlock all features and connect with gamers worldwide
            </Text>

            {/* Features */}
            <View style={styles.features}>
              <FeatureItem
                icon={<Users color={colors.primary} size={20} />}
                text="Find teammates and build your squad"
              />
              <FeatureItem
                icon={<Gamepad2 color={colors.primary} size={20} />}
                text="Track your gaming stats and progress"
              />
              <FeatureItem
                icon={<Trophy color={colors.primary} size={20} />}
                text="Join tournaments and win rewards"
              />
              <FeatureItem
                icon={<MessageCircle color={colors.primary} size={20} />}
                text="Chat with friends and join communities"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <Button
                title="Create Account"
                onPress={onSignUp}
                variant="primary"
                style={styles.signUpButton}
              />
              <Button
                title="Sign In"
                onPress={onSignIn}
                variant="outline"
                style={styles.signInButton}
              />
            </View>

            {/* Guest link */}
            <TouchableOpacity
              onPress={onContinueAsGuest}
              style={styles.guestLink}
            >
              <Text style={styles.guestLinkText}>
                Continue browsing community as guest
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: width - spacing.md * 2,
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  topAccent: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryGlow,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  features: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryTransparent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  buttons: {
    gap: spacing.md,
  },
  signUpButton: {
    height: 48,
  },
  signInButton: {
    height: 48,
  },
  guestLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  guestLinkText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
