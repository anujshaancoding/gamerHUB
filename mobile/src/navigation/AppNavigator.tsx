import React, { useState, useCallback, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import {
  Home,
  Users,
  UserPlus,
  MessageCircle,
  User,
} from 'lucide-react-native';

import { useAuth } from '../hooks/useAuth';
import { colors } from '../lib/theme';
import { AuthGateModal } from '../components/auth/AuthGateModal';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import FindGamersScreen from '../screens/main/FindGamersScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import MatchDetailsScreen from '../screens/main/MatchDetailsScreen';
import GamerProfileScreen from '../screens/main/GamerProfileScreen';

// New Screens
import TournamentsScreen from '../screens/main/TournamentsScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import QuestsScreen from '../screens/main/QuestsScreen';
import ShopScreen from '../screens/main/ShopScreen';
import LFGScreen from '../screens/main/LFGScreen';
import ChatScreen from '../screens/main/ChatScreen';
import IntegrationsScreen from '../screens/main/IntegrationsScreen';
import BattlePassScreen from '../screens/main/BattlePassScreen';
import ChallengesScreen from '../screens/main/ChallengesScreen';

import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  DashboardStackParamList,
  CommunityStackParamList,
  LFGStackParamList,
  MessagesStackParamList,
  ProfileStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DashboardStackNav = createNativeStackNavigator<DashboardStackParamList>();
const CommunityStackNav = createNativeStackNavigator<CommunityStackParamList>();
const LFGStackNav = createNativeStackNavigator<LFGStackParamList>();
const MessagesStackNav = createNativeStackNavigator<MessagesStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

const defaultScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const },
  contentStyle: { backgroundColor: colors.background },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function DashboardNavigator() {
  return (
    <DashboardStackNav.Navigator screenOptions={defaultScreenOptions}>
      <DashboardStackNav.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <DashboardStackNav.Screen
        name="MatchDetails"
        component={MatchDetailsScreen}
        options={{ title: 'Match Details' }}
      />
      <DashboardStackNav.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <DashboardStackNav.Screen
        name="Quests"
        component={QuestsScreen}
        options={{ title: 'Daily & Weekly Quests' }}
      />
      <DashboardStackNav.Screen
        name="BattlePass"
        component={BattlePassScreen}
        options={{ title: 'Battle Pass' }}
      />
      <DashboardStackNav.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      <DashboardStackNav.Screen
        name="Shop"
        component={ShopScreen}
        options={{ title: 'Shop' }}
      />
      <DashboardStackNav.Screen
        name="Tournaments"
        component={TournamentsScreen}
        options={{ title: 'Tournaments' }}
      />
      <DashboardStackNav.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{ title: 'Challenges' }}
      />
    </DashboardStackNav.Navigator>
  );
}

function CommunityNavigator() {
  return (
    <CommunityStackNav.Navigator screenOptions={defaultScreenOptions}>
      <CommunityStackNav.Screen
        name="CommunityHome"
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <CommunityStackNav.Screen
        name="FindGamers"
        component={FindGamersScreen}
        options={{ title: 'Find Gamers' }}
      />
      <CommunityStackNav.Screen
        name="GamerProfile"
        component={GamerProfileScreen}
        options={{ title: 'Gamer Profile' }}
      />
    </CommunityStackNav.Navigator>
  );
}

function LFGNavigator() {
  return (
    <LFGStackNav.Navigator screenOptions={defaultScreenOptions}>
      <LFGStackNav.Screen
        name="LFGHome"
        component={LFGScreen}
        options={{ title: 'Find Group' }}
      />
    </LFGStackNav.Navigator>
  );
}

function MessagesNavigator() {
  return (
    <MessagesStackNav.Navigator screenOptions={defaultScreenOptions}>
      <MessagesStackNav.Screen
        name="ConversationList"
        component={MessagesScreen}
        options={{ title: 'Messages' }}
      />
      <MessagesStackNav.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
    </MessagesStackNav.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStackNav.Navigator screenOptions={defaultScreenOptions}>
      <ProfileStackNav.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStackNav.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStackNav.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStackNav.Screen
        name="Integrations"
        component={IntegrationsScreen}
        options={{ title: 'Connected Accounts' }}
      />
      <ProfileStackNav.Screen
        name="GamerProfile"
        component={GamerProfileScreen}
        options={{ title: 'Gamer Profile' }}
      />
    </ProfileStackNav.Navigator>
  );
}

// Tabs that guests can access without authentication
const GUEST_ALLOWED_TABS = ['CommunityTab'];

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
      }}
    >
      <MainTab.Screen
        name="DashboardTab"
        component={DashboardNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <MainTab.Screen
        name="CommunityTab"
        component={CommunityNavigator}
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <MainTab.Screen
        name="LFGTab"
        component={LFGNavigator}
        options={{
          title: 'LFG',
          tabBarIcon: ({ color, size }) => <UserPlus color={color} size={size} />,
        }}
      />
      <MainTab.Screen
        name="MessagesTab"
        component={MessagesNavigator}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </MainTab.Navigator>
  );
}

// Guest Navigator - Shows MainNavigator with auth gate for protected tabs
function GuestNavigator({
  onSignUp,
  onSignIn
}: {
  onSignUp: () => void;
  onSignIn: () => void;
}) {
  const [showAuthGate, setShowAuthGate] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const handleTabPress = useCallback((routeName: string) => {
    if (!GUEST_ALLOWED_TABS.includes(routeName)) {
      setShowAuthGate(true);
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  }, []);

  const handleContinueAsGuest = useCallback(() => {
    setShowAuthGate(false);
    // Navigate to Community tab
    if (navigationRef.current) {
      navigationRef.current.navigate('Main', { screen: 'CommunityTab' } as never);
    }
  }, []);

  return (
    <>
      <MainTab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          headerShown: false,
        }}
        screenListeners={{
          tabPress: (e) => {
            const routeName = e.target?.split('-')[0] || '';
            if (!GUEST_ALLOWED_TABS.includes(routeName)) {
              e.preventDefault();
              setShowAuthGate(true);
            }
          },
        }}
        initialRouteName="CommunityTab"
      >
        <MainTab.Screen
          name="DashboardTab"
          component={DashboardNavigator}
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <MainTab.Screen
          name="CommunityTab"
          component={CommunityNavigator}
          options={{
            title: 'Community',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <MainTab.Screen
          name="LFGTab"
          component={LFGNavigator}
          options={{
            title: 'LFG',
            tabBarIcon: ({ color, size }) => <UserPlus color={color} size={size} />,
          }}
        />
        <MainTab.Screen
          name="MessagesTab"
          component={MessagesNavigator}
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <MessageCircle color={color} size={size} />
            ),
          }}
        />
        <MainTab.Screen
          name="ProfileTab"
          component={ProfileNavigator}
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </MainTab.Navigator>
      <AuthGateModal
        visible={showAuthGate}
        onSignUp={onSignUp}
        onSignIn={onSignIn}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, profile } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [guestMode, setGuestMode] = useState(false);

  const handleSignUp = useCallback(() => {
    setGuestMode(false);
    // Navigate to register screen
    if (navigationRef.current) {
      navigationRef.current.navigate('Auth', { screen: 'Register' } as never);
    }
  }, []);

  const handleSignIn = useCallback(() => {
    setGuestMode(false);
    // Navigate to login screen
    if (navigationRef.current) {
      navigationRef.current.navigate('Auth', { screen: 'Login' } as never);
    }
  }, []);

  // Enter guest mode to browse community
  const enterGuestMode = useCallback(() => {
    setGuestMode(true);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine what to show
  const showAuth = !isAuthenticated && !guestMode;
  const showOnboarding = isAuthenticated && !profile;
  const showMain = isAuthenticated && profile;
  const showGuestMain = !isAuthenticated && guestMode;

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {showAuth ? (
          <RootStack.Screen name="Auth">
            {() => <AuthNavigatorWithGuestMode onGuestMode={enterGuestMode} />}
          </RootStack.Screen>
        ) : showOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : showGuestMain ? (
          <RootStack.Screen name="Main">
            {() => <GuestNavigator onSignUp={handleSignUp} onSignIn={handleSignIn} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// Auth navigator with guest mode option
function AuthNavigatorWithGuestMode({ onGuestMode }: { onGuestMode: () => void }) {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login">
        {(props) => <LoginScreen {...props} onGuestMode={onGuestMode} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {(props) => <RegisterScreen {...props} onGuestMode={onGuestMode} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
