"use client";

import { useEffect, useState } from "react";
import { Crosshair, Sparkles, Trophy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { MODES, MODE_BY_ID, type AimModeId, type AimResult, type ModeMeta } from "./types";
import { getBests, submitResult } from "./storage";
import { ReactionMode } from "./modes/reaction-mode";
import { FlickMode } from "./modes/flick-mode";
import { TrackingMode } from "./modes/tracking-mode";
import { PeekMode } from "./modes/peek-mode";
import { EchoMode } from "./modes/echo-mode";
import { ClutchMode } from "./modes/clutch-mode";
import { DailyMode } from "./modes/daily-mode";
import { ResultCard } from "./result-card";

type View =
  | { kind: "hub" }
  | { kind: "playing"; mode: AimModeId }
  | { kind: "result"; result: AimResult; isNewBest: boolean; previous?: AimResult };

export function AimHub() {
  const [view, setView] = useState<View>({ kind: "hub" });
  const [bests, setBests] = useState<Partial<Record<AimModeId, AimResult>>>({});

  useEffect(() => {
    setBests(getBests());
  }, []);

  const handleComplete = (result: AimResult) => {
    const { isNewBest, previous } = submitResult(result);
    setBests(getBests());
    setView({ kind: "result", result, isNewBest, previous });
  };

  const playAgain = () => {
    if (view.kind === "result") {
      setView({ kind: "playing", mode: view.result.mode });
    }
  };

  const backToHub = () => setView({ kind: "hub" });

  if (view.kind === "playing") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={backToHub}>
            ← All modes
          </Button>
          <span className="text-xs text-text-muted">
            Personal best reset? Clear site storage.
          </span>
        </div>
        {view.mode === "reaction" && <ReactionMode onComplete={handleComplete} />}
        {view.mode === "flick" && <FlickMode onComplete={handleComplete} />}
        {view.mode === "tracking" && <TrackingMode onComplete={handleComplete} />}
        {view.mode === "peek" && <PeekMode onComplete={handleComplete} />}
        {view.mode === "echo" && <EchoMode onComplete={handleComplete} />}
        {view.mode === "clutch" && <ClutchMode onComplete={handleComplete} />}
        {view.mode === "daily" && <DailyMode onComplete={handleComplete} />}
      </div>
    );
  }

  if (view.kind === "result") {
    return (
      <ResultCard
        result={view.result}
        isNewBest={view.isNewBest}
        previousBest={view.previous}
        onPlayAgain={playAgain}
        onBackToHub={backToHub}
      />
    );
  }

  const creative = MODES.filter((m) => m.tone === "creative");
  const baseline = MODES.filter((m) => m.tone === "baseline");

  return (
    <div className="space-y-8">
      <Hero />

      <section>
        <SectionHeader
          icon={<Sparkles className="h-5 w-5 text-warning" />}
          title="ggLobby Originals"
          subtitle="You won't find these on Aimlabs or Kovaak's. Designed from scratch for moments you want to share."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {creative.map((m) => (
            <ModeCard
              key={m.id}
              meta={m}
              best={bests[m.id]}
              onClick={() => setView({ kind: "playing", mode: m.id })}
              featured
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          icon={<ShieldCheck className="h-5 w-5 text-primary" />}
          title="Benchmark Suite"
          subtitle="The fundamentals. Measure your baseline before you chase the creative modes."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {baseline.map((m) => (
            <ModeCard
              key={m.id}
              meta={m}
              best={bests[m.id]}
              onClick={() => setView({ kind: "playing", mode: m.id })}
            />
          ))}
        </div>
      </section>

      <Footnote />
    </div>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-surface to-accent/15 p-6 sm:p-8">
      <div className="absolute -right-10 -top-10 opacity-20 pointer-events-none">
        <Crosshair className="h-48 w-48 text-primary" />
      </div>
      <div className="relative">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-3">
          <Sparkles className="h-3 w-3" /> Aim Lab · beta
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-text">
          Train your aim. <span className="text-primary">Share the receipt.</span>
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-2 max-w-2xl">
          Seven browser-native drills — three benchmarks and four originals you won't find
          anywhere else. No downloads, no install, no account required to play. Every run
          produces a share card you can drop in a story or a group chat.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg sm:text-xl font-bold text-text">{title}</h2>
      </div>
      <p className="text-sm text-text-muted mt-1">{subtitle}</p>
    </div>
  );
}

function ModeCard({
  meta,
  best,
  onClick,
  featured,
}: {
  meta: ModeMeta;
  best?: AimResult;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-2xl border bg-surface p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 ${
        featured ? "border-warning/30 bg-gradient-to-br from-warning/5 via-surface to-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-3xl mb-2" aria-hidden>{meta.emoji}</div>
          <h3 className="font-bold text-text text-lg">{meta.title}</h3>
          <p className="text-sm text-primary font-medium mt-0.5">{meta.tagline}</p>
        </div>
        {best && (
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 text-xs text-warning">
              <Trophy className="h-3 w-3" /> Best
            </div>
            <div className="text-sm font-bold text-text tabular-nums">
              {Number.isInteger(best.score) ? best.score : best.score.toFixed(1)}
              <span className="text-xs text-text-muted ml-1">{meta.scoreSuffix}</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-text-secondary mt-3">{meta.description}</p>
      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
        <span>Play</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </button>
  );
}

function Footnote() {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4 text-xs text-text-muted">
      <p>
        Scores are saved locally in your browser. Sign in soon to sync personal bests,
        compete on the global leaderboard, and earn XP toward your ggLobby profile.
      </p>
    </div>
  );
}
