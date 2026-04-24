"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";

// Clutch 1v5 (ggLobby original): scripted 1v5 retake scenario. Five enemies
// peek one after another, each faster than the last. Misses and time pressure
// drain your HP. Survive with positive HP to clutch.

const START_HP = 100;
const ENEMY_COUNT = 5;
const MISS_DAMAGE = 18;
const SLOW_DAMAGE_PER_MS = 0.028; // HP lost per ms enemy is exposed
const TARGET_RADIUS = 30;

interface EnemyScript {
  visibleFor: number;
  delayBefore: number;
  position: { x: number; y: number };
}

type Phase = "idle" | "intro" | "fighting" | "done";

interface Props {
  onComplete: (r: AimResult) => void;
}

export function ClutchMode({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 800, h: 500 });
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  const hpRef = useRef(START_HP);
  const enemyRef = useRef<{ x: number; y: number; shownAt: number; hidesAt: number } | null>(null);
  const killsRef = useRef(0);
  const scriptRef = useRef<EnemyScript[]>([]);
  const enemyIndexRef = useRef(0);
  const totalDamageTakenRef = useRef(0);
  const finishedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [hp, setHp] = useState(START_HP);
  const [kills, setKills] = useState(0);
  const [introText, setIntroText] = useState("");
  const [heartbeat, setHeartbeat] = useState(false);
  const [flash, setFlash] = useState<"hit" | "miss" | "dmg" | null>(null);

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

    // pressure vignette — strength tied to current HP
    const danger = 1 - hpRef.current / START_HP;
    if (danger > 0) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.6);
      grad.addColorStop(0, "rgba(239,68,68,0)");
      grad.addColorStop(1, `rgba(239,68,68,${0.1 + danger * 0.35})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // site outline
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.1, h * 0.15, w * 0.8, h * 0.7);

    // spike icon center
    ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, h / 2 + 14);
    ctx.lineTo(w / 2 + 10, h / 2 + 14);
    ctx.lineTo(w / 2, h / 2 - 14);
    ctx.closePath();
    ctx.fill();

    // enemy
    const enemy = enemyRef.current;
    if (enemy && phase === "fighting") {
      const age = performance.now() - enemy.shownAt;
      const left = enemy.hidesAt - performance.now();
      const fade = Math.min(1, age / 90);
      const exit = left < 140 ? Math.max(0, left / 140) : 1;
      ctx.globalAlpha = fade * exit;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, TARGET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, TARGET_RADIUS * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fecaca";
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, [phase]);

  const loop = useCallback(() => {
    // passive damage while enemy is visible and alive
    const enemy = enemyRef.current;
    if (enemy && phase === "fighting") {
      const now = performance.now();
      const dt = now - (enemyRef.current as unknown as { _last?: number })._last!;
      (enemyRef.current as unknown as { _last?: number })._last = now;
      if (!isNaN(dt) && dt > 0 && dt < 100) {
        const loss = dt * SLOW_DAMAGE_PER_MS;
        hpRef.current = Math.max(0, hpRef.current - loss);
        totalDamageTakenRef.current += loss;
        setHp(Math.round(hpRef.current));
        if (hpRef.current <= 0) {
          finish();
        }
      }
    }
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, phase]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimers();
    enemyRef.current = null;
    const finalHp = Math.max(0, Math.round(hpRef.current));
    const finalKills = killsRef.current;
    setPhase("done");
    setTimeout(() => {
      const survived = finalKills >= ENEMY_COUNT && finalHp > 0;
      onComplete({
        mode: "clutch",
        score: finalHp,
        label: survived ? `Clutched with ${finalHp} HP` : `${finalKills}/${ENEMY_COUNT} down`,
        detail: survived
          ? `1v${ENEMY_COUNT} clutched — took ${Math.round(totalDamageTakenRef.current)} dmg`
          : `Died after ${finalKills} kill${finalKills === 1 ? "" : "s"}`,
        playedAt: Date.now(),
      });
    }, 500);
  }, [onComplete]);

  const spawnNextEnemy = useCallback(() => {
    const script = scriptRef.current;
    const idx = enemyIndexRef.current;
    if (idx >= script.length) {
      finish();
      return;
    }
    const s = script[idx];
    const id = window.setTimeout(() => {
      const e = {
        x: s.position.x,
        y: s.position.y,
        shownAt: performance.now(),
        hidesAt: performance.now() + s.visibleFor,
      };
      (e as unknown as { _last?: number })._last = performance.now();
      enemyRef.current = e;

      const hid = window.setTimeout(() => {
        // enemy got away — that's a miss
        if (enemyRef.current === e) {
          hpRef.current = Math.max(0, hpRef.current - MISS_DAMAGE);
          totalDamageTakenRef.current += MISS_DAMAGE;
          setHp(Math.round(hpRef.current));
          setFlash("dmg");
          setTimeout(() => setFlash(null), 180);
          enemyRef.current = null;
          enemyIndexRef.current += 1;
          if (hpRef.current <= 0) finish();
          else spawnNextEnemy();
        }
      }, s.visibleFor);
      timersRef.current.push(hid);
    }, s.delayBefore);
    timersRef.current.push(id);
  }, [finish]);

  const buildScript = useCallback(() => {
    const { w, h } = sizeRef.current;
    const positions = [
      { x: w * 0.22, y: h * 0.35 },
      { x: w * 0.78, y: h * 0.42 },
      { x: w * 0.45, y: h * 0.75 },
      { x: w * 0.85, y: h * 0.22 },
      { x: w * 0.15, y: h * 0.78 },
    ];
    scriptRef.current = positions.map((p, i) => ({
      position: p,
      delayBefore: i === 0 ? 900 : 500 + Math.random() * 350,
      visibleFor: Math.max(440, 900 - i * 95),
    }));
  }, []);

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

  const begin = async () => {
    clearTimers();
    finishedRef.current = false;
    hpRef.current = START_HP;
    setHp(START_HP);
    killsRef.current = 0;
    setKills(0);
    totalDamageTakenRef.current = 0;
    enemyIndexRef.current = 0;
    enemyRef.current = null;
    buildScript();

    setPhase("intro");
    const lines = ["POST-PLANT · A SITE", "5 ENEMIES INCOMING", "HOLD THE LINE"];
    for (let i = 0; i < lines.length; i++) {
      setIntroText(lines[i]);
      await new Promise((r) => {
        const id = window.setTimeout(r, 700);
        timersRef.current.push(id);
      });
    }
    setIntroText("");
    setHeartbeat(true);
    setPhase("fighting");
    spawnNextEnemy();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "fighting") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const enemy = enemyRef.current;
    if (!enemy) {
      // whiffing between enemies also hurts
      hpRef.current = Math.max(0, hpRef.current - 6);
      totalDamageTakenRef.current += 6;
      setHp(Math.round(hpRef.current));
      setFlash("miss");
      setTimeout(() => setFlash(null), 140);
      if (hpRef.current <= 0) finish();
      return;
    }
    const hit = Math.hypot(x - enemy.x, y - enemy.y) <= TARGET_RADIUS + 4;
    if (hit) {
      killsRef.current += 1;
      setKills(killsRef.current);
      enemyRef.current = null;
      enemyIndexRef.current += 1;
      setFlash("hit");
      setTimeout(() => setFlash(null), 120);
      if (killsRef.current >= ENEMY_COUNT) {
        finish();
      } else {
        spawnNextEnemy();
      }
    } else {
      hpRef.current = Math.max(0, hpRef.current - MISS_DAMAGE);
      totalDamageTakenRef.current += MISS_DAMAGE;
      setHp(Math.round(hpRef.current));
      setFlash("miss");
      setTimeout(() => setFlash(null), 140);
      if (hpRef.current <= 0) finish();
    }
  };

  const hpPct = (hp / START_HP) * 100;
  const hpColor =
    hpPct > 60 ? "bg-success" : hpPct > 30 ? "bg-warning" : "bg-error";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-text">🩸 Clutch 1v5</h2>
          <p className="text-sm text-text-muted">
            {phase === "idle"
              ? "One life. Five enemies. Try not to panic."
              : phase === "done"
              ? "Round over."
              : `${kills}/${ENEMY_COUNT} down · HP ${hp}`}
          </p>
        </div>
        {phase === "idle" && (
          <Button onClick={begin} variant="primary">Begin</Button>
        )}
      </div>

      {/* HP bar */}
      <div className="mb-3">
        <div className="h-3 w-full rounded-full bg-surface-light overflow-hidden border border-border">
          <div
            className={`h-full ${hpColor} transition-all duration-200 ${heartbeat && hpPct < 40 ? "animate-pulse" : ""}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      <div
        ref={wrapRef}
        className={`relative w-full rounded-2xl overflow-hidden border transition-colors ${
          flash === "dmg" || flash === "miss"
            ? "border-error bg-error/10"
            : flash === "hit"
            ? "border-success/60"
            : "border-border bg-surface"
        }`}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block w-full cursor-crosshair"
        />
        {introText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-4xl font-black tracking-widest text-error drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
              {introText}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: The clock is the sixth enemy. Take clean shots — whiffs cost HP.
      </p>
    </div>
  );
}
