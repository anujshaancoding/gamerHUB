"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) {
      // Disconnect if no user
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Connect Socket.io
    const socket = io({
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
    }),
    [connected]
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
