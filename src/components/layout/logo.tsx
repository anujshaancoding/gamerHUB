"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function BetaInfoIcon({ size }: { size: "sm" | "md" | "lg" }) {
  const [show, setShow] = useState(false);
  const iconSize = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button
        type="button"
        className="flex items-center justify-center text-warning/70 hover:text-warning transition-colors"
        onClick={() => setShow((v) => !v)}
        aria-label="Beta information"
      >
        <AlertTriangle className={iconSize} />
      </button>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-surface border border-border rounded-lg shadow-lg p-3 z-50 text-left">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-l border-t border-border rotate-45" />
          <p className="text-xs text-warning font-semibold mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Beta Version
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            This website is currently in the testing/beta phase and may experience failures or crashes. If you encounter any issues, please report them at{" "}
            <a href="mailto:support@gglobby.in" className="text-primary hover:underline font-medium">
              support@gglobby.in
            </a>{" "}
            or fill out the feedback form on the bottom right corner of the page.
          </p>
        </div>
      )}
    </div>
  );
}

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className, showText = true, size = "md", href = "/community" }: LogoProps) {
  const iconSizes = {
    sm: 28,
    md: 32,
    lg: 48,
  };

  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-12 w-12", text: "text-3xl" },
  };

  const logo = (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/icons/icon.svg"
        alt="ggLobby"
        width={iconSizes[size]}
        height={iconSizes[size]}
        className={sizes[size].icon}
        priority
      />

      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={cn(sizes[size].text, "font-bold tracking-tight")}>
            <span className="text-primary text-glow-primary">gg</span>
            <span className="text-text">Lobby</span>
          </span>
          <span className="text-[10px] font-semibold text-warning bg-warning/15 px-1.5 py-0.5 rounded-full leading-none uppercase tracking-wide">
            Beta
          </span>
          <BetaInfoIcon size={size} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center flex-shrink-0">
        {logo}
      </Link>
    );
  }

  return logo;
}
