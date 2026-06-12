"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ASPECTS,
  GAMES,
  convertGameFov,
  hFovToVFov,
  type AspectMode,
} from "@/lib/features/tools/fov";

export function FovCalculator() {
  const [fromId, setFromId] = useState("valorant");
  const [toId, setToId] = useState("cs2");
  const [value, setValue] = useState("103");
  const [fromAspect, setFromAspect] = useState<AspectMode>("16:9");
  const [toAspect, setToAspect] = useState<AspectMode>("16:9");

  const from = GAMES.find((g) => g.id === fromId)!;
  const to = GAMES.find((g) => g.id === toId)!;

  const num = Number(value) || 0;
  const result = useMemo(
    () => convertGameFov(num, from, to, ASPECTS[fromAspect], ASPECTS[toAspect]),
    [num, from, to, fromAspect, toAspect]
  );

  const sourceHFov = useMemo(() => {
    if (from.unit === "hfov") return num;
    if (from.unit === "vfov") {
      const h = 2 * Math.atan(Math.tan((num * Math.PI) / 360) * ASPECTS[fromAspect]);
      return (h * 180) / Math.PI;
    }
    return (from.scaleBaseline ?? 90) * num;
  }, [num, from, fromAspect]);

  const sourceVFov = useMemo(() => hFovToVFov(sourceHFov, ASPECTS[fromAspect]), [sourceHFov, fromAspect]);

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setFromAspect(toAspect);
    setToAspect(fromAspect);
    setValue(result.toFixed(2).replace(/\.?0+$/, ""));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <GamePicker label="From game" value={fromId} onChange={setFromId} />
        <button
          onClick={swap}
          className="rounded-full bg-surface-light hover:bg-primary/10 hover:text-primary p-3 transition-colors mx-auto"
          title="Swap"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <GamePicker label="To game" value={toId} onChange={setToId} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NumberField
          label={`${from.label.split(" (")[0]} FOV (${from.unit === "vfov" ? "vertical" : from.unit === "scale" ? "slider" : "horizontal"})`}
          value={value}
          onChange={setValue}
          min={String(from.min)}
          max={String(from.max)}
          hint={from.notes}
        />
        <div className="grid grid-cols-2 gap-3">
          <AspectField label="From aspect" value={fromAspect} onChange={setFromAspect} />
          <AspectField label="To aspect" value={toAspect} onChange={setToAspect} />
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Equivalent {to.label.split(" (")[0]} {to.unit === "vfov" ? "(vertical FOV)" : to.unit === "scale" ? "(slider)" : "(horizontal FOV)"}
        </p>
        <p className="text-3xl font-bold text-text mt-1 font-mono">
          {result.toFixed(2).replace(/\.?0+$/, "")}
        </p>
        <p className="text-xs text-text-muted mt-1">
          on a {toAspect} display
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Stat label="Source horizontal FOV" value={`${sourceHFov.toFixed(1)}°`} />
        <Stat label="Source vertical FOV" value={`${sourceVFov.toFixed(1)}°`} />
      </div>

      {to.notes && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-xs text-text-secondary">
          <Info className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
          <p>{to.label.split(" (")[0]}: {to.notes}</p>
        </div>
      )}
    </div>
  );
}

function GamePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
      >
        {GAMES.map((g) => (
          <option key={g.id} value={g.id}>{g.label}</option>
        ))}
      </select>
    </label>
  );
}

function AspectField({ label, value, onChange }: { label: string; value: AspectMode; onChange: (v: AspectMode) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AspectMode)}
        className="w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
      >
        {(Object.keys(ASPECTS) as AspectMode[]).map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, min, max, hint }: { label: string; value: string; onChange: (v: string) => void; min?: string; max?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-1">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step="0.5"
        className={cn(
          "w-full bg-surface-light/60 border border-border rounded-lg px-3 py-2 text-sm text-text font-mono",
          "focus:outline-none focus:border-primary/50"
        )}
      />
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-text mt-1 font-mono">{value}</p>
    </div>
  );
}
