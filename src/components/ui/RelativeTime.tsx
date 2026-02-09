"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/utils";

interface RelativeTimeProps {
  date: Date | string;
  className?: string;
}

/**
 * A hydration-safe component for displaying relative time.
 * Shows a placeholder on server, then updates with actual time on client.
 */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a static placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formatRelativeTime(date)}</span>;
}
