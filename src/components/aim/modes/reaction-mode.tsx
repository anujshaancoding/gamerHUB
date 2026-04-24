"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { AimResult } from "../types";

const ROUNDS = 5;

type Phase = "idle" | "waiting" | "go" | "tooEarly" | "done";

interface Props {
  onComplete: (r: AimResult) => void;
}

export function ReactionMode({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const startRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const mouseDownRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleGo = useCallback(() => {
    setPhase("waiting");
    const delay = 900 + Math.random() * 2300;
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase("go");
    }, delay);
  }, []);

  useEffect(() => () => clearTimer(), []);

  const begin = () => {
    setRound(0);
    setTimes([]);
    setLastTime(null);
    scheduleGo();
  };

  const handlePress = (e: React.PointerEvent | React.MouseEvent) => {
    e.preventDefault();
    if (mouseDownRef.current) return; // ignore key-repeat / double-fire
    mouseDownRef.current = true;
    if (phase === "waiting") {
      clearTimer();
      setPhase("tooEarly");
      return;
    }
    if (phase === "tooEarly") {
      scheduleGo();
      return;
    }
    if (phase === "go") {
      const reaction = Math.round(performance.now() - startRef.current);
      setLastTime(reaction);
      const next = [...times, reaction];
      setTimes(next);
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= ROUNDS) {
        const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
        const best = Math.min(...next);
        setPhase("done");
        setTimeout(() => {
          onComplete({
            mode: "reaction",
            score: avg,
            label: `${avg}ms average`,
            detail: `Best: ${best}ms · ${next.map((t) => `${t}ms`).join(" · ")}`,
            playedAt: Date.now(),
          });
        }, 600);
        return;
      }
      scheduleGo();
      return;
    }
  };

  const bg =
    phase === "go"
      ? "bg-success"
      : phase === "tooEarly"
      ? "bg-error"
      : phase === "waiting"
      ? "bg-error/80"
      : "bg-surface-light";

  const label =
    phase === "idle"
      ? "Click Start when ready"
      : phase === "waiting"
      ? "Wait for green…"
      : phase === "go"
      ? "CLICK!"
      : phase === "tooEarly"
      ? "Too early! Click to retry round"
      : "Nice shooting.";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-text">⚡ Reaction</h2>
          <p className="text-sm text-text-muted">
            Round {Math.min(round + 1, ROUNDS)} of {ROUNDS}
            {lastTime !== null && phase !== "tooEarly" ? ` · Last: ${lastTime}ms` : ""}
          </p>
        </div>
        {phase === "idle" && (
          <Button onClick={begin} variant="primary">Start</Button>
        )}
      </div>

      <button
        onPointerDown={handlePress}
        onPointerUp={() => { mouseDownRef.current = false; }}
        onPointerCancel={() => { mouseDownRef.current = false; }}
        disabled={phase === "idle" || phase === "done"}
        className={`w-full h-[60vh] min-h-[320px] rounded-2xl border border-border flex items-center justify-center text-2xl sm:text-4xl font-bold text-white select-none touch-none ${bg} ${phase === "idle" ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        {label}
      </button>

      <p className="text-xs text-text-muted mt-3 text-center">
        Tip: Don't pre-click. The trap round punishes early fingers.
      </p>
    </div>
  );
}
