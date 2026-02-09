"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface QuestTimerProps {
  resetTime: string;
  className?: string;
  showIcon?: boolean;
}

export function QuestTimer({
  resetTime,
  className,
  showIcon = true,
}: QuestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const reset = new Date(resetTime).getTime();
      const diff = reset - now;

      if (diff <= 0) {
        setTimeRemaining("Resetting...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [resetTime]);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm text-text-muted",
        className
      )}
    >
      {showIcon && <Clock className="w-4 h-4" />}
      <span>{timeRemaining}</span>
    </div>
  );
}
