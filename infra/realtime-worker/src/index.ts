/**
 * ggLobby realtime hub — Cloudflare Worker + Durable Object.
 *
 * A single RealtimeHub DO holds all WebSocket connections and implements rooms
 * in memory exactly like the old in-process Socket.IO server
 * (src/lib/realtime/socket-server.ts) — the simplest correct port at our scale.
 *
 * Hibernation-safe: per-connection state (userId, status, rooms) lives in each
 * socket's serialized attachment, and presence/room membership is DERIVED from
 * state.getWebSockets() on demand, so nothing breaks when the DO hibernates.
 *
 * Auth: the same HMAC handshake token as the app (src/lib/security/socket-token.ts),
 * verified with Web Crypto. Server-side fan-out (the emitTo* helpers) arrives as
 * authenticated POSTs to /emit.
 */

export interface Env {
  REALTIME_HUB: DurableObjectNamespace;
  AUTH_SECRET: string;
  /** Shared secret the Next app sends on /emit (Bearer). */
  REALTIME_SECRET?: string;
}

const DISCONNECT_GRACE_MS = 5000;

interface Attachment {
  userId: string;
  status: string;
  rooms: string[];
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

  // ── attachment helpers ──────────────────────────────────────────────────────
  private att(ws: WebSocket): Attachment {
    return (ws.deserializeAttachment() as Attachment) ?? { userId: "", status: "auto", rooms: [] };
  }
  private setAtt(ws: WebSocket, a: Attachment) {
    ws.serializeAttachment(a);
  }

  // ── routing ─────────────────────────────────────────────────────────────────
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const userId = await verifyToken(url.searchParams.get("token") ?? "", this.env.AUTH_SECRET);
      if (!userId) return new Response("unauthorized", { status: 401 });
      return this.accept(userId);
    }

    if (url.pathname === "/emit" && request.method === "POST") {
      if (this.env.REALTIME_SECRET) {
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${this.env.REALTIME_SECRET}`) {
          return new Response("unauthorized", { status: 401 });
        }
      }
      const body = (await request.json().catch(() => null)) as
        | { room?: string; event?: string; data?: unknown }
        | null;
      if (!body?.room || !body?.event) {
        return new Response("room and event required", { status: 400 });
      }
      const n = this.sendToRoom(body.room, body.event, body.data);
      return Response.json({ ok: true, delivered: n });
    }

    return new Response("gglobby-realtime: ok");
  }

  private accept(userId: string): Response {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    // Cancel a pending grace alarm if this user is reconnecting.
    this.setAtt(server, { userId, status: "auto", rooms: [`user:${userId}`] });
    this.state.acceptWebSocket(server, [`u:${userId}`]);

    server.send(JSON.stringify({ type: "connected", data: { userId } }));
    this.broadcastPresence();

    return new Response(null, { status: 101, webSocket: client });
  }

  // ── client -> server messages ────────────────────────────────────────────────
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;
    let msg: { type?: string; [k: string]: unknown };
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }
    const a = this.att(ws);
    if (!a.userId) return;

    switch (msg.type) {
      case "status:set": {
        a.status = String(msg.status ?? "auto");
        this.setAtt(ws, a);
        this.broadcastPresence();
        break;
      }
      case "status:auto-away":
        a.status = "auto_away";
        this.setAtt(ws, a);
        this.broadcastPresence();
        break;
      case "status:back":
        a.status = "auto";
        this.setAtt(ws, a);
        this.broadcastPresence();
        break;
      case "join:conversation":
        this.joinRoom(ws, a, `conversation:${msg.conversationId}`);
        break;
      case "leave:conversation":
        this.leaveRoom(ws, a, `conversation:${msg.conversationId}`);
        break;
      case "join:tournament":
        this.joinRoom(ws, a, `tournament:${msg.tournamentId}`);
        break;
      case "leave:tournament":
        this.leaveRoom(ws, a, `tournament:${msg.tournamentId}`);
        break;
      case "typing:start":
      case "typing:stop":
        this.sendToRoom(
          `conversation:${msg.conversationId}`,
          msg.type,
          { userId: a.userId, conversationId: msg.conversationId },
          ws,
        );
        break;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const a = this.att(ws);
    // If this user has no other live sockets, schedule a grace check before
    // marking them offline (avoids an offline flash on page refresh).
    if (a.userId && this.socketsForUser(a.userId).length <= 1) {
      await this.state.storage.setAlarm(Date.now() + DISCONNECT_GRACE_MS);
    } else {
      this.broadcastPresence();
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  // Grace expiry: presence has already lost the closed socket, so just re-broadcast.
  async alarm(): Promise<void> {
    this.broadcastPresence();
  }

  // ── rooms ─────────────────────────────────────────────────────────────────
  private joinRoom(ws: WebSocket, a: Attachment, room: string) {
    if (!a.rooms.includes(room)) {
      a.rooms.push(room);
      this.setAtt(ws, a);
    }
  }
  private leaveRoom(ws: WebSocket, a: Attachment, room: string) {
    a.rooms = a.rooms.filter((r) => r !== room);
    this.setAtt(ws, a);
  }

  private socketsForUser(userId: string): WebSocket[] {
    return this.state.getWebSockets(`u:${userId}`);
  }

  /** Send {type:event, data} to every socket in `room`, optionally excluding one. */
  private sendToRoom(room: string, event: string, data: unknown, except?: WebSocket): number {
    const payload = JSON.stringify({ type: event, data });
    let n = 0;
    for (const ws of this.state.getWebSockets()) {
      if (ws === except) continue;
      if (this.att(ws).rooms.includes(room)) {
        try {
          ws.send(payload);
          n++;
        } catch {
          /* socket going away */
        }
      }
    }
    return n;
  }

  /** Presence = distinct online users (skipping "appear offline"), broadcast to all. */
  private broadcastPresence() {
    const presence: Record<string, { status: string }> = {};
    for (const ws of this.state.getWebSockets()) {
      const a = this.att(ws);
      if (!a.userId || a.status === "offline") continue;
      presence[a.userId] = { status: a.status || "auto" };
    }
    const payload = JSON.stringify({ type: "presence:sync", data: presence });
    for (const ws of this.state.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        /* ignore */
      }
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
