"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Sparkles,
  Palette,
  Image,
  Music,
  Layers,
  Gift,
  MousePointer,
  Code,
  ChevronDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { ColorThemeEditor } from "./color-theme-editor";
import { EffectSelector } from "./effect-selector";
import { BackgroundSelector } from "./background-selector";
import { MusicWidgetEditor } from "./music-widget-editor";
import { SkinSelector } from "./skin-selector";
import { EasterEggEditor } from "./easter-egg-editor";
import { HoverCardEditor } from "./hover-card-editor";
import { CustomCssEditor } from "./custom-css-editor";
import { FeatureFlag } from "./feature-flag";
import { isFeatureEnabled } from "@/lib/config/profile-features";
import { PremiumFeatureGate } from "@/components/premium";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomizationTabProps {
  profile: {
    custom_theme?: unknown;
    profile_effect?: unknown;
    profile_background?: unknown;
    profile_music_url?: unknown;
    widget_layout?: unknown;
    profile_skin?: unknown;
    easter_egg_config?: unknown;
    hover_card_config?: unknown;
    custom_css?: unknown;
  };
  isPremium: boolean;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
}

interface SectionDef {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  premium?: boolean;
  featureFlag?: boolean; // true means gated behind isFeatureEnabled("customCSS")
}

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

const SECTIONS: SectionDef[] = [
  {
    id: "color_theme",
    icon: Palette,
    title: "Color Theme",
    description: "Set primary, secondary, and accent colors for your profile",
  },
  {
    id: "profile_effects",
    icon: Sparkles,
    title: "Profile Effects",
    description: "Add particle effects and visual flair to your profile",
  },
  {
    id: "animated_backgrounds",
    icon: Image,
    title: "Animated Backgrounds",
    description: "Choose a dynamic animated background for your profile",
    premium: true,
  },
  {
    id: "theme_song",
    icon: Music,
    title: "Theme Song",
    description: "Set a YouTube track as your profile theme song",
    premium: true,
  },
  {
    id: "profile_skin",
    icon: Layers,
    title: "Profile Skin",
    description: "Apply a complete visual skin to your profile layout",
  },
  {
    id: "easter_eggs",
    icon: Gift,
    title: "Easter Eggs",
    description: "Hide a secret surprise for visitors to discover",
  },
  {
    id: "hover_card",
    icon: MousePointer,
    title: "Hover Card",
    description: "Customize the card shown when someone hovers your name",
  },
  {
    id: "custom_css",
    icon: Code,
    title: "Custom CSS",
    description: "Write your own CSS to fully customize your profile",
    premium: true,
    featureFlag: true,
  },
];

// ---------------------------------------------------------------------------
// Saved toast
// ---------------------------------------------------------------------------

function StatusToast({ status }: { status: "saved" | "error" | null }) {
  return (
    <AnimatePresence>
      {status && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-lg ${
            status === "saved"
              ? "bg-green-500/90 shadow-green-500/20"
              : "bg-red-500/90 shadow-red-500/20"
          }`}
        >
          {status === "saved" ? (
            <><Check className="h-3.5 w-3.5" /> Saved</>
          ) : (
            <><AlertCircle className="h-3.5 w-3.5" /> Failed to save</>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Accordion section
// ---------------------------------------------------------------------------

function AccordionSection({
  section,
  isOpen,
  onToggle,
  children,
}: {
  section: SectionDef;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = section.icon;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors hover:border-white/15">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
          <Icon className="h-4.5 w-4.5 text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{section.title}</h3>
          <p className="text-xs text-white/50 truncate">{section.description}</p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 text-white/40" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CustomizationTab({
  profile,
  isPremium,
  onSave,
}: CustomizationTabProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [toastStatus, setToastStatus] = useState<"saved" | "error" | null>(null);

  // Toggle accordion
  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Persist handler — calls onSave and shows status toast
  const handleSave = useCallback(
    async (field: string, value: unknown) => {
      try {
        await onSave({ [field]: value });
        setToastStatus("saved");
      } catch {
        setToastStatus("error");
      } finally {
        setTimeout(() => setToastStatus(null), 2000);
      }
    },
    [onSave],
  );

  // -----------------------------------------------------------------------
  // Render helpers for each section's content
  // -----------------------------------------------------------------------

  const renderContent = (sectionId: string) => {
    switch (sectionId) {
      case "color_theme":
        return (
          <ColorThemeEditor
            value={(profile.custom_theme as Parameters<typeof ColorThemeEditor>[0]["value"]) ?? null}
            onChange={(v) => handleSave("custom_theme", v)}
          />
        );

      case "profile_effects":
        return (
          <EffectSelector
            value={(profile.profile_effect as string) ?? null}
            onChange={(v) => handleSave("profile_effect", v)}
          />
        );

      case "animated_backgrounds": {
        const bg = (
          <BackgroundSelector
            value={(profile.profile_background as string) ?? null}
            onChange={(v) => handleSave("profile_background", v)}
          />
        );
        if (!isPremium) {
          return (
            <PremiumFeatureGate featureName="Animated Backgrounds">
              {bg}
            </PremiumFeatureGate>
          );
        }
        return bg;
      }

      case "theme_song": {
        const music = (
          <MusicWidgetEditor
            value={(profile.profile_music_url as string) ?? null}
            onChange={(v) => handleSave("profile_music_url", v)}
          />
        );
        if (!isPremium) {
          return (
            <PremiumFeatureGate featureName="Theme Song">
              {music}
            </PremiumFeatureGate>
          );
        }
        return music;
      }

      case "profile_skin":
        return (
          <SkinSelector
            value={(profile.profile_skin as string) ?? null}
            onChange={(v) => handleSave("profile_skin", v)}
          />
        );

      case "easter_eggs":
        return (
          <EasterEggEditor
            value={
              (profile.easter_egg_config as Parameters<typeof EasterEggEditor>[0]["value"]) ?? null
            }
            onChange={(v) => handleSave("easter_egg_config", v)}
          />
        );

      case "hover_card":
        return (
          <HoverCardEditor
            value={
              (profile.hover_card_config as Parameters<typeof HoverCardEditor>[0]["value"]) ?? null
            }
            onChange={(v) => handleSave("hover_card_config", v)}
          />
        );

      case "custom_css": {
        const cssEditor = (
          <CustomCssEditor
            value={(profile.custom_css as string) ?? null}
            onChange={(v) => handleSave("custom_css", v)}
          />
        );
        if (!isPremium) {
          return (
            <PremiumFeatureGate featureName="Custom CSS">
              {cssEditor}
            </PremiumFeatureGate>
          );
        }
        return cssEditor;
      }

      default:
        return null;
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
          <Wand2 className="h-5 w-5 text-purple-400" />
          <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Customize Your Profile</h2>
          <p className="text-sm text-white/50">Make your profile uniquely yours</p>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {SECTIONS.map((section) => {
          // Custom CSS: hide entirely if feature flag is disabled, show "Coming Soon" badge
          if (section.featureFlag && !isFeatureEnabled("customCSS")) {
            return (
              <div
                key={section.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 opacity-60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                  <section.icon className="h-4.5 w-4.5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{section.title}</h3>
                    <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate">{section.description}</p>
                </div>
              </div>
            );
          }

          return (
            <AccordionSection
              key={section.id}
              section={section}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            >
              {renderContent(section.id)}
            </AccordionSection>
          );
        })}
      </div>

      {/* Status toast */}
      <StatusToast status={toastStatus} />
    </section>
  );
}
