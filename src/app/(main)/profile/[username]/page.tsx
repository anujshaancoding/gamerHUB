import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileGames } from "@/components/profile/profile-games";
import { ProfileMedals } from "@/components/profile/profile-medals";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileRatings } from "@/components/profile/profile-ratings";
import { ProfileBadges } from "@/components/profile/profile-badges";
import { GameThemeProvider } from "@/components/profile/game-theme-provider";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { PowerLevelGauge } from "@/components/profile/power-level-gauge";
import { ActivityCalendar } from "@/components/profile/activity-calendar";
import { PlayerCard } from "@/components/profile/player-card";
import { StatTrackers } from "@/components/profile/stat-trackers";
import { ClanDisplay } from "@/components/profile/clan-display";
import { RankHistoryTimeline } from "@/components/profile/rank-history-timeline";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { GlobalRatingBreakdown, scoreToStanding } from "@/components/ratings/global-rating-breakdown";
import type { Profile, TraitEndorsementStats, TrustBadges, StandingLevel } from "@/types/database";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile from main profiles table
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profileData) {
    notFound();
  }

  const profile = profileData as unknown as Profile;

  // Fetch user games
  const { data: userGames } = await supabase
    .from("user_games")
    .select("*, game:games(*)")
    .eq("user_id", profile.id)
    .eq("is_public", true);

  // Fetch achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*, game:games(*)")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("achievement_date", { ascending: false })
    .limit(12);

  // Fetch trait endorsements (new system - not in auto-generated types)
  const { data: endorsements } = await supabase
    .from("trait_endorsements" as never)
    .select("friendly, team_player, leader, communicative, reliable" as never)
    .eq("endorsed_id" as never, profile.id);

  // Calculate trait endorsement stats
  type EndorsementRow = {
    friendly: boolean;
    team_player: boolean;
    leader: boolean;
    communicative: boolean;
    reliable: boolean;
  };

  const endorsementData = endorsements as EndorsementRow[] | null;
  const totalEndorsers = endorsementData?.length || 0;
  const traitStats: TraitEndorsementStats = {
    friendly: endorsementData?.filter((e) => e.friendly).length || 0,
    teamPlayer: endorsementData?.filter((e) => e.team_player).length || 0,
    leader: endorsementData?.filter((e) => e.leader).length || 0,
    communicative: endorsementData?.filter((e) => e.communicative).length || 0,
    reliable: endorsementData?.filter((e) => e.reliable).length || 0,
    totalEndorsers,
  };

  // Fetch trust badges (public view derived from private trust engine)
  // trust_badges is a DB view not in auto-generated types, so cast the result
  type TrustBadgeRow = {
    user_id: string;
    is_veteran: boolean;
    is_active: boolean;
    is_trusted: boolean;
    is_verified: boolean;
    is_community_pillar: boolean;
    is_established: boolean;
  };
  const { data: trustBadgeRaw } = await supabase
    .from("trust_badges" as never)
    .select("*")
    .eq("user_id" as never, profile.id)
    .single();

  const trustBadgeData = trustBadgeRaw as unknown as TrustBadgeRow | null;
  const trustBadges: TrustBadges = trustBadgeData
    ? {
        isVeteran: trustBadgeData.is_veteran,
        isActive: trustBadgeData.is_active,
        isTrusted: trustBadgeData.is_trusted,
        isVerified: trustBadgeData.is_verified,
        isCommunityPillar: trustBadgeData.is_community_pillar,
        isEstablished: trustBadgeData.is_established,
      }
    : {
        isVeteran: false,
        isActive: false,
        isTrusted: false,
        isVerified: false,
        isCommunityPillar: false,
        isEstablished: false,
      };

  // Fetch account trust for standing breakdown
  // account_trust is a new table not in auto-generated types, so cast the result
  type AccountTrustRow = {
    account_age_score: number;
    activity_score: number;
    community_score: number;
    report_score: number;
    interaction_depth_score: number;
    repeat_play_score: number;
    clan_participation_score: number;
    verification_bonus: number;
  };
  const { data: accountTrustRaw } = await supabase
    .from("account_trust" as never)
    .select("account_age_score, activity_score, community_score, report_score, interaction_depth_score, repeat_play_score, clan_participation_score, verification_bonus" as never)
    .eq("user_id" as never, profile.id)
    .single();

  const accountTrust = accountTrustRaw as unknown as AccountTrustRow | null;
  const standingFactors = accountTrust
    ? {
        accountAge: scoreToStanding(accountTrust.account_age_score),
        activity: scoreToStanding(accountTrust.activity_score),
        community: scoreToStanding(accountTrust.community_score),
        cleanRecord: scoreToStanding(accountTrust.report_score),
        engagement: scoreToStanding(accountTrust.interaction_depth_score),
        repeatPlays: scoreToStanding(accountTrust.repeat_play_score),
        clanActivity: scoreToStanding(accountTrust.clan_participation_score),
        verified: accountTrust.verification_bonus > 0,
      }
    : null;

  // Fetch user badges
  const { data: userBadges } = await supabase
    .from("user_profile_badges")
    .select("*, badge:profile_badges(*)")
    .eq("user_id", profile.id)
    .order("earned_at", { ascending: false });

  // Note: gamification tables (badge_definitions, user_badges, user_progression) are not yet migrated.
  // Badge definitions are provided as static data in the ProfileMedals component.
  // User stats for progress bars are derived from already-fetched profile data below.

  // Fetch follow counts
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  // Check if current user follows this profile
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isFollowing = false;
  let isOwnProfile = false;

  if (user) {
    isOwnProfile = user.id === profile.id;
    if (!isOwnProfile) {
      const { data: follow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .single();
      isFollowing = !!follow;
    }
  }

  // Determine premium status (check DB column, fall back to auth metadata)
  let isPremium = profile.is_premium ?? false;
  if (!isPremium && user && isOwnProfile) {
    const metaPremiumUntil = user.app_metadata?.premium_until;
    if (user.app_metadata?.is_premium && metaPremiumUntil && new Date(metaPremiumUntil) > new Date()) {
      isPremium = true;
    }
  }

  // Log profile view (if not own profile)
  if (user && !isOwnProfile) {
    await supabase.from("profile_views").insert({
      profile_id: profile.id,
      viewer_id: user.id,
      source: "direct",
    } as never);
  }

  // Fetch recent 5 profile viewers (only for own profile)
  type ProfileViewRow = {
    viewer_id: string;
    viewed_at: string;
    viewer: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  };
  let recentViewers: ProfileViewRow[] = [];
  if (isOwnProfile) {
    const { data: viewerData } = await supabase
      .from("profile_views" as never)
      .select("viewer_id, viewed_at, viewer:profiles!profile_views_viewer_id_fkey(id, username, display_name, avatar_url)" as never)
      .eq("profile_id" as never, profile.id)
      .not("viewer_id" as never, "is", null)
      .order("viewed_at" as never, { ascending: false })
      .limit(5);
    const allViewers = (viewerData as unknown as ProfileViewRow[]) || [];
    // Deduplicate by viewer_id — query is ordered by viewed_at desc so first occurrence is most recent
    const seen = new Set<string>();
    recentViewers = allViewers.filter((v) => {
      const id = v.viewer?.id || v.viewer_id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  // Determine primary game slug for theme
  const primaryGameSlug = userGames?.[0]?.game?.slug ?? null;

  // Fetch clan memberships for profile display
  const { data: clanMemberships } = await supabase
    .from("clan_members")
    .select("*, clan:clans(id, name, tag, slug, avatar_url, banner_url)")
    .eq("user_id", profile.id);

  // Fetch rank history for timeline
  const { data: rankHistoryRaw } = await supabase
    .from("rank_history" as never)
    .select("id, rank, achieved_at, season, game_id, game:games(name, slug, icon_url)" as never)
    .eq("user_id" as never, profile.id)
    .order("achieved_at" as never, { ascending: true })
    .limit(20);

  type RankHistoryRow = {
    id: string;
    rank: string;
    achieved_at: string;
    season: string | null;
    game_id: string;
    game: { name: string; slug: string; icon_url: string | null } | null;
  };

  const rankHistory = (rankHistoryRaw as unknown as RankHistoryRow[] | null) || [];
  const rankMilestones = rankHistory.map((rh, i) => ({
    id: rh.id,
    rank: rh.rank,
    gameSlug: rh.game?.slug || "",
    gameName: rh.game?.name || "",
    gameIcon: rh.game?.icon_url || undefined,
    date: rh.achieved_at,
    isCurrent: i === rankHistory.length - 1,
  }));

  // Fetch activity data for power level and calendar
  const { data: activityDataRaw } = await supabase
    .from("user_activity_days" as never)
    .select("activity_date, minutes_online, first_seen_at, last_seen_at" as never)
    .eq("user_id" as never, profile.id)
    .gte("activity_date" as never, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("activity_date" as never, { ascending: true });

  type ActivityRow = { activity_date: string; minutes_online: number; first_seen_at: string; last_seen_at: string };
  const activityRows = (activityDataRaw as unknown as ActivityRow[] | null) || [];
  const totalMinutesOnline = activityRows.reduce((sum, d) => sum + d.minutes_online, 0);
  const totalHoursOnline = Math.round((totalMinutesOnline / 60) * 10) / 10;

  const activeDateSet = new Set(activityRows.filter((d) => d.minutes_online > 0).map((d) => d.activity_date));
  let currentStreak = 0;
  {
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    while (activeDateSet.has(checkDate.toISOString().split("T")[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  let longestStreak = 0;
  if (activityRows.length > 0) {
    let streak = 0;
    const first = new Date(activityRows[0].activity_date);
    const last = new Date(activityRows[activityRows.length - 1].activity_date);
    const cursor = new Date(first);
    while (cursor <= last) {
      if (activeDateSet.has(cursor.toISOString().split("T")[0])) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  const averageDailyMinutes = activeDateSet.size > 0 ? Math.round(totalMinutesOnline / activeDateSet.size) : 0;

  // Compose activity feed from existing data
  type ActivityItem = { id: string; type: "achievement" | "badge" | "game_added" | "rank_up" | "joined"; title: string; description?: string; date: string };
  const activityItems: ActivityItem[] = [];

  // Add achievements
  achievements?.forEach((a) => {
    const ach = a as unknown as { id: string; title: string; description?: string; achievement_date?: string; game?: { name: string } | null };
    activityItems.push({
      id: `ach-${ach.id}`,
      type: "achievement",
      title: `Earned "${ach.title}"`,
      description: ach.game?.name ? `In ${ach.game.name}` : undefined,
      date: ach.achievement_date || profile.created_at,
    });
  });

  // Add badges
  userBadges?.forEach((ub) => {
    const badge = ub as unknown as { id: string; earned_at: string; badge: { display_name: string; rarity: string } };
    activityItems.push({
      id: `badge-${badge.id}`,
      type: "badge",
      title: `Unlocked "${badge.badge.display_name}" badge`,
      description: `${badge.badge.rarity} rarity`,
      date: badge.earned_at,
    });
  });

  // Add games
  userGames?.forEach((ug) => {
    const game = ug as unknown as { id: string; created_at: string; game?: { name: string } | null };
    activityItems.push({
      id: `game-${game.id}`,
      type: "game_added",
      title: `Linked ${game.game?.name || "a game"}`,
      date: game.created_at,
    });
  });

  // Add rank history
  rankHistory.forEach((rh) => {
    activityItems.push({
      id: `rank-${rh.id}`,
      type: "rank_up",
      title: `Reached ${rh.rank}`,
      description: rh.game?.name ? `In ${rh.game.name}` : undefined,
      date: rh.achieved_at,
    });
  });

  // Add joined event
  activityItems.push({
    id: "joined",
    type: "joined",
    title: "Joined GamerHub",
    date: profile.created_at,
  });

  // Sort by date descending (most recent first)
  activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <GameThemeProvider gameSlug={primaryGameSlug}>
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-12">
        {/* Profile Header — always visible above tabs */}
        <ProfileHeader
          profile={profile}
          followersCount={followersCount || 0}
          followingCount={followingCount || 0}
          isFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          trustBadges={trustBadges}
          isPremium={isPremium}
          profileViewsCount={(profile as unknown as Record<string, unknown>)?.profile_views as number ?? 0}
          recentViewers={recentViewers.map((v) => ({
            id: v.viewer?.id || v.viewer_id,
            username: v.viewer?.username || "unknown",
            display_name: v.viewer?.display_name || null,
            avatar_url: v.viewer?.avatar_url || null,
            viewed_at: v.viewed_at,
          }))}
        />

        {/* Tabbed Content */}
        <ProfileTabs>
          {{
            overview: (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {/* Row 1: Power Level (hero) + Clan/Player Card */}
                <div className="md:col-span-2 xl:col-span-2">
                  <PowerLevelGauge
                    gamesLinked={userGames?.length || 0}
                    hoursOnline={totalHoursOnline}
                    badgeCount={userBadges?.length || 0}
                    level={0}
                    endorsementCount={traitStats.totalEndorsers}
                    isPremium={isPremium}
                    isVerified={trustBadges.isVerified}
                  />
                </div>
                <div className="space-y-4">
                  <PlayerCard
                    profile={profile}
                    primaryGame={userGames?.[0] ? {
                      name: userGames[0].game?.name || "",
                      slug: userGames[0].game?.slug || "",
                      rank: userGames[0].rank,
                      role: userGames[0].role,
                      icon_url: userGames[0].game?.icon_url,
                    } : null}
                  />
                </div>
                {/* Row 2: Games (hero) + Stat Trackers */}
                <div className="md:col-span-2 xl:col-span-2">
                  <ProfileGames userGames={userGames || []} />
                </div>
                <div>
                  <StatTrackers
                    stats={{
                      matches_played: (profile as unknown as { total_matches_played?: number }).total_matches_played || 0,
                      matches_won: 0,
                      games_linked: userGames?.length || 0,
                      badge_count: userBadges?.length || 0,
                    }}
                  />
                </div>
                {/* Activity Calendar (full width) */}
                <div className="md:col-span-2 xl:col-span-3">
                  <ActivityCalendar
                    days={activityRows}
                    totalHoursOnline={totalHoursOnline}
                    currentStreak={currentStreak}
                    longestStreak={longestStreak}
                    averageDailyMinutes={averageDailyMinutes}
                    memberSince={profile.created_at}
                  />
                </div>
                {/* Row 3: Player Traits + Clan + Account Standing */}
                <div>
                  <ProfileRatings
                    traits={traitStats}
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                  />
                </div>
                <div>
                  <ClanDisplay memberships={(clanMemberships as unknown as Array<{ id: string; role: string; joined_at: string; clan: { id: string; name: string; tag: string; slug: string; avatar_url: string | null; banner_url: string | null } }>) || []} />
                </div>
                {standingFactors && (
                  <div>
                    <GlobalRatingBreakdown factors={standingFactors} />
                  </div>
                )}
              </div>
            ),
            games: (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 xl:col-span-2 space-y-4">
                  <ProfileGames userGames={userGames || []} />
                  <RankHistoryTimeline milestones={rankMilestones} />
                </div>
                <div className="space-y-4">
                  <StatTrackers
                    stats={{
                      matches_played: (profile as unknown as { total_matches_played?: number }).total_matches_played || 0,
                      matches_won: 0,
                      games_linked: userGames?.length || 0,
                    }}
                  />
                  <ProfileStats
                    profile={profile}
                    matchesPlayed={(profile as unknown as { total_matches_played?: number }).total_matches_played || 0}
                    gamesLinked={userGames?.length || 0}
                  />
                </div>
              </div>
            ),
            achievements: (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 xl:col-span-2">
                  <ProfileBadges
                    badges={userBadges || []}
                    isOwnProfile={isOwnProfile}
                  />
                </div>
                {standingFactors && (
                  <div>
                    <GlobalRatingBreakdown factors={standingFactors} />
                  </div>
                )}
                <div className="md:col-span-2 xl:col-span-3">
                  <ProfileMedals
                    achievements={achievements || []}
                    username={username}
                    userStats={{
                      matches_played: (profile as unknown as { total_matches_played?: number }).total_matches_played || 0,
                      matches_won: 0,
                      challenges_completed: 0,
                      quests_completed: 0,
                      best_win_streak: 0,
                      followers: followersCount || 0,
                      following: followingCount || 0,
                      clans_joined: clanMemberships?.length || 0,
                    }}
                  />
                </div>
              </div>
            ),
            activity: (
              <ProfileActivity activities={activityItems} />
            ),
          }}
        </ProfileTabs>
      </div>
    </GameThemeProvider>
  );
}
