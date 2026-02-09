"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAccessibility } from "@/lib/hooks/useAccessibility";
import type { AccessibilitySettings } from "@/types/accessibility";
import { ColorBlindFilters } from "./ColorBlindFilters";

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<AccessibilitySettings>) => Promise<AccessibilitySettings>;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const accessibility = useAccessibility();

  // Handle keyboard navigation
  useEffect(() => {
    if (!accessibility.settings.keyboard_only_mode) return;

    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        document.body.classList.add("user-is-tabbing");
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove("user-is-tabbing");
    };

    window.addEventListener("keydown", handleFirstTab);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleFirstTab);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [accessibility.settings.keyboard_only_mode]);

  // Handle flashing content warning
  useEffect(() => {
    if (!accessibility.settings.flashing_content_warning) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Could be used to warn about flashing content in linked pages
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [accessibility.settings.flashing_content_warning]);

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;

    // Caption size
    const captionSizes = {
      small: "0.875rem",
      medium: "1rem",
      large: "1.25rem",
      extra_large: "1.5rem",
    };
    root.style.setProperty(
      "--caption-size",
      captionSizes[accessibility.settings.caption_size] || "1rem"
    );

    // Input delay
    if (accessibility.settings.input_delay_ms > 0) {
      root.style.setProperty(
        "--input-delay",
        `${accessibility.settings.input_delay_ms}ms`
      );
    }
  }, [accessibility.settings]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings: accessibility.settings,
        isLoading: accessibility.isLoading,
        updateSettings: accessibility.updateSettings,
        speak: accessibility.speak,
        stopSpeaking: accessibility.stopSpeaking,
      }}
    >
      {/* SVG Filters for color blindness */}
      <ColorBlindFilters />

      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Reading guide overlay */}
      {accessibility.settings.reading_guide && <ReadingGuide />}

      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibilityContext must be used within AccessibilityProvider"
    );
  }
  return context;
}

// Reading guide component
function ReadingGuide() {
  useEffect(() => {
    const guide = document.createElement("div");
    guide.id = "reading-guide";
    guide.className =
      "fixed left-0 right-0 h-8 pointer-events-none z-[9999] border-y-2 border-primary/50 bg-primary/5";
    guide.style.top = "50%";
    guide.style.transform = "translateY(-50%)";
    document.body.appendChild(guide);

    const handleMouseMove = (e: MouseEvent) => {
      guide.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      guide.remove();
    };
  }, []);

  return null;
}

// Announcer for screen readers
interface AnnouncerProps {
  message: string;
  politeness?: "polite" | "assertive";
}

export function ScreenReaderAnnouncer({
  message,
  politeness = "polite",
}: AnnouncerProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Focus trap component
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return <>{children}</>;
}
