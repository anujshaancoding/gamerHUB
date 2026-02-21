"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Gift, Plus } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useListings } from "@/lib/hooks/useListings";
import { ListingCard } from "./ListingCard";
import { cn } from "@/lib/utils";
import type { CommunityListing, ListingType } from "@/types/listings";

interface TournamentsTabProps {
  onCreateClick: () => void;
  onListingClick: (listing: CommunityListing) => void;
}

const FILTER_OPTIONS: { value: ListingType | "all"; label: string; icon: typeof Trophy }[] = [
  { value: "all", label: "All", icon: Trophy },
  { value: "tournament", label: "Tournaments", icon: Trophy },
  { value: "giveaway", label: "Giveaways", icon: Gift },
];

export function TournamentsTab({
  onCreateClick,
  onListingClick,
}: TournamentsTabProps) {
  const [filterType, setFilterType] = useState<ListingType | "all">("all");

  const { listings, isLoading, toggleBookmark, isBookmarking } = useListings({
    type: filterType === "all" ? undefined : filterType,
  });

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {FILTER_OPTIONS.map(({ value, label, icon: Icon }) => (
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
            No listings yet
          </h3>
          <p className="text-text-muted mb-4">
            Be the first to share a tournament or giveaway with the community!
          </p>
          <Button onClick={onCreateClick} leftIcon={<Plus className="h-4 w-4" />}>
            Create Listing
          </Button>
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
