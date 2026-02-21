"use client";

import { createContext, useContext, useMemo } from "react";
import { getGameTheme, type GameTheme } from "@/lib/constants/game-themes";

interface GameThemeContextValue {
  theme: GameTheme;
  gameSlug: string | null;
}

const GameThemeContext = createContext<GameThemeContextValue>({
  theme: getGameTheme(),
  gameSlug: null,
});

export function useGameTheme() {
  return useContext(GameThemeContext);
}

interface GameThemeProviderProps {
  gameSlug?: string | null;
  children: React.ReactNode;
}

export function GameThemeProvider({ gameSlug, children }: GameThemeProviderProps) {
  const theme = useMemo(() => getGameTheme(gameSlug), [gameSlug]);

  const cssVars = useMemo(
    () =>
      ({
        "--theme-primary": theme.colors.primary,
        "--theme-secondary": theme.colors.secondary,
        "--theme-accent": theme.colors.accent,
        "--theme-background": theme.colors.background,
        "--theme-card-border": theme.colors.cardBorder,
        "--theme-text-accent": theme.colors.textAccent,
        "--theme-glow": theme.colors.glow,
        "--theme-gradient-bg": theme.gradient.background,
        "--theme-gradient-card": theme.gradient.card,
        "--theme-gradient-accent": theme.gradient.accent,
      }) as React.CSSProperties,
    [theme]
  );

  return (
    <GameThemeContext.Provider value={{ theme, gameSlug: gameSlug ?? null }}>
      <div className="relative" style={cssVars}>
        {/* Game watermark background */}
        {theme.watermark.iconPath && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden z-0"
            aria-hidden="true"
          >
            <div
              className={`absolute ${
                theme.watermark.position === "bottom-right"
                  ? "bottom-0 right-0 translate-x-1/4 translate-y-1/4"
                  : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              }`}
              style={{ opacity: theme.watermark.opacity }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme.watermark.iconPath}
                alt=""
                className="w-[500px] h-[500px] select-none"
                style={{ filter: `brightness(0) invert(1)` }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* Themed content */}
        <div className="relative z-10">{children}</div>
      </div>
    </GameThemeContext.Provider>
  );
}
