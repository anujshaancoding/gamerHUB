"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/db/client-browser";
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
  const db = createClient();

  const [activeCall, setActiveCall] = useState<CallWithDetails | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallWithDetails | null>(
    null
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Fetch call with details
  const fetchCallDetails = useCallback(
    async (callId: string): Promise<CallWithDetails | null> => {
      const { data: call } = await db
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
    [db]
  );

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
