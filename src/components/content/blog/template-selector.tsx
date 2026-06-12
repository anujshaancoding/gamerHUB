"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Newspaper,
  Zap,
  Minus,
  LayoutGrid,
  Monitor,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOG_TEMPLATES, type BlogTemplate } from "@/types/blog";

interface TemplateSelectorProps {
  selected: BlogTemplate;
  onSelect: (template: BlogTemplate) => void;
}

const TEMPLATE_ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
  Newspaper,
  Zap,
  Minus,
  LayoutGrid,
  Monitor,
};

const TEMPLATE_PREVIEWS: Record<BlogTemplate, React.ReactNode> = {
  classic: (
    <div className="space-y-1.5">
      <div className="w-full h-8 rounded bg-white/10" />
      <div className="w-3/4 h-2 rounded bg-white/20" />
      <div className="space-y-1 mt-2">
        <div className="w-full h-1.5 rounded bg-white/8" />
        <div className="w-full h-1.5 rounded bg-white/8" />
        <div className="w-2/3 h-1.5 rounded bg-white/8" />
      </div>
    </div>
  ),
  magazine: (
    <div className="space-y-1.5">
      <div className="relative w-full h-10 rounded bg-white/10">
        <div className="absolute bottom-1 left-1.5 w-2/3 h-2 rounded bg-white/30" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="space-y-0.5">
          <div className="w-full h-1 rounded bg-white/8" />
          <div className="w-full h-1 rounded bg-white/8" />
        </div>
        <div className="space-y-0.5">
          <div className="w-full h-1 rounded bg-white/8" />
          <div className="w-full h-1 rounded bg-white/8" />
        </div>
      </div>
    </div>
  ),
  cyberpunk: (
    <div className="space-y-1.5">
      <div className="w-full h-2.5 rounded border border-primary/40 bg-primary/5" />
      <div className="w-full h-6 rounded border border-primary/20 bg-primary/3 p-1">
        <div className="w-2/3 h-1 rounded bg-primary/30" />
      </div>
      <div className="space-y-0.5">
        <div className="w-full h-1 rounded bg-white/8 border-l-2 border-primary/30" />
        <div className="w-full h-1 rounded bg-white/8 border-l-2 border-primary/30" />
      </div>
    </div>
  ),
  minimal: (
    <div className="px-3 space-y-1.5">
      <div className="w-2/3 h-2 rounded bg-white/15 mx-auto" />
      <div className="space-y-1 mt-2">
        <div className="w-full h-1 rounded bg-white/6" />
        <div className="w-full h-1 rounded bg-white/6" />
        <div className="w-full h-1 rounded bg-white/6" />
        <div className="w-1/2 h-1 rounded bg-white/6" />
      </div>
    </div>
  ),
  card_grid: (
    <div className="grid grid-cols-2 gap-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded border border-white/10 bg-white/5 p-1">
          <div className="w-full h-3 rounded bg-white/8 mb-0.5" />
          <div className="w-2/3 h-1 rounded bg-white/5" />
        </div>
      ))}
    </div>
  ),
  gaming_stream: (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <div className="flex-1 h-8 rounded bg-white/10" />
        <div className="w-6 h-8 rounded bg-white/5 space-y-0.5 p-0.5">
          <div className="w-full h-1 rounded bg-primary/20" />
          <div className="w-full h-1 rounded bg-white/10" />
          <div className="w-full h-1 rounded bg-white/10" />
        </div>
      </div>
      <div className="flex gap-1">
        <div className="w-4 h-4 rounded-full bg-white/10" />
        <div className="flex-1 space-y-0.5">
          <div className="w-1/2 h-1 rounded bg-white/15" />
          <div className="w-full h-1 rounded bg-white/6" />
        </div>
      </div>
    </div>
  ),
};

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  const templates = Object.entries(BLOG_TEMPLATES) as [BlogTemplate, typeof BLOG_TEMPLATES[BlogTemplate]][];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text">Choose Your Template</h2>
        <p className="text-text-muted mt-2">
          Select a layout style for your blog post
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(([id, template], index) => {
          const Icon = TEMPLATE_ICONS[template.icon];
          const isSelected = selected === id;

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(id)}
              className={cn(
                "relative group text-left rounded-xl border-2 p-4 transition-all duration-300",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-surface hover:border-primary/40 hover:bg-surface-light"
              )}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-black" />
                </motion.div>
              )}

              {/* Preview area */}
              <div className={cn(
                "w-full h-24 rounded-lg p-2 mb-3 transition-colors",
                isSelected ? "bg-primary/10" : "bg-surface-light group-hover:bg-surface-lighter"
              )}>
                {TEMPLATE_PREVIEWS[id]}
              </div>

              {/* Template info */}
              <div className="flex items-center gap-2 mb-1.5">
                {Icon && <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-text-muted")} />}
                <h3 className={cn(
                  "font-semibold text-sm",
                  isSelected ? "text-primary" : "text-text"
                )}>
                  {template.label}
                </h3>
              </div>
              <p className="text-xs text-text-muted line-clamp-2">
                {template.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
