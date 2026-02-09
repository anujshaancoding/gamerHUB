"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accessibility,
  Eye,
  Volume2,
  Keyboard,
  MessageSquare,
  Brain,
  RotateCcw,
  ChevronDown,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/lib/hooks/useAccessibility";
import {
  COLOR_BLIND_FILTERS,
  CUSTOM_FONTS,
  type ColorBlindMode,
  type CustomFont,
  type CaptionSize,
} from "@/types/accessibility";

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Section = "visual" | "audio" | "input" | "communication" | "cognitive";

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const {
    settings,
    updateSettings,
    isUpdating,
    resetSettings,
    isResetting,
    getVoices,
  } = useAccessibility();
  const [activeSection, setActiveSection] = useState<Section>("visual");

  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "visual", label: "Visual", icon: Eye },
    { id: "audio", label: "Audio", icon: Volume2 },
    { id: "input", label: "Input", icon: Keyboard },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "cognitive", label: "Cognitive", icon: Brain },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 20 }}
          className="relative ml-auto w-full max-w-lg bg-card border-l border-border shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Accessibility</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetSettings()}
                disabled={isResetting}
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </Button>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex overflow-x-auto border-b border-border">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto">
            {/* Visual Settings */}
            {activeSection === "visual" && (
              <>
                <SettingToggle
                  label="High Contrast Mode"
                  description="Increase contrast for better visibility"
                  checked={settings.high_contrast_mode}
                  onChange={(checked) =>
                    updateSettings({ high_contrast_mode: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Reduce Motion"
                  description="Minimize animations and transitions"
                  checked={settings.reduce_motion}
                  onChange={(checked) =>
                    updateSettings({ reduce_motion: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Large Text"
                  description="Increase text size throughout the app"
                  checked={settings.large_text}
                  onChange={(checked) =>
                    updateSettings({ large_text: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingSlider
                  label="Text Scale"
                  value={settings.text_scale}
                  min={0.75}
                  max={2}
                  step={0.05}
                  onChange={(value) => updateSettings({ text_scale: value })}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                  disabled={isUpdating}
                />

                <SettingSelect
                  label="Color Blind Mode"
                  description="Apply color filters for color vision deficiency"
                  value={settings.color_blind_mode || ""}
                  options={[
                    { value: "", label: "None" },
                    ...Object.entries(COLOR_BLIND_FILTERS).map(
                      ([key, config]) => ({
                        value: key,
                        label: config.name,
                        description: config.description,
                      })
                    ),
                  ]}
                  onChange={(value) =>
                    updateSettings({
                      color_blind_mode: (value as ColorBlindMode) || null,
                    })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Dyslexia-Friendly Font"
                  description="Use OpenDyslexic font throughout the app"
                  checked={settings.dyslexia_font}
                  onChange={(checked) =>
                    updateSettings({ dyslexia_font: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingSelect
                  label="Custom Font"
                  value={settings.custom_font || ""}
                  options={[
                    { value: "", label: "Default" },
                    ...Object.entries(CUSTOM_FONTS).map(([key, config]) => ({
                      value: key,
                      label: config.name,
                      description: config.description,
                    })),
                  ]}
                  onChange={(value) =>
                    updateSettings({
                      custom_font: (value as CustomFont) || null,
                    })
                  }
                  disabled={isUpdating}
                />
              </>
            )}

            {/* Audio Settings */}
            {activeSection === "audio" && (
              <>
                <SettingSlider
                  label="Sound Effects Volume"
                  value={settings.sound_effects_volume}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) =>
                    updateSettings({ sound_effects_volume: value })
                  }
                  formatValue={(v) => `${v}%`}
                  disabled={isUpdating}
                />

                <SettingSlider
                  label="Voice Chat Volume"
                  value={settings.voice_chat_volume}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(value) =>
                    updateSettings({ voice_chat_volume: value })
                  }
                  formatValue={(v) => `${v}%`}
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Notification Sounds"
                  description="Play sounds for notifications"
                  checked={settings.notification_sounds}
                  onChange={(checked) =>
                    updateSettings({ notification_sounds: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Audio Descriptions"
                  description="Narrate visual content"
                  checked={settings.audio_descriptions}
                  onChange={(checked) =>
                    updateSettings({ audio_descriptions: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Screen Reader Optimized"
                  description="Optimize layout for screen readers"
                  checked={settings.screen_reader_optimized}
                  onChange={(checked) =>
                    updateSettings({ screen_reader_optimized: checked })
                  }
                  disabled={isUpdating}
                />
              </>
            )}

            {/* Input Settings */}
            {activeSection === "input" && (
              <>
                <SettingToggle
                  label="Keyboard-Only Mode"
                  description="Optimize for keyboard navigation"
                  checked={settings.keyboard_only_mode}
                  onChange={(checked) =>
                    updateSettings({ keyboard_only_mode: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Focus Indicators"
                  description="Show visible focus outlines"
                  checked={settings.focus_indicators}
                  onChange={(checked) =>
                    updateSettings({ focus_indicators: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingSlider
                  label="Input Delay"
                  description="Add delay between inputs to prevent accidental clicks"
                  value={settings.input_delay_ms}
                  min={0}
                  max={500}
                  step={50}
                  onChange={(value) =>
                    updateSettings({ input_delay_ms: value })
                  }
                  formatValue={(v) => `${v}ms`}
                  disabled={isUpdating}
                />
              </>
            )}

            {/* Communication Settings */}
            {activeSection === "communication" && (
              <>
                <SettingToggle
                  label="Auto Captions"
                  description="Show captions for voice chat and videos"
                  checked={settings.auto_captions}
                  onChange={(checked) =>
                    updateSettings({ auto_captions: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingSelect
                  label="Caption Size"
                  value={settings.caption_size}
                  options={[
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                    { value: "extra_large", label: "Extra Large" },
                  ]}
                  onChange={(value) =>
                    updateSettings({ caption_size: value as CaptionSize })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Text-to-Speech"
                  description="Read text content aloud"
                  checked={settings.tts_enabled}
                  onChange={(checked) =>
                    updateSettings({ tts_enabled: checked })
                  }
                  disabled={isUpdating}
                />

                {settings.tts_enabled && (
                  <SettingSlider
                    label="Speech Rate"
                    value={settings.tts_rate}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onChange={(value) => updateSettings({ tts_rate: value })}
                    formatValue={(v) => `${v}x`}
                    disabled={isUpdating}
                  />
                )}
              </>
            )}

            {/* Cognitive Settings */}
            {activeSection === "cognitive" && (
              <>
                <SettingToggle
                  label="Simplified UI"
                  description="Show a simpler, less cluttered interface"
                  checked={settings.simplified_ui}
                  onChange={(checked) =>
                    updateSettings({ simplified_ui: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Reading Guide"
                  description="Show a guide line that follows your cursor"
                  checked={settings.reading_guide}
                  onChange={(checked) =>
                    updateSettings({ reading_guide: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Content Warnings"
                  description="Show warnings for potentially sensitive content"
                  checked={settings.content_warnings_enabled}
                  onChange={(checked) =>
                    updateSettings({ content_warnings_enabled: checked })
                  }
                  disabled={isUpdating}
                />

                <SettingToggle
                  label="Flashing Content Warning"
                  description="Warn before showing flashing or strobing content"
                  checked={settings.flashing_content_warning}
                  onChange={(checked) =>
                    updateSettings({ flashing_content_warning: checked })
                  }
                  disabled={isUpdating}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper Components

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: SettingToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

function SettingSlider({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (v) => v.toString(),
  disabled,
}: SettingSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{label}</div>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        <span className="text-sm font-medium">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full accent-primary"
      />
    </div>
  );
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string; description?: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function SettingSelect({
  label,
  description,
  value,
  options,
  onChange,
  disabled,
}: SettingSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-input bg-background text-sm"
        >
          <span>{options.find((o) => o.value === value)?.label || "Select..."}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 py-1 rounded-lg border border-border bg-card shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted"
              >
                <div>
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                </div>
                {value === option.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
