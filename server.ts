/**
 * Custom Node.js server running Next.js + Socket.io on the same HTTP server.
 *
 * Usage:
 *   NODE_ENV=production node server.js
 *
 * PM2:
 *   pm2 start server.js --name gglobby
 */

import { createServer } from "http";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { setupSocketHandlers } from "./src/lib/realtime/socket-server";

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
  (globalThis as Record<string, unknown>).__socket_io__ = io;

  // Set up all Socket.io event handlers
  setupSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});
