/**
 * Sensitivity conversion math.
 *
 * Most PC FPS games expose a per-game "sens" multiplier that, combined with
 * a fixed yaw constant, determines how many degrees of in-game rotation per
 * counted mouse-unit. Two games match in feel when their (sens × yaw × dpi)
 * products match — so converting between games is just:
 *
 *   target_sens = source_sens × (source_yaw / target_yaw)
 *
 * For mobile games the relationship is messier (each title uses its own
 * 0–200 / 0–100 scale per scope), so the mobile-to-mobile pairs in this
 * file are documented as approximations.
 */

export interface PcGame {
  id:
    | "valorant"
    | "cs2"
    | "apex"
    | "ow2"
    | "fortnite"
    | "r6"
    | "thefinals"
    | "deadlock";
  label: string;
  yaw: number;
  family: "pc";
  notes?: string;
}

export interface MobileGame {
  id: "bgmi" | "codm" | "freefire" | "pubgnewstate";
  label: string;
  /** Maximum value of the in-game sens slider */
  scaleMax: number;
  /**
   * Approximate equivalence multiplier to BGMI's 100% "Camera (Free Look)" sens.
   * If you find any number on BGMI's scale produces feel X, multiply by this
   * to land on the equivalent number on the target game's scale.
   */
  bgmiMultiplier: number;
  family: "mobile";
  notes?: string;
}

export type AnyGame = PcGame | MobileGame;

export const PC_GAMES: PcGame[] = [
  { id: "valorant", label: "Valorant",                yaw: 0.07,        family: "pc" },
  { id: "cs2",      label: "CS2 / CS:GO",             yaw: 0.022,       family: "pc" },
  { id: "apex",     label: "Apex Legends",            yaw: 0.022,       family: "pc", notes: "Assumes default mouse-input mode" },
  { id: "ow2",      label: "Overwatch 2",             yaw: 0.0066,      family: "pc" },
  { id: "thefinals",label: "The Finals",              yaw: 0.022,       family: "pc" },
  { id: "deadlock", label: "Deadlock",                yaw: 0.022,       family: "pc" },
  { id: "r6",       label: "Rainbow Six Siege",       yaw: 0.00572958,  family: "pc", notes: "Default 1.0× mouse input mode" },
  { id: "fortnite", label: "Fortnite (X/Y%)",         yaw: 0.5566 / 100,family: "pc", notes: "Translation is approximate — Fortnite uses a separate ADS multiplier" },
];

export const MOBILE_GAMES: MobileGame[] = [
  { id: "bgmi",         label: "BGMI",                scaleMax: 200, bgmiMultiplier: 1.0,   family: "mobile" },
  { id: "codm",         label: "COD: Mobile",         scaleMax: 200, bgmiMultiplier: 1.0,   family: "mobile", notes: "Same 0–200 slider as BGMI; multiplier is approximate" },
  { id: "pubgnewstate", label: "PUBG: New State",     scaleMax: 200, bgmiMultiplier: 0.95,  family: "mobile" },
  { id: "freefire",     label: "Free Fire",           scaleMax: 100, bgmiMultiplier: 0.55,  family: "mobile", notes: "Free Fire uses a 0–100 scale — math is a feel-based approximation" },
];

export function findGame(id: string): AnyGame | undefined {
  return [...PC_GAMES, ...MOBILE_GAMES].find((g) => g.id === id);
}

/**
 * Convert a PC sens value from one game to another.
 * Both games must be in the PC family.
 */
export function convertPcSens(
  sens: number,
  fromYaw: number,
  toYaw: number
): number {
  if (toYaw === 0) return 0;
  return sens * (fromYaw / toYaw);
}

/**
 * Convert a mobile sens value from one game to another (approximation).
 * Maps via the BGMI scale and clamps to the target game's scale max.
 */
export function convertMobileSens(
  sens: number,
  from: MobileGame,
  to: MobileGame
): number {
  // Normalise the input to "BGMI-equivalent"
  const asBgmi = (sens / from.scaleMax) * 200 / from.bgmiMultiplier;
  // Then project onto the target game
  const projected = (asBgmi * to.bgmiMultiplier * to.scaleMax) / 200;
  return Math.min(projected, to.scaleMax);
}

/**
 * cm/360° — the universal "feel" metric: how many real-world centimeters of
 * mouse movement produce a full 360° in-game rotation.
 *   counts/360 = 360 / yaw / sens
 *   cm/360     = counts/360 / dpi × 2.54
 */
export function cmPer360(sens: number, yaw: number, dpi: number): number {
  if (sens === 0 || yaw === 0 || dpi === 0) return 0;
  const countsPer360 = 360 / yaw / sens;
  return (countsPer360 / dpi) * 2.54;
}

/**
 * eDPI = sens × DPI. Standard quick-reference metric.
 */
export function eDPI(sens: number, dpi: number): number {
  return sens * dpi;
}
