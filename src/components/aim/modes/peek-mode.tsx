"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";

// Peek Duel (ggLobby original): targets appear briefly from behind cover.
// Each round the window shrinks. Pre-aim is the point — you cannot flick in time.

const ROUNDS = 10;
const WINDOW_MS = (round: number) => Math.max(160, 520 - round * 36);
const PRE_DELAY_MS = 650;

type Phase = "idle" | "waiting" | "peek" | "resolved" | "done";

interface CoverSlot {
  x: number;
  y: number;
  side: "left" | "right" | "top" | "bottom";
}

interface Props {
  onComplete: (r: AimResult) => void;
}

export function PeekMode({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 500 });
  const slotsRef = useRef<CoverSlot[]>([]);
  const activeRef = useRef<CoverSlot | null>(null);
  const peekStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  const rebuildSlots = useCallback(() => {
    const { w, h } = sizeRef.current;
    const pad = 70;
    slotsRef.current = [
      { x: pad, y: h / 2, side: "left" },
      { x: w - pad, y: h / 2, side: "right" },
      { x: w / 2, y: pad, side: "top" },
      { x: w / 2, y: h - pad, side: "bottom" },
      { x: w * 0.28, y: h * 0.3, side: "top" },
      { x: w * 0.72, y: h * 0.7, side: "bottom" },
      { x: w * 0.25, y: h * 0.75, side: "left" },
      { x: w * 0.78, y: h * 0.28, side: "right" },
    ];
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);

    // draw cover blocks
    ctx.fillStyle = "rgba(148, 163, 184, 0.16)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 2;
    for (const slot of slotsRef.current) {
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // crosshair hint dot at center
    ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // active peeking target
    const active = activeRef.current;
    if (active && phase === "peek") {
      const age = performance.now() - peekStartRef.current;
      const window = WINDOW_MS(round);
      const fade = Math.min(1, age / 80);
      const exit = age > window - 80 ? Math.max(0, (window - age) / 80) : 1;
      const alpha = fade * exit;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(active.x, active.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(active.x, active.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#fecaca";
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, [phase, round]);

  const loop = useCallback(() => {
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const clearTimers = () => {
    for (const id of timeoutsRef.current) window.clearTimeout(id);
    timeoutsRef.current = [];
  };

  const endRoundOutcome = useCallback((hit: boolean) => {
    setFlash(hit ? "hit" : "miss");
    setTimeout(() => setFlash(null), 220);

    setStreak((s) => {
      const next = hit ? s + 1 : 0;
      setBestStreak((b) => Math.max(b, next));
      return next;
    });

    if (hit) setHits((h) => h + 1);

    activeRef.current = null;
    setPhase("resolved");

    const id = window.setTimeout(() => {
      setRound((r) => {
        const next = r + 1;
        if (next >= ROUNDS) {
          // done
          setPhase("done");
          setTimeout(() => {
            setHits((finalHits) => {
              setBestStreak((finalBest) => {
                onComplete({
                  mode: "peek",
                  score: finalHits,
                  label: `${finalHits}/10 peeks`,
                  detail: `Best streak: ${finalBest} · windows tightened each round`,
                  playedAt: Date.now(),
                });
                return finalBest;
              });
              return finalHits;
            });
          }, 200);
          return next;
        }
        // queue next peek
        startPeek(next);
        return next;
      });
    }, 480);
    timeoutsRef.current.push(id);
  }, [onComplete]);

  const startPeek = useCallback((roundIndex: number) => {
    const slots = slotsRef.current;
    const active = slots[Math.floor(Math.random() * slots.length)];
    activeRef.current = active;
    setPhase("waiting");

    const t1 = window.setTimeout(() => {
      peekStartRef.current = performance.now();
      setPhase("peek");
      const t2 = window.setTimeout(() => {
        // window closed without hit
        if (activeRef.current) {
          endRoundOutcome(false);
        }
      }, WINDOW_MS(roundIndex));
      timeoutsRef.current.push(t2);
    }, PRE_DELAY_MS + Math.random() * 400);
    timeoutsRef.current.push(t1);
  }, [endRoundOutcome]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(320, Math.round(rect.width));
    const h = Math.max(320, Math.round(Math.min(600, rect.width * 0.62)));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizeRef.current = { w, h };
    rebuildSlots();
  }, [rebuildSlots]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimers();
    };
  }, [resize, loop]);

  const begin = () => {
    clearTimers();
    setRound(0);
    setHits(0);
    setStreak(0);
    setBestStreak(0);
    startPeek(0);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "peek") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const active = activeRef.current;
    if (!active) return;
    const dx = x - active.x;
    const dy = y - active.y;
    const hit = Math.sqrt(dx * dx + dy * dy) <= 34;
    endRoundOutcome(hit);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-text">🎭 Peek Duel</h2>
          <p className="text-sm text-text-muted">
            {phase === "idle"
              ? "Pre-aim one cover spot. They peek for less than half a second."
              : phase === "done"
              ? "Reviewing your reflexes…"
              : `Round ${Math.min(round + 1, ROUNDS)}/${ROUNDS} · ${hits} hits · streak ${streak} (best ${bestStreak}) · window ${WINDOW_MS(round)}ms`}
          </p>
        </div>
        {phase === "idle" && (
          <Button onClick={begin} variant="primary">Start</Button>
        )}
      </div>

      <div
        ref={wrapRef}
        className={`w-full rounded-2xl overflow-hidden border transition-colors ${
          flash === "hit"
            ? "border-success bg-success/10"
            : flash === "miss"
            ? "border-error bg-error/10"
            : "border-border bg-surface"
        }`}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block w-full cursor-crosshair"
        />
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: Park your crosshair at head height on the cover you're most afraid of.
      </p>
    </div>
  );
}
