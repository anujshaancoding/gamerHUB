"use client";

import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  Plus,
  Clock,
  MapPin,
  Gamepad2,
  MessageSquare,
} from "lucide-react";
import { Button, Input, LegacySelect as Select, Card, Badge, Modal } from "@/components/ui";
import { GamerCard } from "@/components/gamers/gamer-card";
import { OnlineGamersSection } from "@/components/gamers/online-gamers-section";
import { SuggestedFriendsSection, ProPlayersSection } from "@/components/suggestions";
import { SUPPORTED_GAMES, REGIONS, LANGUAGES, GAMING_STYLES } from "@/lib/constants/games";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFriends } from "@/lib/hooks/useFriends";
import { queryKeys, STALE_TIMES } from "@/lib/query/provider";
import {
  useLFGPosts,
  useCreateLFGPost,
  useDeleteLFGPost,
  useApplyToLFG,
  useMyLFGPosts,
} from "@/lib/hooks/useLFG";
import { DURATION_OPTIONS } from "@/types/lfg";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { Profile, UserGame, Game } from "@/types/database";
import type { LFGPost, LFGFilters, CreateLFGPostInput } from "@/types/lfg";

interface GamerWithGames extends Profile {
  user_games: (UserGame & { game: Game })[];
}

const INITIAL_PROFILES_TO_SHOW = 3;
const PROFILES_PER_LOAD = 3;

type TabId = "find-friends" | "lfg";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "find-friends", label: "Find Friends", icon: Users },
  { id: "lfg", label: "Looking For Group", icon: Gamepad2 },
];

// ─── LFG Post Card ──────────────────────────────────────────
function LFGPostCard({
  post,
  currentUserId,
  onApply,
  onDelete,
}: {
  post: LFGPost;
  currentUserId?: string;
  onApply: (postId: string) => void;
  onDelete: (postId: string) => void;
}) {
  const isOwner = currentUserId === post.creator_id;
  const isFull = post.current_players >= post.max_players;
  const expiresAt = new Date(post.expires_at);
  const isExpired = expiresAt < new Date();
  const timeLeft = getTimeLeft(expiresAt);

  return (
    <Card className="p-4 hover:border-primary/30 transition-colors">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text truncate">{post.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {post.game && (
                <Badge variant="primary" size="sm">
                  {post.game.name}
                </Badge>
              )}
              {post.game_mode && (
                <Badge variant="secondary" size="sm">
                  {post.game_mode}
                </Badge>
              )}
              {post.region && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.region}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {post.voice_required && (
              <span title="Voice required"><Mic className="h-4 w-4 text-primary" /></span>
            )}
            <Badge
              variant={isFull ? "secondary" : isExpired ? "secondary" : "primary"}
              size="sm"
            >
              {isFull ? "Full" : isExpired ? "Expired" : "Open"}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {post.description && (
          <p className="text-sm text-text-secondary line-clamp-2">
            {post.description}
          </p>
        )}

        {/* Creator Info */}
        <div className="flex items-center gap-2">
          {post.creator?.avatar_url ? (
            <Image
              src={post.creator.avatar_url}
              alt={`${post.creator.display_name || post.creator.username || "User"}'s avatar`}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs text-primary font-medium">
                {(post.creator?.display_name || post.creator?.username || "?")[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm text-text-secondary">
            {post.creator?.display_name || post.creator?.username || "Unknown"}
          </span>
          {post.creator_role && (
            <Badge variant="secondary" size="sm">
              {post.creator_role}
            </Badge>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {post.current_players}/{post.max_players} players
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}
            </span>
            {(post.applications_count ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {post.applications_count} applied
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwner ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(post.id)}
                className="text-red-500 hover:text-red-600"
              >
                Cancel Post
              </Button>
            ) : (
              !isFull &&
              !isExpired &&
              currentUserId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApply(post.id)}
                  leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                >
                  Apply
                </Button>
              )
            )}
          </div>
        </div>

        {/* Looking for roles */}
        {post.looking_for_roles && post.looking_for_roles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Looking for:</span>
            {post.looking_for_roles.map((role: string) => (
              <Badge key={role} variant="secondary" size="sm">
                {role}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Create LFG Post Modal ─────────────────────────────────
function CreatePostModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { createPost, isCreating } = useCreateLFGPost();
  const [form, setForm] = useState<CreateLFGPostInput>({
    game_id: "",
    title: "",
    description: "",
    max_players: 5,
    duration_type: "2hr",
    voice_required: false,
    accept_unranked: true,
    region: "",
    language: "en",
  });
  const [error, setError] = useState<string | null>(null);

  const selectedGame = SUPPORTED_GAMES.find((g) => g.slug === form.game_id);

  const handleSubmit = async () => {
    setError(null);
    if (!form.game_id || !form.title?.trim()) {
      setError("Game and title are required.");
      return;
    }

    try {
      await createPost(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Create LFG Post">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Title"
          placeholder="e.g. Need 2 for Ranked Push"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          maxLength={100}
        />

        <Select
          label="Game"
          options={[
            { value: "", label: "Select a game" },
            ...SUPPORTED_GAMES.filter((g) => g.slug !== "other").map((g) => ({
              value: g.slug,
              label: g.name,
            })),
          ]}
          value={form.game_id}
          onChange={(e) =>
            setForm({ ...form, game_id: e.target.value, creator_role: "" })
          }
        />

        {selectedGame && selectedGame.roles.length > 0 && (
          <Select
            label="Your Role"
            options={[
              { value: "", label: "Any role" },
              ...selectedGame.roles.map((r) => ({ value: r, label: r })),
            ]}
            value={form.creator_role || ""}
            onChange={(e) => setForm({ ...form, creator_role: e.target.value })}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Team Size"
            options={[2, 3, 4, 5].map((n) => ({
              value: String(n),
              label: `${n} Players`,
            }))}
            value={String(form.max_players || 5)}
            onChange={(e) =>
              setForm({ ...form, max_players: parseInt(e.target.value) })
            }
          />

          <Select
            label="Duration"
            options={DURATION_OPTIONS.map((d) => ({
              value: d.value,
              label: d.label,
            }))}
            value={form.duration_type || "2hr"}
            onChange={(e) =>
              setForm({
                ...form,
                duration_type: e.target.value as CreateLFGPostInput["duration_type"],
              })
            }
          />
        </div>

        <Select
          label="Region"
          options={[
            { value: "", label: "Any region" },
            ...REGIONS.map((r) => ({ value: r.value, label: r.label })),
          ]}
          value={form.region || ""}
          onChange={(e) => setForm({ ...form, region: e.target.value })}
        />

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.voice_required}
              onChange={(e) =>
                setForm({ ...form, voice_required: e.target.checked })
              }
              className="rounded border-border"
            />
            <span className="text-sm text-text-secondary flex items-center gap-1">
              <Mic className="h-4 w-4" /> Voice Required
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Description (optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={3}
            placeholder="Tell others what you're looking for..."
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isCreating}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {isCreating ? "Creating..." : "Create Post"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Apply Modal ─────────────────────────────────────────────
function ApplyModal({
  postId,
  open,
  onClose,
}: {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { apply, isApplying } = useApplyToLFG();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!postId) return;
    setError(null);
    try {
      await apply({ post_id: postId, message: message.trim() || undefined });
      setMessage("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Apply to Join">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Message (optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={3}
            placeholder="Introduce yourself, share your rank, experience..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? "Applying..." : "Send Application"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function getTimeLeft(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// ─── Find Friends Tab Content ────────────────────────────────
function FindFriendsTab() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { friends } = useFriends({ userId: user?.id });
  const friendIds = useMemo(() => new Set(friends.map((f) => f.friend_id)), [friends]);

  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PROFILES_TO_SHOW);
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
      const params = new URLSearchParams();
      if (selectedRegion) params.set("region", selectedRegion);
      if (selectedLanguage) params.set("language", selectedLanguage);
      if (selectedStyle) params.set("style", selectedStyle);
      if (onlineOnly) params.set("onlineOnly", "true");
      params.set("limit", "50");

      const res = await fetch(`/api/gamers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load gamers");
      const { gamers: data } = await res.json();

      let filtered = (data as GamerWithGames[]) || [];

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

      return filtered.filter((gamer) => {
        if (user && gamer.id === user.id) return false;
        if (friendIds.has(gamer.id)) return false;
        return true;
      });
    },
    staleTime: STALE_TIMES.FIND_GAMERS,
  });

  const prevFilterKey = useMemo(() => JSON.stringify(filterParams), [filterParams]);
  useEffect(() => {
    setVisibleCount(INITIAL_PROFILES_TO_SHOW);
  }, [prevFilterKey]);

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
    selectedGame, selectedRank, selectedRegion,
    selectedLanguage, selectedStyle, onlineOnly, hasmic,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
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

      {/* Filter Panel */}
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
                <Select
                  label="Game"
                  options={[
                    { value: "", label: "All Games" },
                    ...SUPPORTED_GAMES.map((g) => ({ value: g.slug, label: g.name })),
                  ]}
                  value={selectedGame}
                  onChange={(e) => { setSelectedGame(e.target.value); setSelectedRank(""); }}
                />
                <Select
                  label="Rank"
                  options={[
                    { value: "", label: "All Ranks" },
                    ...(selectedGameData?.ranks?.map((r) => ({ value: r, label: r })) || []),
                  ]}
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  disabled={!selectedGame}
                />
                <Select
                  label="Region"
                  options={[
                    { value: "", label: "All Regions" },
                    ...REGIONS.map((r) => ({ value: r.value, label: r.label })),
                  ]}
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                />
                <Select
                  label="Language"
                  options={[
                    { value: "", label: "All Languages" },
                    ...LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
                  ]}
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                />
                <Select
                  label="Gaming Style"
                  options={[
                    { value: "", label: "All Styles" },
                    ...GAMING_STYLES.map((s) => ({ value: s.value, label: s.label })),
                  ]}
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                />
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
                        <span className={`h-2 w-2 rounded-full ${onlineOnly ? "bg-background" : "bg-success"}`} />
                      }
                    >
                      Online Now
                    </Button>
                    <Button
                      variant={hasmic ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setHasMic(!hasmic)}
                      leftIcon={hasmic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
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

      {/* Online Gamers Section */}
      <OnlineGamersSection />

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
          <h3 className="text-lg font-semibold text-text mb-2">Failed to load gamers</h3>
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

// ─── LFG Tab Content ─────────────────────────────────────────
function LFGTab() {
  const { user } = useAuth();

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [applyPostId, setApplyPostId] = useState<string | null>(null);
  const [lfgSubTab, setLfgSubTab] = useState<"browse" | "my-posts">("browse");

  // Filters
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [hasSlots, setHasSlots] = useState(true);

  const filters: LFGFilters = useMemo(
    () => ({
      game: selectedGame || undefined,
      region: selectedRegion || undefined,
      hasSlots: hasSlots || undefined,
    }),
    [selectedGame, selectedRegion, hasSlots]
  );

  const { posts, loading, error, total, hasMore, loadMore, refetch } = useLFGPosts(filters);
  const { posts: myPosts, loading: myPostsLoading } = useMyLFGPosts(user?.id || "");
  const { deletePost } = useDeleteLFGPost();

  const displayPosts = useMemo(() => {
    if (!voiceOnly) return posts;
    return posts.filter((p) => p.voice_required);
  }, [posts, voiceOnly]);

  const activeFiltersCount = [selectedGame, selectedRegion, voiceOnly, !hasSlots].filter(Boolean).length;

  const handleDelete = async (id: string) => {
    if (!confirm("Cancel this LFG post?")) return;
    try {
      await deletePost(id);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* LFG Header with Create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          Find teammates for your next gaming session
        </p>
        {user && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Post
          </Button>
        )}
      </div>

      {/* Browse / My Posts sub-tabs */}
      {user && (
        <div className="flex gap-1 bg-card rounded-lg p-1 border border-border w-fit">
          <button
            onClick={() => setLfgSubTab("browse")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              lfgSubTab === "browse"
                ? "bg-primary text-primary-foreground"
                : "text-text-muted hover:text-text"
            )}
          >
            Browse Posts
          </button>
          <button
            onClick={() => setLfgSubTab("my-posts")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              lfgSubTab === "my-posts"
                ? "bg-primary text-primary-foreground"
                : "text-text-muted hover:text-text"
            )}
          >
            My Posts
            {myPosts.length > 0 && (
              <Badge variant="primary" size="sm" className="ml-1.5">
                {myPosts.length}
              </Badge>
            )}
          </button>
        </div>
      )}

      {/* Browse Sub-Tab */}
      {lfgSubTab === "browse" && (
        <>
          {/* Filter Bar */}
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <Select
              options={[
                { value: "", label: "All Games" },
                ...SUPPORTED_GAMES.filter((g) => g.slug !== "other").map((g) => ({
                  value: g.slug,
                  label: g.name,
                })),
              ]}
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
            />
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
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Select
                      label="Region"
                      options={[
                        { value: "", label: "All Regions" },
                        ...REGIONS.map((r) => ({ value: r.value, label: r.label })),
                      ]}
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                    />
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-text-secondary">
                        Options
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={voiceOnly ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setVoiceOnly(!voiceOnly)}
                          leftIcon={<Mic className="h-4 w-4" />}
                        >
                          Voice Only
                        </Button>
                        <Button
                          variant={hasSlots ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setHasSlots(!hasSlots)}
                          leftIcon={<Users className="h-4 w-4" />}
                        >
                          Has Slots
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {loading && displayPosts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <Card className="text-center py-12">
              <Gamepad2 className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">Failed to load posts</h3>
              <p className="text-text-muted max-w-md mx-auto mb-4">{error}</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </Card>
          ) : displayPosts.length === 0 ? (
            <Card className="text-center py-12">
              <Gamepad2 className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">No LFG posts yet</h3>
              <p className="text-text-muted max-w-md mx-auto mb-4">
                Be the first to create a post and find teammates!
              </p>
              {user && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create Post
                </Button>
              )}
            </Card>
          ) : (
            <>
              <p className="text-sm text-text-muted">
                {total} {total === 1 ? "post" : "posts"} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <LFGPostCard
                      post={post}
                      currentUserId={user?.id}
                      onApply={(id) => setApplyPostId(id)}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* My Posts Sub-Tab */}
      {lfgSubTab === "my-posts" && (
        <>
          {myPostsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : myPosts.length === 0 ? (
            <Card className="text-center py-12">
              <Gamepad2 className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text mb-2">No active posts</h3>
              <p className="text-text-muted max-w-md mx-auto mb-4">
                Create a post to start finding teammates.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create Post
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myPosts.map((post) => (
                <LFGPostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onApply={(id) => setApplyPostId(id)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreatePostModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <ApplyModal postId={applyPostId} open={!!applyPostId} onClose={() => setApplyPostId(null)} />
    </div>
  );
}

// ─── Main Page Content ───────────────────────────────────────
function FindGamersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultTab: TabId = "find-friends";
  const initialTab = (searchParams.get("tab") as TabId) || defaultTab;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Find Gamers</h1>
        <p className="text-text-muted mt-1">
          Discover players who share your passion for gaming
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
              activeTab === tab.id
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text hover:bg-surface-light"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "find-friends" && <FindFriendsTab />}
      {activeTab === "lfg" && <LFGTab />}
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
