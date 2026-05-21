"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Gift, Loader2, Medal } from "lucide-react";

interface Row {
  rank: number;
  name: string;
  image: string | null;
  points: number;
  tier: string;
}

const MEDAL = ["#ffd166", "#c0c0c0", "#cd7f32"];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/loyalty/leaderboard")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((d) => setRows(d.leaderboard ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-primary" />
        <h1 className="text-3xl font-black uppercase tracking-tight text-text sm:text-4xl">
          Loyalty Leaderboard
        </h1>
      </div>
      <p className="mb-8 max-w-xl text-sm text-text-muted">
        Points earned on ggLobby are entries into the monthly Valorant
        giveaway. Climb before the next draw.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <Trophy className="mx-auto h-10 w-10 text-text-dim" />
          <p className="mt-3 font-semibold text-text">No entries yet</p>
          <p className="mt-1 text-sm text-text-muted">
            Be the first on the board.
          </p>
          <Link
            href="/giveaway"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark"
          >
            <Gift className="h-4 w-4" /> Start earning points
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.rank}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 sm:px-5"
            >
              <div className="flex w-8 shrink-0 justify-center">
                {r.rank <= 3 ? (
                  <Medal
                    className="h-6 w-6"
                    style={{ color: MEDAL[r.rank - 1] }}
                  />
                ) : (
                  <span className="text-sm font-bold text-text-dim">
                    {r.rank}
                  </span>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-light text-sm font-bold text-text-muted">
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image}
                    alt={r.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  r.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="flex-1 truncate text-sm font-medium text-text">
                {r.name}
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-text-dim sm:block">
                {r.tier}
              </span>
              <span className="w-16 text-right text-sm font-bold text-primary">
                {r.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
