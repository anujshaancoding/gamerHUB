"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ResponsiveGridLayout } from "react-grid-layout";
import {
  Zap,
  User,
  Gamepad2,
  BarChart3,
  Calendar,
  Star,
  Shield,
  Award,
  MessageSquare,
  Music,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import type { Layout } from "react-grid-layout";

import "react-grid-layout/css/styles.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WidgetLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

interface WidgetLayoutEditorProps {
  value: unknown;
  onChange: (layout: WidgetLayoutItem[] | null) => void;
}

/* ------------------------------------------------------------------ */
/*  Widget catalogue                                                   */
/* ------------------------------------------------------------------ */

interface WidgetDef {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultLayout: Omit<WidgetLayoutItem, "visible">;
}

const WIDGET_DEFS: WidgetDef[] = [
  { id: "power_level", name: "Power Level", icon: Zap, defaultLayout: { i: "power_level", x: 0, y: 0, w: 2, h: 1 } },
  { id: "player_card", name: "Player Card", icon: User, defaultLayout: { i: "player_card", x: 2, y: 0, w: 1, h: 1 } },
  { id: "games", name: "Games", icon: Gamepad2, defaultLayout: { i: "games", x: 0, y: 1, w: 2, h: 1 } },
  { id: "stats", name: "Stat Trackers", icon: BarChart3, defaultLayout: { i: "stats", x: 2, y: 1, w: 1, h: 1 } },
  { id: "activity", name: "Activity Calendar", icon: Calendar, defaultLayout: { i: "activity", x: 0, y: 2, w: 3, h: 1 } },
  { id: "ratings", name: "Player Ratings", icon: Star, defaultLayout: { i: "ratings", x: 0, y: 3, w: 1, h: 1 } },
  { id: "clan", name: "Clan Display", icon: Shield, defaultLayout: { i: "clan", x: 1, y: 3, w: 1, h: 1 } },
  { id: "badges", name: "Badges", icon: Award, defaultLayout: { i: "badges", x: 2, y: 3, w: 1, h: 1 } },
  { id: "wall", name: "Gamer Wall", icon: MessageSquare, defaultLayout: { i: "wall", x: 0, y: 4, w: 3, h: 1 } },
  { id: "music", name: "Theme Song", icon: Music, defaultLayout: { i: "music", x: 0, y: 5, w: 3, h: 1 } },
];

const WIDGET_MAP = new Map(WIDGET_DEFS.map((w) => [w.id, w]));

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildDefaultLayout(): WidgetLayoutItem[] {
  return WIDGET_DEFS.map((w) => ({
    ...w.defaultLayout,
    visible: true,
  }));
}

function parseLayout(raw: unknown): WidgetLayoutItem[] {
  if (!Array.isArray(raw)) return buildDefaultLayout();

  const knownIds = new Set(WIDGET_DEFS.map((w) => w.id));
  const seen = new Set<string>();
  const parsed: WidgetLayoutItem[] = [];

  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as WidgetLayoutItem).i === "string" &&
      knownIds.has((item as WidgetLayoutItem).i) &&
      !seen.has((item as WidgetLayoutItem).i)
    ) {
      const it = item as WidgetLayoutItem;
      seen.add(it.i);
      parsed.push({
        i: it.i,
        x: typeof it.x === "number" ? it.x : 0,
        y: typeof it.y === "number" ? it.y : 0,
        w: typeof it.w === "number" ? it.w : 1,
        h: typeof it.h === "number" ? it.h : 1,
        visible: typeof it.visible === "boolean" ? it.visible : true,
      });
    }
  }

  // Add any missing widgets with defaults
  for (const def of WIDGET_DEFS) {
    if (!seen.has(def.id)) {
      parsed.push({ ...def.defaultLayout, visible: true });
    }
  }

  return parsed;
}

function toRglLayout(items: WidgetLayoutItem[]): Layout[] {
  return items.map((item) => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: 1,
    maxW: 3,
    minH: 1,
    maxH: 3,
  }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WidgetLayoutEditor({ value, onChange }: WidgetLayoutEditorProps) {
  const initial = useMemo(() => parseLayout(value), [value]);
  const [items, setItems] = useState<WidgetLayoutItem[]>(initial);

  const visibilityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of items) {
      map.set(item.i, item.visible);
    }
    return map;
  }, [items]);

  const handleLayoutChange = useCallback(
    (newRglLayout: Layout[]) => {
      setItems((prev) => {
        const updated = prev.map((item) => {
          const match = newRglLayout.find((l) => l.i === item.i);
          if (!match) return item;
          return {
            ...item,
            x: match.x,
            y: match.y,
            w: match.w,
            h: match.h,
          };
        });
        onChange(updated);
        return updated;
      });
    },
    [onChange]
  );

  const toggleVisibility = useCallback(
    (widgetId: string) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.i === widgetId ? { ...item, visible: !item.visible } : item
        );
        onChange(updated);
        return updated;
      });
    },
    [onChange]
  );

  const handleReset = useCallback(() => {
    const defaults = buildDefaultLayout();
    setItems(defaults);
    onChange(null);
  }, [onChange]);

  const rglLayout = useMemo(() => toRglLayout(items), [items]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text/60">
          Drag widgets to rearrange your profile layout. Toggle visibility with the eye icon.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text rounded-lg border border-border hover:border-primary/50 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Default
        </button>
      </div>

      {/* Grid editor */}
      <div className="rounded-xl border border-border bg-surface-light/30 p-2 overflow-hidden">
        <ResponsiveGridLayout
          layouts={{ lg: rglLayout, md: rglLayout, sm: rglLayout }}
          breakpoints={{ lg: 700, md: 400, sm: 0 }}
          cols={{ lg: 3, md: 2, sm: 1 }}
          rowHeight={100}
          compactType="vertical"
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          margin={[8, 8]}
          containerPadding={[4, 4]}
        >
          {items.map((item) => {
            const def = WIDGET_MAP.get(item.i);
            if (!def) return null;
            const Icon = def.icon;
            const hidden = !item.visible;

            return (
              <div
                key={item.i}
                className={`group rounded-xl border-2 transition-all duration-200 overflow-hidden flex flex-col ${
                  hidden
                    ? "border-dashed border-border/50 bg-surface-light/20 opacity-50"
                    : "border-border bg-surface-light hover:border-primary/40"
                }`}
              >
                {/* Widget header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                  {/* Drag handle */}
                  <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-surface-lighter transition-colors">
                    <GripVertical className="w-4 h-4 text-text/30 group-hover:text-text/60" />
                  </div>

                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-text/80 truncate flex-1">
                    {def.name}
                  </span>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(item.i);
                    }}
                    className="p-1 rounded-md hover:bg-surface-lighter transition-colors"
                    title={hidden ? "Show widget" : "Hide widget"}
                  >
                    {hidden ? (
                      <EyeOff className="w-3.5 h-3.5 text-text/30" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-text/50 hover:text-text/80" />
                    )}
                  </button>
                </div>

                {/* Widget body placeholder */}
                <div className="flex-1 flex items-center justify-center p-3">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <Icon
                      className={`w-6 h-6 ${
                        hidden ? "text-text/10" : "text-primary/30"
                      }`}
                    />
                    <span
                      className={`text-[10px] uppercase tracking-wider font-medium ${
                        hidden ? "text-text/20" : "text-text/30"
                      }`}
                    >
                      {hidden ? "Hidden" : def.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </motion.div>
  );
}
