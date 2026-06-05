// One-off cleanup: revoke "link_valorant" loyalty points that were granted by
// the old honor-system button (no real Riot account was ever linked).
//
// WHY this is safe to strip ALL of them: the Riot RSO env vars
// (RIOT_CLIENT_ID / RIOT_CLIENT_SECRET) were never configured, so until now it
// was impossible for anyone to genuinely link a Valorant account. Every
// existing `link_valorant` event is therefore a self-reported fake. Genuine
// users can re-click "Link" on the giveaway page afterwards and instantly get
// the points back — the server now verifies a real game_connections row.
//
// Usage (run on the VPS where loyalty.json lives):
//   node scripts/reset-valorant-link-points.mjs            # dry run (prints only)
//   node scripts/reset-valorant-link-points.mjs --apply    # writes changes
//
// Honors UPLOAD_DIR (defaults to ./uploads), same as the app.

import { readFile, writeFile, copyFile } from "fs/promises";
import { resolve } from "path";

const APPLY = process.argv.includes("--apply");
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || "./uploads");
const STORE_PATH = resolve(UPLOAD_DIR, "data/loyalty.json");

function main(store) {
  let usersTouched = 0;
  let eventsRemoved = 0;
  let pointsRevoked = 0;

  for (const rec of Object.values(store)) {
    if (!rec || !Array.isArray(rec.events)) continue;
    const before = rec.events.length;
    const removed = rec.events.filter((e) => e.action === "link_valorant");
    if (removed.length === 0) continue;

    const revoked = removed.reduce((sum, e) => sum + (e.points || 0), 0);
    rec.events = rec.events.filter((e) => e.action !== "link_valorant");
    rec.points = Math.max(0, (rec.points || 0) - revoked);

    usersTouched++;
    eventsRemoved += before - rec.events.length;
    pointsRevoked += revoked;
    console.log(
      `  ${rec.userId} (${rec.name ?? "?"}): -${revoked} pts, now ${rec.points}`
    );
  }

  return { usersTouched, eventsRemoved, pointsRevoked };
}

try {
  const raw = await readFile(STORE_PATH, "utf8");
  const store = JSON.parse(raw);

  console.log(`Store: ${STORE_PATH}`);
  console.log(`Mode:  ${APPLY ? "APPLY (will write)" : "DRY RUN"}\n`);

  const { usersTouched, eventsRemoved, pointsRevoked } = main(store);

  console.log(
    `\n${usersTouched} user(s), ${eventsRemoved} event(s), ${pointsRevoked} point(s) revoked.`
  );

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to commit.");
  } else if (usersTouched > 0) {
    await copyFile(STORE_PATH, `${STORE_PATH}.bak`);
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    console.log(`\nBackup saved to ${STORE_PATH}.bak — changes written.`);
  } else {
    console.log("\nNothing to change.");
  }
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(`No store at ${STORE_PATH} — nothing to do.`);
  } else {
    console.error("Failed:", err.message);
    process.exit(1);
  }
}
