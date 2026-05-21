"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Share2,
  Copy,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Rec {
  name: string;
  points: number;
  image?: string | null;
  events: { action: string }[];
}
interface Tier {
  name: string;
  color: string;
}

export default function RankCardPage() {
  const [rec, setRec] = useState<Rec | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

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

  async function share() {
    setSharing(true);
    await fetch("/api/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "share_rank_card" }),
    });
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My ggLobby rank card",
          text: "Check out my ggLobby Valorant rank card",
          url,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
    await load();
    setSharing(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Share2 className="mx-auto h-10 w-10 text-text-dim" />
        <h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-text">
          Your rank card
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Create a free profile to generate a shareable Valorant rank card and
          earn giveaway points.
        </p>
        <Link href="/register" className="mt-5 inline-block">
          <Button variant="primary" size="lg">
            Create profile
          </Button>
        </Link>
      </div>
    );
  }

  const accent = tier?.color ?? "#00ff88";
  const shared = rec?.events.some((e) => e.action === "share_rank_card");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-black uppercase tracking-tight text-text">
        Your rank card
      </h1>
      <p className="mb-6 text-sm text-text-muted">
        Share it anywhere. {shared ? "You've claimed the share bonus." : "First share earns +15 points."}
      </p>

      {/* The card */}
      <div
        className="relative overflow-hidden rounded-3xl border p-8"
        style={{ borderColor: `${accent}55` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(60% 70% at 80% 10%, ${accent}33, transparent 70%), radial-gradient(60% 70% at 10% 100%, ${accent}22, transparent 70%)`,
          }}
        />
        <div className="relative flex items-center gap-5">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-3xl font-black"
            style={{ background: `${accent}22`, color: accent }}
          >
            {rec?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rec.image}
                alt={rec.name}
                className="h-full w-full object-cover"
              />
            ) : (
              rec?.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-2xl font-black text-text">
              {rec?.name}
            </p>
            <p
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: accent }}
            >
              {tier?.name} tier
            </p>
          </div>
        </div>

        <div className="relative mt-8 flex items-end justify-between">
          <div>
            <p className="text-6xl font-black" style={{ color: accent }}>
              {rec?.points}
            </p>
            <p className="text-xs uppercase tracking-widest text-text-dim">
              loyalty points
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black tracking-tight text-text">
              gg<span style={{ color: "#00ff88" }}>Lobby</span>
            </p>
            <p className="text-[10px] uppercase tracking-widest text-text-dim">
              Valorant
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Button
          variant="primary"
          size="lg"
          isLoading={sharing}
          onClick={share}
          leftIcon={<Share2 className="h-4 w-4" />}
        >
          Share card
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          leftIcon={
            copied ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )
          }
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Link href="/giveaway" className="ml-auto">
          <Button variant="ghost" size="lg" leftIcon={<Gift className="h-4 w-4" />}>
            Giveaway
          </Button>
        </Link>
      </div>
    </div>
  );
}
