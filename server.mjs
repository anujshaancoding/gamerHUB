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
      presenceData[userId] = { status: info.status || "auto" };
    }
    io.emit("presence:sync", presenceData);
  }

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
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
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).status = data.status;
        if (data.status === "offline") {
          onlineUsers.delete(userId);
        }
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
