"use client";

import { useMemo, useState } from "react";
import { SKIN_VP, VP_TO_INR, VP_TO_USD, type SkinTier } from "@/lib/features/tools/valorant-skins";
import { cn } from "@/lib/utils";

type Counts = Record<SkinTier, { gun: number; knife: number }>;

const EMPTY: Counts = {
  select:    { gun: 0, knife: 0 },
  deluxe:    { gun: 0, knife: 0 },
  premium:   { gun: 0, knife: 0 },
  exclusive: { gun: 0, knife: 0 },
  ultra:     { gun: 0, knife: 0 },
};

const TIERS: SkinTier[] = ["select", "deluxe", "premium", "exclusive", "ultra"];

export function SkinEstimator() {
  const [counts, setCounts] = useState<Counts>(EMPTY);

  const { totalVP, totalGuns, totalKnives } = useMemo(() => {
    let vp = 0,
      guns = 0,
      knives = 0;
    for (const t of TIERS) {
      vp += counts[t].gun * SKIN_VP[t].gun;
      vp += counts[t].knife * SKIN_VP[t].knife;
      guns += counts[t].gun;
      knives += counts[t].knife;
    }
    return { totalVP: vp, totalGuns: guns, totalKnives: knives };
  }, [counts]);

  const update = (t: SkinTier, kind: "gun" | "knife", v: string) => {
    const n = Math.max(0, Math.min(999, parseInt(v) || 0));
    setCounts((prev) => ({ ...prev, [t]: { ...prev[t], [kind]: n } }));
  };

  const inr = totalVP * VP_TO_INR;
  const usd = totalVP * VP_TO_USD;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-light/50 text-text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2.5">Tier</th>
              <th className="text-right px-4 py-2.5">Gun VP</th>
              <th className="text-right px-4 py-2.5">Knife VP</th>
              <th className="text-right px-4 py-2.5">Guns</th>
              <th className="text-right px-4 py-2.5">Knives</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t, i) => (
              <tr key={t} className={cn("border-t border-border/40", i % 2 ? "bg-surface-light/10" : "")}>
                <td className="px-4 py-2 font-medium text-text">{SKIN_VP[t].label}</td>
                <td className="px-4 py-2 text-right font-mono text-text-secondary">{SKIN_VP[t].gun.toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-mono text-text-secondary">{SKIN_VP[t].knife.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    value={counts[t].gun}
                    onChange={(e) => update(t, "gun", e.target.value)}
                    className="w-16 bg-surface-light/60 border border-border rounded px-2 py-1 text-right font-mono text-text focus:outline-none focus:border-primary/50"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    value={counts[t].knife}
                    onChange={(e) => update(t, "knife", e.target.value)}
                    className="w-16 bg-surface-light/60 border border-border rounded px-2 py-1 text-right font-mono text-text focus:outline-none focus:border-primary/50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Estimated total spend</p>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div>
            <p className="text-2xl font-bold text-text font-mono">{totalVP.toLocaleString()}</p>
            <p className="text-xs text-text-muted mt-0.5">VP</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text font-mono">
              ₹{inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-text-muted mt-0.5">INR (approx)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text font-mono">${usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-text-muted mt-0.5">USD (approx)</p>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-3">
          {totalGuns} gun skins · {totalKnives} knives
        </p>
      </div>
    </div>
  );
}
