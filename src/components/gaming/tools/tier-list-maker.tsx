"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import {
  TIER_PRESETS,
  DEFAULT_ROWS,
  type TierItem,
} from "@/lib/features/tools/tier-list-presets";

type ItemPlacement = Record<string, string>; // itemId -> rowId | 'pool'

// Route remote artwork through Next's image optimizer: resizes to the chip
// size, serves AVIF/WebP, and caches at the edge. Chips render at h-14 (~56px)
// so 128w covers 2x retina; 256w covers 3x phones.
const optimized = (url: string, w = 128) =>
  `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=70`;

export function TierListMaker() {
  const [presetId, setPresetId] = useState(TIER_PRESETS[0].id);
  const preset = useMemo(() => TIER_PRESETS.find((p) => p.id === presetId)!, [presetId]);

  const [placements, setPlacements] = useState<ItemPlacement>(() =>
    Object.fromEntries(preset.items.map((it) => [it.id, "pool"]))
  );
  const [dragging, setDragging] = useState<string | null>(null);

  // Re-init when the preset changes.
  const lastPreset = useRef(presetId);
  if (lastPreset.current !== presetId) {
    lastPreset.current = presetId;
    setPlacements(Object.fromEntries(preset.items.map((it) => [it.id, "pool"])));
  }

  const handleDrop = (rowId: string) => {
    if (!dragging) return;
    setPlacements((prev) => ({ ...prev, [dragging]: rowId }));
    setDragging(null);
  };

  const reset = () => setPlacements(Object.fromEntries(preset.items.map((it) => [it.id, "pool"])));

  const itemsByRow = (rowId: string) =>
    preset.items.filter((it) => placements[it.id] === rowId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={presetId}
          onChange={(e) => setPresetId(e.target.value)}
          className="bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
        >
          {TIER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
        </Button>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-text-muted">
          <Camera className="h-3.5 w-3.5" /> Screenshot the board to share.
        </span>
      </div>

      <div id="tier-list-board" className="space-y-1 rounded-xl border border-border bg-surface p-3">
        {DEFAULT_ROWS.map((row) => (
          <div
            key={row.id}
            className="flex items-stretch gap-1 min-h-[84px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(row.id)}
          >
            <div className={cn("w-16 flex items-center justify-center rounded-l-md border bg-gradient-to-br font-bold text-text text-2xl", row.color)}>
              {row.label}
            </div>
            <div className="flex-1 flex flex-wrap gap-1 rounded-r-md bg-surface-light/30 p-1.5">
              {itemsByRow(row.id).map((it) => (
                <TierChip key={it.id} item={it} onDragStart={() => setDragging(it.id)} active={dragging === it.id} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border border-border bg-surface p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop("pool")}
      >
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-4 w-4 text-text-muted" />
          <span className="text-xs uppercase tracking-wider text-text-muted">Drag from here onto a row</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {itemsByRow("pool").map((it, idx) => (
            <TierChip
              key={it.id}
              item={it}
              onDragStart={() => setDragging(it.id)}
              active={dragging === it.id}
              // First row of chips is always above the fold — fetch eagerly,
              // give the browser a hint that these are the priority images.
              eager={idx < 14}
            />
          ))}
          {itemsByRow("pool").length === 0 && (
            <p className="text-xs text-text-muted py-2">Pool is empty — every item is placed.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TierChip({
  item,
  onDragStart,
  active,
  eager = false,
}: {
  item: TierItem;
  onDragStart: () => void;
  active: boolean;
  eager?: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={item.label}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-md bg-surface border border-border cursor-grab select-none transition-colors",
        "hover:border-primary/40 hover:bg-surface-light",
        item.image ? "p-1.5" : "px-3 py-2.5",
        active && "opacity-50"
      )}
    >
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimized(item.image)}
          alt={item.label}
          draggable={false}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          width={128}
          height={56}
          className="h-14 w-auto max-w-[150px] object-contain pointer-events-none"
        />
      )}
      <span className="line-clamp-2 max-w-[150px] text-center text-[11px] leading-tight text-text">
        {item.label}
      </span>
    </div>
  );
}
