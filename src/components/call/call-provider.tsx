"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Call, CallParticipant, Profile } from "@/types/database";

export interface CallWithDetails extends Call {
  initiator?: Profile;
  participants?: (CallParticipant & { user?: Profile })[];
}

interface CallContextValue {
  // State
  activeCall: CallWithDetails | null;
  incomingCall: CallWithDetails | null;
  isInCall: boolean;
  isConnecting: boolean;

  // Actions
  initiateCall: (
    conversationId: string,
    type: "voice" | "video"
  ) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;

  // Media controls
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;

  // Local state
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within CallProvider");
  }
  return context;
}

interface CallProviderProps {
  children: ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [activeCall, setActiveCall] = useState<CallWithDetails | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallWithDetails | null>(
    null
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Use refs so the realtime callback always reads current state
  // without needing to re-subscribe the channel on every state change
  const activeCallRef = useRef(activeCall);
  const incomingCallRef = useRef(incomingCall);
  activeCallRef.current = activeCall;
  incomingCallRef.current = incomingCall;

  // Fetch call with details
  const fetchCallDetails = useCallback(
    async (callId: string): Promise<CallWithDetails | null> => {
      const { data: call } = await supabase
        .from("calls")
        .select(
          `
          *,
          initiator:profiles!initiator_id (*),
          participants:call_participants (
            *,
            user:profiles (*)
          )
        `
        )
        .eq("id", callId)
        .single();

      return call as CallWithDetails | null;
    },
    [supabase]
  );

  // Subscribe to incoming calls — stable effect that reads state via refs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("call_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_participants",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // New call participant entry - might be incoming call
          const callId = (payload.new as CallParticipant).call_id;
          const call = await fetchCallDetails(callId);

          if (
            call &&
            call.status === "ringing" &&
            call.initiator_id !== user.id
          ) {
            setIncomingCall(call);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
        },
        async (payload) => {
          const updatedCall = payload.new as Call;

          // Handle call status changes
          if (
            updatedCall.status === "ended" ||
            updatedCall.status === "declined" ||
            updatedCall.status === "missed" ||
            updatedCall.status === "failed"
          ) {
            if (activeCallRef.current?.id === updatedCall.id) {
              setActiveCall(null);
            }
            if (incomingCallRef.current?.id === updatedCall.id) {
              setIncomingCall(null);
            }
          }

          // Update active call if it's the same call
          if (activeCallRef.current?.id === updatedCall.id) {
            setActiveCall((prev) =>
              prev ? { ...prev, ...updatedCall } : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase, fetchCallDetails]);

  const initiateCall = useCallback(
    async (conversationId: string, type: "voice" | "video") => {
      if (!user || activeCall) return;

      setIsConnecting(true);
      setIsVideoEnabled(type === "video");

      try {
        const response = await fetch("/api/livekit/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, type }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to initiate call");
        }

        const { callId } = await response.json();
        const call = await fetchCallDetails(callId);

        if (call) {
          setActiveCall(call);
        }
      } catch (error) {
        console.error("Failed to initiate call:", error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [user, activeCall, fetchCallDetails]
  );

  const joinCall = useCallback(
    async (callId: string) => {
      if (!user) return;

      setIsConnecting(true);

      try {
        await fetch("/api/livekit/call", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId, action: "join" }),
        });

        const call = await fetchCallDetails(callId);

        if (call) {
          setActiveCall(call);
          setIsVideoEnabled(call.type === "video");
        }
        setIncomingCall(null);
      } catch (error) {
        console.error("Failed to join call:", error);
      } finally {
        setIsConnecting(false);
      }
    },
    [user, fetchCallDetails]
  );

  const declineCall = useCallback(async (callId: string) => {
    try {
      await fetch("/api/livekit/call", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, action: "decline" }),
      });
      setIncomingCall(null);
    } catch (error) {
      console.error("Failed to decline call:", error);
    }
  }, []);

  const endCall = useCallback(async () => {
    if (!activeCall) return;

    try {
      await fetch("/api/livekit/call", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: activeCall.id, action: "leave" }),
      });
      setActiveCall(null);
      setIsMuted(false);
      setIsVideoEnabled(true);
      setIsScreenSharing(false);
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  }, [activeCall]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => !prev);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    setIsScreenSharing((prev) => !prev);
  }, []);

  const value: CallContextValue = {
    activeCall,
    incomingCall,
    isInCall: !!activeCall,
    isConnecting,
    initiateCall,
    joinCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
