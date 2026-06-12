"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, MinusCircle, AlertTriangle } from "lucide-react";
import type { Verdict } from "@/lib/tracker/types";

const styles: Record<Verdict, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  strong: {
    label: "STRENGTH",
    cls: "bg-success/15 text-success border-success/30",
    Icon: CheckCircle2,
  },
  decent: {
    label: "DECENT",
    cls: "bg-warning/15 text-warning border-warning/30",
    Icon: MinusCircle,
  },
  weak: {
    label: "NEEDS PRACTICE",
    cls: "bg-error/15 text-error border-error/30",
    Icon: AlertTriangle,
  },
};

export function VerdictPill({ verdict, className }: { verdict: Verdict; className?: string }) {
  const { label, cls, Icon } = styles[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide",
        cls,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
