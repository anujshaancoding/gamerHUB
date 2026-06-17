// Configure CORS on the R2 bucket so the browser can PUT directly to presigned
// URLs (video uploads) and GET assets. Run once:
//   node --env-file=.env.local infra/configure-r2-cors.mjs
//
// Needs an R2 token with bucket-config permission. If it returns AccessDenied,
// the token is object-only — set CORS in the Cloudflare dashboard instead
// (R2 > bucket > Settings > CORS Policy).

import { AwsClient } from "aws4fetch";
import { createHash } from "crypto";

const endpoint = (process.env.R2_ENDPOINT || "").replace(/\/+$/, "");
const bucket = process.env.R2_BUCKET;
if (!endpoint || !bucket || !process.env.R2_ACCESS_KEY_ID) {
  console.error("Missing R2 env (R2_ENDPOINT / R2_BUCKET / R2_ACCESS_KEY_ID).");
  process.exit(1);
}

const client = new AwsClient({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: "auto",
  service: "s3",
});

const body =
  "<CORSConfiguration><CORSRule>" +
  "<AllowedOrigin>https://gglobby.in</AllowedOrigin>" +
  "<AllowedOrigin>http://localhost:3000</AllowedOrigin>" +
  "<AllowedMethod>GET</AllowedMethod>" +
  "<AllowedMethod>PUT</AllowedMethod>" +
  "<AllowedHeader>*</AllowedHeader>" +
  "<ExposeHeader>ETag</ExposeHeader>" +
  "<MaxAgeSeconds>3600</MaxAgeSeconds>" +
  "</CORSRule></CORSConfiguration>";

const md5 = createHash("md5").update(body).digest("base64");

const put = await client.fetch(`${endpoint}/${bucket}?cors`, {
  method: "PUT",
  body,
  headers: { "Content-Type": "application/xml", "Content-MD5": md5 },
});
console.log("PutBucketCors:", put.status, put.ok ? "OK" : await put.text());

const get = await client.fetch(`${endpoint}/${bucket}?cors`, { method: "GET" });
console.log("GetBucketCors:", get.status);
if (get.ok) console.log(await get.text());

process.exit(put.ok ? 0 : 1);
