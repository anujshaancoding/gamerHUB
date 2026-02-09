"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, Gamepad2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

function GhostController() {
  return (
    <motion.svg
      width="220"
      height="220"
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ y: 0 }}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Ghost body */}
      <motion.path
        d="M110 30C65.8 30 30 65.8 30 110v60c0 0 0 20 20 20s20-15 20-15 0 15 20 15 20-15 20-15 0 15 20 15 20-15 20-15 0 15 20 15 20-20 20-20v-60c0-44.2-35.8-80-80-80z"
        fill="url(#ghostGradient)"
        opacity="0.9"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ghost eyes */}
      <motion.circle
        cx="85"
        cy="105"
        r="14"
        fill="#0a0a0f"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />
      <motion.circle
        cx="135"
        cy="105"
        r="14"
        fill="#0a0a0f"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />

      {/* Eye glow */}
      <circle cx="85" cy="105" r="7" fill="#00ff88" opacity="0.8" />
      <circle cx="135" cy="105" r="7" fill="#00ff88" opacity="0.8" />

      {/* Controller in ghost's hands */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "110px 155px" }}
      >
        <rect x="75" y="145" width="70" height="30" rx="15" fill="#1a1a2e" stroke="#00d4ff" strokeWidth="2" />
        {/* D-pad */}
        <rect x="88" y="153" width="4" height="12" rx="1" fill="#00d4ff" />
        <rect x="83" y="157" width="14" height="4" rx="1" fill="#00d4ff" />
        {/* Buttons */}
        <circle cx="125" cy="155" r="3" fill="#00ff88" />
        <circle cx="133" cy="159" r="3" fill="#ff00ff" />
        <circle cx="125" cy="163" r="3" fill="#00d4ff" />
      </motion.g>

      {/* Glow filter */}
      <defs>
        <linearGradient id="ghostGradient" x1="110" y1="30" x2="110" y2="210" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2a2a4a" />
          <stop offset="1" stopColor="#1a1a2e" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </motion.svg>
  );
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Ghost SVG */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GhostController />
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-7xl font-black tracking-tighter mb-2">
            <span className="text-glow-primary text-primary">4</span>
            <span className="text-text-muted">0</span>
            <span className="text-glow-primary text-primary">4</span>
          </h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-text mb-3">
            Player Disconnected
          </h2>
          <p className="text-text-muted mb-8 leading-relaxed">
            Looks like this page rage-quit the server. It either never existed, was moved, or respawned somewhere else.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href="/">
            <Button
              size="lg"
              className="bg-primary text-black font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Back to Lobby
            </Button>
          </Link>
          <Link href="/find-gamers">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              leftIcon={<Search className="w-4 h-4" />}
            >
              Find Gamers
            </Button>
          </Link>
        </motion.div>

        {/* Fun tip */}
        <motion.p
          className="mt-10 text-xs text-text-muted/60 flex items-center justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          Pro tip: Check the URL — typos happen even to the best gamers
        </motion.p>
      </div>
    </div>
  );
}
