"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Check, Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PickemMatch, PickemPrediction } from "@/lib/pro/pickem-queries";

interface Props {
  matches: PickemMatch[];
  initialPicks: PickemPrediction[];
  isAuthed: boolean;
}

export function PickemBoard({ matches, initialPicks, isAuthed }: Props) {
  const [picks, setPicks] = useState<Record<string, "a" | "b">>(() =>
    Object.fromEntries(initialPicks.map((p) => [p.match_id, p.pick]))
  );
  const [pending, setPending] = useState<string | null>(null);

  const groups = useMemo(() => {
    const acc: Record<string, PickemMatch[]> = {};
    for (const m of matches) {
      (acc[m.stage] ||= []).push(m);
    }
    return acc;
  }, [matches]);

  const handlePick = async (match: PickemMatch, side: "a" | "b") => {
    if (!isAuthed) { window.location.href = "/login"; return; }
    const lockTime = match.locks_at ?? match.starts_at;
    if (lockTime && new Date(lockTime).getTime() < Date.now()) return;
    if (match.winner) return;
    setPending(match.id);
    try {
      const res = await fetch(`/api/pickem/${match.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pick: side }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Could not save pick");
        return;
      }
      setPicks((p) => ({ ...p, [match.id]: side }));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      {!isAuthed && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-text-secondary">
          <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link> to lock in your picks and climb the leaderboard.
        </div>
      )}

      {Object.entries(groups).map(([stage, list]) => (
        <section key={stage} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{stage.replace(/-/g, " ")}</h2>
          <div className="space-y-2">
            {list.map((m) => {
              const myPick = picks[m.id];
              const lockTime = m.locks_at ?? m.starts_at;
              const isLocked = (!!lockTime && new Date(lockTime).getTime() < Date.now()) || !!m.winner;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-xl border bg-surface overflow-hidden",
                    m.winner ? "border-emerald-500/30" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-light/30 text-xs text-text-muted">
                    <span className="font-medium">{m.match_label}{m.is_final && " · FINAL"}</span>
                    <span>
                      {m.starts_at ? new Date(m.starts_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBD"}
                      {isLocked && !m.winner && (
                        <span className="inline-flex items-center gap-1 ml-2 text-warning">
                          <Lock className="h-3 w-3" /> picks closed
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <TeamButton
                      side="a"
                      label={m.team_a}
                      logo={m.team_a_logo}
                      picked={myPick === "a"}
                      isWinner={m.winner === "a"}
                      isLoser={m.winner === "b"}
                      disabled={isLocked || pending === m.id}
                      onClick={() => handlePick(m, "a")}
                      bonus={m.is_final}
                    />
                    <TeamButton
                      side="b"
                      label={m.team_b}
                      logo={m.team_b_logo}
                      picked={myPick === "b"}
                      isWinner={m.winner === "b"}
                      isLoser={m.winner === "a"}
                      disabled={isLocked || pending === m.id}
                      onClick={() => handlePick(m, "b")}
                      bonus={m.is_final}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TeamButton({
  side, label, logo, picked, isWinner, isLoser, disabled, onClick, bonus,
}: {
  side: "a" | "b";
  label: string;
  logo: string | null;
  picked: boolean;
  isWinner: boolean;
  isLoser: boolean;
  disabled: boolean;
  onClick: () => void;
  bonus: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-left transition-colors",
        picked && !isWinner && !isLoser && "bg-primary/10",
        isWinner && "bg-emerald-500/15",
        isLoser && "opacity-50",
        !disabled && "hover:bg-surface-light"
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={label} className="w-9 h-9 rounded object-contain" />
      ) : (
        <div className="w-9 h-9 rounded bg-surface-light border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
          {side.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text truncate">{label}</div>
        {picked && (
          <div className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
            <Check className="h-3 w-3" /> Your pick{bonus && " · +3 if correct"}
          </div>
        )}
        {isWinner && (
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <Trophy className="h-3 w-3" /> Winner
          </div>
        )}
      </div>
    </button>
  );
}
