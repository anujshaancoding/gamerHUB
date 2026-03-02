"use client";

interface CustomColorTheme {
  primary: string;
  secondary: string;
  accent: string;
}

function isValidHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function parseTheme(raw: unknown): CustomColorTheme | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;

  if (!isValidHex(obj.primary) || !isValidHex(obj.secondary) || !isValidHex(obj.accent)) {
    return null;
  }

  return {
    primary: obj.primary,
    secondary: obj.secondary,
    accent: obj.accent,
  };
}

interface CustomThemeLayerProps {
  theme: unknown;
}

export function CustomThemeLayer({ theme }: CustomThemeLayerProps) {
  const parsed = parseTheme(theme);

  if (!parsed) return null;

  const css = `
    :root {
      --theme-primary: ${parsed.primary};
      --theme-secondary: ${parsed.secondary};
      --theme-accent: ${parsed.accent};
      --theme-glow: ${parsed.primary}66;
      --theme-text-accent: ${parsed.primary};
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
