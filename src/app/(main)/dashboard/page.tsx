"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  Swords,
  Clock,
  Gamepad2,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Avatar, Badge } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { useProgression } from "@/lib/hooks/useProgression";
import { PremiumBadge } from "@/components/premium";
import { useQuests } from "@/lib/hooks/useQuests";
import { ProgressionOverview, QuestList } from "@/components/gamification";
import { queryKeys, STALE_TIMES } from "@/lib/query/provider";
import type { Match, Challenge, Profile, Game, UserGame } from "@/types/database";

interface DashboardStats {
  totalMatches: number;
  upcomingMatches: number;
  activeChallenges: number;
  followers: number;
}

interface UserGameWithGame extends UserGame {
  game: Game;
}

interface DashboardData {
  stats: DashboardStats;
  upcomingMatches: Match[];
  activeChallenges: Challenge[];
  userGames: UserGameWithGame[];
  recentGamers: Profile[];
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { progression, loading: progressionLoading } = useProgression();
  const { dailyQuests, weeklyQuests, claimQuest, loading: questsLoading, resets } = useQuests();
  const supabase = useMemo(() => createClient(), []);

  const userId = user?.id;

  const { data, isLoading: loading } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async (): Promise<DashboardData> => {
      if (!userId) throw new Error("No user");

      const [gamesResult, matchesResult, challengesResult, followersResult, totalMatchesResult, gamersResult] = await Promise.all([
        supabase
          .from("user_games")
          .select("*, game:games(*)")
          .eq("user_id", userId),
        supabase
          .from("matches")
          .select("*")
          .or(`creator_id.eq.${userId}`)
          .eq("status", "upcoming")
          .order("scheduled_at", { ascending: true })
          .limit(5),
        supabase
          .from("challenges")
          .select("*")
          .eq("creator_id", userId)
          .eq("status", "open")
          .limit(5),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("match_participants")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("profiles")
          .select("*")
          .neq("id", userId)
          .eq("is_online", true)
          .limit(6),
      ]);

      return {
        userGames: (gamesResult.data as UserGameWithGame[]) || [],
        upcomingMatches: matchesResult.data || [],
        activeChallenges: challengesResult.data || [],
        recentGamers: gamersResult.data || [],
        stats: {
          totalMatches: totalMatchesResult.count || 0,
          upcomingMatches: matchesResult.data?.length || 0,
          activeChallenges: challengesResult.data?.length || 0,
          followers: followersResult.count || 0,
        },
      };
    },
    staleTime: STALE_TIMES.DASHBOARD,
    enabled: !!userId && !authLoading,
  });

  const stats = data?.stats ?? { totalMatches: 0, upcomingMatches: 0, activeChallenges: 0, followers: 0 };
  const upcomingMatches = data?.upcomingMatches ?? [];
  const activeChallenges = data?.activeChallenges ?? [];
  const userGames = data?.userGames ?? [];
  const recentGamers = data?.recentGamers ?? [];

  const statCards = [
    { label: "Matches Played", value: stats.totalMatches, icon: Calendar, color: "text-primary" },
    { label: "Upcoming", value: stats.upcomingMatches, icon: Clock, color: "text-accent" },
    { label: "Active Challenges", value: stats.activeChallenges, icon: Swords, color: "text-warning" },
    { label: "Followers", value: stats.followers, icon: Users, color: "text-secondary" },
  ];

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Welcome back, {profile?.display_name || profile?.username}!
          </h1>
          <p className="text-text-muted mt-1">
            Here&apos;s what&apos;s happening in your gaming world
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/matches/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Schedule Match
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full"
          >
            <Card className="h-full">
              <CardContent className="pt-4 h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex flex-col justify-between h-full min-h-[72px]">
                    <p className="text-text-muted text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-text">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-surface-light ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progression & Quests */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progression Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          {!progressionLoading && progression && (
            <ProgressionOverview
              level={progression.level}
              currentLevelXP={progression.current_level_xp}
              xpToNextLevel={progression.xp_to_next_level}
              totalXP={progression.total_xp}
              stats={progression.stats}
              activeTitle={progression.active_title}
              recentBadges={[]}
            />
          )}
        </motion.div>

        {/* Daily Quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          {!questsLoading && (
            <QuestList
              title="Daily Quests"
              quests={dailyQuests}
              onClaim={async (questId) => { await claimQuest(questId); }}
              resetTime={resets?.daily}
            />
          )}
        </motion.div>

        {/* Weekly Quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          {!questsLoading && (
            <QuestList
              title="Weekly Quests"
              quests={weeklyQuests}
              onClaim={async (questId) => { await claimQuest(questId); }}
              resetTime={resets?.weekly}
            />
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Games */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Games</CardTitle>
            <Link href={`/profile/${profile?.username}`}>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {userGames.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No games linked yet</p>
                <Link href={`/profile/${profile?.username}/edit`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    Add Games
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userGames.slice(0, 6).map((ug) => (
                  <div
                    key={ug.id}
                    className="p-3 rounded-lg bg-surface-light border border-border hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {ug.game?.name}
                        </p>
                        {ug.rank && (
                          <Badge variant="primary" size="sm">
                            {ug.rank}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online Gamers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Online Now</CardTitle>
            <Link href="/find-gamers">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                Find More
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentGamers.length === 0 ? (
              <p className="text-text-muted text-center py-4">No gamers online</p>
            ) : (
              <div className="space-y-3">
                {recentGamers.map((gamer) => (
                  <Link
                    key={gamer.id}
                    href={`/profile/${gamer.username}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light transition-colors"
                  >
                    <Avatar
                      src={gamer.avatar_url}
                      alt={gamer.display_name || gamer.username}
                      size="sm"
                      status="online"
                      showStatus
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-text truncate">
                          {gamer.display_name || gamer.username}
                        </p>
                        {gamer.is_premium && (
                          <PremiumBadge size="sm" showLabel={false} animate={false} />
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        @{gamer.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Matches</CardTitle>
            <Link href="/matches">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No upcoming matches</p>
                <Link href="/matches/create">
                  <Button variant="outline" size="sm" className="mt-3">
                    Schedule One
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text">{match.title}</p>
                        <p className="text-sm text-text-muted">
                          {new Date(match.scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={match.match_type === "competitive" ? "primary" : "default"}>
                      {match.match_type}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Challenges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Challenges</CardTitle>
            <Link href="/challenges">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeChallenges.length === 0 ? (
              <div className="text-center py-8">
                <Swords className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No active challenges</p>
                <Link href="/challenges/create">
                  <Button variant="outline" size="sm" className="mt-3">
                    Create Challenge
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeChallenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/challenges/${challenge.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-warning/10">
                        <Swords className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-text">{challenge.title}</p>
                        <p className="text-sm text-text-muted">
                          {formatRelativeTime(challenge.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning">{challenge.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
