"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Crosshair } from "lucide-react";
import { proxyAssetUrl } from "@/lib/tracker/valorant-assets";
import type { WeaponStat } from "@/lib/tracker/types";

export function FavoriteWeapons({ weapons }: { weapons: WeaponStat[] }) {
  if (!weapons.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Crosshair className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text sm:text-lg">Favorite Weapons</h3>
          <p className="text-xs text-text-muted sm:text-sm">
            Top 3 weapons by total kills, with accuracy and headshot breakdowns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {weapons.map((w, idx) => (
          <WeaponCard key={w.weaponId} weapon={w} rank={idx + 1} />
        ))}
      </div>
    </section>
  );
}

function WeaponCard({ weapon, rank }: { weapon: WeaponStat; rank: number }) {
  const [imgError, setImgError] = useState(false);
  const src = proxyAssetUrl("weapon", weapon.weaponId);
  const rankColor =
    rank === 1 ? "text-warning" : rank === 2 ? "text-text-secondary" : "text-text-muted";

  return (
    <Card variant="outlined" className="relative p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text">{weapon.weaponName}</p>
        <span className={`text-xs font-bold tabular-nums ${rankColor}`}>#{rank}</span>
      </div>

      {/* Weapon image */}
      <div className="relative mt-2 flex h-20 items-center justify-center">
        {imgError ? (
          <Crosshair className="h-10 w-10 text-text-muted/40" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={weapon.weaponName}
            className="max-h-full max-w-full object-contain drop-shadow-[0_0_12px_rgba(46,213,115,0.15)]"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
        <Metric label="Kills" value={weapon.kills.toLocaleString()} />
        <Metric label="HS%" value={`${weapon.headshotPct.toFixed(1)}%`} />
        <Metric label="Acc" value={`${weapon.accuracy.toFixed(1)}%`} />
      </div>
      <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-text-muted">
        {weapon.matches} matches
      </p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-light/50 px-1.5 py-1.5">
      <p className="text-sm font-bold text-text tabular-nums">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}
