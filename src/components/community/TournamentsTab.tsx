"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Gift, Plus, Gamepad2, CheckCircle2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useListings } from "@/lib/hooks/useListings";
import { useGames } from "@/lib/hooks/useGames";
import { ListingCard } from "./ListingCard";
import { SearchFilterBar } from "./SearchFilterBar";
import { cn } from "@/lib/utils";
import type { CommunityListing, ListingType, ListingStatus } from "@/types/listings";

interface TournamentsTabProps {
  onCreateClick: () => void;
  onListingClick: (listing: CommunityListing) => void;
}

const TYPE_OPTIONS: { value: ListingType | "all"; label: string; icon: typeof Trophy }[] = [
  { value: "all", label: "All", icon: Trophy },
  { value: "tournament", label: "Tournaments", icon: Trophy },
  { value: "giveaway", label: "Giveaways", icon: Gift },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function TournamentsTab({
  onCreateClick,
  onListingClick,
}: TournamentsTabProps) {
  const [filterType, setFilterType] = useState<ListingType | "all">("all");
  const [search, setSearch] = useState("");
  const [gameId, setGameId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  const { games } = useGames();

  const gameOptions = useMemo(
    () => games.map((g) => ({ value: g.id, label: g.name })),
    [games]
  );

  const { listings, isLoading, toggleBookmark, isBookmarking } = useListings({
    type: filterType === "all" ? undefined : filterType,
    search: search || undefined,
    gameId,
    status: status as ListingStatus | undefined,
  });

  const filterFields = useMemo(() => [
    {
      key: "gameId",
      label: "Game",
      icon: <Gamepad2 className="w-3.5 h-3.5" />,
      type: "select" as const,
      options: gameOptions,
      placeholder: "All Games",
    },
    {
      key: "status",
      label: "Status",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      type: "select" as const,
      options: STATUS_OPTIONS,
      placeholder: "Active & Completed",
    },
  ], [gameOptions]);

  const filterValues = useMemo(
    () => ({ gameId, status }),
    [gameId, status]
  );

  const hasFilters = !!search || !!gameId || !!status;

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <SearchFilterBar
        searchPlaceholder="Search tournaments & giveaways..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterFields}
        filterValues={filterValues}
        onFilterChange={(key, val) => {
          if (key === "gameId") setGameId(val as string | undefined);
          if (key === "status") setStatus(val as string | undefined);
        }}
        onClearAll={() => {
          setSearch("");
          setGameId(undefined);
          setStatus(undefined);
        }}
      />

      {/* Type pills + Create button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilterType(value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filterType === value
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text hover:bg-surface-light"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={onCreateClick}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Listing
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : !listings || listings.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {hasFilters ? "No matching listings found" : "No listings yet"}
          </h3>
          <p className="text-text-muted mb-4">
            {hasFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Be the first to share a tournament or giveaway with the community!"}
          </p>
          {hasFilters ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setGameId(undefined);
                setStatus(undefined);
                setFilterType("all");
              }}
            >
              Clear Filters
            </Button>
          ) : (
            <Button onClick={onCreateClick} leftIcon={<Plus className="h-4 w-4" />}>
              Create Listing
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListingCard
                listing={listing}
                onClick={() => onListingClick(listing)}
                onBookmark={() => toggleBookmark(listing.id)}
                isBookmarking={isBookmarking}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
