"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Trophy, Star } from "lucide-react";
import { Badge, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ProGame, ProPlayerWithTeam } from "@/lib/pro/types";

interface RankingTableProps {
  game: ProGame;
  players: ProPlayerWithTeam[];
}

const rankPillFor = (rank: number | null) => {
  if (rank == null) return "bg-surface-light text-text-muted";
  if (rank === 1) return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30";
  if (rank === 2) return "bg-zinc-400/15 text-zinc-200 border border-zinc-400/30";
  if (rank === 3) return "bg-amber-600/15 text-amber-300 border border-amber-600/30";
  return "bg-primary/10 text-primary border border-primary/20";
};

export function RankingTable({ game, players }: RankingTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.ign.toLowerCase().includes(q) ||
        (p.real_name?.toLowerCase().includes(q) ?? false) ||
        (p.team?.name.toLowerCase().includes(q) ?? false) ||
        (p.region?.toLowerCase().includes(q) ?? false)
    );
  }, [players, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by IGN, name, team, or city…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center text-text-muted">
          No players match that search.
        </div>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface-light text-text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium w-16">#</th>
                  <th className="px-4 py-3 text-left font-medium">Player</th>
                  <th className="px-4 py-3 text-left font-medium">Team</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Region</th>
                  <th className="px-4 py-3 text-left font-medium">Peak</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-border hover:bg-surface-light/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-9 h-7 rounded-md text-xs font-semibold",
                          rankPillFor(p.national_rank)
                        )}
                      >
                        {p.national_rank ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/pros/${p.slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="relative h-9 w-9 rounded-full bg-surface-light overflow-hidden flex-shrink-0">
                          {p.photo_url ? (
                            <Image
                              src={p.photo_url}
                              alt={p.ign}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-text-muted">
                              {p.ign.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-text group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {p.ign}
                            {p.is_featured && (
                              <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                            )}
                          </div>
                          {p.real_name && (
                            <div className="text-xs text-text-muted truncate">
                              {p.real_name}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {p.team ? (
                        <span className="inline-flex items-center gap-1.5">
                          {p.team.short_name && (
                            <span className="text-text-muted text-xs">[{p.team.short_name}]</span>
                          )}
                          {p.team.name}
                        </span>
                      ) : (
                        <span className="text-text-muted">Free agent</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.role ? (
                        <Badge variant="secondary" size="sm">
                          {p.role}
                        </Badge>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{p.region || "—"}</td>
                    <td className="px-4 py-3">
                      {p.peak_rank ? (
                        <span className="inline-flex items-center gap-1 text-text-secondary">
                          <Trophy className="h-3.5 w-3.5 text-warning" />
                          {p.peak_rank}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/pros/${p.slug}`}
                className="block rounded-lg border border-border bg-surface p-3 hover:bg-surface-light transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-9 h-7 rounded-md text-xs font-semibold flex-shrink-0",
                      rankPillFor(p.national_rank)
                    )}
                  >
                    {p.national_rank ?? "—"}
                  </span>
                  <div className="relative h-10 w-10 rounded-full bg-surface-light overflow-hidden flex-shrink-0">
                    {p.photo_url ? (
                      <Image src={p.photo_url} alt={p.ign} fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-text-muted">
                        {p.ign.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-text flex items-center gap-1.5 truncate">
                      {p.ign}
                      {p.is_featured && (
                        <Star className="h-3.5 w-3.5 text-warning fill-warning flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {p.team?.name || "Free agent"}
                      {p.role ? ` · ${p.role}` : ""}
                      {p.region ? ` · ${p.region}` : ""}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
