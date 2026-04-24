"use client";

import { Copy, Share2, RefreshCw, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { useState } from "react";
import type { AimResult } from "./types";
import { MODE_BY_ID } from "./types";

interface ResultCardProps {
  result: AimResult;
  isNewBest: boolean;
  previousBest?: AimResult;
  onPlayAgain: () => void;
  onBackToHub: () => void;
}

export function ResultCard({
  result,
  isNewBest,
  previousBest,
  onPlayAgain,
  onBackToHub,
}: ResultCardProps) {
  const meta = MODE_BY_ID[result.mode];
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(result);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `ggLobby Aim Lab — ${meta.title}`,
          text: shareText,
          url: typeof window !== "undefined" ? `${window.location.origin}/aim` : undefined,
        });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to copy */
      }
    }
    await copyToClipboard();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(
        `${shareText}\n\nPlay at ${typeof window !== "undefined" ? window.location.origin : "gglobby.in"}/aim`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div
        className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-surface to-accent/10 p-6 sm:p-8 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-widest text-text-muted">
            {meta.tone === "creative" ? "ggLobby Original" : "Benchmark"}
          </span>
          {isNewBest && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/15 text-warning text-xs font-semibold">
              <Sparkles className="h-3 w-3" /> New Personal Best
            </span>
          )}
        </div>

        <div className="text-5xl sm:text-6xl mb-2" aria-hidden>
          {meta.emoji}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-text">{meta.title}</h2>
        <p className="text-sm text-text-muted">{meta.tagline}</p>

        <div className="my-6 flex items-baseline gap-2">
          <span className="text-5xl sm:text-6xl font-black text-primary tabular-nums">
            {formatScore(result.score)}
          </span>
          <span className="text-lg text-text-secondary">{meta.scoreSuffix}</span>
        </div>

        {result.detail && (
          <p className="text-sm text-text-muted mb-4">{result.detail}</p>
        )}

        {previousBest && !isNewBest && (
          <p className="text-xs text-text-muted mb-4">
            Your best: <span className="text-text font-semibold">{formatScore(previousBest.score)} {meta.scoreSuffix}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
          <Button onClick={onPlayAgain} variant="primary" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" /> Play again
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" /> Share result
          </Button>
          <Button onClick={copyToClipboard} variant="ghost" className="sm:w-auto" aria-label="Copy result">
            <Copy className="h-4 w-4 sm:mr-0 mr-2" />
            <span className="sm:hidden">{copied ? "Copied!" : "Copy"}</span>
          </Button>
        </div>

        {copied && (
          <p className="text-xs text-success mt-2 text-center sm:text-right" aria-live="polite">
            Copied to clipboard — paste it anywhere.
          </p>
        )}

        <pre className="mt-5 text-[11px] leading-relaxed font-mono text-text-muted bg-background/50 border border-border rounded-lg p-3 whitespace-pre-wrap">
{shareText}
        </pre>
      </div>

      <div className="mt-4 text-center">
        <Button onClick={onBackToHub} variant="ghost" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to modes
        </Button>
      </div>
    </div>
  );
}

function formatScore(score: number) {
  if (Number.isInteger(score)) return String(score);
  return score.toFixed(1);
}

function buildShareText(result: AimResult): string {
  const meta = MODE_BY_ID[result.mode];
  const score = `${formatScore(result.score)} ${meta.scoreSuffix}`;
  const detail = result.detail ? `\n${result.detail}` : "";
  return `${meta.emoji} ggLobby Aim Lab — ${meta.title}\nScore: ${score}${detail}\n\nThink you can beat it?`;
}
