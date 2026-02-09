"use client";

import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import type { BlogCategory } from "@/types/blog";
import { BLOG_CATEGORIES } from "@/types/blog";

interface CategoryTabsProps {
  selected: BlogCategory | undefined;
  onChange: (category: BlogCategory | undefined) => void;
}

const categoryStyles: Record<string, { active: string; hover: string }> = {
  blue: {
    active: "bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-blue-500/20",
    hover: "hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30",
  },
  green: {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20",
    hover: "hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30",
  },
  purple: {
    active: "bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-purple-500/20",
    hover: "hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30",
  },
  orange: {
    active: "bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-orange-500/20",
    hover: "hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30",
  },
  red: {
    active: "bg-red-500/20 text-red-400 border-red-500/50 shadow-red-500/20",
    hover: "hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30",
  },
  cyan: {
    active: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-cyan-500/20",
    hover: "hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30",
  },
  yellow: {
    active: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-yellow-500/20",
    hover: "hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30",
  },
  pink: {
    active: "bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-pink-500/20",
    hover: "hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-500/30",
  },
};

export function CategoryTabs({ selected, onChange }: CategoryTabsProps) {
  const categories = Object.entries(BLOG_CATEGORIES) as [
    BlogCategory,
    { label: string; color: string }
  ][];

  return (
    <div className="relative mb-6">
      {/* Scrollable container */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* All button */}
        <motion.button
          onClick={() => onChange(undefined)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border shrink-0 ${
            !selected
              ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/50 shadow-lg shadow-primary/10"
              : "bg-surface-light text-text-muted border-border hover:bg-surface-lighter hover:text-white hover:border-border-light"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          All
          {!selected && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.button>

        {/* Divider */}
        <div className="w-px h-6 bg-border shrink-0" />

        {/* Category buttons */}
        {categories.map(([key, { label, color }]) => {
          const style = categoryStyles[color] || categoryStyles.blue;
          const isSelected = selected === key;

          return (
            <motion.button
              key={key}
              onClick={() => onChange(key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border shrink-0 ${
                isSelected
                  ? `${style.active} shadow-lg`
                  : `bg-surface-light text-text-muted border-border ${style.hover}`
              }`}
            >
              {label}
              {isSelected && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Fade edges for scroll indication */}
      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
    </div>
  );
}
