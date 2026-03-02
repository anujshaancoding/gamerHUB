"use client";

import React, { useMemo } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";
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

interface WidgetGridProps {
  layout: unknown;
  widgets: Record<string, React.ReactNode>;
}

/* ------------------------------------------------------------------ */
/*  Default ordering (matches editor defaults)                         */
/* ------------------------------------------------------------------ */

const DEFAULT_ORDER: WidgetLayoutItem[] = [
  { i: "power_level", x: 0, y: 0, w: 2, h: 1, visible: true },
  { i: "player_card", x: 2, y: 0, w: 1, h: 1, visible: true },
  { i: "games", x: 0, y: 1, w: 2, h: 1, visible: true },
  { i: "stats", x: 2, y: 1, w: 1, h: 1, visible: true },
  { i: "activity", x: 0, y: 2, w: 3, h: 1, visible: true },
  { i: "ratings", x: 0, y: 3, w: 1, h: 1, visible: true },
  { i: "clan", x: 1, y: 3, w: 1, h: 1, visible: true },
  { i: "badges", x: 2, y: 3, w: 1, h: 1, visible: true },
  { i: "wall", x: 0, y: 4, w: 3, h: 1, visible: true },
  { i: "music", x: 0, y: 5, w: 3, h: 1, visible: true },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseLayout(raw: unknown): WidgetLayoutItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const parsed: WidgetLayoutItem[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as WidgetLayoutItem).i === "string" &&
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

  return parsed.length > 0 ? parsed : null;
}

function toRglLayout(items: WidgetLayoutItem[]): Layout[] {
  return items
    .filter((item) => item.visible)
    .map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      static: true,
    }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WidgetGrid({ layout, widgets }: WidgetGridProps) {
  const items = useMemo(() => parseLayout(layout), [layout]);

  // ----- Fallback: render all widgets sequentially (no grid) -----
  if (!items) {
    return (
      <div className="flex flex-col gap-4">
        {DEFAULT_ORDER.map((def) => {
          const widget = widgets[def.i];
          if (!widget) return null;
          return (
            <div key={def.i} className="w-full">
              {widget}
            </div>
          );
        })}
      </div>
    );
  }

  // ----- Grid layout mode -----
  const visibleItems = items.filter((item) => item.visible);
  const rglLayout = toRglLayout(items);

  return (
    <ResponsiveGridLayout
      layouts={{ lg: rglLayout, md: rglLayout, sm: rglLayout }}
      breakpoints={{ lg: 700, md: 400, sm: 0 }}
      cols={{ lg: 3, md: 2, sm: 1 }}
      rowHeight={100}
      compactType="vertical"
      isDraggable={false}
      isResizable={false}
      margin={[8, 8]}
      containerPadding={[0, 0]}
    >
      {visibleItems.map((item) => {
        const widget = widgets[item.i];
        if (!widget) return null;

        return (
          <div key={item.i} className="w-full h-full">
            {widget}
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}
