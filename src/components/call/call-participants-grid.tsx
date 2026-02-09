"use client";

import { useMemo } from "react";
import { Participant } from "livekit-client";
import { motion } from "framer-motion";
import { CallParticipantTile } from "./call-participant-tile";

interface CallParticipantsGridProps {
  participants: Participant[];
  callType: "voice" | "video";
}

export function CallParticipantsGrid({
  participants,
  callType,
}: CallParticipantsGridProps) {
  // Calculate grid layout based on participant count
  const gridClass = useMemo(() => {
    const count = participants.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-3 md:grid-cols-4";
  }, [participants.length]);

  return (
    <div className={`grid ${gridClass} gap-4 h-full w-full p-4`}>
      {participants.map((participant) => (
        <motion.div
          key={participant.identity}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative"
        >
          <CallParticipantTile participant={participant} callType={callType} />
        </motion.div>
      ))}
    </div>
  );
}
