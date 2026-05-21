// ggLobby V2 — loyalty / giveaway engine (SERVER ONLY — uses fs).
//
// Points are stored in a JSON file on the upload volume (same pattern as
// lineups) so this is fully functional WITHOUT the VPS database. For
// production scale this should move to Postgres, but the API surface here
// stays the same so the swap is isolated.
//
// Client components must import from "./constants" instead — importing this
// file from the client bundles `fs` and breaks the build.

import { readFile, writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import {
  type LoyaltyAction,
  type LoyaltyRecord,
  ACTION_POINTS,
  ONE_TIME,
  tierFor,
} from "./constants";

export {
  ACTION_POINTS,
  ACTION_LABEL,
  TIERS,
  tierFor,
} from "./constants";
export type {
  LoyaltyAction,
  LoyaltyEvent,
  LoyaltyRecord,
} from "./constants";

const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./uploads");
const STORE_PATH = resolve(UPLOAD_DIR, "data/loyalty.json");

type Store = Record<string, LoyaltyRecord>;

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function refCodeFor(userId: string) {
  return userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase() || "gg";
}

function ensureRecord(
  store: Store,
  userId: string,
  name: string,
  image?: string | null
): LoyaltyRecord {
  if (!store[userId]) {
    store[userId] = {
      userId,
      name,
      image,
      points: 0,
      events: [],
      referralCode: refCodeFor(userId),
      updatedAt: new Date().toISOString(),
    };
  } else {
    store[userId].name = name || store[userId].name;
    if (image) store[userId].image = image;
  }
  return store[userId];
}

function applyAction(
  rec: LoyaltyRecord,
  action: LoyaltyAction,
  key: string
): boolean {
  if (rec.events.some((e) => e.key === key)) return false;
  if (ONE_TIME.includes(action) && rec.events.some((e) => e.action === action))
    return false;
  const points = ACTION_POINTS[action];
  rec.events.push({ action, points, at: new Date().toISOString(), key });
  rec.points += points;
  rec.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Called on every authenticated loyalty fetch — grants signup once and the
 * daily check-in (idempotent by date).
 */
export async function syncUser(user: {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}): Promise<LoyaltyRecord> {
  const store = await readStore();
  const name = user.name || user.email.split("@")[0];
  const rec = ensureRecord(store, user.id, name, user.image);

  applyAction(rec, "signup", "signup");
  const today = new Date().toISOString().slice(0, 10);
  applyAction(rec, "daily_login", `daily_login:${today}`);

  await writeStore(store);
  return rec;
}

export async function awardAction(
  userId: string,
  action: Exclude<LoyaltyAction, "signup" | "daily_login">
): Promise<{ awarded: boolean; record: LoyaltyRecord | null }> {
  const store = await readStore();
  const rec = store[userId];
  if (!rec) return { awarded: false, record: null };
  const key = action === "share_rank_card" ? `${action}:once` : action;
  const awarded = applyAction(rec, action, key);
  if (awarded) await writeStore(store);
  return { awarded, record: rec };
}

/** Records that `userId` was referred by the owner of `referralCode`. */
export async function applyReferral(
  userId: string,
  referralCode: string
): Promise<boolean> {
  const store = await readStore();
  const newUser = store[userId];
  if (!newUser || newUser.referredBy) return false;
  const referrer = Object.values(store).find(
    (r) => r.referralCode === referralCode && r.userId !== userId
  );
  if (!referrer) return false;
  newUser.referredBy = referrer.userId;
  applyAction(referrer, "refer", `refer:${userId}`);
  await writeStore(store);
  return true;
}

export async function getRecord(userId: string): Promise<LoyaltyRecord | null> {
  const store = await readStore();
  return store[userId] ?? null;
}

export async function getLeaderboard(limit = 50) {
  const store = await readStore();
  return Object.values(store)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((r, i) => ({
      rank: i + 1,
      name: r.name,
      image: r.image ?? null,
      points: r.points,
      tier: tierFor(r.points).name,
    }));
}
