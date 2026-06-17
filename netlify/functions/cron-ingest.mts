// Netlify scheduled function — nightly pro-stats ingest.
// Calls the Bearer-protected /api/cron/ingest route (direct vlr.gg scrape).
// Configure CRON_SECRET in the Netlify env (same value the route checks).

import type { Config } from "@netlify/functions";

export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    return new Response("missing URL or CRON_SECRET", { status: 500 });
  }
  const res = await fetch(`${base}/api/cron/ingest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  return new Response(`ingest -> ${res.status} ${await res.text()}`, { status: res.ok ? 200 : 502 });
};

// 03:00 UTC daily.
export const config: Config = { schedule: "0 3 * * *" };
