"use client";

import { Check, Gamepad2, Palette } from "lucide-react";
import { useTheme, Theme, getThemesByCategory } from "@/lib/theme";
import { Card, Badge, LegacySelect as Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SUPPORTED_GAMES } from "@/lib/constants/games";

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all text-left",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Color preview bar */}
      <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.background }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.secondary }}
        />
      </div>

      {/* Theme info */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-text text-sm">{theme.name}</h4>
          <p className="text-xs text-text-muted mt-0.5">{theme.description}</p>
        </div>
        {theme.category === "game" && (
          <Badge variant="primary" size="sm">
            Game
          </Badge>
        )}
      </div>

      {/* Color dots */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: theme.colors.primary }}
          title="Primary"
        />
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: theme.colors.accent }}
          title="Accent"
        />
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: theme.colors.background }}
          title="Background"
        />
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-background" />
        </div>
      )}
    </button>
  );
}

export function ThemeSwitcher() {
  const {
    theme,
    setTheme,
    preferGameTheme,
    setPreferGameTheme,
    preferredGame,
    setPreferredGame,
  } = useTheme();

  const defaultThemes = getThemesByCategory("default");
  const classicThemes = getThemesByCategory("classic");
  const gameThemes = getThemesByCategory("game");

  const gameOptions = SUPPORTED_GAMES.map((game) => ({
    value: game.slug,
    label: game.name,
  }));

  return (
    <div className="space-y-8">
      {/* Prefer Game Theme Toggle */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-text">
                  Prefer Game-Based Theme
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  Automatically use a theme based on your favorite game
                </p>
              </div>
              <button
                onClick={() => setPreferGameTheme(!preferGameTheme)}
                className={cn(
                  "relative w-12 h-7 rounded-full transition-colors",
                  preferGameTheme ? "bg-primary" : "bg-surface-lighter"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                    preferGameTheme ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {preferGameTheme && (
              <div className="mt-4">
                <Select
                  label="Select your favorite game"
                  options={gameOptions}
                  value={preferredGame || ""}
                  onChange={(e) => setPreferredGame(e.target.value || null)}
                  placeholder="Choose a game..."
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Manual Theme Selection - hidden when prefer game theme is active */}
      {!preferGameTheme && (
        <>
          {/* Default Theme */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text">Default Theme</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isSelected={theme.id === t.id}
                  onSelect={() => setTheme(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Classic Themes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text">Classic Themes</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classicThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isSelected={theme.id === t.id}
                  onSelect={() => setTheme(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Game Themes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-5 h-5 text-warning" />
              <h3 className="font-semibold text-text">Game-Inspired Themes</h3>
              <Badge variant="secondary" size="sm">
                8 Games
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isSelected={theme.id === t.id}
                  onSelect={() => setTheme(t.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Show current theme when game preference is active */}
      {preferGameTheme && preferredGame && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text">Active Theme</h3>
          </div>
          <div className="max-w-sm">
            <ThemeCard
              theme={theme}
              isSelected={true}
              onSelect={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
