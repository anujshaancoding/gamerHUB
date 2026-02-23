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
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { UserStatus, UserStatusPreference } from "@/types/database";

interface PresenceContextType {
  /** Set of user IDs currently online (from Supabase Presence channel) */
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

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const IDLE_TIMEOUT = 5 * 60_000; // 5 minutes
const HIDDEN_TAB_TIMEOUT = 60_000; // 1 minute when tab hidden

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user, session, profile } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<
    Map<string, UserStatusPreference>
  >(new Map());
  const [statusPreference, setStatusPreference] =
    useState<UserStatusPreference>("auto");
  const [statusUntil, setStatusUntil] = useState<string | null>(null);
  const [isAutoAway, setIsAutoAway] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef(session);
  const statusPrefRef = useRef(statusPreference);
  const supabase = useMemo(() => createClient(), []);

  // Keep refs current
  sessionRef.current = session;
  statusPrefRef.current = statusPreference;

  // ── Resolve a user's display status ────────────────────────────────
  const getUserStatus = useCallback(
    (userId: string): UserStatus => {
      const isOnline = onlineUserIds.has(userId);
      const preference = userStatuses.get(userId) || "auto";

      // If they chose to appear offline, always show offline
      if (preference === "offline") return "offline";
      // If not connected at all, show offline
      if (!isOnline) return "offline";
      // Manual statuses
      if (preference === "dnd") return "dnd";
      if (preference === "away") return "away";
      if (preference === "online") return "online";
      // Auto — the presence channel metadata may include "auto_away"
      if (preference === ("auto_away" as string)) return "away";
      // Default auto → online
      return "online";
    },
    [onlineUserIds, userStatuses]
  );

  // ── Backward compat: connected if not offline ─────────────────────
  const isUserOnline = useCallback(
    (userId: string) => getUserStatus(userId) !== "offline",
    [getUserStatus]
  );

  // ── Current user's resolved status ────────────────────────────────
  const myStatus: UserStatus = useMemo(() => {
    if (!user) return "offline";
    if (statusPreference === "offline") return "offline";
    if (statusPreference === "dnd") return "dnd";
    if (statusPreference === "away") return "away";
    if (statusPreference === "online") return "online";
    // auto
    return isAutoAway ? "away" : "online";
  }, [user, statusPreference, isAutoAway]);

  // ── Helper: track presence with current status ────────────────────
  const trackPresence = useCallback(
    async (status: string) => {
      if (!channelRef.current || !user) return;
      await channelRef.current.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
        status,
      });
    },
    [user]
  );

  // ── Set my status ─────────────────────────────────────────────────
  const setMyStatus = useCallback(
    async (
      status: UserStatusPreference,
      durationMinutes?: number
    ): Promise<void> => {
      if (!user) return;

      const until = durationMinutes
        ? new Date(Date.now() + durationMinutes * 60_000).toISOString()
        : null;

      // Persist to DB
      await supabase
        .from("profiles")
        .update({ status, status_until: until })
        .eq("id", user.id);

      // Update local state
      setStatusPreference(status);
      setStatusUntil(until);
      setIsAutoAway(false);

      // Update presence channel
      if (status === "offline") {
        // Appear offline → untrack from presence so others don't see us
        channelRef.current?.untrack();
      } else {
        await trackPresence(status);
      }
    },
    [user, supabase, trackPresence]
  );

  // ── Main presence setup effect ────────────────────────────────────
  // Wait for both user AND profile to be available. The profile being set
  // means the DB row exists, so our queries (status, heartbeat) won't 406/409.
  useEffect(() => {
    if (!user || !profile) {
      // Not logged in or profile not loaded yet — clean up everything
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (!user) {
        setOnlineUserIds(new Set());
        setUserStatuses(new Map());
        setStatusPreference("auto");
        setStatusUntil(null);
        setIsAutoAway(false);
      }
      return;
    }

    let cancelled = false;

    const setup = async () => {
      // ── 1. Load saved status from DB ─────────────────────────────
      const { data: profileData } = await supabase
        .from("profiles")
        .select("status, status_until")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      let savedStatus: UserStatusPreference = "auto";
      let savedUntil: string | null = null;

      if (profileData) {
        savedStatus = (profileData.status as UserStatusPreference) || "auto";
        savedUntil = profileData.status_until;

        // Check if timed status has expired
        if (savedUntil && new Date(savedUntil).getTime() <= Date.now()) {
          savedStatus = "auto";
          savedUntil = null;
          await supabase
            .from("profiles")
            .update({ status: "auto", status_until: null })
            .eq("id", user.id);
        }
      }

      setStatusPreference(savedStatus);
      setStatusUntil(savedUntil);

      // ── 2. Mark online in DB ─────────────────────────────────────
      await supabase
        .from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("id", user.id);

      // Record initial activity heartbeat for today
      supabase.rpc("record_heartbeat_activity", { p_user_id: user.id })
        .then(({ error }) => { if (error) console.warn("[Presence] heartbeat RPC error:", error.message); });

      if (cancelled) return;

      // ── 3. Join Supabase Presence channel ────────────────────────
      const channel = supabase.channel("online-users", {
        config: { presence: { key: user.id } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const ids = new Set<string>();
          const statuses = new Map<string, UserStatusPreference>();

          for (const [userId, presences] of Object.entries(state)) {
            ids.add(userId);
            const latest = presences[presences.length - 1] as {
              status?: string;
            };
            statuses.set(
              userId,
              (latest?.status as UserStatusPreference) || "auto"
            );
          }

          setOnlineUserIds(ids);
          setUserStatuses(statuses);
        })
        .subscribe(async (subStatus) => {
          if (subStatus === "SUBSCRIBED") {
            // If user chose "appear offline", don't track
            if (savedStatus === "offline") return;
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
              status: savedStatus,
            });
          }
        });

      channelRef.current = channel;

      // ── 4. Heartbeat — keep last_seen fresh + record activity ─────
      heartbeatRef.current = setInterval(() => {
        supabase
          .from("profiles")
          .update({ last_seen: new Date().toISOString(), is_online: true })
          .eq("id", user.id)
          .then();

        // Record activity for the day (deduplication handled server-side)
        supabase
          .rpc("record_heartbeat_activity", { p_user_id: user.id })
          .then(({ error }) => { if (error) console.warn("[Presence] heartbeat RPC error:", error.message); });
      }, HEARTBEAT_INTERVAL);
    };

    setup();

    // ── 5. Handle tab / browser close ──────────────────────────────
    const handleBeforeUnload = () => {
      const token = sessionRef.current?.access_token;
      if (!token) return;

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`;
      fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          is_online: false,
          last_seen: new Date().toISOString(),
        }),
        keepalive: true,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // ── Cleanup ────────────────────────────────────────────────────
    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.id, supabase]);

  // ── Timed status expiry ───────────────────────────────────────────
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

  // ── Auto-away detection (only when preference is "auto") ──────────
  useEffect(() => {
    if (!user || statusPreference !== "auto") return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const goAway = () => {
      setIsAutoAway(true);
      if (channelRef.current) {
        channelRef.current.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          status: "auto_away",
        });
      }
    };

    const resetIdle = () => {
      clearTimeout(idleTimer);
      if (isAutoAway) {
        setIsAutoAway(false);
        if (channelRef.current) {
          channelRef.current.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            status: "auto",
          });
        }
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
  }, [user, statusPreference, isAutoAway]);

  const value = useMemo(
    () => ({
      onlineUserIds,
      isUserOnline,
      getUserStatus,
      myStatusPreference: statusPreference,
      myStatus,
      setMyStatus,
    }),
    [
      onlineUserIds,
      isUserOnline,
      getUserStatus,
      statusPreference,
      myStatus,
      setMyStatus,
    ]
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
