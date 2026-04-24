"use client";

import type { AimModeId, AimResult } from "./types";
import { MODE_BY_ID } from "./types";

const KEY = "gglobby:aim:bests:v1";

type BestsMap = Partial<Record<AimModeId, AimResult>>;

function read(): BestsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as BestsMap;
    return {};
  } catch {
    return {};
  }
}

function write(bests: BestsMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bests));
  } catch {
    /* storage full / disabled — silently ignore */
  }
}

export function getBests(): BestsMap {
  return read();
}

export function getBest(mode: AimModeId): AimResult | undefined {
  return read()[mode];
}

export function submitResult(result: AimResult): { isNewBest: boolean; previous?: AimResult } {
  const bests = read();
  const existing = bests[result.mode];
  const meta = MODE_BY_ID[result.mode];

  let isNewBest = false;
  if (!existing) {
    isNewBest = true;
  } else if (meta.higherIsBetter) {
    isNewBest = result.score > existing.score;
  } else {
    isNewBest = result.score < existing.score;
  }

  if (isNewBest) {
    bests[result.mode] = result;
    write(bests);
  }

  return { isNewBest, previous: existing };
}

export function clearAllBests() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
