import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList>;
  LFGTab: NavigatorScreenParams<LFGStackParamList>;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  MatchDetails: { matchId: string };
  CreateMatch: undefined;
  Notifications: undefined;
  Quests: undefined;
  BattlePass: undefined;
  Leaderboard: undefined;
  Shop: undefined;
  Tournaments: undefined;
  TournamentDetails: { tournamentId: string };
  CreateTournament: undefined;
  Challenges: undefined;
  ChallengeDetails: { challengeId: string };
  CommunityChallengeDetails: { challengeId: string };
  CreateChallenge: undefined;
};

export type CommunityStackParamList = {
  CommunityHome: undefined;
  ClanDetails: { clanId: string };
  CreateClan: undefined;
  FindGamers: undefined;
  GamerProfile: { userId: string };
};

export type LFGStackParamList = {
  LFGHome: undefined;
  LFGDetails: { postId: string };
  CreateLFG: undefined;
};

export type MessagesStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string; title?: string; avatarUrl?: string };
  NewConversation: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
  MyGames: undefined;
  Integrations: undefined;
  Badges: undefined;
  GamerProfile: { userId: string };
};

// Keep old types for backward compatibility
export type FindGamersStackParamList = CommunityStackParamList;

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

export type DashboardStackScreenProps<T extends keyof DashboardStackParamList> =
  NativeStackScreenProps<DashboardStackParamList, T>;

export type CommunityStackScreenProps<T extends keyof CommunityStackParamList> =
  NativeStackScreenProps<CommunityStackParamList, T>;

export type LFGStackScreenProps<T extends keyof LFGStackParamList> =
  NativeStackScreenProps<LFGStackParamList, T>;

export type MessagesStackScreenProps<T extends keyof MessagesStackParamList> =
  NativeStackScreenProps<MessagesStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;
