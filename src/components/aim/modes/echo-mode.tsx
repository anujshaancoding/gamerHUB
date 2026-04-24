"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";
import { usePointerLockAim } from "../use-pointer-lock-aim";
import { SensitivityInlineHint } from "../sensitivity-bar";

// Ghost Echo (ggLobby original): a ghost fires a sequence of shots on screen.
// You must reproduce the same targets in order. Each level adds one shot.

const START_LENGTH = 3;
const MAX_LEVEL = 9;
const TARGET_RADIUS = 28;

interface Shot {
  x: number;
  y: number;
  atMs: number;
}

type Phase = "idle" | "playback" | "reproduce" | "success" | "fail" | "done";

interface Props {
  onComplete: (r: AimResult) => void;
}

export function EchoMode({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 500 });
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  const sequenceRef = useRef<Shot[]>([]);
  const playbackStartRef = useRef(0);
  const reproStartRef = useRef(0);
  const userIndexRef = useRef(0);
  const errorRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const levelRef = useRef(1);
  const completedRef = useRef(0);
  const flashRef = useRef<"hit" | "miss" | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [completed, setCompleted] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const [, forceTick] = useState(0);

  const aim = usePointerLockAim(canvasRef, wrapRef, sizeRef);

  const setPhaseBoth = useCallback((p: Phase) => {
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
    aim.center();
  }, [aim]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);

    const seq = sequenceRef.current;
    const ph = phaseRef.current;

    if (ph === "playback") {
      const t = performance.now() - playbackStartRef.current;
      for (let i = 0; i < seq.length; i++) {
        const s = seq[i];
        const age = t - s.atMs;
        if (age < 0) continue;
        const alpha = Math.max(0, 1 - age / 900);
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, TARGET_RADIUS + age * 0.08, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s.x, s.y, TARGET_RADIUS * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.35)";
        ctx.fill();
        ctx.globalAlpha = Math.min(1, alpha * 1.5);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), s.x, s.y);
        ctx.globalAlpha = 1;
      }
    }

    if (ph === "reproduce") {
      for (let i = 0; i < seq.length; i++) {
        const s = seq[i];
        if (i < userIndexRef.current) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(34, 197, 94, 0.55)";
          ctx.fill();
        } else if (i === userIndexRef.current) {
          const pulse = 1 + Math.sin(performance.now() / 140) * 0.08;
          ctx.beginPath();
          ctx.arc(s.x, s.y, TARGET_RADIUS * pulse, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
          ctx.fill();
          ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
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

  const generate = (len: number): Shot[] => {
    const { w, h } = sizeRef.current;
    const pad = TARGET_RADIUS + 10;
    const out: Shot[] = [];
    let time = 400;
    for (let i = 0; i < len; i++) {
      let x: number, y: number;
      let attempts = 0;
      do {
        x = pad + Math.random() * (w - pad * 2);
        y = pad + Math.random() * (h - pad * 2);
        attempts++;
      } while (
        attempts < 20 &&
        out.some((s) => Math.hypot(s.x - x, s.y - y) < TARGET_RADIUS * 2.2)
      );
      out.push({ x, y, atMs: time });
      time += 600 + Math.random() * 250;
    }
    return out;
  };

  const finish = useCallback((reachedCleared: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearAllTimers();
    setPhaseBoth("done");
    const avgErr = reachedCleared > 0 ? Math.round(errorRef.current / reachedCleared) : 0;
    setTimeout(() => {
      onComplete({
        mode: "echo",
        score: reachedCleared,
        label: `Level ${reachedCleared} cleared`,
        detail:
          reachedCleared === 0
            ? "Dropped on level 1 — the ghost out-remembered you."
            : `Survived through level ${reachedCleared}${avgErr > 0 ? ` · avg timing drift ${avgErr}ms` : ""}`,
        playedAt: Date.now(),
      });
    }, 400);
  }, [onComplete, setPhaseBoth]);

  const startLevel = useCallback((lvl: number) => {
    const len = START_LENGTH + (lvl - 1);
    const seq = generate(len);
    sequenceRef.current = seq;
    userIndexRef.current = 0;
    errorRef.current = 0;
    levelRef.current = lvl;
    setLevel(lvl);
    setPhaseBoth("playback");
    playbackStartRef.current = performance.now();

    const total = seq[seq.length - 1].atMs + 900;
    pushTimer(window.setTimeout(() => {
      if (phaseRef.current !== "playback") return;
      reproStartRef.current = performance.now();
      setPhaseBoth("reproduce");
    }, total));
  }, [setPhaseBoth]);

  const begin = () => {
    clearAllTimers();
    finishedRef.current = false;
    completedRef.current = 0;
    setCompleted(0);
    aim.center();
    startLevel(1);
  };

  const nextLevel = useCallback((lvl: number) => {
    if (lvl > MAX_LEVEL) {
      finish(lvl - 1);
      return;
    }
    startLevel(lvl);
  }, [finish, startLevel]);

  const failLevel = useCallback((reachedLevel: number) => {
    setFlashBoth("miss");
    pushTimer(window.setTimeout(() => setFlashBoth(null), 250));
    setPhaseBoth("fail");
    pushTimer(window.setTimeout(() => finish(reachedLevel - 1), 500));
  }, [finish, setFlashBoth, setPhaseBoth]);

  const handleClick = () => {
    if (phaseRef.current !== "reproduce") {
      aim.requestLock();
      return;
    }
    const seq = sequenceRef.current;
    const target = seq[userIndexRef.current];
    if (!target) return;
    const { x, y } = aim.getPosition();
    if (Math.hypot(x - target.x, y - target.y) > TARGET_RADIUS + 6) {
      failLevel(levelRef.current);
      return;
    }

    const elapsed = performance.now() - reproStartRef.current;
    const expected = target.atMs - seq[0].atMs;
    errorRef.current += Math.abs(elapsed - expected);

    setFlashBoth("hit");
    pushTimer(window.setTimeout(() => setFlashBoth(null), 120));

    userIndexRef.current += 1;
    forceTick((n) => n + 1);

    if (userIndexRef.current >= seq.length) {
      completedRef.current += 1;
      setCompleted(completedRef.current);
      setPhaseBoth("success");
      pushTimer(window.setTimeout(() => nextLevel(levelRef.current + 1), 500));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-text">👻 Ghost Echo</h2>
          <p className="text-sm text-text-muted">
            {phase === "idle"
              ? "A ghost fires. You echo the same shots in order."
              : phase === "playback"
              ? `Level ${level} · watch carefully`
              : phase === "reproduce"
              ? `Level ${level} · shot ${userIndexRef.current + 1}/${sequenceRef.current.length}`
              : phase === "success"
              ? "Clean echo."
              : phase === "fail"
              ? "The ghost wins this one."
              : `Cleared ${completed} level${completed === 1 ? "" : "s"}.`}
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
          flash === "hit" ? "border-success/60" : flash === "miss" ? "border-error bg-error/10" : "border-border"
        } bg-surface`}
      >
        <canvas
          ref={canvasRef}
          className="block w-full cursor-none bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]"
          style={{ touchAction: "none" }}
        />
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: Don't chase timing — your hand remembers position better than your head remembers rhythm.
      </p>
    </div>
  );
}
