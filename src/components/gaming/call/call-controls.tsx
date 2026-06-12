"use client";

import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MonitorOff,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useCall } from "./call-provider";

export function CallControls() {
  const {
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    activeCall,
  } = useCall();

  const controls = [
    {
      icon: isMuted ? MicOff : Mic,
      label: isMuted ? "Unmute" : "Mute",
      onClick: toggleMute,
      active: !isMuted,
      variant: isMuted ? "danger" : "secondary",
    },
    {
      icon: isVideoEnabled ? Video : VideoOff,
      label: isVideoEnabled ? "Stop Video" : "Start Video",
      onClick: toggleVideo,
      active: isVideoEnabled,
      variant: isVideoEnabled ? "secondary" : "danger",
      hidden: activeCall?.type === "voice",
    },
    {
      icon: isScreenSharing ? MonitorOff : Monitor,
      label: isScreenSharing ? "Stop Sharing" : "Share Screen",
      onClick: toggleScreenShare,
      active: isScreenSharing,
      variant: isScreenSharing ? "primary" : "secondary",
    },
  ].filter((c) => !c.hidden);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-center gap-3 p-4 bg-surface rounded-2xl border border-border"
    >
      {controls.map((control, index) => (
        <Button
          key={index}
          variant={control.variant as "primary" | "secondary" | "danger"}
          size="lg"
          onClick={control.onClick}
          className="rounded-full w-14 h-14"
          title={control.label}
        >
          <control.icon className="h-5 w-5" />
        </Button>
      ))}

      <Button
        variant="ghost"
        size="lg"
        className="rounded-full w-14 h-14"
        title="More options"
      >
        <MoreVertical className="h-5 w-5" />
      </Button>

      <Button
        variant="danger"
        size="lg"
        onClick={endCall}
        className="rounded-full w-14 h-14 ml-4"
        title="End call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </motion.div>
  );
}
