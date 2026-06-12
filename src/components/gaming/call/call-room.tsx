"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useTracks,
  useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { useCall } from "./call-provider";
import { CallControls } from "./call-controls";
import { CallParticipantsGrid } from "./call-participants-grid";
import { ScreenShareView } from "./screen-share-view";
import { Card } from "@/components/ui";

interface CallRoomProps {
  onClose?: () => void;
}

export function CallRoom({ onClose }: CallRoomProps) {
  const { activeCall, endCall, isMuted, isVideoEnabled, isScreenSharing } =
    useCall();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch token when call becomes active
  useEffect(() => {
    if (!activeCall) return;

    const fetchToken = async () => {
      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: activeCall.room_name,
            callId: activeCall.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get token");
        }

        const { token } = await response.json();
        setToken(token);
      } catch (err) {
        setError("Failed to connect to call");
        console.error(err);
      }
    };

    fetchToken();
  }, [activeCall]);

  const handleDisconnected = useCallback(() => {
    endCall();
    onClose?.();
  }, [endCall, onClose]);

  if (error) {
    return (
      <Card className="fixed inset-4 z-50 flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-background rounded-lg"
          >
            Close
          </button>
        </div>
      </Card>
    );
  }

  if (!activeCall || !token) {
    return (
      <Card className="fixed inset-4 z-50 flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </Card>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
      >
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
          audio={true}
          video={isVideoEnabled}
          onDisconnected={handleDisconnected}
          className="h-full flex flex-col"
        >
          <RoomContent
            callType={activeCall.type}
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
          />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </motion.div>
    </AnimatePresence>
  );
}

interface RoomContentProps {
  callType: "voice" | "video";
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

function RoomContent({
  callType,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
}: RoomContentProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.ScreenShare]);

  const screenShareTrack = tracks.find(
    (t) =>
      t.source === Track.Source.ScreenShare && t.publication?.isSubscribed
  );

  // Sync local state with room
  useEffect(() => {
    if (room.localParticipant) {
      room.localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [room, isMuted]);

  useEffect(() => {
    if (room.localParticipant) {
      room.localParticipant.setCameraEnabled(isVideoEnabled);
    }
  }, [room, isVideoEnabled]);

  useEffect(() => {
    if (room.localParticipant) {
      room.localParticipant.setScreenShareEnabled(isScreenSharing);
    }
  }, [room, isScreenSharing]);

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden rounded-xl">
        {screenShareTrack ? (
          <ScreenShareView track={screenShareTrack} />
        ) : (
          <CallParticipantsGrid participants={participants} callType={callType} />
        )}
      </div>

      {/* Controls */}
      <div className="mt-4">
        <CallControls />
      </div>
    </div>
  );
}
