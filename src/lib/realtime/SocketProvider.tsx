"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { io } from "socket.io-client";
import { useAuthSession } from "@/lib/auth/AuthProvider";
import { RealtimeClient, type RealtimeSocket } from "./realtime-client";

// When set, realtime runs against the Cloudflare DO worker (serverless);
// otherwise the in-process Socket.IO server (local / VPS). Same dual-mode idea
// as the storage driver — the VPS is unchanged until this is configured.
const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL;

interface SocketContextType {
  socket: RealtimeSocket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

/** Fetch a signed handshake token (validated server-side against AUTH_SECRET). */
async function fetchSocketToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/realtime/socket-token", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { token?: string };
      return data?.token ?? null;
    }
  } catch {
    // network blip — UI handles the offline state
  }
  return null;
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const [connected, setConnected] = useState(false);
  // Stored in state (not a ref) so create/destroy re-renders consumers.
  const [socket, setSocket] = useState<RealtimeSocket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    // ── Serverless: Cloudflare Durable Object worker over native WebSocket ──
    if (REALTIME_URL) {
      const client = new RealtimeClient(REALTIME_URL, fetchSocketToken);
      client.on("connect", () => {
        if (!cancelled) setConnected(true);
      });
      client.on("disconnect", () => {
        if (!cancelled) setConnected(false);
      });
      // One-time init of the realtime client for this user (mirrors the
      // socket.io branch below, which sets it from an async callback).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(client);
      return () => {
        cancelled = true;
        client.disconnect();
        setSocket(null);
        setConnected(false);
      };
    }

    // ── Local / VPS: in-process Socket.IO ──────────────────────────────────
    let s: ReturnType<typeof io> | null = null;
    (async () => {
      const token = await fetchSocketToken();
      if (cancelled || !token) return;

      s = io({
        auth: { userId: user.id, token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      s.on("connect", () => setConnected(true));
      s.on("disconnect", () => setConnected(false));

      // Token expired mid-session → server rejects with "unauthorized"; fetch a
      // fresh one and reconnect.
      s.on("connect_error", async (err) => {
        if (err?.message !== "unauthorized") return;
        const fresh = await fetchSocketToken();
        if (fresh && s) {
          (s.auth as Record<string, unknown>).token = fresh;
          s.connect();
        }
      });

      setSocket(s);
    })();

    return () => {
      cancelled = true;
      if (s) s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user?.id]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
