"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthSession } from "@/lib/auth/AuthProvider";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const [connected, setConnected] = useState(false);
  // Socket is stored in state (not a ref) so that creating/destroying it
  // re-renders consumers — reading a ref's `.current` during render is a bug
  // (consumers would get a stale/null socket).
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let cancelled = false;
    let s: Socket | null = null;

    // Fetch a signed handshake token. The server validates this against
    // AUTH_SECRET so users can't claim another userId on the websocket.
    (async () => {
      let token: string | null = null;
      try {
        const res = await fetch("/api/realtime/socket-token", { credentials: "include" });
        if (res.ok) {
          const data = (await res.json()) as { token?: string };
          token = data?.token ?? null;
        }
      } catch {
        // network blip — socket simply won't connect; UI handles offline state
      }
      if (cancelled || !token) return;

      s = io({
        auth: { userId: user.id, token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      s.on("connect", () => {
        setConnected(true);
      });

      s.on("disconnect", () => {
        setConnected(false);
      });

      // If the token expired mid-session, the server rejects with
      // "unauthorized" — fetch a fresh one and reconnect.
      s.on("connect_error", async (err) => {
        if (err?.message !== "unauthorized") return;
        try {
          const res = await fetch("/api/realtime/socket-token", { credentials: "include" });
          if (!res.ok) return;
          const data = (await res.json()) as { token?: string };
          if (data?.token && s) {
            (s.auth as Record<string, unknown>).token = data.token;
            s.connect();
          }
        } catch {
          // give up — user can refresh the page
        }
      });

      setSocket(s);
    })();

    return () => {
      cancelled = true;
      if (s) {
        s.disconnect();
      }
      setSocket(null);
      setConnected(false);
    };
  }, [user?.id]);

  const value = useMemo(
    () => ({
      socket,
      connected,
    }),
    [socket, connected]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
