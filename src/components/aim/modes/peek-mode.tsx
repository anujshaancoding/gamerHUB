"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";
import { usePointerLockAim } from "../use-pointer-lock-aim";
import { SensitivityInlineHint } from "../sensitivity-bar";

// Peek Duel (ggLobby original): targets appear briefly from behind cover.
// Each round the window shrinks. Pre-aim is the point — you cannot flick in time.

const ROUNDS = 10;
const WINDOW_MS = (round: number) => Math.max(160, 520 - round * 36);
const PRE_DELAY_MIN = 650;
const PRE_DELAY_JITTER = 400;

interface CoverSlot {
  x: number;
  y: number;
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
  const peekWindowRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  const phaseRef = useRef<"idle" | "waiting" | "peek" | "resolved" | "done">("idle");
  const roundRef = useRef(0);
  const hitsRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const flashRef = useRef<"hit" | "miss" | null>(null);

  // display mirrors
  const [phase, setPhase] = useState<"idle" | "waiting" | "peek" | "resolved" | "done">("idle");
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  const aim = usePointerLockAim(canvasRef, wrapRef, sizeRef);

  const setPhaseBoth = useCallback((p: typeof phaseRef.current) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const setFlashBoth = useCallback((f: "hit" | "miss" | null) => {
    flashRef.current = f;
    setFlash(f);
  }, []);

  const pushTimer = (id: number) => timersRef.current.push(id);
  const clearAllTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  };

  const rebuildSlots = useCallback(() => {
    const { w, h } = sizeRef.current;
    const pad = 70;
    slotsRef.current = [
      { x: pad, y: h / 2 },
      { x: w - pad, y: h / 2 },
      { x: w / 2, y: pad },
      { x: w / 2, y: h - pad },
      { x: w * 0.28, y: h * 0.3 },
      { x: w * 0.72, y: h * 0.7 },
      { x: w * 0.25, y: h * 0.75 },
      { x: w * 0.78, y: h * 0.28 },
    ];
  }, []);

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
    aim.center();
  }, [rebuildSlots, aim]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);

    // cover blocks
    ctx.fillStyle = "rgba(148, 163, 184, 0.16)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 2;
    for (const slot of slotsRef.current) {
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // center hint dot
    ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    const active = activeRef.current;
    if (active && phaseRef.current === "peek") {
      const age = performance.now() - peekStartRef.current;
      const windowMs = peekWindowRef.current;
      const fade = Math.min(1, age / 80);
      const exit = age > windowMs - 80 ? Math.max(0, (windowMs - age) / 80) : 1;
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

    aim.drawCrosshair(ctx);
  }, [aim]);

  const loop = useCallback(() => {
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resize, loop]);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // --- progression ---
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearAllTimers();
    setPhaseBoth("done");
    const finalHits = hitsRef.current;
    const finalBest = bestStreakRef.current;
    setTimeout(() => {
      onComplete({
        mode: "peek",
        score: finalHits,
        label: `${finalHits}/${ROUNDS} peeks`,
        detail: `Best streak: ${finalBest} · windows tightened each round`,
        playedAt: Date.now(),
      });
    }, 200);
  }, [onComplete, setPhaseBoth]);

  const resolveRound = useCallback((hit: boolean) => {
    if (phaseRef.current !== "peek") return;
    setFlashBoth(hit ? "hit" : "miss");
    pushTimer(window.setTimeout(() => setFlashBoth(null), 220));

    if (hit) {
      hitsRef.current += 1;
      setHits(hitsRef.current);
      streakRef.current += 1;
    } else {
      streakRef.current = 0;
    }
    if (streakRef.current > bestStreakRef.current) {
      bestStreakRef.current = streakRef.current;
      setBestStreak(bestStreakRef.current);
    }
    setStreak(streakRef.current);

    activeRef.current = null;
    setPhaseBoth("resolved");

    pushTimer(window.setTimeout(() => {
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      setRound(nextRound);
      if (nextRound >= ROUNDS) {
        finish();
      } else {
        startPeek();
      }
    }, 460));
  }, [finish, setFlashBoth, setPhaseBoth]);

  const startPeek = useCallback(() => {
    const slots = slotsRef.current;
    if (slots.length === 0) return;
    const active = slots[Math.floor(Math.random() * slots.length)];
    activeRef.current = active;
    setPhaseBoth("waiting");

    pushTimer(window.setTimeout(() => {
      if (phaseRef.current !== "waiting") return;
      peekStartRef.current = performance.now();
      peekWindowRef.current = WINDOW_MS(roundRef.current);
      setPhaseBoth("peek");

      pushTimer(window.setTimeout(() => {
        if (phaseRef.current === "peek" && activeRef.current) {
          resolveRound(false);
        }
      }, peekWindowRef.current));
    }, PRE_DELAY_MIN + Math.random() * PRE_DELAY_JITTER));
  }, [resolveRound, setPhaseBoth]);

  const begin = () => {
    clearAllTimers();
    finishedRef.current = false;
    roundRef.current = 0;
    hitsRef.current = 0;
    streakRef.current = 0;
    bestStreakRef.current = 0;
    setRound(0);
    setHits(0);
    setStreak(0);
    setBestStreak(0);
    aim.center();
    startPeek();
  };

  const handleClick = () => {
    if (phaseRef.current !== "peek") {
      aim.requestLock();
      return;
    }
    const active = activeRef.current;
    if (!active) return;
    const { x, y } = aim.getPosition();
    const hit = Math.hypot(x - active.x, y - active.y) <= 34;
    resolveRound(hit);
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

      <SensitivityInlineHint locked={aim.locked} />

      <div
        ref={wrapRef}
        onClick={handleClick}
        className={`w-full rounded-2xl overflow-hidden border transition-colors ${
          flash === "hit"
            ? "border-success bg-success/10"
            : flash === "miss"
            ? "border-error bg-error/10"
            : "border-border bg-surface"
        }`}
      >
        <canvas ref={canvasRef} className="block w-full cursor-none" style={{ touchAction: "none" }} />
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: Park your crosshair where the peek is most likely. Click inside the arena to lock/unlock the mouse.
      </p>
    </div>
  );
}
