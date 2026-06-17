// Verify the realtime hub locally (against `wrangler dev` on :8787). Exercises
// auth, presence broadcast, room join + /emit fan-out, typing (sender excluded),
// and bad-token rejection. Two simulated clients.
//
//   node --env-file=.dev.vars verify-ws.mjs

import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET;
const PORT = process.env.PORT || 8787;
const BASE = `127.0.0.1:${PORT}`;
if (!SECRET) {
  console.error("AUTH_SECRET not set (expected from .dev.vars)");
  process.exit(1);
}

const b64url = (b) => b.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
function signToken(uid, ttl = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(Buffer.from(JSON.stringify({ uid, iat: now, exp: now + ttl })));
  const sig = b64url(createHmac("sha256", SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function client(uid) {
  const ws = new WebSocket(`ws://${BASE}/ws?token=${signToken(uid)}`);
  const msgs = [];
  ws.onmessage = (e) => msgs.push(JSON.parse(e.data));
  const ready = new Promise((res, rej) => {
    ws.onopen = () => res();
    ws.onerror = () => rej(new Error("ws error"));
    ws.onclose = () => rej(new Error("closed"));
  });
  return {
    ws,
    msgs,
    ready,
    send: (o) => ws.send(JSON.stringify(o)),
    has: (type, pred = () => true) => msgs.some((m) => m.type === type && pred(m)),
    close: () => ws.close(),
  };
}

async function emit(room, event, data) {
  const res = await fetch(`http://${BASE}/emit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room, event, data }),
  });
  return res.json();
}

const checks = [];
const check = (name, pass) => { checks.push({ name, pass }); console.log(`${pass ? "✅" : "❌"} ${name}`); };

// ── bad token first
const badResult = await new Promise((res) => {
  const ws = new WebSocket(`ws://${BASE}/ws?token=garbage.token`);
  ws.onopen = () => { res("opened"); ws.close(); };
  ws.onerror = () => res("rejected");
  ws.onclose = () => res("rejected");
});
check("bad token rejected", badResult === "rejected");

// ── two good clients
const a = client("userA");
const b = client("userB");
await Promise.all([a.ready, b.ready]);
await sleep(300); // let presence settle

check("A sees itself + B online (presence:sync)",
  a.has("presence:sync", (m) => m.data.userA && m.data.userB));
check("B sees both online", b.has("presence:sync", (m) => m.data.userA && m.data.userB));

// ── room join + /emit fan-out
a.send({ type: "join:conversation", conversationId: "room1" });
b.send({ type: "join:conversation", conversationId: "room1" });
await sleep(150);
const delivered = await emit("conversation:room1", "message:new", { id: "m1", text: "hi" });
await sleep(200);
check("/emit delivered to both room members", delivered.delivered === 2);
check("A received message:new", a.has("message:new", (m) => m.data.id === "m1"));
check("B received message:new", b.has("message:new", (m) => m.data.id === "m1"));

// ── typing excludes sender
a.send({ type: "typing:start", conversationId: "room1" });
await sleep(200);
check("B received A's typing:start", b.has("typing:start", (m) => m.data.userId === "userA"));
check("A did NOT receive its own typing", !a.has("typing:start"));

a.close();
b.close();
await sleep(100);

const allPass = checks.every((c) => c.pass);
console.log(allPass ? "\n✅ realtime hub: full presence/rooms/emit/typing verified" : "\n❌ some checks failed");
process.exit(allPass ? 0 : 1);
