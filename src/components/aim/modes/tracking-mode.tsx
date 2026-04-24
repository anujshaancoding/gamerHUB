"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";

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
  const mouseRef = useRef<{ x: number; y: number; down: boolean }>({ x: 0, y: 0, down: false });
  const onTargetRef = useRef(0);
  const totalHeldRef = useRef(0);
  const lastTickRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [remaining, setRemaining] = useState(DURATION_MS / 1000);
  const [accuracy, setAccuracy] = useState(0);

  const targetPos = useCallback((t: number) => {
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w * 0.32;
    const ry = h * 0.3;
    // procedural wandering path
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
    const t = now - startedAtRef.current;
    const { x, y } = targetPos(t);

    const mouse = mouseRef.current;
    const dx = mouse.x - x;
    const dy = mouse.y - y;
    const inside = Math.sqrt(dx * dx + dy * dy) <= TARGET_RADIUS;

    const held = mouse.down && phase !== "idle";
    const locked = inside && held;

    // halo
    ctx.beginPath();
    ctx.arc(x, y, TARGET_RADIUS + 8, 0, Math.PI * 2);
    ctx.fillStyle = locked ? "rgba(34, 197, 94, 0.22)" : "rgba(139, 92, 246, 0.18)";
    ctx.fill();

    // target
    ctx.beginPath();
    ctx.arc(x, y, TARGET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = locked ? "#22c55e" : "#8b5cf6";
    ctx.fill();

    // inner
    ctx.beginPath();
    ctx.arc(x, y, TARGET_RADIUS * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  }, [phase, targetPos]);

  const loop = useCallback((now: number) => {
    if (!runningRef.current) return;
    const left = endAtRef.current - now;
    if (lastTickRef.current) {
      const dt = now - lastTickRef.current;
      const mouse = mouseRef.current;
      if (mouse.down) {
        totalHeldRef.current += dt;
        const { x, y } = targetPos(now - startedAtRef.current);
        const dx = mouse.x - x;
        const dy = mouse.y - y;
        if (Math.sqrt(dx * dx + dy * dy) <= TARGET_RADIUS) {
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
    setRemaining(Math.max(0, left / 1000));
    setAccuracy(totalHeldRef.current > 0 ? (onTargetRef.current / totalHeldRef.current) * 100 : 0);
    draw(now);
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, onComplete, targetPos]);

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

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    const onUp = () => { mouseRef.current.down = false; };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resize]);

  const begin = () => {
    onTargetRef.current = 0;
    totalHeldRef.current = 0;
    lastTickRef.current = 0;
    startedAtRef.current = performance.now();
    endAtRef.current = startedAtRef.current + DURATION_MS;
    runningRef.current = true;
    setPhase("playing");
    setAccuracy(0);
    rafRef.current = requestAnimationFrame(loop);
  };

  const updateMouse = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      if (!t) return;
      mouseRef.current.x = t.clientX - rect.left;
      mouseRef.current.y = t.clientY - rect.top;
    } else {
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }
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
              : "Hold the button. Stay inside the target."}
          </p>
        </div>
        {phase === "idle" && (
          <Button onClick={begin} variant="primary">Start</Button>
        )}
      </div>

      <div ref={wrapRef} className="w-full rounded-2xl overflow-hidden border border-border bg-surface">
        <canvas
          ref={canvasRef}
          onMouseMove={updateMouse}
          onMouseDown={(e) => { updateMouse(e); mouseRef.current.down = true; }}
          onMouseUp={() => { mouseRef.current.down = false; }}
          onTouchMove={updateMouse}
          onTouchStart={(e) => { updateMouse(e); mouseRef.current.down = true; }}
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
