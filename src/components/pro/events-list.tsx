"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Trophy, ExternalLink, Tv, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProEvent, ProGame } from "@/lib/pro/types";

interface EventsListProps {
  events: ProEvent[];
}

const GAME_LABEL: Record<ProGame, string> = {
  valorant: "Valorant",
  bgmi: "BGMI",
  freefire: "Free Fire",
};

const GAME_ACCENT: Record<ProGame, string> = {
  valorant: "bg-red-500/10 text-red-300 border-red-500/30",
  bgmi: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  freefire: "bg-purple-500/10 text-purple-300 border-purple-500/30",
};

const STATUS_BADGE: Record<ProEvent["status"], { label: string; cls: string }> = {
  upcoming: { label: "Upcoming", cls: "bg-blue-500/10 text-blue-300 border-blue-500/30" },
  live: { label: "Live now", cls: "bg-red-500/15 text-red-300 border-red-500/30 animate-pulse" },
  completed: { label: "Completed", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-zinc-700/20 text-zinc-500 border-zinc-700/30 line-through" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRange(start: string, end: string | null) {
  if (!end) return fmtDate(start);
  const a = new Date(start);
  const b = new Date(end);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${a.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
  }
  return `${fmtDate(start)} → ${fmtDate(end)}`;
}

function fmtPrize(amount: number | null, currency: string) {
  if (amount == null) return null;
  if (currency === "INR") {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
    if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)} L`;
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

export function EventsList({ events }: EventsListProps) {
  const [game, setGame] = useState<"all" | ProGame>("all");
  const [statusTab, setStatusTab] = useState<"upcoming" | "completed">("upcoming");

  const filtered = useMemo(() => {
    let list = events;
    if (game !== "all") list = list.filter((e) => e.game === game);
    if (statusTab === "upcoming") {
      list = list.filter((e) => e.status === "upcoming" || e.status === "live");
    } else {
      list = list.filter((e) => e.status === "completed");
    }
    return list;
  }, [events, game, statusTab]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex gap-1 rounded-lg bg-surface-light p-1 self-start">
          {(["upcoming", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusTab(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                statusTab === s
                  ? "bg-surface text-text shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {s === "upcoming" ? "Upcoming & live" : "Completed"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "valorant", "bgmi", "freefire"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGame(g)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                game === g
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface text-text-muted border-border hover:border-primary/30 hover:text-text-secondary"
              )}
            >
              {g === "all" ? "All games" : GAME_LABEL[g as ProGame]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center text-text-muted">
          No events to show.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((e) => {
            const prize = fmtPrize(e.prize_pool, e.prize_currency);
            return (
              <article
                key={e.id}
                className="rounded-xl border border-border bg-surface overflow-hidden hover:border-primary/30 transition-colors"
              >
                {e.banner_url && (
                  <div className="relative h-32 w-full bg-surface-light">
                    <Image
                      src={e.banner_url}
                      alt={e.name}
                      fill
                      sizes="(min-width:768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        GAME_ACCENT[e.game]
                      )}
                    >
                      {GAME_LABEL[e.game]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        STATUS_BADGE[e.status].cls
                      )}
                    >
                      {STATUS_BADGE[e.status].label}
                    </span>
                    {e.is_featured && (
                      <Badge variant="warning" size="sm">Featured</Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-text leading-tight">{e.name}</h3>
                  {e.description && (
                    <p className="text-sm text-text-muted line-clamp-2">{e.description}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-text-muted" />
                      {fmtRange(e.starts_at, e.ends_at)}
                    </span>
                    {e.venue && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-text-muted" />
                        {e.venue}
                      </span>
                    )}
                    {prize && (
                      <span className="inline-flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-warning" />
                        {prize} prize pool
                      </span>
                    )}
                    {e.region && (
                      <span className="inline-flex items-center gap-1.5 text-text-muted">
                        {e.region}
                      </span>
                    )}
                  </div>
                  {(e.official_url || e.stream_url) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {e.official_url && (
                        <a
                          href={e.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface-light hover:bg-primary/10 hover:text-primary px-3 py-1 text-xs text-text-secondary transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Official page
                        </a>
                      )}
                      {e.stream_url && (
                        <a
                          href={e.stream_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface-light hover:bg-primary/10 hover:text-primary px-3 py-1 text-xs text-text-secondary transition-colors"
                        >
                          <Tv className="h-3 w-3" />
                          Watch stream
                        </a>
                      )}
                      {(e.status === "upcoming" || e.status === "live") && (
                        <Link
                          href={`/pro/events/${e.slug}/pickem`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 text-xs font-medium transition-colors"
                        >
                          <Sparkles className="h-3 w-3" />
                          Pick&apos;em
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
