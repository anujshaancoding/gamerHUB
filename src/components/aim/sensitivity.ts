"use client";

// ggLobby sensitivity = raw multiplier applied to pointer-lock movementX/Y.
// 1.0  → 1 CSS pixel of virtual cursor movement per 1 pixel of mouse movement
// 0.5  → half as sensitive (need twice the mouse distance)
// 2.0  → twice as sensitive
//
// For matching a game feel, we use the same intuition as real sens converters:
// pixels-per-360° should map to counts-per-360° given the user's DPI.
// We give the user a simple "what's your sens in X game" helper that outputs a
// ggLobby multiplier that "feels" the same at the default 800 DPI assumption.

const KEY = "gglobby:aim:sens:v1";
const DEFAULT_SENS = 1.0;

export function getSensitivity(): number {
  if (typeof window === "undefined") return DEFAULT_SENS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SENS;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_SENS;
    return clamp(n, 0.05, 10);
  } catch {
    return DEFAULT_SENS;
  }
}

export function setSensitivity(sens: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(clamp(sens, 0.05, 10)));
    window.dispatchEvent(new CustomEvent("gglobby-aim-sens-change"));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function onSensitivityChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("gglobby-aim-sens-change", cb);
  return () => window.removeEventListener("gglobby-aim-sens-change", cb);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Game sensitivity converters ──────────────────────────────────────
//
// These are approximate. They translate a game's in-game sensitivity into a
// ggLobby multiplier that produces *similar* cursor travel per mouse movement
// at 800 DPI. Users should tune by feel — these just give a starting point.
//
// Reference cm/360 @ 800 DPI:
//   Valorant sens 0.3 → ~53 cm/360
//   CS2/CSGO sens 2.0 → ~38 cm/360
//   Apex/Fortnite ADS vary a lot; we approximate from hipfire

export interface GameConverter {
  id: string;
  label: string;
  hint: string;
  toGGLobby: (inGameSens: number) => number;
  fromGGLobby: (gglobbySens: number) => number;
}

// Calibration: at sens 1.0 ggLobby, moving the mouse 1 cm at 800 DPI moves the
// cursor about 315 px. That means ~315 px per cm. For ggLobby's default canvas
// of ~900 px wide, one full "sweep" = 900/315 ≈ 2.85 cm.
// We pick 40 cm/360 as the neutral ggLobby reference; sens 1.0 ≈ 40 cm/360.
const GGLOBBY_REFERENCE_CM360 = 40;

function cm360ToGGLobby(cm360: number): number {
  // lower cm/360 = higher sensitivity
  return round2(GGLOBBY_REFERENCE_CM360 / cm360);
}
function gglobbyToCm360(sens: number): number {
  return round2(GGLOBBY_REFERENCE_CM360 / sens);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export const GAME_CONVERTERS: GameConverter[] = [
  {
    id: "valorant",
    label: "Valorant",
    hint: "Your in-game Sensitivity (e.g. 0.3)",
    // Valorant: cm/360 @ 800 DPI ≈ 15.876 / valorantSens
    toGGLobby: (v) => cm360ToGGLobby(15.876 / v),
    fromGGLobby: (g) => round2(15.876 / gglobbyToCm360(g)),
  },
  {
    id: "cs2",
    label: "CS2 / CSGO",
    hint: "Your in-game Sensitivity (e.g. 2.0)",
    // CS2: cm/360 @ 800 DPI ≈ 76.2 / csSens
    toGGLobby: (v) => cm360ToGGLobby(76.2 / v),
    fromGGLobby: (g) => round2(76.2 / gglobbyToCm360(g)),
  },
  {
    id: "apex",
    label: "Apex Legends",
    hint: "Your in-game Sensitivity (e.g. 2.5)",
    // Apex (per-optic 1.0): ~73 / sens @ 800 DPI
    toGGLobby: (v) => cm360ToGGLobby(73 / v),
    fromGGLobby: (g) => round2(73 / gglobbyToCm360(g)),
  },
  {
    id: "fortnite",
    label: "Fortnite",
    hint: "Your X sensitivity (e.g. 0.08)",
    // Fortnite: cm/360 @ 800 DPI ≈ 12.7 / sens (rough)
    toGGLobby: (v) => cm360ToGGLobby(12.7 / v),
    fromGGLobby: (g) => round2(12.7 / gglobbyToCm360(g)),
  },
  {
    id: "bgmi",
    label: "BGMI (mouse on emulator)",
    hint: "Your camera sensitivity (1–200 scale)",
    // Emulator mouse: very rough — treat 100 as baseline 40cm/360
    toGGLobby: (v) => cm360ToGGLobby(40 * (100 / Math.max(1, v))),
    fromGGLobby: (g) => round2(100 / (gglobbyToCm360(g) / 40)),
  },
];
