"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGames } from "@/lib/hooks/useGames";
import { useGameRoles } from "@/lib/hooks/useLFG";
import type { LFGFilters } from "@/types/lfg";
import { REGIONS } from "@/types/lfg";
import { getGameConfig } from "@/lib/game-configs";

interface LFGFiltersProps {
  filters: LFGFilters;
  onFiltersChange: (filters: LFGFilters) => void;
}

export function LFGFiltersComponent({
  filters,
  onFiltersChange,
}: LFGFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { games } = useGames();
  const { roles } = useGameRoles(filters.game || "");
  const gameConfig = filters.game ? getGameConfig(filters.game) : null;
  const gameModes = gameConfig?.gameModes ?? [];

  const handleChange = (key: keyof LFGFilters, value: unknown) => {
    const newFilters = { ...filters, [key]: value || undefined };
    // Clear role and game mode when game changes
    if (key === "game") {
      newFilters.role = undefined;
      newFilters.gameMode = undefined;
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== ""
  );

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
      {/* Main filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Game select */}
        <Select
          value={filters.game || "all"}
          onValueChange={(v) => handleChange("game", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Games" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            {games.map((game) => (
              <SelectItem key={game.id} value={game.slug}>
                {game.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role select (dynamic based on game) */}
        <Select
          value={filters.role || "any"}
          onValueChange={(v) => handleChange("role", v === "any" ? "" : v)}
          disabled={!filters.game}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Role</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Region select */}
        <Select
          value={filters.region || "any"}
          onValueChange={(v) => handleChange("region", v === "any" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Region</SelectItem>
            {REGIONS.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex-1 sm:flex-none"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showAdvanced ? "Less" : "More"}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex-1 sm:flex-none"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Game mode (dynamic per game) */}
            {gameModes.length > 0 && (
              <Select
                value={filters.gameMode || "any"}
                onValueChange={(v) =>
                  handleChange("gameMode", v === "any" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Mode</SelectItem>
                  {gameModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Min rating */}
            <Input
              type="number"
              placeholder="Min Rating"
              value={filters.minRating || ""}
              onChange={(e) =>
                handleChange(
                  "minRating",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            />

            {/* Max rating */}
            <Input
              type="number"
              placeholder="Max Rating"
              value={filters.maxRating || ""}
              onChange={(e) =>
                handleChange(
                  "maxRating",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            />

            {/* Checkboxes */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:col-span-1">
              <label className="flex items-center gap-2 text-sm text-gray-400 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={filters.includeUnranked !== false}
                  onChange={(e) =>
                    handleChange("includeUnranked", e.target.checked)
                  }
                  className="rounded border-gray-600"
                />
                Unranked
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-400 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={filters.hasSlots === true}
                  onChange={(e) =>
                    handleChange("hasSlots", e.target.checked || undefined)
                  }
                  className="rounded border-gray-600"
                />
                Open Slots
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
