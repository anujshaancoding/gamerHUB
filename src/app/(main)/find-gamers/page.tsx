"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { queryKeys, STALE_TIMES } from "@/lib/query/provider";
import type { Profile, UserGame, Game } from "@/types/database";

interface GamerWithGames extends Profile {
  user_games: (UserGame & { game: Game })[];
}

const INITIAL_PROFILES_TO_SHOW = 3;
const PROFILES_PER_LOAD = 3;

function FindGamersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get friends list to filter them out
  const { friends } = useFriends({ userId: user?.id });
  const friendIds = useMemo(() => new Set(friends.map((f) => f.friend_id)), [friends]);

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

  const filterParams = useMemo(() => ({
    game: selectedGame,
    rank: selectedRank,
    region: selectedRegion,
    language: selectedLanguage,
    style: selectedStyle,
  }), [selectedGame, selectedRank, selectedRegion, selectedLanguage, selectedStyle]);

  const { data: gamers = [], isLoading: loading, error: gamersError } = useQuery({
    queryKey: queryKeys.findGamers(filterParams),
    queryFn: async () => {
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

      if (realError) throw new Error(realError.message);

      // Client-side filtering for game and rank
      let filtered = (realData as GamerWithGames[]) || [];

      if (selectedGame) {
        filtered = filtered.filter((gamer) =>
          gamer.user_games?.some((ug) => ug.game?.slug === selectedGame)
        );
      }

      if (selectedRank && selectedGame) {
        filtered = filtered.filter((gamer) =>
          gamer.user_games?.some(
            (ug) => ug.game?.slug === selectedGame && ug.rank === selectedRank
          )
        );
      }

      // Filter out the current user and their friends
      return filtered.filter((gamer) => {
        if (user && gamer.id === user.id) return false;
        if (friendIds.has(gamer.id)) return false;
        return true;
      });
    },
    staleTime: STALE_TIMES.FIND_GAMERS,
  });

  // Reset visible count when filters change
  const prevFilterKey = useMemo(() => JSON.stringify(filterParams), [filterParams]);
  useEffect(() => {
    setVisibleCount(INITIAL_PROFILES_TO_SHOW);
  }, [prevFilterKey]);

  // Client-side search filtering (instant results as user types)
  const filteredGamers = useMemo(() => {
    if (!searchQuery.trim()) return gamers;
    const q = searchQuery.toLowerCase();
    return gamers.filter(
      (gamer) =>
        gamer.username?.toLowerCase().includes(q) ||
        gamer.display_name?.toLowerCase().includes(q)
    );
  }, [gamers, searchQuery]);

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
          <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["find-gamers"] })}>
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
      ) : gamersError ? (
        <Card className="text-center py-12">
          <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            Failed to load gamers
          </h3>
          <p className="text-text-muted max-w-md mx-auto mb-4">
            Something went wrong while fetching gamers. Please try again.
          </p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["find-gamers"] })}>
            Retry
          </Button>
        </Card>
      ) : filteredGamers.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="h-16 w-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {searchQuery ? "No matching gamers found" : "No gamers found"}
          </h3>
          <p className="text-text-muted max-w-md mx-auto">
            {searchQuery
              ? "Try a different name or clear your search."
              : "Try adjusting your filters or search criteria to find more players."}
          </p>
          {searchQuery ? (
            <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
              Clear Search
            </Button>
          ) : (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div>
          {searchQuery && (
            <p className="text-sm text-text-muted mb-3">
              {filteredGamers.length} {filteredGamers.length === 1 ? "gamer" : "gamers"} matching &quot;{searchQuery}&quot;
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredGamers.slice(0, searchQuery ? filteredGamers.length : visibleCount).map((gamer, index) => (
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
          {!searchQuery && visibleCount < filteredGamers.length && (
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
