// Verify Cloudflare R2 connectivity, credentials, and the bucket — and
// auto-discover the bucket name (the provided keys don't include it).
//
// Run with Node's env-file loader so it sees .env.local:
//   node --env-file=.env.local infra/verify-r2.mjs
//
// Does: ListBuckets (discover name) -> PUT a tiny object -> GET it back and
// compare bytes -> DELETE it. Prints what to set R2_BUCKET to.

import { AwsClient } from "aws4fetch";

const endpoint = (process.env.R2_ENDPOINT || "").replace(/\/+$/, "");
if (!endpoint || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY in env.");
  process.exit(1);
}

const client = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: "auto",
  service: "s3",
});

// 1. ListBuckets — best-effort. Bucket-scoped tokens (the secure default)
// return 403 here; that's fine as long as R2_BUCKET is set.
const listRes = await client.fetch(`${endpoint}/`, { method: "GET" });
const listXml = await listRes.text();
const buckets = [...listXml.matchAll(/<Name>([^<]+)<\/Name>/g)].map((m) => m[1]);
console.log(
  "ListBuckets:",
  listRes.status,
  listRes.ok ? `OK (${buckets.join(", ") || "none"})` : "403 — bucket-scoped token (expected)"
);

const bucket = process.env.R2_BUCKET || buckets[0];
if (!bucket) {
  console.error("No R2_BUCKET set and token can't list buckets — set R2_BUCKET in .env.local.");
  process.exit(1);
}
console.log("Using bucket:", bucket, process.env.R2_BUCKET ? "(from env)" : "(auto-discovered)");

// 2. Round-trip a tiny object.
const key = "_healthcheck/verify.txt";
const url = `${endpoint}/${bucket}/${key}`;
const body = `r2-verify ${new Date().toISOString()}`;

const put = await client.fetch(url, {
  method: "PUT",
  body,
  headers: { "Content-Type": "text/plain" },
});
console.log("PUT   :", put.status, put.ok ? "OK" : "FAILED");

const get = await client.fetch(url, { method: "GET" });
const got = get.ok ? await get.text() : "";
console.log("GET   :", get.status, get.ok && got === body ? "OK (bytes match)" : "FAILED");

const del = await client.fetch(url, { method: "DELETE" });
console.log("DELETE:", del.status, del.ok ? "OK" : "FAILED");

const ok = put.ok && get.ok && got === body && del.ok;
console.log(ok ? `\n✅ R2 verified. Set R2_BUCKET=${bucket} in .env.local` : "\n❌ R2 round-trip failed");
process.exit(ok ? 0 : 1);
