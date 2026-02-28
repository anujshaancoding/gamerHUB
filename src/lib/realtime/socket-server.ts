/**
 * Socket.io server event handlers:
 *   - online-users (Presence) → connection/disconnect tracking + presence:sync
 *   - conversations-updates   → room user:{userId}, event conversation:updated
 *   - conversation:{id}       → room conversation:{id}, events message:new/deleted
 *   - typing:{id}             → room conversation:{id}, events typing:start/stop
 *   - unread-count-singleton  → room user:{userId}, event unread:updated
 *   - notifications-updates   → room user:{userId}, event notification:new
 *   - tournament-{id}         → room tournament:{id}, event tournament:updated
 *   - call_notifications      → room user:{userId}, event call:incoming
 *   - read-receipts-chat:{id} → room conversation:{id}, event read-receipt:updated
 */

import type { Server, Socket } from "socket.io";
import { getPool } from "@/lib/db/index";

// Track online users: userId → Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

// Track user statuses: userId → status preference
const userStatuses = new Map<string, string>();

export function setupSocketHandlers(io: Server) {
  io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // ── Track online status ──────────────────────────────────────────

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join user-specific room for targeted events
    socket.join(`user:${userId}`);

    // Mark online in DB
    const sql = getPool();
    try {
      await sql`
        UPDATE profiles SET is_online = true, last_seen = NOW()
        WHERE id = ${userId}
      `;

      // Record heartbeat activity
      await sql`SELECT record_heartbeat_activity(${userId})`.catch(() => {});
    } catch {
      // DB might not be ready yet
    }

    // Broadcast presence sync
    broadcastPresence(io);

    // ── Handle status changes ────────────────────────────────────────

    socket.on("status:set", (data: { status: string; durationMinutes?: number }) => {
      userStatuses.set(userId, data.status);

      if (data.status === "offline") {
        // Appear offline
        onlineUsers.delete(userId);
      }

      broadcastPresence(io);

      // Persist to DB
      const until = data.durationMinutes
        ? new Date(Date.now() + data.durationMinutes * 60000).toISOString()
        : null;
      sql`
        UPDATE profiles SET status = ${data.status}, status_until = ${until}
        WHERE id = ${userId}
      `.catch(() => {});
    });

    socket.on("status:auto-away", () => {
      userStatuses.set(userId, "auto_away");
      broadcastPresence(io);
    });

    socket.on("status:back", () => {
      userStatuses.set(userId, "auto");
      broadcastPresence(io);
    });

    // ── Conversation rooms ───────────────────────────────────────────

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Typing indicators ────────────────────────────────────────────

    socket.on("typing:start", (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        userId,
        conversationId: data.conversationId,
      });
    });

    // ── Tournament rooms ─────────────────────────────────────────────

    socket.on("join:tournament", (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on("leave:tournament", (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    // ── Heartbeat ────────────────────────────────────────────────────

    const heartbeatInterval = setInterval(async () => {
      try {
        await sql`
          UPDATE profiles SET last_seen = NOW(), is_online = true
          WHERE id = ${userId}
        `;
        await sql`SELECT record_heartbeat_activity(${userId})`.catch(() => {});
      } catch {
        // Ignore heartbeat errors
      }
    }, 30000);

    // ── Disconnect ───────────────────────────────────────────────────

    socket.on("disconnect", async () => {
      clearInterval(heartbeatInterval);

      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          userStatuses.delete(userId);

          // Mark offline in DB
          try {
            await sql`
              UPDATE profiles SET is_online = false, last_seen = NOW()
              WHERE id = ${userId}
            `;
          } catch {
            // Ignore
          }
        }
      }

      broadcastPresence(io);
    });
  });
}

/** Broadcast current presence state to all connected clients */
function broadcastPresence(io: Server) {
  const presenceData: Record<string, { status: string }> = {};

  for (const [userId] of onlineUsers) {
    presenceData[userId] = {
      status: userStatuses.get(userId) || "auto",
    };
  }

  io.emit("presence:sync", presenceData);
}

// ─── Helper to emit events from API routes ───────────────────────────────────

export function getIO(): Server | null {
  return (globalThis as Record<string, unknown>).__socket_io__ as Server | null;
}

/** Emit an event to a specific user's room */
export function emitToUser(userId: string, event: string, data: unknown) {
  const io = getIO();
  if (io) io.to(`user:${userId}`).emit(event, data);
}

/** Emit an event to a conversation room */
export function emitToConversation(conversationId: string, event: string, data: unknown) {
  const io = getIO();
  if (io) io.to(`conversation:${conversationId}`).emit(event, data);
}

/** Emit an event to a tournament room */
export function emitToTournament(tournamentId: string, event: string, data: unknown) {
  const io = getIO();
  if (io) io.to(`tournament:${tournamentId}`).emit(event, data);
}
