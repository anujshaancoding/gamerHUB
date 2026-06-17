// Verify the realtime hub locally (against `wrangler dev` on :8787): signs an
// HMAC handshake token like the app does, opens a WebSocket, and checks the
// connect + echo round-trip — plus that a bad token is rejected.
//
//   AUTH_SECRET must match the worker's. Run with:
//     node --env-file=.dev.vars verify-ws.mjs

import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET;
const PORT = process.env.PORT || 8787;
if (!SECRET) {
  console.error("AUTH_SECRET not set (expected from .dev.vars)");
  process.exit(1);
}

const b64url = (buf) =>
  buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");

function signToken(uid, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(Buffer.from(JSON.stringify({ uid, iat: now, exp: now + ttl })));
  const sig = b64url(createHmac("sha256", SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}

function connect(token, label) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws?token=${token}`);
    const result = { label, opened: false, connected: false, echo: false };
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      resolve(result);
    }, 6000);

    ws.onopen = () => { result.opened = true; };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "connected") {
        result.connected = msg.userId;
        ws.send("ping-123");
      } else if (msg.type === "echo") {
        result.echo = msg.data === "ping-123";
        clearTimeout(timer);
        try { ws.close(); } catch {}
        resolve(result);
      }
    };
    ws.onerror = () => { /* bad-token path closes the socket */ };
    ws.onclose = () => { clearTimeout(timer); resolve(result); };
  });
}

const good = await connect(signToken("test-user-123"), "valid token");
console.log("valid token  →", good);

const bad = await connect("garbage.token", "bad token");
console.log("bad token    →", bad);

const ok = good.connected === "test-user-123" && good.echo === true && bad.connected === false;
console.log(ok ? "\n✅ realtime hub: auth + WS echo verified (bad token rejected)" : "\n❌ verification failed");
process.exit(ok ? 0 : 1);
