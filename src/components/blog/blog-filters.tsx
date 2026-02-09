"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, Gamepad2, Sparkles, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useGames } from "@/lib/hooks/useGames";
import type { BlogFilters, BlogCategory } from "@/types/blog";
import { BLOG_CATEGORIES } from "@/types/blog";

interface BlogFiltersProps {
  filters: BlogFilters;
  onFiltersChange: (filters: BlogFilters) => void;
}

const categoryOptions = Object.entries(BLOG_CATEGORIES).map(([key, value]) => ({
  value: key,
  label: value.label,
}));

export function BlogFiltersComponent({
  filters,
  onFiltersChange,
}: BlogFiltersProps) {
  const { games } = useGames();
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key: keyof BlogFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const handleSearch = () => {
    handleChange("search", searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  return (
    <div className="mb-6">
      {/* Main search bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
            <div className="pl-4 text-text-dim">
              <Search className="w-5 h-5" />
            </div>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search articles, topics, games..."
              className="flex-1 border-0 bg-transparent focus:ring-0 px-3 py-3"
            />
            <AnimatePresence>
              {searchInput && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setSearchInput("");
                    handleChange("search", "");
                  }}
                  className="px-3 text-text-dim hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
            <Button
              variant="primary"
              onClick={handleSearch}
              className="m-1.5 px-4"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Filter toggle button */}
        <Button
          variant={showFilters || activeFilterCount > 0 ? "secondary" : "ghost"}
          onClick={() => setShowFilters(!showFilters)}
          className={`relative border ${
            activeFilterCount > 0
              ? "border-primary/50 bg-primary/10"
              : "border-border"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-black rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 ml-1 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      {/* Expandable filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-surface rounded-xl border border-border">
              <div className="flex flex-wrap items-center gap-4">
                {/* Game filter */}
                <div className="min-w-[200px] flex-1">
                  <label className="block text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    Game
                  </label>
                  <Select
                    value={filters.game || ""}
                    onValueChange={(v) => handleChange("game", v)}
                    placeholder="All Games"
                  >
                    <option value="">All Games</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.slug}>
                        {game.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Category filter */}
                <div className="min-w-[180px] flex-1">
                  <label className="block text-xs font-medium text-text-muted mb-2">
                    Category
                  </label>
                  <Select
                    value={filters.category || ""}
                    onValueChange={(v) =>
                      handleChange("category", v as BlogCategory)
                    }
                    placeholder="All Categories"
                  >
                    <option value="">All Categories</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Featured filter */}
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.featured === true}
                        onChange={(e) =>
                          handleChange(
                            "featured",
                            e.target.checked || undefined
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-surface-lighter rounded-full peer-checked:bg-primary/20 transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-text-dim rounded-full peer-checked:translate-x-4 peer-checked:bg-primary transition-all" />
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-white transition-colors flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Featured Only
                    </span>
                  </label>
                </div>

                {/* Clear filters */}
                <AnimatePresence>
                  {activeFilterCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-end pb-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        Clear all
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFilterCount > 0 && !showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center gap-2 mt-3"
          >
            {filters.search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full text-sm text-text-secondary border border-border">
                <Search className="w-3.5 h-3.5" />
                &quot;{filters.search}&quot;
                <button
                  onClick={() => {
                    setSearchInput("");
                    handleChange("search", "");
                  }}
                  className="ml-1 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.game && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full text-sm text-text-secondary border border-border">
                <Gamepad2 className="w-3.5 h-3.5" />
                {games.find((g) => g.slug === filters.game)?.name ||
                  filters.game}
                <button
                  onClick={() => handleChange("game", "")}
                  className="ml-1 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full text-sm text-text-secondary border border-border">
                {BLOG_CATEGORIES[filters.category]?.label || filters.category}
                <button
                  onClick={() => handleChange("category", "")}
                  className="ml-1 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.featured && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary border border-primary/30">
                <Sparkles className="w-3.5 h-3.5" />
                Featured
                <button
                  onClick={() => handleChange("featured", undefined)}
                  className="ml-1 hover:text-primary-dark"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-text-dim hover:text-white transition-colors"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
