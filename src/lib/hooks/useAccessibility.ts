import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import type {
  AccessibilitySettings,
  UpdateAccessibilitySettingsRequest,
} from "@/types/accessibility";
import { DEFAULT_ACCESSIBILITY_SETTINGS } from "@/types/accessibility";

const ACCESSIBILITY_KEY = ["accessibility", "settings"] as const;

async function fetchAccessibilitySettings(): Promise<AccessibilitySettings> {
  const response = await fetch("/api/accessibility");
  if (!response.ok) {
    throw new Error("Failed to fetch accessibility settings");
  }
  const data = await response.json();
  return data.settings;
}

async function updateAccessibilitySettings(
  updates: UpdateAccessibilitySettingsRequest
): Promise<AccessibilitySettings> {
  const response = await fetch("/api/accessibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update accessibility settings");
  }
  const data = await response.json();
  return data.settings;
}

async function resetAccessibilitySettings(): Promise<AccessibilitySettings> {
  const response = await fetch("/api/accessibility", { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Failed to reset accessibility settings");
  }
  const data = await response.json();
  return data.settings;
}

export function useAccessibility() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ACCESSIBILITY_KEY,
    queryFn: fetchAccessibilitySettings,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const updateMutation = useMutation({
    mutationFn: updateAccessibilitySettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(ACCESSIBILITY_KEY, settings);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetAccessibilitySettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(ACCESSIBILITY_KEY, settings);
    },
  });

  const settings = settingsQuery.data || DEFAULT_ACCESSIBILITY_SETTINGS;

  // Apply settings to document
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // High contrast mode
    root.classList.toggle("high-contrast", settings.high_contrast_mode === true);

    // Reduce motion
    root.classList.toggle("reduce-motion", settings.reduce_motion === true);

    // Large text
    root.classList.toggle("large-text", settings.large_text === true);

    // Text scale
    if (typeof settings.text_scale === "number") {
      root.style.setProperty("--text-scale", settings.text_scale.toString());
    }

    // Dyslexia font
    root.classList.toggle("dyslexia-font", settings.dyslexia_font === true);

    // Custom font
    if (settings.custom_font) {
      root.setAttribute("data-font", settings.custom_font);
    } else {
      root.removeAttribute("data-font");
    }

    // Color blind mode
    if (settings.color_blind_mode) {
      root.setAttribute("data-color-blind", settings.color_blind_mode);
    } else {
      root.removeAttribute("data-color-blind");
    }

    // Keyboard only mode
    root.classList.toggle("keyboard-only", settings.keyboard_only_mode === true);

    // Focus indicators
    root.classList.toggle("focus-visible-only", settings.focus_indicators !== true);

    // Simplified UI
    root.classList.toggle("simplified-ui", settings.simplified_ui === true);

    // Screen reader optimized
    root.classList.toggle("sr-optimized", settings.screen_reader_optimized === true);

    return () => {
      // Cleanup
      root.classList.remove(
        "high-contrast",
        "reduce-motion",
        "large-text",
        "dyslexia-font",
        "keyboard-only",
        "focus-visible-only",
        "simplified-ui",
        "sr-optimized"
      );
      root.style.removeProperty("--text-scale");
      root.removeAttribute("data-font");
      root.removeAttribute("data-color-blind");
    };
  }, [settings]);

  // Text-to-speech helper
  const speak = useCallback(
    (text: string) => {
      if (!settings.tts_enabled) return;

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = settings.tts_rate || 1.0;

        if (settings.tts_voice) {
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find((v) => v.name === settings.tts_voice);
          if (voice) utterance.voice = voice;
        }

        window.speechSynthesis.speak(utterance);
      }
    },
    [settings.tts_enabled, settings.tts_rate, settings.tts_voice]
  );

  // Stop speech
  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Get available TTS voices
  const getVoices = useCallback(() => {
    if ("speechSynthesis" in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  }, []);

  return {
    settings: settings as AccessibilitySettings,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,

    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    resetSettings: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,

    // Helpers
    speak,
    stopSpeaking,
    getVoices,

    // Quick toggles
    toggleHighContrast: () =>
      updateMutation.mutate({ high_contrast_mode: !settings.high_contrast_mode }),
    toggleReduceMotion: () =>
      updateMutation.mutate({ reduce_motion: !settings.reduce_motion }),
    toggleLargeText: () =>
      updateMutation.mutate({ large_text: !settings.large_text }),
    toggleDyslexiaFont: () =>
      updateMutation.mutate({ dyslexia_font: !settings.dyslexia_font }),
    toggleTTS: () =>
      updateMutation.mutate({ tts_enabled: !settings.tts_enabled }),
    toggleCaptions: () =>
      updateMutation.mutate({ auto_captions: !settings.auto_captions }),
  };
}

// Simpler hook for just checking if motion should be reduced
export function useReducedMotion(): boolean {
  const { settings } = useAccessibility();

  // Also check system preference
  const systemPrefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  return settings.reduce_motion || systemPrefersReducedMotion;
}

// Hook for checking high contrast preference
export function useHighContrast(): boolean {
  const { settings } = useAccessibility();

  const systemPrefersHighContrast =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-contrast: more)").matches
      : false;

  return settings.high_contrast_mode || systemPrefersHighContrast;
}
