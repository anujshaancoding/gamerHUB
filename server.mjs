/**
 * Production server running Next.js + Socket.io on the same HTTP server.
 *
 * Usage:
 *   NODE_ENV=production node server.mjs
 *
 * PM2:
 *   pm2 start ecosystem.config.js
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createServer } from "http";
import next from "next";
import { Server as SocketServer } from "socket.io";
import postgres from "postgres";
import { createHmac, timingSafeEqual } from "crypto";

// ── Socket handshake token verification ────────────────────────────────
// Mirror of src/lib/security/socket-token.ts — must stay in sync.
// AUTH_SECRET is shared with NextAuth so the same JWT secret is used.
function b64urlDecode(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}
function b64urlEncode(buf) {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function verifySocketToken(token) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return { ok: false, reason: "no_secret" };
  if (typeof token !== "string" || !token.includes(".")) return { ok: false, reason: "malformed" };
  const [payloadStr, sigStr] = token.split(".");
  if (!payloadStr || !sigStr) return { ok: false, reason: "malformed" };

  const expected = createHmac("sha256", secret).update(payloadStr).digest();
  let received;
  try { received = b64urlDecode(sigStr); } catch { return { ok: false, reason: "malformed" }; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "bad_signature" };
  }
  let payload;
  try { payload = JSON.parse(b64urlDecode(payloadStr).toString("utf8")); }
  catch { return { ok: false, reason: "malformed" }; }
  if (!payload?.uid || typeof payload.uid !== "string") return { ok: false, reason: "malformed" };
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, userId: payload.uid };
}
// Silence "unused" linter without breaking — keep encode for future use.
void b64urlEncode;

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "https://gglobby.in",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Make io accessible to API routes via global
  globalThis.__socket_io__ = io;

  // Database connection for presence updates
  const sql = postgres(process.env.DATABASE_URL);

  // Reset all stale is_online flags on server start
  sql`UPDATE profiles SET is_online = false`.catch(() => {});

  // Presence tracking: userId → { socketIds: Set, status }
  const onlineUsers = new Map();
  // Grace period timers for disconnect (avoids offline flash on page refresh)
  const disconnectTimers = new Map();
  const DISCONNECT_GRACE_MS = 5000; // 5 seconds

  function broadcastPresence() {
    const presenceData = {};
    for (const [userId, info] of onlineUsers) {
      // Skip users who chose "appear offline" — they stay tracked for socket management
      if (info.status === "offline") continue;
      presenceData[userId] = { status: info.status || "auto" };
    }
    io.emit("presence:sync", presenceData);
  }

  // Middleware: reject any connection that doesn't present a valid signed
  // handshake token. The browser fetches this token from
  // /api/realtime/socket-token after authenticating with NextAuth.
  io.use((socket, nextFn) => {
    const token = socket.handshake.auth?.token;
    const claimedUserId = socket.handshake.auth?.userId;
    const result = verifySocketToken(token);
    if (!result.ok) {
      console.warn(`[SOCKET] Rejected connection: ${result.reason} (claimed userId: ${typeof claimedUserId === "string" ? claimedUserId.slice(0, 8) : "n/a"})`);
      return nextFn(new Error("unauthorized"));
    }
    // If the client also sent a userId, it MUST match the signed one.
    // This blocks the trivial "spoof in handshake.auth.userId" attack that
    // was letting any logged-in user receive another user's private events.
    if (typeof claimedUserId === "string" && claimedUserId !== result.userId) {
      console.warn(`[SOCKET] userId mismatch: claimed=${claimedUserId.slice(0, 8)} verified=${result.userId.slice(0, 8)}`);
      return nextFn(new Error("unauthorized"));
    }
    socket.data.userId = result.userId;
    nextFn();
  });

  io.on("connection", (socket) => {
    // Trust ONLY the verified userId from the token, never the client-sent one.
    const userId = socket.data.userId;
    if (userId) {
      console.log(`[SOCKET] User connected: ${userId.slice(0, 8)}... (socket: ${socket.id})`);

      // Cancel any pending disconnect timer for this user (page refresh case)
      if (disconnectTimers.has(userId)) {
        clearTimeout(disconnectTimers.get(userId));
        disconnectTimers.delete(userId);
        console.log(`[SOCKET] Cancelled disconnect timer for ${userId.slice(0, 8)}... (page refresh)`);
      }

      // Track multiple socket IDs per user (multi-tab support)
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, { socketIds: new Set(), status: "auto" });
      }
      const userInfo = onlineUsers.get(userId);
      userInfo.socketIds.add(socket.id);

      socket.join(`user:${userId}`);

      // Restore saved status from DB on connection
      sql`SELECT status, status_until FROM profiles WHERE id = ${userId}`
        .then((rows) => {
          if (rows.length > 0 && userInfo.socketIds.has(socket.id)) {
            const saved = rows[0];
            console.log(`[SOCKET] DB status for ${userId.slice(0, 8)}...: status=${saved.status}, until=${saved.status_until}`);
            if (saved.status && saved.status !== "auto") {
              if (saved.status_until && new Date(saved.status_until).getTime() <= Date.now()) {
                userInfo.status = "auto";
              } else {
                userInfo.status = saved.status;
              }
              broadcastPresence();
            }
          }
        })
        .catch((err) => console.error(`[SOCKET] DB status restore error:`, err.message));

      broadcastPresence();
      sql`UPDATE profiles SET is_online = true, last_seen = NOW() WHERE id = ${userId}`.catch(() => {});
      console.log(`[SOCKET] Online users: ${onlineUsers.size}`);
    } else {
      console.log(`[SOCKET] Connection without userId, ignoring`);
    }

    socket.on("join:conversation", (id) => socket.join(`conversation:${id}`));
    socket.on("leave:conversation", (id) => socket.leave(`conversation:${id}`));
    socket.on("join:tournament", (id) => socket.join(`tournament:${id}`));
    socket.on("leave:tournament", (id) => socket.leave(`tournament:${id}`));

    socket.on("status:set", (data) => {
      console.log(`[SOCKET] status:set from ${userId?.slice(0, 8)}...: ${JSON.stringify(data)}`);
      if (userId) {
        // Re-add to tracking if previously removed (e.g. after "offline" status in old code)
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, { socketIds: new Set([socket.id]), status: "auto" });
        }
        onlineUsers.get(userId).status = data.status;
        broadcastPresence();

        // Persist status to DB so it survives page refresh / server restart
        const until = data.durationMinutes
          ? new Date(Date.now() + data.durationMinutes * 60000).toISOString()
          : null;
        sql`
          UPDATE profiles SET status = ${data.status}, status_until = ${until}
          WHERE id = ${userId}
        `.then(() => console.log(`[SOCKET] DB status saved: ${data.status} for ${userId.slice(0, 8)}...`))
         .catch((err) => console.error(`[SOCKET] DB status save FAILED:`, err.message));
      }
    });

    socket.on("status:auto-away", () => {
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).status = "auto_away";
        broadcastPresence();
      }
    });

    socket.on("status:back", () => {
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).status = "auto";
        broadcastPresence();
      }
    });

    socket.on("typing:start", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        userId: userId || data.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("typing:stop", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        userId: userId || data.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] User disconnected: ${userId?.slice(0, 8)}... (socket: ${socket.id})`);
      if (userId && onlineUsers.has(userId)) {
        const userInfo = onlineUsers.get(userId);
        userInfo.socketIds.delete(socket.id);

        // Only go offline if no sockets remain, with a grace period
        if (userInfo.socketIds.size === 0) {
          const timer = setTimeout(() => {
            disconnectTimers.delete(userId);
            // Re-check: if user reconnected during grace period, do nothing
            if (onlineUsers.has(userId) && onlineUsers.get(userId).socketIds.size > 0) {
              return;
            }
            onlineUsers.delete(userId);
            broadcastPresence();
            // Mark offline in DB
            sql`UPDATE profiles SET is_online = false, last_seen = NOW() WHERE id = ${userId}`.catch(() => {});
          }, DISCONNECT_GRACE_MS);
          disconnectTimers.set(userId, timer);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
    console.log(`> ${onlineUsers.size} users online`);
  });
});
