"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Share2, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useAuthProfile } from "@/lib/hooks/useAuth";
import { useActionGate } from "@/components/auth/auth-gate-provider";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";
import { VALORANT_TIERS, tierColor } from "@/lib/tools/valorant-ranks";

// Public Valorant rank-card share page. Anyone (logged out) can pick a rank,
// preview the card, and download/share the PNG for free. Only "save/publish to
// my ggLobby profile" requires an account (action gate).

export function ValorantRankCardClient({ initialRank }: { initialRank?: string }) {
  const { user } = useAuth();
  const { profile } = useAuthProfile();
  const { openAuthGate } = useActionGate();

  const startRank =
    initialRank && VALORANT_TIERS.includes(initialRank as never) ? initialRank : "Gold 2";
  const [tier, setTier] = useState<string>(startRank);
  const [name, setName] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const accent = tierColor(tier);
  const username = profile?.username;
  const displayName = profile?.display_name;

  const ogUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("rank", tier);
    if (name.trim()) params.set("name", name.trim());
    if (username) params.set("username", username);
    return `/api/og/rank-card?${params.toString()}`;
  }, [tier, name, username]);

  async function downloadPng() {
    setDownloading(true);
    try {
      const res = await fetch(ogUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gglobby-valorant-rank-${tier.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* download failed silently — preview still visible */
    } finally {
      setDownloading(false);
    }
  }

  function shareUrl(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/rank-card?rank=${encodeURIComponent(tier)}`;
  }

  async function share() {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Valorant rank — ggLobby",
          text: `I'm ${tier} in Valorant. Make your own rank card free on ggLobby.`,
          url,
        });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* ignore */
      }
    }
  }

  function saveToProfile() {
    if (!user) {
      trackCtaClick(CTA_SOURCES.rank_card_save);
      openAuthGate({
        reason:
          "Create a free profile to save your Valorant rank card and share it with teammates",
        source: CTA_SOURCES.rank_card_save,
        redirectTo: "/rank-card",
      });
      return;
    }
    // Authed: deep-link to profile game settings where rank is managed.
    window.location.href = "/settings/games";
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Live preview card */}
        <div
          className="relative overflow-hidden rounded-3xl border bg-[#0a0a0f] p-6 sm:p-8"
          style={{ borderColor: `${accent}55` }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(60% 60% at 85% 8%, ${accent}33, transparent 70%), radial-gradient(60% 60% at 10% 100%, ${accent}22, transparent 70%)`,
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-dim">
              Valorant Rank
            </span>
            <p className="mt-2 text-lg font-bold text-text">
              {name.trim() || displayName || username || "Your name"}
            </p>
            <p
              className="mt-6 text-5xl font-black sm:text-6xl"
              style={{ color: accent, textShadow: `0 0 40px ${accent}55` }}
            >
              {tier}
            </p>
            <div className="mt-8 flex w-full items-center justify-between text-sm">
              <span className="font-black tracking-tight text-text">
                gg<span style={{ color: accent }}>Lobby</span>
              </span>
              <span className="text-text-dim">gglobby.in/rank-card</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Your Valorant rank
            </span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-light/60 px-3 py-2 text-sm text-text focus:border-primary/50 focus:outline-none"
            >
              {VALORANT_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Display name (optional)
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              placeholder={username || "Your name"}
              className="w-full rounded-lg border border-border bg-surface-light/60 px-3 py-2 text-sm text-text focus:border-primary/50 focus:outline-none"
            />
          </label>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={downloading}
            onClick={downloadPng}
            leftIcon={
              !downloading ? <Download className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />
            }
          >
            Download PNG
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={share}
              leftIcon={
                copied ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )
              }
            >
              {copied ? "Copied" : "Share"}
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl());
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              leftIcon={<Copy className="h-4 w-4" />}
            >
              Copy link
            </Button>
          </div>

          <button
            onClick={saveToProfile}
            className="w-full rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            {user ? "Set this rank on my profile" : "Save my rank card to my profile — free"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-text-dim">
        Viewing and downloading is free, no account needed.{" "}
        <Link href="/find-gamers" className="text-primary hover:underline">
          Find teammates at your rank
        </Link>
      </p>
    </div>
  );
}
