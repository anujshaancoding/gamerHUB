"use client";

import { useEffect, useState } from "react";
import { VideoTrack, AudioTrack } from "@livekit/components-react";
import { Participant, Track } from "livekit-client";
import { motion } from "framer-motion";
import { MicOff, VideoOff } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface CallParticipantTileProps {
  participant: Participant;
  callType: "voice" | "video";
}

export function CallParticipantTile({
  participant,
  callType,
}: CallParticipantTileProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
  const microphonePublication = participant.getTrackPublication(
    Track.Source.Microphone
  );

  const isVideoEnabled =
    cameraPublication?.isSubscribed && !cameraPublication?.isMuted;
  const isAudioEnabled =
    microphonePublication?.isSubscribed && !microphonePublication?.isMuted;

  // Parse metadata for avatar
  const metadata = participant.metadata
    ? JSON.parse(participant.metadata)
    : {};

  // Monitor speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(participant.isSpeaking);
    }, 100);
    return () => clearInterval(interval);
  }, [participant]);

  return (
    <div
      className={cn(
        "relative h-full min-h-[200px] rounded-xl overflow-hidden bg-surface-light border-2 transition-colors",
        isSpeaking ? "border-primary" : "border-border"
      )}
    >
      {/* Video or Avatar */}
      {callType === "video" &&
      isVideoEnabled &&
      cameraPublication?.track ? (
        <VideoTrack
          trackRef={{
            participant,
            publication: cameraPublication,
            source: Track.Source.Camera,
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-light">
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          >
            <Avatar
              src={metadata.avatarUrl}
              alt={participant.name || participant.identity}
              size="xl"
            />
          </motion.div>
        </div>
      )}

      {/* Audio track (hidden, for playback) */}
      {microphonePublication?.track && !participant.isLocal && (
        <AudioTrack
          trackRef={{
            participant,
            publication: microphonePublication,
            source: Track.Source.Microphone,
          }}
        />
      )}

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white truncate">
            {participant.name || participant.identity}
            {participant.isLocal && " (You)"}
          </span>
          <div className="flex items-center gap-2">
            {!isAudioEnabled && (
              <span className="p-1 rounded-full bg-error/80">
                <MicOff className="h-3 w-3 text-white" />
              </span>
            )}
            {callType === "video" && !isVideoEnabled && (
              <span className="p-1 rounded-full bg-surface-light/80">
                <VideoOff className="h-3 w-3 text-text-muted" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
