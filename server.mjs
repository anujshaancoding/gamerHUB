/**
 * Production server running Next.js + Socket.io on the same HTTP server.
 *
 * Usage:
 *   NODE_ENV=production node server.mjs
 *
 * PM2:
 *   pm2 start ecosystem.config.js
 */

import { createServer } from "http";
import next from "next";
import { Server as SocketServer } from "socket.io";

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

  // Presence tracking
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      onlineUsers.set(userId, { socketId: socket.id, lastSeen: new Date() });
      io.emit("presence:sync", Array.from(onlineUsers.keys()));
    }

    socket.on("join:conversation", (id) => socket.join(`conversation:${id}`));
    socket.on("leave:conversation", (id) => socket.leave(`conversation:${id}`));
    socket.on("join:tournament", (id) => socket.join(`tournament:${id}`));
    socket.on("leave:tournament", (id) => socket.leave(`tournament:${id}`));

    socket.on("typing:start", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        userId: data.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("typing:stop", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        userId: data.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("presence:sync", Array.from(onlineUsers.keys()));
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
    console.log(`> ${onlineUsers.size} users online`);
  });
});
