"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";

const DURATION_MS = 30_000;
const TARGET_RADIUS = 28;
const MISS_PENALTY_MS = 350;

interface Target {
  x: number;
  y: number;
  spawnedAt: number;
}

interface Props {
  onComplete: (r: AimResult) => void;
}

export function FlickMode({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<Target | null>(null);
  const runningRef = useRef(false);
  const endAtRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const hitTimesRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 500 });

  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [remaining, setRemaining] = useState(DURATION_MS / 1000);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  const spawnTarget = useCallback(() => {
    const { w, h } = sizeRef.current;
    const pad = TARGET_RADIUS + 8;
    targetRef.current = {
      x: pad + Math.random() * (w - pad * 2),
      y: pad + Math.random() * (h - pad * 2),
      spawnedAt: performance.now(),
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;

    ctx.clearRect(0, 0, w, h);

    const target = targetRef.current;
    if (target) {
      const age = performance.now() - target.spawnedAt;
      const pulse = 1 + Math.sin(age / 120) * 0.04;
      const r = TARGET_RADIUS * pulse;

      ctx.beginPath();
      ctx.arc(target.x, target.y, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(target.x, target.y, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#fca5a5";
      ctx.fill();
    }
  }, []);

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    const left = endAtRef.current - performance.now();
    if (left <= 0) {
      runningRef.current = false;
      const totalHits = hitsRef.current;
      const totalMisses = missesRef.current;
      const avgMs = hitTimesRef.current.length
        ? Math.round(hitTimesRef.current.reduce((a, b) => a + b, 0) / hitTimesRef.current.length)
        : 0;
      setPhase("done");
      setTimeout(() => {
        onComplete({
          mode: "flick",
          score: totalHits,
          label: `${totalHits} hits`,
          detail: `${totalMisses} misses · avg ${avgMs}ms per shot`,
          playedAt: Date.now(),
        });
      }, 400);
      return;
    }
    setRemaining(Math.max(0, left / 1000));
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, onComplete]);

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
    draw();
  }, [draw]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resize]);

  const begin = () => {
    hitsRef.current = 0;
    missesRef.current = 0;
    hitTimesRef.current = [];
    setHits(0);
    setMisses(0);
    endAtRef.current = performance.now() + DURATION_MS;
    runningRef.current = true;
    setPhase("playing");
    spawnTarget();
    rafRef.current = requestAnimationFrame(loop);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = targetRef.current;
    if (!target) return;
    const dx = x - target.x;
    const dy = y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= TARGET_RADIUS + 4) {
      hitTimesRef.current.push(performance.now() - target.spawnedAt);
      hitsRef.current += 1;
      setHits(hitsRef.current);
      spawnTarget();
    } else {
      missesRef.current += 1;
      setMisses(missesRef.current);
      endAtRef.current -= MISS_PENALTY_MS;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-text">🎯 Flick Shots</h2>
          <p className="text-sm text-text-muted">
            {phase === "playing"
              ? `${remaining.toFixed(1)}s left · ${hits} hits · ${misses} misses`
              : phase === "done"
              ? "Final score locking in…"
              : "Thirty seconds. Misses cost 350ms."}
          </p>
        </div>
        {phase === "idle" && (
          <Button onClick={begin} variant="primary">Start</Button>
        )}
      </div>

      <div ref={wrapRef} className="w-full rounded-2xl overflow-hidden border border-border bg-surface">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block w-full cursor-crosshair bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]"
        />
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: Don't drag — commit to each flick.
      </p>
    </div>
  );
}
