"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  X,
  Users,
  Mic,
  MicOff,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { Button, Input, LegacySelect as Select, Card, Badge } from "@/components/ui";
import { GamerCard } from "@/components/gamers/gamer-card";
import { SuggestedFriendsSection, ProPlayersSection } from "@/components/suggestions";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_GAMES, REGIONS, LANGUAGES, GAMING_STYLES } from "@/lib/constants/games";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFriends } from "@/lib/hooks/useFriends";
import type { Profile, UserGame, Game } from "@/types/database";

interface GamerWithGames extends Profile {
  user_games: (UserGame & { game: Game })[];
  /** @internal flag for demo/seed profiles — not rendered in UI */
  _isDemo?: boolean;
}

interface DemoProfile {
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

// Convert demo profile to GamerWithGames format
function convertDemoToGamer(demo: DemoProfile): GamerWithGames {
  return {
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
    online_hours: demo.online_hours,
    social_links: demo.social_links,
    is_online: demo.is_online,
    is_premium: false,
    premium_until: null,
    last_seen: demo.created_at,
    created_at: demo.created_at,
    updated_at: demo.created_at,
    _isDemo: true,
    user_games: demo.games?.map((g) => ({
      id: `demo-${demo.id}-${g.game_slug}`,
      user_id: demo.id,
      game_id: g.game_slug,
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
        icon_url: null,
        banner_url: null,
        description: null,
        genre: "FPS",
        platforms: ["PC"],
        player_count_range: "5v5",
        has_ranked: true,
        rank_system: null,
        is_active: true,
        created_at: demo.created_at,
      },
    })) || [],
  } as GamerWithGames;
}

const INITIAL_PROFILES_TO_SHOW = 3;
const PROFILES_PER_LOAD = 3;

function FindGamersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  // Get friends list to filter them out
  const { friends } = useFriends({ userId: user?.id });
  const friendIds = new Set(friends.map((f) => f.friend_id));

  const [gamers, setGamers] = useState<GamerWithGames[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(INITIAL_PROFILES_TO_SHOW);

  // Section expansion state - only one section can be expanded at a time
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hasmic, setHasMic] = useState(false);

  const fetchGamers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch real profiles
      let query = supabase
        .from("profiles")
        .select(`
          *,
          user_games (
            *,
            game:games (*)
          )
        `)
        .order("last_seen", { ascending: false });

      // Apply filters to real profiles
      if (searchQuery) {
        query = query.or(
          `username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
        );
      }

      if (selectedRegion) {
        query = query.eq("region", selectedRegion);
      }

      if (selectedLanguage) {
        query = query.eq("preferred_language", selectedLanguage);
      }

      if (selectedStyle) {
        query = query.eq("gaming_style", selectedStyle);
      }

      if (onlineOnly) {
        query = query.eq("is_online", true);
      }

      const { data: realData, error: realError } = await query.limit(50);

      if (realError) {
        console.error("Error fetching real profiles:", realError);
      }

      // Fetch demo profiles from view
      let demoQuery = supabase
        .from("demo_profiles_complete")
        .select("*")
        .order("is_online", { ascending: false });

      // Apply filters to demo profiles
      if (searchQuery) {
        demoQuery = demoQuery.or(
          `username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
        );
      }

      if (selectedRegion) {
        demoQuery = demoQuery.ilike("region", `%${selectedRegion}%`);
      }

      if (selectedLanguage) {
        demoQuery = demoQuery.eq("preferred_language", selectedLanguage);
      }

      if (selectedStyle) {
        demoQuery = demoQuery.eq("gaming_style", selectedStyle);
      }

      if (onlineOnly) {
        demoQuery = demoQuery.eq("is_online", true);
      }

      const { data: demoData, error: demoError } = await demoQuery.limit(25);

      if (demoError) {
        console.error("Error fetching demo profiles:", demoError);
      }

      // Convert demo profiles to GamerWithGames format
      const demoGamers: GamerWithGames[] = (demoData as DemoProfile[] || []).map(convertDemoToGamer);

      // Client-side filtering for game and rank
      let filteredReal = (realData as GamerWithGames[]) || [];
      let filteredDemo = demoGamers;

      if (selectedGame) {
        filteredReal = filteredReal.filter((gamer) =>
          gamer.user_games?.some((ug) => ug.game?.slug === selectedGame)
        );
        filteredDemo = filteredDemo.filter((gamer) =>
          gamer.user_games?.some((ug) => ug.game?.slug === selectedGame)
        );
      }

      if (selectedRank && selectedGame) {
        filteredReal = filteredReal.filter((gamer) =>
          gamer.user_games?.some(
            (ug) => ug.game?.slug === selectedGame && ug.rank === selectedRank
          )
        );
        filteredDemo = filteredDemo.filter((gamer) =>
          gamer.user_games?.some(
            (ug) => ug.game?.slug === selectedGame && ug.rank === selectedRank
          )
        );
      }

      // Combine real and demo profiles - demo profiles come after real ones
      // Filter out the current user and their friends
      const combined = [...filteredReal, ...filteredDemo].filter((gamer) => {
        // Exclude current user
        if (user && gamer.id === user.id) return false;
        // Exclude friends
        if (friendIds.has(gamer.id)) return false;
        return true;
      });

      setGamers(combined);
      setVisibleCount(INITIAL_PROFILES_TO_SHOW);
    } catch (error) {
      console.error("Error fetching gamers:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedGame,
    selectedRank,
    selectedRegion,
    selectedLanguage,
    selectedStyle,
    onlineOnly,
    user?.id,
    friendIds.size,
  ]);

  useEffect(() => {
    fetchGamers();
  }, [fetchGamers]);

  const selectedGameData = SUPPORTED_GAMES.find((g) => g.slug === selectedGame);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGame("");
    setSelectedRank("");
    setSelectedRegion("");
    setSelectedLanguage("");
    setSelectedStyle("");
    setOnlineOnly(false);
    setHasMic(false);
  };

  const activeFiltersCount = [
    selectedGame,
    selectedRank,
    selectedRegion,
    selectedLanguage,
    selectedStyle,
    onlineOnly,
    hasmic,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Find Gamers</h1>
        <p className="text-text-muted mt-1">
          Discover players who share your passion for gaming
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-64 md:w-80">
          <Input
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-4 w-4 hover:text-primary" />
                </button>
              )
            }
          />
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <Button
            variant="primary"
            onClick={() => router.push("/lfg")}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Find Teammates
          </Button>
          <Button
            variant={showFilters ? "primary" : "secondary"}
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="primary" size="sm" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchGamers}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter Panel - Now at top */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text">Filter Options</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Game Filter */}
                <Select
                  label="Game"
                  options={[
                    { value: "", label: "All Games" },
                    ...SUPPORTED_GAMES.map((g) => ({
                      value: g.slug,
                      label: g.name,
                    })),
                  ]}
                  value={selectedGame}
                  onChange={(e) => {
                    setSelectedGame(e.target.value);
                    setSelectedRank("");
                  }}
                />

                {/* Rank Filter (dynamic based on game) */}
                <Select
                  label="Rank"
                  options={[
                    { value: "", label: "All Ranks" },
                    ...(selectedGameData?.ranks?.map((r) => ({
                      value: r,
                      label: r,
                    })) || []),
                  ]}
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  disabled={!selectedGame}
                />

                {/* Region Filter */}
                <Select
                  label="Region"
                  options={[
                    { value: "", label: "All Regions" },
                    ...REGIONS.map((r) => ({ value: r.value, label: r.label })),
                  ]}
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                />

                {/* Language Filter */}
                <Select
                  label="Language"
                  options={[
                    { value: "", label: "All Languages" },
                    ...LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
                  ]}
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                />

                {/* Gaming Style Filter */}
                <Select
                  label="Gaming Style"
                  options={[
                    { value: "", label: "All Styles" },
                    ...GAMING_STYLES.map((s) => ({
                      value: s.value,
                      label: s.label,
                    })),
                  ]}
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                />

                {/* Toggle Filters */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Availability
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={onlineOnly ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setOnlineOnly(!onlineOnly)}
                      leftIcon={
                        <span
                          className={`h-2 w-2 rounded-full ${
                            onlineOnly ? "bg-background" : "bg-success"
                          }`}
                        />
                      }
                    >
                      Online Now
                    </Button>
                    <Button
                      variant={hasmic ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setHasMic(!hasmic)}
                      leftIcon={
                        hasmic ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <MicOff className="h-4 w-4" />
                        )
                      }
                    >
                      Has Mic
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Friends Section */}
      {(!expandedSection || expandedSection === "friends") && (
        <SuggestedFriendsSection
          isExpanded={expandedSection === "friends"}
          onToggleExpand={() => setExpandedSection(expandedSection === "friends" ? null : "friends")}
        />
      )}

      {/* Pro Players Section */}
      {(!expandedSection || expandedSection === "proplayers") && (
        <ProPlayersSection
          isExpanded={expandedSection === "proplayers"}
          onToggleExpand={() => setExpandedSection(expandedSection === "proplayers" ? null : "proplayers")}
        />
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : gamers.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No gamers found
          </h3>
          <p className="text-text-muted max-w-md mx-auto">
            Try adjusting your filters or search criteria to find more players.
          </p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {gamers.slice(0, visibleCount).map((gamer, index) => (
              <motion.div
                key={gamer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GamerCard gamer={gamer} />
              </motion.div>
            ))}
          </div>
          {visibleCount < gamers.length && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + PROFILES_PER_LOAD)}
              >
                View More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FindGamersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      }
    >
      <FindGamersContent />
    </Suspense>
  );
}
