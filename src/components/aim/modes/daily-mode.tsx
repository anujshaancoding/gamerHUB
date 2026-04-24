"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";

// Daily Gauntlet (ggLobby original): a seeded three-stage gauntlet.
// Same puzzle for every player each day. Score is a composite:
//   - Stage 1: 10 seeded flick shots (points = hits * 100 - totalMs/50)
//   - Stage 2: 8 seeded peek targets with shrinking window
//   - Stage 3: 12 shots with decoys (click red, avoid blue)
// Share card shows today's seed + your score so friends can compare.

interface Seeded {
  next: () => number; // 0..1
}

function mulberry32(seed: number): Seeded {
  let a = seed | 0;
  return {
    next: () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

function todaySeed(): { seed: number; label: string } {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const seed = y * 10000 + m * 100 + day;
  const label = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { seed, label };
}

const TARGET_RADIUS = 26;

type Stage = "intro" | "s1" | "s2" | "s3" | "done";

interface Shot {
  x: number;
  y: number;
  kind: "red" | "blue";
  visibleFor?: number;
  after?: number;
}

interface Props {
  onComplete: (r: AimResult) => void;
}

export function DailyMode({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 500 });
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const stageRef = useRef<Stage>("intro");
  const s1ShotsRef = useRef<Shot[]>([]);
  const s1IndexRef = useRef(0);
  const s1StartRef = useRef(0);
  const s2ShotsRef = useRef<Shot[]>([]);
  const s2IndexRef = useRef(0);
  const s2HidesAtRef = useRef(0);
  const s3ShotsRef = useRef<Shot[]>([]);
  const s3IndexRef = useRef(0);
  const s3StartRef = useRef(0);

  const pointsRef = useRef(0);
  const statsRef = useRef({ s1Hits: 0, s1Ms: 0, s2Hits: 0, s3Hits: 0, s3Wrong: 0 });

  const [phase, setPhase] = useState<"idle" | "playing" | "between" | "done">("idle");
  const [stageLabel, setStageLabel] = useState("");
  const [displayPoints, setDisplayPoints] = useState(0);
  const { seed, label } = todaySeed();

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
    const stage = stageRef.current;

    if (stage === "s1") {
      const s = s1ShotsRef.current[s1IndexRef.current];
      if (s) drawTarget(ctx, s.x, s.y, "red");
    }
    if (stage === "s2") {
      const s = s2ShotsRef.current[s2IndexRef.current];
      if (s) {
        const left = s2HidesAtRef.current - performance.now();
        const age = performance.now() - (s2HidesAtRef.current - (s.visibleFor ?? 0));
        const fade = Math.min(1, age / 90);
        const exit = left < 140 ? Math.max(0, left / 140) : 1;
        ctx.globalAlpha = fade * exit;
        drawTarget(ctx, s.x, s.y, "red");
        ctx.globalAlpha = 1;
      }
    }
    if (stage === "s3") {
      for (const s of s3ShotsRef.current) {
        if (!s.visibleFor) continue;
        const shown = performance.now() - s3StartRef.current > (s.after ?? 0);
        const gone = performance.now() - s3StartRef.current > (s.after ?? 0) + s.visibleFor;
        if (shown && !gone) {
          const age = performance.now() - s3StartRef.current - (s.after ?? 0);
          const left = s.visibleFor - age;
          const fade = Math.min(1, age / 80);
          const exit = left < 120 ? Math.max(0, left / 120) : 1;
          ctx.globalAlpha = fade * exit;
          drawTarget(ctx, s.x, s.y, s.kind);
          ctx.globalAlpha = 1;
        }
      }
    }
  }, []);

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
      clearTimers();
    };
  }, [resize, loop]);

  const randomShot = (rng: Seeded, pad = 40): { x: number; y: number } => {
    const { w, h } = sizeRef.current;
    return {
      x: pad + rng.next() * (w - pad * 2),
      y: pad + rng.next() * (h - pad * 2),
    };
  };

  const generate = useCallback(() => {
    const rng = mulberry32(seed);
    s1ShotsRef.current = Array.from({ length: 10 }, () => {
      const { x, y } = randomShot(rng);
      return { x, y, kind: "red" as const };
    });
    s2ShotsRef.current = Array.from({ length: 8 }, (_, i) => {
      const { x, y } = randomShot(rng, 55);
      return { x, y, kind: "red" as const, visibleFor: Math.max(280, 650 - i * 40) };
    });

    // s3: 12 shots pacing ~600ms apart, 60% red 40% blue
    let t = 400;
    s3ShotsRef.current = Array.from({ length: 12 }, () => {
      const { x, y } = randomShot(rng, 50);
      const kind = rng.next() < 0.6 ? "red" : "blue";
      const shot: Shot = { x, y, kind, visibleFor: 720, after: t };
      t += 520 + rng.next() * 200;
      return shot;
    });
  }, [seed]);

  const showStageBanner = (text: string): Promise<void> =>
    new Promise((res) => {
      setPhase("between");
      setStageLabel(text);
      const id = window.setTimeout(() => {
        setStageLabel("");
        setPhase("playing");
        res();
      }, 900);
      timersRef.current.push(id);
    });

  const beginStage1 = useCallback(async () => {
    await showStageBanner("Stage 1 · Flick");
    stageRef.current = "s1";
    s1IndexRef.current = 0;
    s1StartRef.current = performance.now();
  }, []);

  const finishStage1 = useCallback(async () => {
    const ms = performance.now() - s1StartRef.current;
    statsRef.current.s1Ms = ms;
    const hits = statsRef.current.s1Hits;
    const pts = Math.max(0, hits * 100 - Math.round(ms / 50));
    pointsRef.current += pts;
    setDisplayPoints(pointsRef.current);
    await beginStage2();
  }, []);

  const beginStage2 = useCallback(async () => {
    await showStageBanner("Stage 2 · Peek");
    stageRef.current = "s2";
    s2IndexRef.current = 0;
    armS2();
  }, []);

  const armS2 = useCallback(() => {
    const s = s2ShotsRef.current[s2IndexRef.current];
    if (!s) {
      finishStage2();
      return;
    }
    s2HidesAtRef.current = performance.now() + (s.visibleFor ?? 400);
    const id = window.setTimeout(() => {
      if (stageRef.current !== "s2") return;
      if (s2ShotsRef.current[s2IndexRef.current] === s) {
        // missed
        s2IndexRef.current += 1;
        armS2();
      }
    }, s.visibleFor);
    timersRef.current.push(id);
  }, []);

  const finishStage2 = useCallback(async () => {
    const hits = statsRef.current.s2Hits;
    pointsRef.current += hits * 140;
    setDisplayPoints(pointsRef.current);
    await beginStage3();
  }, []);

  const beginStage3 = useCallback(async () => {
    await showStageBanner("Stage 3 · Red only");
    stageRef.current = "s3";
    s3IndexRef.current = 0;
    s3StartRef.current = performance.now();
    const last = s3ShotsRef.current[s3ShotsRef.current.length - 1];
    const end = (last?.after ?? 0) + (last?.visibleFor ?? 720) + 200;
    const id = window.setTimeout(() => finishAll(), end);
    timersRef.current.push(id);
  }, []);

  const finishAll = useCallback(async () => {
    if (stageRef.current === "done") return;
    stageRef.current = "done";
    const { s3Hits, s3Wrong } = statsRef.current;
    const s3Pts = s3Hits * 100 - s3Wrong * 60;
    pointsRef.current += Math.max(0, s3Pts);
    setDisplayPoints(pointsRef.current);
    setPhase("done");

    const detail = `Flick ${statsRef.current.s1Hits}/10 · Peek ${statsRef.current.s2Hits}/8 · Red ${s3Hits}/${s3Hits + s3Wrong} (wrong: ${s3Wrong}) · seed ${label}`;
    setTimeout(() => {
      onComplete({
        mode: "daily",
        score: pointsRef.current,
        label: `${pointsRef.current} points`,
        detail,
        playedAt: Date.now(),
      });
    }, 400);
  }, [label, onComplete]);

  const begin = async () => {
    clearTimers();
    pointsRef.current = 0;
    statsRef.current = { s1Hits: 0, s1Ms: 0, s2Hits: 0, s3Hits: 0, s3Wrong: 0 };
    setDisplayPoints(0);
    generate();
    setPhase("playing");
    await beginStage1();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stage = stageRef.current;
    if (stage === "s1") {
      const s = s1ShotsRef.current[s1IndexRef.current];
      if (s && Math.hypot(x - s.x, y - s.y) <= TARGET_RADIUS + 6) {
        statsRef.current.s1Hits += 1;
        s1IndexRef.current += 1;
        if (s1IndexRef.current >= s1ShotsRef.current.length) {
          finishStage1();
        }
      }
      return;
    }
    if (stage === "s2") {
      const s = s2ShotsRef.current[s2IndexRef.current];
      if (s && Math.hypot(x - s.x, y - s.y) <= TARGET_RADIUS + 6) {
        statsRef.current.s2Hits += 1;
        s2IndexRef.current += 1;
        if (s2IndexRef.current >= s2ShotsRef.current.length) {
          finishStage2();
        } else {
          armS2();
        }
      }
      return;
    }
    if (stage === "s3") {
      const now = performance.now();
      const t = now - s3StartRef.current;
      // find shot currently visible under cursor
      const hit = s3ShotsRef.current.find((s) => {
        if (!s.visibleFor) return false;
        const on = t > (s.after ?? 0) && t < (s.after ?? 0) + s.visibleFor;
        return on && Math.hypot(x - s.x, y - s.y) <= TARGET_RADIUS + 6;
      });
      if (!hit) return;
      if (hit.kind === "red") statsRef.current.s3Hits += 1;
      else statsRef.current.s3Wrong += 1;
      hit.visibleFor = 0; // consumed
      return;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-text">🗓️ Daily Gauntlet</h2>
          <p className="text-sm text-text-muted">
            Seed <span className="font-mono text-text">{label}</span> · same puzzle for every player today
          </p>
        </div>
        {phase === "idle" && (
          <Button onClick={begin} variant="primary">Begin</Button>
        )}
      </div>

      <div className="mb-3 flex items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded-md bg-primary/15 text-primary font-semibold">
          {displayPoints} pts
        </span>
        {phase === "playing" && stageRef.current === "s1" && <span className="text-text-muted">Stage 1 · Flick · {s1IndexRef.current}/10</span>}
        {phase === "playing" && stageRef.current === "s2" && <span className="text-text-muted">Stage 2 · Peek · {s2IndexRef.current}/8</span>}
        {phase === "playing" && stageRef.current === "s3" && <span className="text-text-muted">Stage 3 · RED only — don't click blue</span>}
      </div>

      <div
        ref={wrapRef}
        className="relative w-full rounded-2xl overflow-hidden border border-border bg-surface"
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block w-full cursor-crosshair bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]"
        />
        {stageLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-4xl font-black tracking-widest text-primary drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]">
              {stageLabel}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: In Stage 3, a clicked blue target subtracts points — read before you flick.
      </p>
    </div>
  );
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, kind: "red" | "blue") {
  const fill = kind === "red" ? "#ef4444" : "#3b82f6";
  const inner = kind === "red" ? "#fecaca" : "#bfdbfe";
  ctx.beginPath();
  ctx.arc(x, y, TARGET_RADIUS + 6, 0, Math.PI * 2);
  ctx.fillStyle = kind === "red" ? "rgba(239,68,68,0.18)" : "rgba(59,130,246,0.18)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, TARGET_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, TARGET_RADIUS * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = inner;
  ctx.fill();
}
