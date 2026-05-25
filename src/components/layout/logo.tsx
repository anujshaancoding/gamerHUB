"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className, showText = true, size = "md", href = "/" }: LogoProps) {
  const iconSizes = {
    sm: 28,
    md: 32,
    lg: 48,
  };

  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-lg", badge: "text-[8px] px-1 py-px" },
    md: { icon: "h-8 w-8", text: "text-xl", badge: "text-[9px] px-1.5 py-0.5" },
    lg: { icon: "h-12 w-12", text: "text-3xl", badge: "text-xs px-2 py-0.5" },
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
        <div className="flex items-center gap-1.5">
          <span className={cn(sizes[size].text, "font-bold tracking-tight leading-none")}>
            <span className="text-primary text-glow-primary">gg</span>
            <span className="text-text">Lobby</span>
          </span>
          <span
            className={cn(
              sizes[size].badge,
              "rounded-md border border-primary/40 bg-primary/10 text-primary font-bold uppercase tracking-wider leading-none",
            )}
          >
            Beta
          </span>
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
