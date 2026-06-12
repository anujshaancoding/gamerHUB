"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightLeft,
  Trophy,
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  ProGame,
  ProPlayerDetail,
  ProPlayerWithTeam,
  ValorantGameStats,
} from "@/lib/pro/types";

interface CompareViewProps {
  game: ProGame;
  initialA: string | null;
  initialB: string | null;
  detailA: ProPlayerDetail | null;
  detailB: ProPlayerDetail | null;
  rosterByGame: Record<ProGame, ProPlayerWithTeam[]>;
}

const GAME_LABEL: Record<ProGame, string> = {
  valorant: "Valorant",
};

type StatRow = { label: string; a: string | number | null; b: string | number | null; betterWhen?: "higher" | "lower" };

function toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}
function pct(v: number | string | null | undefined): string | null {
  const n = toNum(v);
  return n == null ? null : `${n.toFixed(1)}%`;
}

function statRowsFor(_game: ProGame, a: ProPlayerDetail | null, b: ProPlayerDetail | null): StatRow[] {
  const sa = a?.current_stats;
  const sb = b?.current_stats;
  const winPct = (s: typeof sa) => {
    const mp = toNum(s?.matches_played);
    const w = toNum(s?.wins);
    if (mp == null || mp <= 0 || w == null) return null;
    return +((w / mp) * 100).toFixed(1);
  };
  const rows: StatRow[] = [
    { label: "Matches", a: sa?.matches_played ?? null, b: sb?.matches_played ?? null, betterWhen: "higher" },
    { label: "Win %", a: winPct(sa) != null ? `${winPct(sa)}%` : null, b: winPct(sb) != null ? `${winPct(sb)}%` : null, betterWhen: "higher" },
    { label: "K/D", a: toNum(sa?.k_d_ratio), b: toNum(sb?.k_d_ratio), betterWhen: "higher" },
    { label: "ADR", a: toNum(sa?.adr), b: toNum(sb?.adr), betterWhen: "higher" },
    { label: "HS %", a: pct(sa?.hs_pct), b: pct(sb?.hs_pct), betterWhen: "higher" },
  ];
  rows.splice(3, 0, { label: "ACS", a: toNum(sa?.acs), b: toNum(sb?.acs), betterWhen: "higher" });
  return rows;
}

function numericCompare(a: StatRow["a"], b: StatRow["b"]): -1 | 0 | 1 {
  const parse = (v: StatRow["a"]) => {
    if (v == null) return null;
    if (typeof v === "number") return v;
    const n = parseFloat(String(v).replace("%", ""));
    return isNaN(n) ? null : n;
  };
  const na = parse(a);
  const nb = parse(b);
  if (na == null || nb == null) return 0;
  if (na > nb) return 1;
  if (na < nb) return -1;
  return 0;
}

export function CompareView({
  game: initialGame,
  initialA,
  initialB,
  detailA,
  detailB,
  rosterByGame,
}: CompareViewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [game, setGame] = useState<ProGame>(initialGame);
  const [a, setA] = useState<string | null>(initialA);
  const [b, setB] = useState<string | null>(initialB);

  const updateUrl = (next: { game: ProGame; a: string | null; b: string | null }) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("game", next.game);
    if (next.a) sp.set("a", next.a);
    else sp.delete("a");
    if (next.b) sp.set("b", next.b);
    else sp.delete("b");
    router.push(`/pro/compare?${sp.toString()}`);
  };

  const handleGameChange = (g: ProGame) => {
    setGame(g);
    setA(null);
    setB(null);
    updateUrl({ game: g, a: null, b: null });
  };

  const handlePick = (slot: "a" | "b", slug: string | null) => {
    const next = { game, a, b, [slot]: slug } as typeof game extends never ? never : { game: ProGame; a: string | null; b: string | null };
    if (slot === "a") setA(slug);
    else setB(slug);
    updateUrl(next);
  };

  const rows = useMemo(() => statRowsFor(game, detailA, detailB), [game, detailA, detailB]);
  const roster = rosterByGame[game] || [];

  const swapSides = () => {
    setA(b);
    setB(a);
    updateUrl({ game, a: b, b: a });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-muted uppercase tracking-wider">Game</span>
        {(["valorant"] as ProGame[]).map((g) => (
          <button
            key={g}
            onClick={() => handleGameChange(g)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              game === g
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-surface text-text-muted border-border hover:border-primary/30"
            )}
          >
            {GAME_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        <PlayerColumn
          slot="a"
          detail={detailA}
          roster={roster}
          onPick={(slug) => handlePick("a", slug)}
        />
        <div className="hidden md:flex items-center justify-center">
          <button
            onClick={swapSides}
            disabled={!a || !b}
            className="rounded-full bg-surface-light hover:bg-primary/10 hover:text-primary p-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Swap sides"
          >
            <ArrowRightLeft className="h-5 w-5" />
          </button>
        </div>
        <PlayerColumn
          slot="b"
          detail={detailB}
          roster={roster}
          onPick={(slug) => handlePick("b", slug)}
        />
      </div>

      {detailA && detailB ? (
        <section className="rounded-xl border border-border bg-surface overflow-hidden">
          <h2 className="px-5 py-3 text-sm font-semibold text-text border-b border-border bg-surface-light/60">
            Head-to-head
          </h2>
          <div className="divide-y divide-border">
            {rows.map((r) => {
              const cmp = numericCompare(r.a, r.b);
              const aWins = r.betterWhen === "higher" ? cmp === 1 : cmp === -1;
              const bWins = r.betterWhen === "higher" ? cmp === -1 : cmp === 1;
              return (
                <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 text-sm">
                  <div className={cn("text-right", aWins && "font-semibold text-primary")}>
                    {r.a ?? "—"}
                    {aWins && <Check className="inline h-3.5 w-3.5 ml-1.5 text-primary" />}
                  </div>
                  <div className="text-xs text-text-muted uppercase tracking-wider px-4">{r.label}</div>
                  <div className={cn("text-left", bWins && "font-semibold text-primary")}>
                    {bWins && <Check className="inline h-3.5 w-3.5 mr-1.5 text-primary" />}
                    {r.b ?? "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-text-muted text-sm">
          Pick two {GAME_LABEL[game]} pros above to see them head-to-head.
        </div>
      )}

      {detailA?.gear && detailB?.gear && (
        <section className="rounded-xl border border-border bg-surface overflow-hidden">
          <h2 className="px-5 py-3 text-sm font-semibold text-text border-b border-border bg-surface-light/60">
            Setup
          </h2>
          <div className="divide-y divide-border">
            {[
              { label: "Device", a: detailA.gear.device_model, b: detailB.gear.device_model },
              { label: "Monitor / Hz", a: detailA.gear.monitor || (detailA.gear.monitor_hz ? `${detailA.gear.monitor_hz}Hz` : null), b: detailB.gear.monitor || (detailB.gear.monitor_hz ? `${detailB.gear.monitor_hz}Hz` : null) },
              { label: "Mouse", a: detailA.gear.mouse, b: detailB.gear.mouse },
              { label: "Keyboard", a: detailA.gear.keyboard, b: detailB.gear.keyboard },
              { label: "Headphones", a: detailA.gear.headphones, b: detailB.gear.headphones },
              { label: "Grip", a: detailA.gear.grip_style, b: detailB.gear.grip_style },
              { label: "Triggers", a: detailA.gear.controllers, b: detailB.gear.controllers },
            ]
              .filter((r) => r.a || r.b)
              .map((r) => (
                <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 text-sm">
                  <div className="text-right text-text-secondary">{r.a || <span className="text-text-muted">—</span>}</div>
                  <div className="text-xs text-text-muted uppercase tracking-wider px-4">{r.label}</div>
                  <div className="text-left text-text-secondary">{r.b || <span className="text-text-muted">—</span>}</div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PlayerColumn({
  slot,
  detail,
  roster,
  onPick,
}: {
  slot: "a" | "b";
  detail: ProPlayerDetail | null;
  roster: ProPlayerWithTeam[];
  onPick: (slug: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? roster.filter(
        (p) =>
          p.ign.toLowerCase().includes(q.toLowerCase()) ||
          (p.team?.name.toLowerCase().includes(q.toLowerCase()) ?? false)
      )
    : roster;

  if (!detail) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-5">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
          Pick {slot === "a" ? "first" : "second"} pro
        </p>
        <PlayerSearch
          open={open}
          setOpen={setOpen}
          q={q}
          setQ={setQ}
          filtered={filtered}
          onPick={onPick}
        />
      </div>
    );
  }

  const p = detail.player;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 rounded-full bg-surface-light overflow-hidden flex-shrink-0">
          {p.photo_url ? (
            <Image src={p.photo_url} alt={p.ign} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-text-muted">
              {p.ign.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text truncate">{p.ign}</h3>
            {p.national_rank && <Badge variant="primary" size="sm">#{p.national_rank}</Badge>}
          </div>
          <p className="text-xs text-text-muted truncate">
            {p.real_name && <span>{p.real_name} · </span>}
            {p.team?.name || "Free agent"}
            {p.role ? ` · ${p.role}` : ""}
          </p>
          {p.peak_rank && (
            <p className="text-xs text-text-secondary mt-1 inline-flex items-center gap-1">
              <Trophy className="h-3 w-3 text-warning" />
              Peak {p.peak_rank}
            </p>
          )}
        </div>
        <button
          onClick={() => onPick(null)}
          className="text-text-muted hover:text-text p-1"
          title="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">
        <PlayerSearch
          open={open}
          setOpen={setOpen}
          q={q}
          setQ={setQ}
          filtered={filtered}
          onPick={onPick}
          compact
        />
      </div>
    </div>
  );
}

function PlayerSearch({
  open,
  setOpen,
  q,
  setQ,
  filtered,
  onPick,
  compact,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  q: string;
  setQ: (s: string) => void;
  filtered: ProPlayerWithTeam[];
  onPick: (slug: string | null) => void;
  compact?: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-light/60 px-3 py-2 text-sm text-text-secondary hover:bg-surface-light",
          compact && "text-xs"
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" />
          {compact ? "Change pro" : "Pick a pro…"}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 right-0 rounded-lg border border-border bg-surface shadow-lg max-h-80 overflow-y-auto">
          <div className="sticky top-0 bg-surface border-b border-border px-2 py-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search IGN or team…"
              className="w-full bg-surface-light/60 rounded-md px-2 py-1.5 text-xs text-text placeholder:text-text-muted border-0 focus:outline-none"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-xs text-text-muted px-3 py-4 text-center">No matches.</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onPick(p.slug);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full px-3 py-2 text-left hover:bg-surface-light flex items-center gap-2 text-sm"
              >
                <span className="w-7 text-xs text-text-muted">{p.national_rank ?? "—"}</span>
                <span className="font-medium text-text">{p.ign}</span>
                <span className="text-xs text-text-muted truncate">
                  {p.team?.name ? `· ${p.team.name}` : ""}
                </span>
              </button>
            ))
          )}
          <div className="border-t border-border px-3 py-2">
            <Link
              href="/pro"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              Browse all pros →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// satisfy TS: unused imports won't trip
export type { ValorantGameStats };
