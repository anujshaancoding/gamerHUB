"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Gift,
  Trophy,
  Link2,
  Share2,
  UserPlus,
  CheckCircle2,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui";
import { ACTION_POINTS } from "@/lib/loyalty/constants";

interface Rec {
  userId: string;
  name: string;
  points: number;
  events: { action: string; key: string }[];
  referralCode: string;
}
interface Tier {
  name: string;
  color: string;
  min: number;
  next: { name: string; min: number } | null;
}

function GiveawayInner() {
  const params = useSearchParams();
  const ref = params.get("ref");
  const [rec, setRec] = useState<Rec | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/loyalty");
    if (r.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    const d = await r.json();
    setRec(d.record);
    setTier(d.tier);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Apply referral once we know the user is authed.
  useEffect(() => {
    if (ref && authed && rec && !loading) {
      fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refer", code: ref }),
      }).then(() => load());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, authed, loading]);

  async function act(action: string) {
    setBusy(action);
    await fetch("/api/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
    setBusy(null);
  }

  const has = (a: string) => rec?.events.some((e) => e.action === a);

  const referralUrl =
    rec && typeof window !== "undefined"
      ? `${window.location.origin}/giveaway?ref=${rec.referralCode}`
      : "";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-5 text-3xl font-black uppercase tracking-tight text-text sm:text-4xl">
          Monthly Valorant Giveaway
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-text-muted">
          Create a free profile to start earning points. Every month we give
          away a skin or VP — the more points, the more entries.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={ref ? `/register?ref=${ref}` : "/register"}>
            <Button variant="primary" size="lg">
              Create profile & enter
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="outline" size="lg" leftIcon={<Trophy className="h-4 w-4" />}>
              Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const progress =
    tier && tier.next
      ? Math.min(
          100,
          Math.round(
            (((rec?.points ?? 0) - tier.min) / (tier.next.min - tier.min)) * 100
          )
        )
      : 100;

  const tasks = [
    { action: "signup", icon: UserPlus, label: "Create your profile", done: has("signup"), auto: true },
    { action: "daily_login", icon: Sparkles, label: "Daily check-in (auto, every day)", done: has("daily_login"), auto: true },
    { action: "link_valorant", icon: Link2, label: "Link your Valorant account", done: has("link_valorant") },
    { action: "share_rank_card", icon: Share2, label: "Share your rank card", done: has("share_rank_card") },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-6 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(50% 80% at 80% 10%, rgba(0,212,255,0.18), transparent 70%), radial-gradient(50% 80% at 10% 90%, rgba(0,255,136,0.16), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <Gift className="h-3.5 w-3.5" /> This month&apos;s giveaway
            </span>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-text sm:text-4xl">
              Earn points. Win rewards.
            </h1>
            <p className="mt-2 max-w-md text-sm text-text-secondary">
              Hi {rec?.name} — every point is an entry. Climb the leaderboard
              before the monthly draw.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-border bg-surface/70 p-5 text-center backdrop-blur">
            <p className="text-5xl font-black text-primary">{rec?.points}</p>
            <p className="text-xs uppercase tracking-widest text-text-dim">
              points
            </p>
            {tier && (
              <p
                className="mt-2 text-sm font-bold"
                style={{ color: tier.color }}
              >
                {tier.name}
              </p>
            )}
          </div>
        </div>

        {tier?.next && (
          <div className="relative mt-6">
            <div className="mb-1 flex justify-between text-xs text-text-dim">
              <span>{tier.name}</span>
              <span>
                {tier.next.min - (rec?.points ?? 0)} pts to {tier.next.name}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-light">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-dim">
            Ways to earn
          </h2>
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.action}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <t.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{t.label}</p>
                  <p className="text-xs text-text-dim">
                    +{ACTION_POINTS[t.action as keyof typeof ACTION_POINTS]} points
                  </p>
                </div>
                {t.done ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </span>
                ) : t.auto ? (
                  <span className="text-xs text-text-dim">Automatic</span>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={busy === t.action}
                    onClick={() => act(t.action)}
                  >
                    {t.action === "share_rank_card" ? "Share" : "Do it"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Referral + links */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text">
              <UserPlus className="h-4 w-4 text-primary" /> Refer friends
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              +{ACTION_POINTS.refer} points for every friend who joins with your
              link.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <span className="flex-1 truncate text-xs text-text-secondary">
                {referralUrl}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="shrink-0 text-text-muted hover:text-primary"
                aria-label="Copy referral link"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Link
            href="/rank-card"
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-text">
              <Share2 className="h-4 w-4 text-accent" /> Your rank card
            </span>
            <span className="text-xs text-text-dim">Open →</span>
          </Link>

          <Link
            href="/leaderboard"
            className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-text">
              <Trophy className="h-4 w-4 text-warning" /> Leaderboard
            </span>
            <span className="text-xs text-text-dim">Open →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GiveawayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <GiveawayInner />
    </Suspense>
  );
}
