"use client";

import { Card } from "@/components/ui/card";
import { Target } from "lucide-react";
import type { AccuracyBreakdown as AccuracyBreakdownType, RoleStat } from "@/lib/tracker/types";

export function AccuracyBreakdown({
  accuracy,
  roles,
}: {
  accuracy: AccuracyBreakdownType;
  roles: RoleStat[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-text sm:text-lg">Shot Placement &amp; Roles</h3>
          <p className="text-xs text-text-muted sm:text-sm">
            Where your shots land, and how you perform by role.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card variant="outlined" className="p-4">
          <h4 className="text-sm font-semibold text-text">Shot Placement</h4>
          <p className="text-xs text-text-muted">
            {accuracy.headHits + accuracy.bodyHits + accuracy.legsHits} total shots landed across sampled matches.
          </p>
          <div className="mt-4 space-y-2.5">
            <AccBar label="Head" pct={accuracy.headPct} hits={accuracy.headHits} color="bg-success" />
            <AccBar label="Body" pct={accuracy.bodyPct} hits={accuracy.bodyHits} color="bg-primary" />
            <AccBar label="Legs" pct={accuracy.legsPct} hits={accuracy.legsHits} color="bg-warning" />
          </div>
        </Card>

        <Card variant="outlined" className="p-4">
          <h4 className="text-sm font-semibold text-text">Role Performance</h4>
          <p className="text-xs text-text-muted">
            How you do as Duelist / Controller / Sentinel / Initiator.
          </p>
          {roles.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">No role data available.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {roles
                .slice()
                .sort((a, b) => b.matches - a.matches)
                .map((r) => (
                  <RoleRow key={r.role} role={r} />
                ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function AccBar({
  label,
  pct,
  hits,
  color,
}: {
  label: string;
  pct: number;
  hits: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold text-text tabular-nums">
          {pct.toFixed(1)}% <span className="text-text-muted">({hits})</span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-light">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

function RoleRow({ role }: { role: RoleStat }) {
  const wrTone =
    role.winRate >= 55
      ? "text-success"
      : role.winRate >= 45
        ? "text-text"
        : "text-error";

  const roleLabel = role.role[0].toUpperCase() + role.role.slice(1);

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface-light/30 px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-text">{roleLabel}</p>
        <p className="text-[10px] uppercase tracking-wider text-text-muted">
          {role.matches} {role.matches === 1 ? "match" : "matches"}
        </p>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className={`text-sm font-bold tabular-nums ${wrTone}`}>{role.winRate}%</p>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Win Rate</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-text">{role.kda.toFixed(2)}</p>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">KDA</p>
        </div>
      </div>
    </div>
  );
}
