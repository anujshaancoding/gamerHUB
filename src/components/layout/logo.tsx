"use client";

import { useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className, showText = true, size = "md", href = "/community" }: LogoProps) {
  const uid = useId();
  const gradId = `gg-g${uid}`;
  const glowId = `gg-w${uid}`;

  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-12 w-12", text: "text-3xl" },
  };

  const logo = (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        className={sizes[size].icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary, #00ff88)" />
            <stop offset="100%" stopColor="var(--accent, #00d4ff)" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer circle ring */}
        <circle
          cx="50"
          cy="54"
          r="40"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          fill="none"
        />

        {/* Ambient glow */}
        <circle cx="50" cy="48" r="36" fill={`url(#${gradId})`} opacity="0.07" />

        {/* Controller body - filled */}
        <path
          d="M30 36C30 30 34 26 40 26H60C66 26 70 30 70 36V44C70 50 68 55 64 58L56 64C53 66 47 66 44 64L36 58C32 55 30 50 30 44V36Z"
          fill={`url(#${gradId})`}
          opacity="0.12"
        />

        {/* Controller outline */}
        <path
          d="M30 36C30 30 34 26 40 26H60C66 26 70 30 70 36V44C70 50 68 55 64 58L56 64C53 66 47 66 44 64L36 58C32 55 30 50 30 44V36Z"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Left handle */}
        <path
          d="M36 58L28 64C25 67 23 71 23 76V81C23 83.5 25 85.5 27.5 85.5C30 85.5 32 83.5 32 81V75C32 73 33 71 34.5 69.5"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right handle */}
        <path
          d="M64 58L72 64C75 67 77 71 77 76V81C77 83.5 75 85.5 72.5 85.5C70 85.5 68 83.5 68 81V75C68 73 67 71 65.5 69.5"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* D-pad (cross shape) */}
        <rect x="36" y="42.5" width="10" height="3" rx="1" fill={`url(#${gradId})`} opacity="0.85" />
        <rect x="39.5" y="39" width="3" height="10" rx="1" fill={`url(#${gradId})`} opacity="0.85" />

        {/* Action buttons (diamond pattern) */}
        <circle cx="60" cy="36.5" r="2.5" fill={`url(#${gradId})`} opacity="0.85" />
        <circle cx="66" cy="42.5" r="2.5" fill={`url(#${gradId})`} opacity="0.85" />
        <circle cx="60" cy="48.5" r="2.5" fill={`url(#${gradId})`} opacity="0.85" />
        <circle cx="54" cy="42.5" r="2.5" fill={`url(#${gradId})`} opacity="0.85" />

        {/* Center LED indicator with glow */}
        <circle cx="50" cy="31" r="1.5" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />

        {/* Shine highlight */}
        <path
          d="M38 30C40 28 44 27 48 27C52 27 56 28 58 29"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.15"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(sizes[size].text, "font-bold tracking-tight")}>
            <span className="text-primary text-glow-primary">gg</span>
            <span className="text-text">Lobby</span>
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
