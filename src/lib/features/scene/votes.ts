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

// Cached snapshots. useSyncExternalStore compares snapshots with Object.is, so
// getSnapshot MUST return a stable reference between changes. readJSON parses
// fresh on every call (a new object each time), which made React think the
// store changed on every render → "getSnapshot should be cached" infinite loop.
// Cache the parsed value and only recompute it when a change event fires.
let tallyCache: Tally | null = null;
let userCache: UserVotes | null = null;

function refreshSnapshots() {
  tallyCache = readJSON<Tally>(TALLY_KEY, {});
  userCache = readJSON<UserVotes>(USER_KEY, {});
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    refreshSnapshots();
    cb();
  };
  window.addEventListener("scene-votes-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("scene-votes-changed", handler);
    window.removeEventListener("storage", handler);
  };
}

function getTallySnapshot(): Tally {
  if (tallyCache === null) tallyCache = readJSON<Tally>(TALLY_KEY, {});
  return tallyCache;
}
function getUserSnapshot(): UserVotes {
  if (userCache === null) userCache = readJSON<UserVotes>(USER_KEY, {});
  return userCache;
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
