/**
 * ggLobby realtime hub — Cloudflare Worker + Durable Object.
 *
 * STAGE 1 (this file): the connection + auth + deploy pipeline. A single
 * RealtimeHub DO accepts authenticated, hibernatable WebSocket connections and
 * echoes — enough to prove the whole toolchain end-to-end. Presence, rooms,
 * typing, and the /emit fan-out (porting socket-server.ts) land next.
 *
 * Auth: the same HMAC handshake token as the Socket.IO server
 * (src/lib/security/socket-token.ts), verified here with Web Crypto.
 */

export interface Env {
  REALTIME_HUB: DurableObjectNamespace;
  AUTH_SECRET: string;
}

// ── Token verification (Web Crypto port of verifySocketToken) ─────────────────

function b64urlToBytes(s: string): Uint8Array | null {
  try {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function verifyToken(token: string, secret: string): Promise<string | null> {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payloadStr, sigStr] = token.split(".");
  if (!payloadStr || !sigStr) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadStr)),
  );
  const received = b64urlToBytes(sigStr);
  if (!received || received.length !== expected.length) return null;

  // Constant-time compare.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ received[i];
  if (diff !== 0) return null;

  let payload: { uid?: unknown; exp?: unknown };
  try {
    const bytes = b64urlToBytes(payloadStr);
    if (!bytes) return null;
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
  if (typeof payload.uid !== "string" || !payload.uid) return null;
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
  return payload.uid;
}

// ── Durable Object: the hub ───────────────────────────────────────────────────

export class RealtimeHub {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const userId = await verifyToken(url.searchParams.get("token") ?? "", this.env.AUTH_SECRET);
      if (!userId) return new Response("unauthorized", { status: 401 });

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      // Hibernatable accept — tag the socket with its userId so we can route to
      // it after the DO wakes from hibernation (used for presence/rooms next).
      this.state.acceptWebSocket(server, [`u:${userId}`]);
      server.send(JSON.stringify({ type: "connected", userId }));

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("gglobby-realtime: ok");
  }

  // Echo for stage 1 — proves bidirectional messaging works.
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === "string" ? message : "(binary)";
    ws.send(JSON.stringify({ type: "echo", data: text }));
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    // Presence cleanup (5s grace, DB offline flip) lands in the next stage.
    try {
      ws.close(code);
    } catch {
      /* already closing */
    }
  }
}

// ── Worker entry: route everything to the singleton hub ───────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.REALTIME_HUB.idFromName("hub");
    return env.REALTIME_HUB.get(id).fetch(request);
  },
};
