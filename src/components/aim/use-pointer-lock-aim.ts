"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { getSensitivity, onSensitivityChange } from "./sensitivity";

/**
 * Pointer-lock based virtual cursor, shared by aim modes.
 *
 * - Clicking the wrap requests pointer lock
 * - Mouse movements (raw movementX/Y) drive a virtual cursor, scaled by the
 *   global ggLobby sensitivity multiplier
 * - Crosshair is drawn at the virtual cursor position via drawCrosshair(ctx)
 * - getPosition() returns the current virtual cursor in canvas CSS coordinates
 * - ESC unlocks (standard browser behavior). Falls back to raw mouse coords
 *   when not locked, so taps / touch still work on mobile.
 */
export function usePointerLockAim(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  wrapRef: RefObject<HTMLDivElement | null>,
  sizeRef: RefObject<{ w: number; h: number }>,
) {
  const posRef = useRef({ x: 400, y: 250 });
  const sensRef = useRef(1);
  const [locked, setLocked] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    sensRef.current = getSensitivity();
    return onSensitivityChange(() => {
      sensRef.current = getSensitivity();
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setSupported(typeof document.documentElement.requestPointerLock === "function");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onLockChange = () => {
      setLocked(document.pointerLockElement === canvas);
    };
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockChange);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockChange);
    };
  }, [canvasRef]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const size = sizeRef.current;
      if (!size) return;
      if (document.pointerLockElement === canvasRef.current) {
        const s = sensRef.current;
        posRef.current.x = clamp(posRef.current.x + e.movementX * s, 0, size.w);
        posRef.current.y = clamp(posRef.current.y + e.movementY * s, 0, size.h);
      } else if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        posRef.current.x = clamp(e.clientX - rect.left, 0, size.w);
        posRef.current.y = clamp(e.clientY - rect.top, 0, size.h);
      }
    };
    const onTouch = (e: TouchEvent) => {
      const size = sizeRef.current;
      const canvas = canvasRef.current;
      if (!size || !canvas) return;
      const t = e.touches[0] || e.changedTouches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      posRef.current.x = clamp(t.clientX - rect.left, 0, size.w);
      posRef.current.y = clamp(t.clientY - rect.top, 0, size.h);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [canvasRef, sizeRef]);

  const requestLock = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !supported) return;
    try {
      canvas.requestPointerLock();
    } catch {
      /* some browsers throw if called outside user gesture */
    }
  }, [canvasRef, supported]);

  const center = useCallback(() => {
    const size = sizeRef.current;
    if (size) {
      posRef.current.x = size.w / 2;
      posRef.current.y = size.h / 2;
    }
  }, [sizeRef]);

  const getPosition = useCallback(() => ({ ...posRef.current }), []);

  const drawCrosshair = useCallback((ctx: CanvasRenderingContext2D) => {
    // Only draw our custom crosshair when pointer is locked (cursor hidden).
    // When not locked, the browser cursor suffices.
    if (!document || document.pointerLockElement !== canvasRef.current) return;
    const { x, y } = posRef.current;
    ctx.save();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y); ctx.lineTo(x - 3, y);
    ctx.moveTo(x + 3, y); ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10); ctx.lineTo(x, y - 3);
    ctx.moveTo(x, y + 3); ctx.lineTo(x, y + 10);
    ctx.stroke();
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [canvasRef]);

  return {
    locked,
    supported,
    requestLock,
    center,
    getPosition,
    drawCrosshair,
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
