"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar, Button, Modal } from "@/components/ui";
import { useCall } from "./call-provider";

export function IncomingCallModal() {
  const { incomingCall, joinCall, declineCall } = useCall();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone and handle auto-decline
  useEffect(() => {
    if (incomingCall) {
      // Try to play ringtone (may be blocked by browser autoplay policy)
      audioRef.current = new Audio("/sounds/ringtone.mp3");
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {
        // Autoplay blocked, that's okay
      });

      // Auto-decline after 30 seconds
      const timeout = setTimeout(() => {
        declineCall(incomingCall.id);
      }, 30000);

      return () => {
        audioRef.current?.pause();
        audioRef.current = null;
        clearTimeout(timeout);
      };
    }
  }, [incomingCall, declineCall]);

  if (!incomingCall) return null;

  const caller = incomingCall.initiator;
  const isVideoCall = incomingCall.type === "video";

  return (
    <Modal
      isOpen={!!incomingCall}
      onClose={() => declineCall(incomingCall.id)}
      showCloseButton={false}
      size="sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-6"
      >
        {/* Caller avatar with pulse animation */}
        <div className="relative inline-block mb-6">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-primary/30"
            style={{ margin: "-12px" }}
          />
          <Avatar
            src={caller?.avatar_url}
            alt={caller?.display_name || caller?.username || "Caller"}
            size="xl"
          />
        </div>

        {/* Caller info */}
        <h3 className="text-xl font-semibold text-text mb-1">
          {caller?.display_name || caller?.username || "Unknown"}
        </h3>
        <p className="text-text-muted mb-8">
          Incoming {isVideoCall ? "video" : "voice"} call...
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6">
          {/* Decline */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="danger"
              size="lg"
              onClick={() => declineCall(incomingCall.id)}
              className="rounded-full w-16 h-16"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Accept */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => joinCall(incomingCall.id)}
              className="rounded-full w-16 h-16"
            >
              {isVideoCall ? (
                <Video className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </Modal>
  );
}
