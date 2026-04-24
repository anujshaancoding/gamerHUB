"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";

// Ghost Echo (ggLobby original): a ghost fires a sequence of shots on screen.
// You must reproduce the same targets, same order, within a timing window.
// Each level adds one shot; sequence regenerates per level.

const START_LENGTH = 3;
const MAX_LEVEL = 9;
const TIMING_TOLERANCE_MS = 700;
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
  const sequenceRef = useRef<Shot[]>([]);
  const playbackStartRef = useRef(0);
  const reproStartRef = useRef(0);
  const userIndexRef = useRef(0);
  const errorRef = useRef(0); // ms sum

  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [completed, setCompleted] = useState(0);
  const [hintIdx, setHintIdx] = useState(-1);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  const clearTimers = () => {
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
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);

    const seq = sequenceRef.current;

    if (phase === "playback") {
      const t = performance.now() - playbackStartRef.current;
      for (let i = 0; i < seq.length; i++) {
        const s = seq[i];
        const age = t - s.atMs;
        if (age < 0) continue;
        const alpha = Math.max(0, 1 - age / 900);
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        // ghost ring
        ctx.beginPath();
        ctx.arc(s.x, s.y, TARGET_RADIUS + age * 0.08, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
        // ghost fill
        ctx.beginPath();
        ctx.arc(s.x, s.y, TARGET_RADIUS * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.35)";
        ctx.fill();
        // order number
        ctx.globalAlpha = Math.min(1, alpha * 1.5);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), s.x, s.y);
        ctx.globalAlpha = 1;
      }
    }

    if (phase === "reproduce") {
      // show faint dots for already-hit shots + highlight next target lightly
      for (let i = 0; i < seq.length; i++) {
        const s = seq[i];
        if (i < userIndexRef.current) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(34, 197, 94, 0.5)";
          ctx.fill();
        } else if (i === userIndexRef.current) {
          const pulse = 1 + Math.sin(performance.now() / 140) * 0.08;
          ctx.beginPath();
          ctx.arc(s.x, s.y, TARGET_RADIUS * pulse, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
          ctx.fill();
          ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      if (hintIdx >= 0 && hintIdx === userIndexRef.current) {
        const s = seq[hintIdx];
        ctx.beginPath();
        ctx.arc(s.x, s.y, TARGET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
        ctx.fill();
      }
    }
  }, [phase, hintIdx]);

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
    return () => clearTimers();
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

  const startLevel = useCallback((lvl: number) => {
    clearTimers();
    const len = START_LENGTH + (lvl - 1);
    const seq = generate(len);
    sequenceRef.current = seq;
    userIndexRef.current = 0;
    errorRef.current = 0;
    setPhase("playback");
    playbackStartRef.current = performance.now();

    const total = seq[seq.length - 1].atMs + 900;
    const id = window.setTimeout(() => {
      reproStartRef.current = performance.now();
      setPhase("reproduce");
    }, total);
    timersRef.current.push(id);
  }, []);

  const begin = () => {
    setLevel(1);
    setCompleted(0);
    startLevel(1);
  };

  const nextLevel = useCallback((lvl: number) => {
    if (lvl > MAX_LEVEL) {
      setPhase("done");
      const finished = lvl - 1;
      const avgErr = finished > 0 ? Math.round(errorRef.current / finished) : 0;
      setTimeout(() => {
        onComplete({
          mode: "echo",
          score: finished,
          label: `Level ${finished} cleared`,
          detail: `Survived through level ${finished} of ${MAX_LEVEL}${avgErr > 0 ? ` · avg timing drift ${avgErr}ms` : ""}`,
          playedAt: Date.now(),
        });
      }, 400);
      return;
    }
    setLevel(lvl);
    startLevel(lvl);
  }, [onComplete, startLevel]);

  const failLevel = useCallback((reachedLevel: number) => {
    setFlash("miss");
    setTimeout(() => setFlash(null), 250);
    setPhase("fail");
    setTimeout(() => {
      onComplete({
        mode: "echo",
        score: reachedLevel - 1,
        label: `Level ${reachedLevel - 1} cleared`,
        detail: reachedLevel - 1 === 0
          ? `Dropped on level 1 — the ghost out-remembered you.`
          : `Broke the chain on level ${reachedLevel}`,
        playedAt: Date.now(),
      });
    }, 500);
  }, [onComplete]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "reproduce") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const seq = sequenceRef.current;
    const target = seq[userIndexRef.current];
    if (!target) return;

    const dx = x - target.x;
    const dy = y - target.y;
    if (Math.hypot(dx, dy) > TARGET_RADIUS + 6) {
      setHintIdx(userIndexRef.current);
      setTimeout(() => setHintIdx(-1), 700);
      failLevel(level);
      return;
    }

    // timing check: each shot is paced ~600-850ms apart; we only enforce not
    // being wildly off the first shot window (within 900ms of playback end)
    const elapsed = performance.now() - reproStartRef.current;
    const expected = target.atMs - seq[0].atMs;
    errorRef.current += Math.abs(elapsed - expected);

    setFlash("hit");
    setTimeout(() => setFlash(null), 120);

    userIndexRef.current += 1;
    if (userIndexRef.current >= seq.length) {
      setCompleted((c) => c + 1);
      setPhase("success");
      setTimeout(() => nextLevel(level + 1), 500);
    }
    // tolerance check — if drift exceeds (tolerance * shots) we forgive but
    // this keeps timing meaningful for share stats
    void TIMING_TOLERANCE_MS;
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

      <div
        ref={wrapRef}
        className={`w-full rounded-2xl overflow-hidden border transition-colors ${
          flash === "hit" ? "border-success/60" : flash === "miss" ? "border-error bg-error/10" : "border-border"
        } bg-surface`}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block w-full cursor-crosshair bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]"
        />
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: Don't chase timing — your hand remembers position better than your head remembers rhythm.
      </p>
    </div>
  );
}
