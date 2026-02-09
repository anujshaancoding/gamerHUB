"use client";

import {
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import { motion } from "framer-motion";

interface ScreenShareViewProps {
  track: TrackReferenceOrPlaceholder;
}

export function ScreenShareView({ track }: ScreenShareViewProps) {
  // Only render if we have a valid track reference
  if (!isTrackReference(track)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full rounded-xl overflow-hidden bg-black"
    >
      <VideoTrack trackRef={track} className="w-full h-full object-contain" />
      <div className="absolute top-4 left-4 px-3 py-1 bg-primary rounded-full text-background text-sm font-medium">
        {track.participant?.name || "Someone"} is sharing their screen
      </div>
    </motion.div>
  );
}
