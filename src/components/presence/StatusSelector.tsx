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

const STATUS_OPTIONS: {
  value: UserStatusPreference;
  label: string;
  description: string;
  color: string;
  showDuration?: boolean;
}[] = [
  {
    value: "online",
    label: "Online",
    description: "Show as online",
    color: "bg-success",
  },
  {
    value: "away",
    label: "Away",
    description: "Show as away",
    color: "bg-warning",
  },
  {
    value: "dnd",
    label: "Do Not Disturb",
    description: "Mute notifications",
    color: "bg-error",
  },
  {
    value: "offline",
    label: "Appear Offline",
    description: "Hide your online status",
    color: "bg-text-dim",
    showDuration: true,
  },
];

const DURATION_OPTIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "Until I change it", minutes: undefined },
];

const STATUS_DOT_COLORS: Record<string, string> = {
  auto: "bg-success",
  online: "bg-success",
  away: "bg-warning",
  dnd: "bg-error",
  offline: "bg-text-dim",
};

export function StatusSelector() {
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

  const dotColor =
    STATUS_DOT_COLORS[myStatus] || STATUS_DOT_COLORS[myStatusPreference] || "bg-success";

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
          }}
          className="absolute bottom-0 right-0 rounded-full border-2 border-background z-20 h-3.5 w-3.5 cursor-pointer hover:scale-150 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
          aria-label="Change status"
        >
          <span
            className={cn(
              "block w-full h-full rounded-full",
              dotColor,
              myStatus === "online" && "animate-pulse"
            )}
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
                    className={cn(
                      "w-3 h-3 rounded-full shrink-0",
                      option.color
                    )}
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
