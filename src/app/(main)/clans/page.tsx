"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  Shield,
  Globe,
  Lock,
  Mail,
  Users,
  ChevronDown,
  Gamepad2,
} from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { ClanCard } from "@/components/clans/clan-card";
import { useClans } from "@/lib/hooks/useClans";
import { useGames } from "@/lib/hooks/useGames";
import { useAuth } from "@/lib/hooks/useAuth";
import { useClanMembership } from "@/lib/hooks/useClanMembership";
import { cn } from "@/lib/utils";

const JOIN_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "open", label: "Open", icon: Globe },
  { value: "invite_only", label: "Invite Only", icon: Mail },
  { value: "closed", label: "Closed", icon: Lock },
];

const REGION_OPTIONS = [
  { value: "", label: "All Regions" },
  { value: "India", label: "India" },
  { value: "SEA", label: "Southeast Asia" },
  { value: "EU", label: "Europe" },
  { value: "NA", label: "North America" },
  { value: "ME", label: "Middle East" },
];

export default function ClansPage() {
  const { user } = useAuth();
  const { games } = useGames();
  const { membership, role: myRole } = useClanMembership(user?.id || null);

  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { clans, loading, total, hasMore, loadMore } = useClans({
    search: search || undefined,
    game: selectedGame || undefined,
    region: selectedRegion || undefined,
    recruiting: recruitingOnly || undefined,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Clans
          </h1>
          <p className="text-text-muted mt-1">
            Find a clan to join or create your own
          </p>
        </div>
        {user && (
          <Link href="/clans/create">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Create Clan
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <Card className="p-4 space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Search clans by name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="flex-1"
          />
          <Button
            variant={showFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
            {/* Game Filter */}
            <div>
              <label className="text-xs text-text-muted mb-1 block">Game</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Games</option>
                {games.map((game) => (
                  <option key={game.id} value={game.slug}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="text-xs text-text-muted mb-1 block">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Recruiting Toggle */}
            <div className="flex items-end">
              <button
                onClick={() => setRecruitingOnly(!recruitingOnly)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                  recruitingOnly
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-surface-light border-border text-text-muted hover:text-text"
                )}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Recruiting Only
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Join Type Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1 text-text-muted">
          <Globe className="h-3 w-3 text-success" /> Open - Join freely
        </span>
        <span className="flex items-center gap-1 text-text-muted">
          <Lock className="h-3 w-3 text-warning" /> Closed - Request to join
        </span>
        <span className="flex items-center gap-1 text-text-muted">
          <Mail className="h-3 w-3 text-accent" /> Invite Only - By invitation
        </span>
      </div>

      {/* Results */}
      {loading && clans.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-surface-light rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : clans.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            No clans found
          </h3>
          <p className="text-text-muted mb-4">
            {search
              ? "Try a different search term"
              : "Be the first to create a clan!"}
          </p>
          {user && (
            <Link href="/clans/create">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Clan
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <p className="text-sm text-text-muted">{total} clan{total !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clans.map((clan) => (
              <ClanCard
                key={clan.id}
                clan={clan}
                userRole={membership?.clan_id === clan.id ? myRole : undefined}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                isLoading={loading}
                leftIcon={<ChevronDown className="h-4 w-4" />}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
