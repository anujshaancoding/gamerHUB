"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import { cn, generateAvatarFallback } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  status?: "online" | "offline" | "away" | "dnd";
  showStatus?: boolean;
  frameStyle?: "none" | "default" | "epic" | "legendary" | "mythic" | "rgb";
  glowColor?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = "Avatar",
      fallback,
      size = "md",
      status,
      showStatus = false,
      frameStyle = "none",
      glowColor,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const sizes = {
      xs: "h-6 w-6 text-xs",
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
      "2xl": "h-24 w-24 text-2xl",
      "3xl": "h-32 w-32 text-3xl",
      "4xl": "h-40 w-40 text-4xl",
      "5xl": "h-48 w-48 text-5xl",
    };

    const imageSizes: Record<string, string> = {
      xs: "24px",
      sm: "32px",
      md: "40px",
      lg: "48px",
      xl: "64px",
      "2xl": "96px",
      "3xl": "128px",
      "4xl": "160px",
      "5xl": "192px",
    };

    const statusSizes = {
      xs: "h-2 w-2",
      sm: "h-2.5 w-2.5",
      md: "h-3 w-3",
      lg: "h-3.5 w-3.5",
      xl: "h-4 w-4",
      "2xl": "h-5 w-5",
      "3xl": "h-6 w-6",
      "4xl": "h-7 w-7",
      "5xl": "h-8 w-8",
    };

    const statusColors = {
      online: "bg-success",
      offline: "bg-text-dim",
      away: "bg-warning",
      dnd: "bg-error",
    };

    const frameStyles = {
      none: "",
      default: "ring-2 ring-border",
      epic: "ring-4 ring-purple-500 shadow-lg shadow-purple-500/50",
      legendary: "ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse-subtle",
      mythic: "ring-4 ring-gradient-mythic shadow-xl shadow-pink-500/30",
      rgb: "avatar-rgb-border",
    };

    const displayFallback = fallback || generateAvatarFallback(alt);

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-block rounded-full",
          frameStyle === "rgb" && "avatar-rgb-wrapper",
          className
        )}
        {...props}
      >
        {/* RGB animated border container */}
        {frameStyle === "rgb" && (
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-spin-slow opacity-75 blur-sm" />
        )}

        {/* Mythic animated border */}
        {frameStyle === "mythic" && (
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-gradient-xy opacity-80" />
        )}

        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-light font-medium text-text-secondary",
            sizes[size],
            frameStyles[frameStyle],
            frameStyle !== "none" && frameStyle !== "rgb" && frameStyle !== "mythic" && "z-10"
          )}
          style={glowColor ? { boxShadow: `0 0 30px ${glowColor}` } : undefined}
        >
          {src && !imageError ? (
            <Image
              src={src}
              alt={alt}
              fill
              sizes={imageSizes[size]}
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : fallback ? (
            <span>{displayFallback}</span>
          ) : (
            <Image
              src="/images/defaults/avatar.svg"
              alt={alt}
              fill
              sizes={imageSizes[size]}
              className="object-cover"
            />
          )}
        </div>
        {showStatus && status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full border-2 border-background z-20",
              statusSizes[size],
              statusColors[status],
              status === "online" && "animate-pulse"
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
