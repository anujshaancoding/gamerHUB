"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { useAuthSession } from "@/lib/auth/AuthProvider";
import { useSocket } from "@/lib/realtime/SocketProvider";
import type { UserStatus, UserStatusPreference } from "@/types/database";

interface PresenceContextType {
  /** Set of user IDs currently online (from Socket.io presence) */
  onlineUserIds: Set<string>;
  /** Check if a specific user is connected (backward compat — true for online/away/dnd) */
  isUserOnline: (userId: string) => boolean;
  /** Get the resolved display status for a user */
  getUserStatus: (userId: string) => UserStatus;
  /** The current user's chosen status preference */
  myStatusPreference: UserStatusPreference;
  /** The current user's resolved display status */
  myStatus: UserStatus;
  /** Set the current user's status, optionally with a duration in minutes */
  setMyStatus: (
    status: UserStatusPreference,
    durationMinutes?: number
  ) => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
  getUserStatus: () => "offline",
  myStatusPreference: "auto",
  myStatus: "offline",
  setMyStatus: async () => {},
});

const IDLE_TIMEOUT = 5 * 60_000; // 5 minutes
const HIDDEN_TAB_TIMEOUT = 60_000; // 1 minute when tab hidden
const DB_POLL_INTERVAL = 30_000; // 30 seconds for DB fallback polling

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const { socket, connected } = useSocket();

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(new Map());
  const [statusPreference, setStatusPreference] = useState<UserStatusPreference>("auto");
  const [statusUntil, setStatusUntil] = useState<string | null>(null);
  const [isAutoAway, setIsAutoAway] = useState(false);
  const [gotSocketSync, setGotSocketSync] = useState(false);
  const friendIdsRef = useRef<string[]>([]);

  // ── Listen for presence sync from Socket.io server ────────────────────

  useEffect(() => {
    if (!socket) return;

    const handlePresenceSync = (data: Record<string, { status: string }>) => {
      setGotSocketSync(true);
      const ids = new Set<string>(Object.keys(data));
      const statuses = new Map<string, string>();
      for (const [uid, info] of Object.entries(data)) {
        statuses.set(uid, info.status);
      }
      setOnlineUserIds(ids);
      setUserStatuses(statuses);
    };

    socket.on("presence:sync", handlePresenceSync);

    return () => {
      socket.off("presence:sync", handlePresenceSync);
    };
  }, [socket]);

  // ── DB-polling fallback when Socket.io is not connected ───────────────
  // Fetches is_online status from profiles table so the friends panel
  // works even when running `next dev` without the custom server.

  useEffect(() => {
    if (!user?.id || gotSocketSync) return;

    let cancelled = false;

    const pollOnlineStatus = async () => {
      // Send heartbeat so other users see us as online in the DB
      fetch("/api/users/heartbeat", { method: "POST" }).catch(() => {});

      // Fetch friend IDs if we don't have them yet
      if (friendIdsRef.current.length === 0) {
        try {
          const res = await fetch(`/api/friends?userId=${user.id}&limit=100`);
          if (res.ok) {
            const data = await res.json();
            friendIdsRef.current = (data.friends || []).map(
              (f: { friend_id: string }) => f.friend_id
            );
          }
        } catch {
          // ignore
        }
      }

      if (friendIdsRef.current.length === 0 || cancelled) return;

      try {
        const res = await fetch(
          `/api/users/online-status?ids=${friendIdsRef.current.join(",")}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const statuses: Record<string, { is_online: boolean; status: string }> =
          data.statuses || {};

        const ids = new Set<string>();
        const statusMap = new Map<string, string>();
        for (const [uid, info] of Object.entries(statuses)) {
          if ((info as { is_online: boolean }).is_online) {
            ids.add(uid);
            statusMap.set(uid, (info as { status: string }).status || "auto");
          }
        }

        if (!cancelled) {
          setOnlineUserIds(ids);
          setUserStatuses(statusMap);
        }
      } catch {
        // ignore polling errors
      }
    };

    // Initial poll
    pollOnlineStatus();

    // Repeat on interval
    const interval = setInterval(pollOnlineStatus, DB_POLL_INTERVAL);

    // Mark offline on page unload
    const handleUnload = () => {
      navigator.sendBeacon("/api/profile/offline");
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [user?.id, gotSocketSync]);

  // ── Load saved status from profile (on mount) ────────────────────────

  const statusSyncedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      setOnlineUserIds(new Set());
      setUserStatuses(new Map());
      setStatusPreference("auto");
      setStatusUntil(null);
      setIsAutoAway(false);
      statusSyncedRef.current = false;
      return;
    }

    // Fetch saved status
    fetch(`/api/profile?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const savedStatus = (data.profile.status as UserStatusPreference) || "auto";
          const savedUntil = data.profile.status_until;

          // Check if timed status expired
          if (savedUntil && new Date(savedUntil).getTime() <= Date.now()) {
            setStatusPreference("auto");
            setStatusUntil(null);
          } else {
            setStatusPreference(savedStatus);
            setStatusUntil(savedUntil);
          }

          // Sync saved status to the socket server so it doesn't default to "auto"
          if (socket && savedStatus !== "auto") {
            socket.emit("status:set", { status: savedStatus });
            statusSyncedRef.current = true;
          }
        }
      })
      .catch(() => {});
  }, [user?.id, socket]);

  // ── Re-sync status when socket (re)connects after profile already loaded ──

  useEffect(() => {
    if (!socket || !connected || !user?.id || statusSyncedRef.current) return;

    if (statusPreference !== "auto") {
      socket.emit("status:set", { status: statusPreference });
      statusSyncedRef.current = true;
    }
  }, [socket, connected, user?.id, statusPreference]);

  // ── Resolve a user's display status ───────────────────────────────────

  const getUserStatus = useCallback(
    (userId: string): UserStatus => {
      const isOnline = onlineUserIds.has(userId);
      const preference = userStatuses.get(userId) || "auto";

      if (preference === "offline") return "offline";
      if (!isOnline) return "offline";
      if (preference === "dnd") return "dnd";
      if (preference === "away") return "away";
      if (preference === "online") return "online";
      if (preference === "auto_away") return "away";
      return "online";
    },
    [onlineUserIds, userStatuses]
  );

  const isUserOnline = useCallback(
    (userId: string) => getUserStatus(userId) !== "offline",
    [getUserStatus]
  );

  // ── Current user's resolved status ────────────────────────────────────

  const myStatus: UserStatus = useMemo(() => {
    if (!user) return "offline";
    if (statusPreference === "offline") return "offline";
    if (statusPreference === "dnd") return "dnd";
    if (statusPreference === "away") return "away";
    if (statusPreference === "online") return "online";
    return isAutoAway ? "away" : "online";
  }, [user, statusPreference, isAutoAway]);

  // ── Set my status ─────────────────────────────────────────────────────

  const setMyStatus = useCallback(
    async (status: UserStatusPreference, durationMinutes?: number): Promise<void> => {
      if (!user) return;

      // Always update local state so the UI reflects the change immediately
      setStatusPreference(status);
      setIsAutoAway(false);

      const until = durationMinutes
        ? new Date(Date.now() + durationMinutes * 60_000).toISOString()
        : null;
      setStatusUntil(until);

      // Notify Socket.io server when connected
      if (socket) {
        socket.emit("status:set", { status, durationMinutes });
      }
    },
    [user, socket]
  );

  // ── Timed status expiry ───────────────────────────────────────────────

  useEffect(() => {
    if (!statusUntil) return;
    const expiresAt = new Date(statusUntil).getTime();
    const now = Date.now();
    if (expiresAt <= now) {
      setMyStatus("auto");
      return;
    }
    const timer = setTimeout(() => {
      setMyStatus("auto");
    }, expiresAt - now);
    return () => clearTimeout(timer);
  }, [statusUntil, setMyStatus]);

  // ── Auto-away detection (only when preference is "auto") ──────────────

  useEffect(() => {
    if (!user || !socket || !connected || statusPreference !== "auto") return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const goAway = () => {
      setIsAutoAway(true);
      socket.emit("status:auto-away");
    };

    const resetIdle = () => {
      clearTimeout(idleTimer);
      if (isAutoAway) {
        setIsAutoAway(false);
        socket.emit("status:back");
      }
      idleTimer = setTimeout(goAway, IDLE_TIMEOUT);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(goAway, HIDDEN_TAB_TIMEOUT);
      } else {
        resetIdle();
      }
    };

    resetIdle();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("touchstart", resetIdle);

    return () => {
      clearTimeout(idleTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
    };
  }, [user, socket, connected, statusPreference, isAutoAway]);

  const value = useMemo(
    () => ({
      onlineUserIds,
      isUserOnline,
      getUserStatus,
      myStatusPreference: statusPreference,
      myStatus,
      setMyStatus,
    }),
    [onlineUserIds, isUserOnline, getUserStatus, statusPreference, myStatus, setMyStatus]
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
