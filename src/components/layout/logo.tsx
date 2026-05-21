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
        <span className={cn(sizes[size].text, "font-bold tracking-tight leading-none")}>
          <span className="text-primary text-glow-primary">gg</span>
          <span className="text-text">Lobby</span>
        </span>
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
