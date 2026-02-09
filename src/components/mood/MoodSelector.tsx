"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IntensitySlider } from "./IntensitySlider";
import {
  GAMING_MOODS,
  type GamingMood,
  type MoodIntensity,
  getSuggestedMood,
} from "@/types/mood";

interface MoodSelectorProps {
  onSelect: (mood: GamingMood, intensity: MoodIntensity, note?: string) => void;
  isLoading?: boolean;
  showNote?: boolean;
  showDuration?: boolean;
  defaultDuration?: number;
  onClose?: () => void;
}

export function MoodSelector({
  onSelect,
  isLoading = false,
  showNote = true,
  showDuration = false,
  defaultDuration = 2,
  onClose,
}: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<GamingMood | null>(null);
  const [intensity, setIntensity] = useState<MoodIntensity>(3);
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState(defaultDuration);

  const suggestedMood = getSuggestedMood();

  const handleSelect = () => {
    if (selectedMood) {
      onSelect(selectedMood, intensity, note || undefined);
    }
  };

  const moods = Object.values(GAMING_MOODS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">How are you feeling?</h3>
          <p className="text-sm text-muted-foreground">
            Set your mood to find compatible players
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggested Mood */}
      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm">
          Based on the time, you might be feeling{" "}
          <button
            onClick={() => setSelectedMood(suggestedMood)}
            className="font-medium text-primary hover:underline"
          >
            {GAMING_MOODS[suggestedMood].emoji} {GAMING_MOODS[suggestedMood].label}
          </button>
        </span>
      </div>

      {/* Mood Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {moods.map((mood) => {
          const isSelected = selectedMood === mood.id;

          return (
            <motion.button
              key={mood.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMood(mood.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              }`}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-xs font-medium">{mood.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Mood Details */}
      <AnimatePresence mode="wait">
        {selectedMood && (
          <motion.div
            key={selectedMood}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Mood Info */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${GAMING_MOODS[selectedMood].color}15` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{GAMING_MOODS[selectedMood].emoji}</span>
                <span
                  className="font-semibold"
                  style={{ color: GAMING_MOODS[selectedMood].color }}
                >
                  {GAMING_MOODS[selectedMood].label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {GAMING_MOODS[selectedMood].description}
              </p>

              {/* Compatible moods */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Works well with:
                </p>
                <div className="flex flex-wrap gap-1">
                  {GAMING_MOODS[selectedMood].compatibleWith.map((compatMood) => (
                    <span
                      key={compatMood}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-xs"
                    >
                      {GAMING_MOODS[compatMood].emoji}
                      {GAMING_MOODS[compatMood].label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Intensity Slider */}
            <div>
              <label className="text-sm font-medium mb-2 block">Intensity</label>
              <IntensitySlider value={intensity} onChange={setIntensity} />
            </div>

            {/* Note Input */}
            {showNote && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Add a note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Looking for chill teammates"
                  maxLength={200}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Duration */}
            {showDuration && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </label>
                <div className="flex gap-2">
                  {[1, 2, 4, 8].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setDuration(hours)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        duration === hours
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSelect}
              disabled={isLoading}
              className="w-full"
              style={{ backgroundColor: GAMING_MOODS[selectedMood].color }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <span className="mr-2">{GAMING_MOODS[selectedMood].emoji}</span>
              )}
              Set Mood
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick mood selector (compact version)
interface QuickMoodSelectorProps {
  onSelect: (mood: GamingMood) => void;
  currentMood?: GamingMood;
  size?: "sm" | "md";
}

export function QuickMoodSelector({
  onSelect,
  currentMood,
  size = "md",
}: QuickMoodSelectorProps) {
  const moods = Object.values(GAMING_MOODS);
  const sizeClasses = size === "sm" ? "p-1.5 text-lg" : "p-2 text-xl";

  return (
    <div className="flex flex-wrap gap-1">
      {moods.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelect(mood.id)}
          className={`${sizeClasses} rounded-lg transition-all ${
            currentMood === mood.id
              ? "bg-primary/20 ring-2 ring-primary"
              : "bg-muted/50 hover:bg-muted"
          }`}
          title={`${mood.label}: ${mood.description}`}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
}
