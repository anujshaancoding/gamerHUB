// Netlify scheduled function — nightly retention/prune sweep.
// Calls the Bearer-protected /api/cron/prune route (operational tables only).

import type { Config } from "@netlify/functions";

export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    return new Response("missing URL or CRON_SECRET", { status: 500 });
  }
  const res = await fetch(`${base}/api/cron/prune`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  return new Response(`prune -> ${res.status} ${await res.text()}`, { status: res.ok ? 200 : 502 });
};

// 04:00 UTC daily (after ingest).
export const config: Config = { schedule: "0 4 * * *" };
