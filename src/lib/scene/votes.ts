"use client";

// "Next to go pro" — community vote storage. localStorage MVP so the page
// ships without a DB migration; promote to a real table once traffic shows
// it's used. Two keys:
//   gg.scene.votes.v1       — per-slug tally seen by everyone (mocked: read from JSON below)
//   gg.scene.userVotes.v1   — the *current browser's* picks, so the UI shows checked state
//
// Tally is a local approximation — every visitor adds to their own counter.
// Good enough to demo the mechanic; replace with a server endpoint later.

import { useCallback, useEffect, useSyncExternalStore } from "react";

const TALLY_KEY = "gg.scene.votes.v1";
const USER_KEY = "gg.scene.userVotes.v1";

type Tally = Record<string, number>;
type UserVotes = Record<string, boolean>;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Fire a storage-like event so other components on the same tab refresh.
    window.dispatchEvent(new CustomEvent("scene-votes-changed"));
  } catch {
    // ignore quota/private-mode errors
  }
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("scene-votes-changed", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("scene-votes-changed", cb);
    window.removeEventListener("storage", cb);
  };
}

function getTallySnapshot(): Tally {
  return readJSON<Tally>(TALLY_KEY, {});
}
function getUserSnapshot(): UserVotes {
  return readJSON<UserVotes>(USER_KEY, {});
}

// SSR-safe snapshot — keeps useSyncExternalStore happy.
const EMPTY: Tally = {};
const EMPTY_USER: UserVotes = {};

export function useSceneVotes() {
  const tally = useSyncExternalStore(
    subscribe,
    getTallySnapshot,
    () => EMPTY
  );
  const user = useSyncExternalStore(
    subscribe,
    getUserSnapshot,
    () => EMPTY_USER
  );

  // One-time seed so the leaderboard is not empty on first visit. Idempotent.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(TALLY_KEY)) return;
    const seed: Tally = {
      "gods-reign-roster": 184,
      "leosun-hybr1d": 142,
      "xcrew-lightningfast": 118,
      "asterisk-roster": 96,
      "rad-paradox": 74,
      "xcrew-hellff": 58,
      "leosun-acestar": 41,
      "rad-tricky": 27,
    };
    writeJSON(TALLY_KEY, seed);
  }, []);

  const toggle = useCallback((slug: string) => {
    const currentTally = getTallySnapshot();
    const currentUser = getUserSnapshot();
    const alreadyVoted = !!currentUser[slug];
    const nextTally = { ...currentTally };
    const nextUser = { ...currentUser };
    if (alreadyVoted) {
      nextTally[slug] = Math.max(0, (nextTally[slug] ?? 1) - 1);
      delete nextUser[slug];
    } else {
      nextTally[slug] = (nextTally[slug] ?? 0) + 1;
      nextUser[slug] = true;
    }
    writeJSON(TALLY_KEY, nextTally);
    writeJSON(USER_KEY, nextUser);
  }, []);

  return { tally, user, toggle };
}
