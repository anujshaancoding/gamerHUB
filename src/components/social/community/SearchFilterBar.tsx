"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  icon?: React.ReactNode;
  type: "select" | "toggle";
  options?: FilterOption[];
  placeholder?: string;
}

export interface SearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  filters?: FilterField[];
  filterValues?: Record<string, string | boolean | undefined>;
  onFilterChange?: (key: string, value: string | boolean | undefined) => void;
  onClearAll?: () => void;
  sortOptions?: FilterOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  debounceMs?: number;
  compact?: boolean;
}

export function SearchFilterBar({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearAll,
  sortOptions,
  sortValue,
  onSortChange,
  debounceMs = 0,
  compact = false,
}: SearchFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const submitSearch = useCallback(
    (val: string) => {
      onSearchChange(val);
    },
    [onSearchChange]
  );

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (debounceMs > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => submitSearch(val), debounceMs);
    }
  };

  const clearSearch = () => {
    setLocalSearch("");
    submitSearch("");
  };

  const activeFilterCount = Object.entries(filterValues).filter(
    ([, v]) => v !== undefined && v !== "" && v !== false
  ).length;

  const hasActiveFilters = activeFilterCount > 0 || !!searchValue;

  const getFilterLabel = (field: FilterField, value: string | boolean | undefined): string => {
    if (field.type === "toggle") return field.label;
    if (field.type === "select" && field.options) {
      return field.options.find((o) => o.value === value)?.label || String(value);
    }
    return String(value);
  };

  return (
    <div className={cn("mb-6", compact && "mb-4")}>
      {/* Search bar row */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-surface border border-border rounded-xl overflow-hidden focus-within:border-primary/50 transition-colors">
            <div className="pl-3 sm:pl-4 text-text-dim">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <Input
              value={localSearch}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch(localSearch)}
              placeholder={searchPlaceholder}
              className="flex-1 border-0 bg-transparent focus:ring-0 px-2 sm:px-3 py-2.5 sm:py-3 text-sm sm:text-base"
            />
            <AnimatePresence>
              {localSearch && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearSearch}
                  className="px-2 sm:px-3 text-text-dim hover:text-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
            <Button
              variant="primary"
              onClick={() => submitSearch(localSearch)}
              className="m-1 sm:m-1.5 px-3 sm:px-4 text-sm"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Sort dropdown */}
        {sortOptions && sortOptions.length > 0 && (
          <div className="hidden sm:block">
            <select
              value={sortValue || ""}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 pr-8 text-sm text-text appearance-none cursor-pointer focus:border-primary/50 focus:outline-none transition-colors"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter toggle */}
        {filters.length > 0 && (
          <Button
            variant={showFilters || activeFilterCount > 0 ? "secondary" : "ghost"}
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "relative border flex-shrink-0",
              activeFilterCount > 0
                ? "border-primary/50 bg-primary/10"
                : "border-border"
            )}
          >
            <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 sm:ml-2 px-1.5 py-0.5 text-xs bg-primary text-black rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 ml-1 transition-transform hidden sm:block",
                showFilters && "rotate-180"
              )}
            />
          </Button>
        )}
      </div>

      {/* Mobile sort */}
      {sortOptions && sortOptions.length > 0 && (
        <div className="sm:hidden mt-2">
          <select
            value={sortValue || ""}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="w-full h-10 rounded-lg border border-border bg-surface px-3 pr-8 text-sm text-text appearance-none cursor-pointer focus:border-primary/50 focus:outline-none transition-colors"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Expandable filter panel */}
      <AnimatePresence>
        {showFilters && filters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-surface rounded-xl border border-border">
              <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                {filters.map((field) => {
                  if (field.type === "select") {
                    return (
                      <div key={field.key} className="min-w-[140px] sm:min-w-[180px] flex-1 max-w-[250px]">
                        <label className="block text-xs font-medium text-text-muted mb-1.5 sm:mb-2 flex items-center gap-1.5">
                          {field.icon}
                          {field.label}
                        </label>
                        <select
                          value={(filterValues[field.key] as string) || ""}
                          onChange={(e) => onFilterChange?.(field.key, e.target.value || undefined)}
                          className="w-full h-10 rounded-lg border border-border bg-surface-light px-3 pr-8 text-sm text-text appearance-none cursor-pointer focus:border-primary/50 focus:outline-none transition-colors"
                        >
                          <option value="">{field.placeholder || `All ${field.label}`}</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === "toggle") {
                    return (
                      <div key={field.key} className="flex items-end pb-0.5 sm:pb-1">
                        <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={!!filterValues[field.key]}
                              onChange={(e) =>
                                onFilterChange?.(field.key, e.target.checked || undefined)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 sm:w-10 h-5 sm:h-6 bg-surface-lighter rounded-full peer-checked:bg-primary/20 transition-colors" />
                            <div className="absolute left-0.5 sm:left-1 top-0.5 sm:top-1 w-4 h-4 bg-text-dim rounded-full peer-checked:translate-x-4 peer-checked:bg-primary transition-all" />
                          </div>
                          <span className="text-xs sm:text-sm text-text-secondary group-hover:text-text transition-colors flex items-center gap-1.5">
                            {field.icon}
                            {field.label}
                          </span>
                        </label>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Clear all */}
                <AnimatePresence>
                  {hasActiveFilters && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-end pb-0.5 sm:pb-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          clearSearch();
                          onClearAll?.();
                        }}
                        className="text-error hover:text-error hover:bg-error/10 text-xs sm:text-sm"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
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

      {/* Active filter chips (shown when panel is closed) */}
      <AnimatePresence>
        {hasActiveFilters && !showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3"
          >
            {searchValue && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-surface rounded-full text-xs sm:text-sm text-text-secondary border border-border">
                <Search className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                &quot;{searchValue}&quot;
                <button onClick={clearSearch} className="ml-0.5 sm:ml-1 hover:text-text">
                  <X className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </button>
              </span>
            )}
            {filters.map((field) => {
              const value = filterValues[field.key];
              if (value === undefined || value === "" || value === false) return null;
              return (
                <span
                  key={field.key}
                  className={cn(
                    "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border",
                    field.type === "toggle"
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-surface text-text-secondary border-border"
                  )}
                >
                  {field.icon || null}
                  {getFilterLabel(field, value)}
                  <button
                    onClick={() => onFilterChange?.(field.key, undefined)}
                    className="ml-0.5 sm:ml-1 hover:text-text"
                  >
                    <X className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  </button>
                </span>
              );
            })}
            <button
              onClick={() => {
                clearSearch();
                onClearAll?.();
              }}
              className="text-xs text-text-dim hover:text-text transition-colors"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
