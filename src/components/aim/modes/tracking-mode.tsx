"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";
import { usePointerLockAim } from "../use-pointer-lock-aim";
import { SensitivityInlineHint } from "../sensitivity-bar";

const DURATION_MS = 20_000;
const TARGET_RADIUS = 26;

interface Props {
  onComplete: (r: AimResult) => void;
}

export function TrackingMode({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const endAtRef = useRef(0);
  const startedAtRef = useRef(0);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 500 });
  const holdingRef = useRef(false);
  const onTargetRef = useRef(0);
  const totalHeldRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastDisplayRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [remaining, setRemaining] = useState(DURATION_MS / 1000);
  const [accuracy, setAccuracy] = useState(0);

  const aim = usePointerLockAim(canvasRef, wrapRef, sizeRef);

  const targetPos = useCallback((t: number) => {
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.32;
    const ry = h * 0.3;
    const x = cx + Math.sin(t / 820) * rx + Math.cos(t / 1300) * rx * 0.35;
    const y = cy + Math.cos(t / 940) * ry + Math.sin(t / 1500) * ry * 0.35;
    return { x, y };
  }, []);

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);
    const t = phase === "playing" ? now - startedAtRef.current : now / 10;
    const { x, y } = targetPos(t);

    const cursor = aim.getPosition();
    const inside = Math.hypot(cursor.x - x, cursor.y - y) <= TARGET_RADIUS;
    const locked = inside && holdingRef.current && phase === "playing";

    ctx.beginPath();
    ctx.arc(x, y, TARGET_RADIUS + 8, 0, Math.PI * 2);
    ctx.fillStyle = locked ? "rgba(34, 197, 94, 0.22)" : "rgba(139, 92, 246, 0.18)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = locked ? "#22c55e" : "#8b5cf6";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, TARGET_RADIUS * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    aim.drawCrosshair(ctx);
  }, [phase, targetPos, aim]);

  const loop = useCallback((now: number) => {
    if (!runningRef.current) return;
    const left = endAtRef.current - now;
    if (lastTickRef.current) {
      const dt = now - lastTickRef.current;
      if (holdingRef.current) {
        totalHeldRef.current += dt;
        const { x, y } = targetPos(now - startedAtRef.current);
        const cursor = aim.getPosition();
        if (Math.hypot(cursor.x - x, cursor.y - y) <= TARGET_RADIUS) {
          onTargetRef.current += dt;
        }
      }
    }
    lastTickRef.current = now;

    if (left <= 0) {
      runningRef.current = false;
      const held = totalHeldRef.current;
      const on = onTargetRef.current;
      const pct = held > 0 ? (on / held) * 100 : 0;
      setPhase("done");
      setTimeout(() => {
        onComplete({
          mode: "tracking",
          score: Math.round(pct * 10) / 10,
          label: `${pct.toFixed(1)}% on target`,
          detail: `Held for ${(held / 1000).toFixed(1)}s · locked ${(on / 1000).toFixed(1)}s`,
          playedAt: Date.now(),
        });
      }, 400);
      return;
    }

    if (now - lastDisplayRef.current > 100) {
      lastDisplayRef.current = now;
      setRemaining(Math.max(0, left / 1000));
      setAccuracy(totalHeldRef.current > 0 ? (onTargetRef.current / totalHeldRef.current) * 100 : 0);
    }
    draw(now);
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, onComplete, targetPos, aim]);

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

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    const onUp = () => { holdingRef.current = false; };
    const onDown = (e: MouseEvent) => {
      // only count hold while pointer locked to canvas or cursor inside wrap
      if (document.pointerLockElement === canvasRef.current) {
        if (e.button === 0) holdingRef.current = true;
      }
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousedown", onDown);
    // idle draw when not running
    let idleRaf: number | null = null;
    const idleDraw = () => {
      if (runningRef.current) return;
      draw(performance.now());
      idleRaf = requestAnimationFrame(idleDraw);
    };
    idleRaf = requestAnimationFrame(idleDraw);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousedown", onDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (idleRaf) cancelAnimationFrame(idleRaf);
    };
  }, [resize, draw]);

  const begin = () => {
    onTargetRef.current = 0;
    totalHeldRef.current = 0;
    lastTickRef.current = 0;
    startedAtRef.current = performance.now();
    endAtRef.current = startedAtRef.current + DURATION_MS;
    runningRef.current = true;
    setPhase("playing");
    setAccuracy(0);
    aim.center();
    rafRef.current = requestAnimationFrame(loop);
  };

  const handleClick = () => {
    if (phase !== "playing") {
      aim.requestLock();
      return;
    }
    // inside a running game, hold is managed by mousedown/mouseup listeners
  };

  const handleTouchStart = () => {
    holdingRef.current = true;
  };
  const handleTouchEnd = () => {
    holdingRef.current = false;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-text">🌀 Tracking</h2>
          <p className="text-sm text-text-muted">
            {phase === "playing"
              ? `${remaining.toFixed(1)}s · ${accuracy.toFixed(1)}% on target`
              : phase === "done"
              ? "Crunching accuracy…"
              : "Hold the left mouse button. Stay inside the target."}
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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full rounded-2xl overflow-hidden border border-border bg-surface"
      >
        <canvas
          ref={canvasRef}
          className="block w-full cursor-none bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]"
          style={{ touchAction: "none" }}
        />
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: Release the button if you drift — only clean tracking counts.
      </p>
    </div>
  );
}
