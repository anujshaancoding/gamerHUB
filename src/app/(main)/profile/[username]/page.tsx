import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileGames } from "@/components/profile/profile-games";
import { ProfileMedals } from "@/components/profile/profile-medals";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileRatings } from "@/components/profile/profile-ratings";
import { ProfileBadges } from "@/components/profile/profile-badges";
import { GlobalRatingBreakdown, scoreToStanding } from "@/components/ratings/global-rating-breakdown";
import type { Profile, TraitEndorsementStats, TrustBadges, StandingLevel } from "@/types/database";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

interface DemoProfileComplete {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  gaming_style: "casual" | "competitive" | "pro" | null;
  preferred_language: string;
  region: string | null;
  timezone: string | null;
  online_hours: unknown;
  social_links: unknown;
  is_online: boolean;
  is_verified: boolean;
  created_at: string;
  games: Array<{
    game: string;
    game_slug: string;
    in_game_name: string;
    rank: string;
    role: string;
    secondary_role: string | null;
    hours: number;
    stats: unknown;
  }>;
  badges: Array<{
    name: string;
    slug: string;
    icon: string;
    description: string;
    rarity: string;
    earned_at: string;
  }>;
  badge_count: number;
  total_hours: number;
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

  // If not found in main profiles, try demo profiles
  if (!profileData) {
    const { data: demoProfile } = await supabase
      .from("demo_profiles_complete")
      .select("*")
      .eq("username", username)
      .single();

    if (!demoProfile) {
      notFound();
    }

    // Render demo profile page
    const demo = demoProfile as DemoProfileComplete;

    // Convert demo profile to Profile format
    const demoAsProfile: Profile = {
      id: demo.id,
      username: demo.username,
      display_name: demo.display_name,
      avatar_url: demo.avatar_url,
      banner_url: demo.banner_url,
      bio: demo.bio,
      gaming_style: demo.gaming_style,
      preferred_language: demo.preferred_language,
      region: demo.region,
      timezone: demo.timezone,
      online_hours: demo.online_hours as Profile["online_hours"],
      social_links: demo.social_links as Profile["social_links"],
      is_online: demo.is_online,
      is_premium: false,
      premium_until: null,
      last_seen: demo.created_at,
      created_at: demo.created_at,
      updated_at: demo.created_at,
    };

    // Convert demo games to user_games format
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const demoUserGames = (demo.games?.map((g) => ({
      id: `demo-${demo.id}-${g.game_slug}`,
      user_id: demo.id,
      game_id: g.game_slug,
      game_username: g.in_game_name,
      game_id_external: null,
      in_game_name: g.in_game_name,
      rank: g.rank,
      role: g.role,
      hours_played: g.hours,
      stats: g.stats,
      is_public: true,
      is_verified: false,
      created_at: demo.created_at,
      updated_at: demo.created_at,
      game: {
        id: g.game_slug,
        name: g.game,
        slug: g.game_slug,
        icon_url: g.game_slug === "valorant"
          ? "/images/banners/gaming-1.svg"
          : "/images/banners/gaming-4.svg",
        banner_url: null,
        has_api: false,
        api_config: null,
        ranks: null,
        roles: null,
        created_at: demo.created_at,
      },
    })) || []) as any[];

    const demoBadges = (demo.badges?.map((b) => ({
      id: `badge-${demo.id}-${b.slug}`,
      user_id: demo.id,
      badge_id: b.slug,
      earned_at: b.earned_at,
      is_featured: false,
      badge: {
        id: b.slug,
        name: b.name,
        slug: b.slug,
        description: b.description,
        icon_url: b.icon,
        rarity: b.rarity,
        category: "achievement",
        requirements: null,
        is_active: true,
        created_at: demo.created_at,
      },
    })) || []) as any[];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Fixed mock trait endorsement data for demo
    const totalEndorsers = 42;
    const demoTraits: TraitEndorsementStats = {
      friendly: Math.floor(totalEndorsers * 0.85),
      teamPlayer: Math.floor(totalEndorsers * 0.78),
      leader: Math.floor(totalEndorsers * 0.62),
      communicative: Math.floor(totalEndorsers * 0.71),
      reliable: Math.floor(totalEndorsers * 0.88),
      totalEndorsers,
    };

    // Mock trust badges for demo
    const demoTrustBadges: TrustBadges = {
      isVeteran: true,
      isActive: true,
      isTrusted: true,
      isVerified: demo.is_verified,
      isCommunityPillar: false,
      isEstablished: true,
    };

    // Mock account standing for demo
    const demoStanding = {
      accountAge: "veteran" as StandingLevel,
      activity: "established" as StandingLevel,
      community: "established" as StandingLevel,
      cleanRecord: "veteran" as StandingLevel,
      engagement: "growing" as StandingLevel,
      repeatPlays: "growing" as StandingLevel,
      clanActivity: "new" as StandingLevel,
      verified: demo.is_verified,
    };

    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Profile Header */}
        <ProfileHeader
          profile={demoAsProfile}
          followersCount={347}
          followingCount={128}
          isFollowing={false}
          isOwnProfile={false}
          trustBadges={demoTrustBadges}
          isPremium={false}
        />

        {/* Main Content Grid - items in same row align horizontally */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Row 1: Games + Player Traits */}
          <div className="lg:col-span-2">
            <ProfileGames userGames={demoUserGames} />
          </div>
          <div>
            <ProfileRatings
              traits={demoTraits}
              profile={demoAsProfile}
              isOwnProfile={false}
            />
          </div>

          {/* Row 2: Badges + Account Standing */}
          <div className="lg:col-span-2">
            <ProfileBadges badges={demoBadges} isOwnProfile={false} />
          </div>
          <div>
            <GlobalRatingBreakdown factors={demoStanding} />
          </div>

          {/* Row 3: Medals + Stats */}
          <div className="lg:col-span-2">
            <ProfileMedals achievements={[]} username={username} />
          </div>
          <div>
            <ProfileStats
              profile={demoAsProfile}
              matchesPlayed={1247}
              gamesLinked={demoUserGames.length}
            />
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Profile Header - Full Width */}
      <ProfileHeader
        profile={profile}
        followersCount={followersCount || 0}
        followingCount={followingCount || 0}
        isFollowing={isFollowing}
        isOwnProfile={isOwnProfile}
        trustBadges={trustBadges}
        isPremium={isPremium}
      />

      {/* Main Content Grid - items in same row align horizontally */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Row 1: Games + Player Traits */}
        <div className="lg:col-span-2">
          <ProfileGames userGames={userGames || []} />
        </div>
        <div>
          <ProfileRatings
            traits={traitStats}
            profile={profile}
            isOwnProfile={isOwnProfile}
          />
        </div>

        {/* Row 2: Badges + Stats */}
        <div className="lg:col-span-2">
          <ProfileBadges
            badges={userBadges || []}
            isOwnProfile={isOwnProfile}
          />
        </div>
        <div>
          {standingFactors && (
            <GlobalRatingBreakdown factors={standingFactors} />
          )}
        </div>

        {/* Row 3: Medals + Quick Stats */}
        <div className="lg:col-span-2">
          <ProfileMedals achievements={achievements || []} username={username} />
        </div>
        <div>
          <ProfileStats
            profile={profile}
            matchesPlayed={(profile as unknown as { total_matches_played?: number }).total_matches_played || 0}
            gamesLinked={userGames?.length || 0}
          />
        </div>
      </div>
    </div>
  );
}
