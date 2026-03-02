"use client";

import { useState } from "react";
import { Check, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { cn } from "@/lib/utils";
import type { UserStatusPreference } from "@/types/database";

/** Hardcoded status colors — never affected by themes */
const STATUS_COLORS: Record<string, { bg: string; glow: string }> = {
  online: { bg: "#00ff88", glow: "0 0 6px rgba(0,255,136,0.6)" },
  away: { bg: "#ffaa00", glow: "0 0 6px rgba(255,170,0,0.6)" },
  dnd: { bg: "#ff4444", glow: "0 0 6px rgba(255,68,68,0.6)" },
  offline: { bg: "#5a5a6a", glow: "none" },
  auto: { bg: "#00ff88", glow: "0 0 6px rgba(0,255,136,0.6)" },
};

const STATUS_OPTIONS: {
  value: UserStatusPreference;
  label: string;
  description: string;
  statusKey: string;
  showDuration?: boolean;
}[] = [
  {
    value: "online",
    label: "Online",
    description: "Show as online",
    statusKey: "online",
  },
  {
    value: "away",
    label: "Away",
    description: "Show as away",
    statusKey: "away",
  },
  {
    value: "dnd",
    label: "Do Not Disturb",
    description: "Mute notifications",
    statusKey: "dnd",
  },
  {
    value: "offline",
    label: "Appear Offline",
    description: "Hide your online status",
    statusKey: "offline",
    showDuration: true,
  },
];

const DURATION_OPTIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "Until I change it", minutes: undefined },
];

interface StatusSelectorProps {
  /** Size variant — matches avatar sizes for proper positioning */
  size?: "sm" | "md" | "lg";
}

const DOT_SIZES = {
  sm: { width: 14, height: 14, border: 1.5 },
  md: { width: 16, height: 16, border: 2 },
  lg: { width: 18, height: 18, border: 2 },
};

export function StatusSelector({ size = "lg" }: StatusSelectorProps) {
  const { myStatusPreference, myStatus, setMyStatus } = usePresence();
  const [open, setOpen] = useState(false);
  const [showDurations, setShowDurations] = useState(false);

  const handleSelect = async (
    status: UserStatusPreference,
    durationMinutes?: number
  ) => {
    await setMyStatus(status, durationMinutes);
    setOpen(false);
    setShowDurations(false);
  };

  const colorKey = myStatus || myStatusPreference || "online";
  const colors = STATUS_COLORS[colorKey] || STATUS_COLORS.online;
  const dims = DOT_SIZES[size];

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setShowDurations(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="absolute z-20 cursor-pointer hover:scale-125 transition-transform focus:outline-none"
          style={{
            bottom: -2,
            right: -2,
            width: dims.width,
            height: dims.height,
            borderRadius: "50%",
            border: `${dims.border}px solid var(--background, #0a0a0f)`,
            padding: 0,
            background: "transparent",
          }}
          aria-label="Change status"
        >
          <span
            className="block w-full h-full rounded-full"
            style={{
              backgroundColor: colors.bg,
              boxShadow: colors.glow,
            }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-60 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1.5">
          Set Status
        </div>

        {!showDurations ? (
          <div className="space-y-0.5">
            {STATUS_OPTIONS.map((option) => {
              const isActive =
                myStatusPreference === option.value ||
                (myStatusPreference === "auto" && option.value === "online");
              const optColors = STATUS_COLORS[option.statusKey];

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (option.showDuration) {
                      setShowDurations(true);
                    } else {
                      handleSelect(option.value);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-zinc-800",
                    isActive && "bg-zinc-800"
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: optColors.bg }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">{option.label}</div>
                    <div className="text-xs text-zinc-400">
                      {option.description}
                    </div>
                  </div>
                  {isActive && !option.showDuration && (
                    <Check className="h-4 w-4 text-green-400 shrink-0" />
                  )}
                  {option.showDuration && (
                    <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Auto option — shown when user has manually set a status */}
            {myStatusPreference !== "auto" && (
              <>
                <div className="h-px bg-zinc-700 my-1" />
                <button
                  onClick={() => handleSelect("auto")}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-zinc-800"
                >
                  <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">Auto</div>
                    <div className="text-xs text-zinc-400">
                      Let the system decide
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        ) : (
          /* Duration sub-menu for "Appear Offline" */
          <div className="space-y-0.5">
            <button
              onClick={() => setShowDurations(false)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div className="h-px bg-zinc-700 my-1" />
            <div className="text-xs text-zinc-400 px-2 py-1">
              Appear offline for...
            </div>
            {DURATION_OPTIONS.map((dur) => (
              <button
                key={dur.label}
                onClick={() => handleSelect("offline", dur.minutes)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-zinc-800"
              >
                <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="text-white">{dur.label}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
