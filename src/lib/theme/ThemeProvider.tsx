"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Theme, THEMES, DEFAULT_THEME, getThemeById, getGameTheme } from "./themes";

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  preferGameTheme: boolean;
  setPreferGameTheme: (prefer: boolean) => void;
  preferredGame: string | null;
  setPreferredGame: (gameSlug: string | null) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "gamerhub-theme";
const STORAGE_PREFER_GAME = "gamerhub-prefer-game-theme";
const STORAGE_PREFERRED_GAME = "gamerhub-preferred-game";

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;

  // Apply all theme colors as CSS variables
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--surface", theme.colors.surface);
  root.style.setProperty("--surface-light", theme.colors.surfaceLight);
  root.style.setProperty("--surface-lighter", theme.colors.surfaceLighter);
  root.style.setProperty("--border", theme.colors.border);
  root.style.setProperty("--border-light", theme.colors.borderLight);
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-dark", theme.colors.primaryDark);
  root.style.setProperty("--primary-glow", theme.colors.primaryGlow);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent-dark", theme.colors.accentDark);
  root.style.setProperty("--accent-glow", theme.colors.accentGlow);
  root.style.setProperty("--secondary", theme.colors.secondary);
  root.style.setProperty("--warning", theme.colors.warning);
  root.style.setProperty("--error", theme.colors.error);
  root.style.setProperty("--success", theme.colors.success);
  root.style.setProperty("--text", theme.colors.text);
  root.style.setProperty("--text-secondary", theme.colors.textSecondary);
  root.style.setProperty("--text-muted", theme.colors.textMuted);
  root.style.setProperty("--text-dim", theme.colors.textDim);
  root.style.setProperty("--foreground", theme.colors.foreground);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [preferGameTheme, setPreferGameThemeState] = useState(false);
  const [preferredGame, setPreferredGameState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedThemeId = localStorage.getItem(STORAGE_KEY);
    const storedPreferGame = localStorage.getItem(STORAGE_PREFER_GAME);
    const storedPreferredGame = localStorage.getItem(STORAGE_PREFERRED_GAME);

    if (storedPreferGame === "true") {
      setPreferGameThemeState(true);
      if (storedPreferredGame) {
        setPreferredGameState(storedPreferredGame);
        const gameTheme = getGameTheme(storedPreferredGame);
        if (gameTheme) {
          setThemeState(gameTheme);
          applyThemeToDOM(gameTheme);
        }
      }
    } else if (storedThemeId) {
      const theme = getThemeById(storedThemeId);
      setThemeState(theme);
      applyThemeToDOM(theme);
    } else {
      applyThemeToDOM(DEFAULT_THEME);
    }

    setMounted(true);
  }, []);

  const setTheme = useCallback((themeId: string) => {
    const newTheme = getThemeById(themeId);
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, themeId);
    applyThemeToDOM(newTheme);
  }, []);

  const setPreferGameTheme = useCallback((prefer: boolean) => {
    setPreferGameThemeState(prefer);
    localStorage.setItem(STORAGE_PREFER_GAME, prefer.toString());

    if (prefer && preferredGame) {
      const gameTheme = getGameTheme(preferredGame);
      if (gameTheme) {
        setThemeState(gameTheme);
        applyThemeToDOM(gameTheme);
      }
    } else if (!prefer) {
      const storedThemeId = localStorage.getItem(STORAGE_KEY);
      const theme = storedThemeId ? getThemeById(storedThemeId) : DEFAULT_THEME;
      setThemeState(theme);
      applyThemeToDOM(theme);
    }
  }, [preferredGame]);

  const setPreferredGame = useCallback((gameSlug: string | null) => {
    setPreferredGameState(gameSlug);
    if (gameSlug) {
      localStorage.setItem(STORAGE_PREFERRED_GAME, gameSlug);
      if (preferGameTheme) {
        const gameTheme = getGameTheme(gameSlug);
        if (gameTheme) {
          setThemeState(gameTheme);
          applyThemeToDOM(gameTheme);
        }
      }
    } else {
      localStorage.removeItem(STORAGE_PREFERRED_GAME);
    }
  }, [preferGameTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        preferGameTheme,
        setPreferGameTheme,
        preferredGame,
        setPreferredGame,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
