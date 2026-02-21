"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateSelector } from "./template-selector";
import { PaletteSelector } from "./palette-selector";
import { cn } from "@/lib/utils";
import type { BlogTemplate, BlogColorPalette } from "@/types/blog";

interface BlogCreationWizardProps {
  initialTemplate?: BlogTemplate;
  initialPalette?: BlogColorPalette;
  onComplete: (template: BlogTemplate, palette: BlogColorPalette) => void;
  skipWizard?: boolean;
  children: React.ReactNode;
}

const STEPS = [
  { id: 1, label: "Template", description: "Choose layout" },
  { id: 2, label: "Palette", description: "Choose colors" },
  { id: 3, label: "Write", description: "Create content" },
];

export function BlogCreationWizard({
  initialTemplate = "classic",
  initialPalette = "neon_surge",
  onComplete,
  skipWizard = false,
  children,
}: BlogCreationWizardProps) {
  const [step, setStep] = useState(skipWizard ? 3 : 1);
  const [template, setTemplate] = useState<BlogTemplate>(initialTemplate);
  const [palette, setPalette] = useState<BlogColorPalette>(initialPalette);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const goNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep(step + 1);
    }
    if (step === 2) {
      onComplete(template, palette);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  // If in write step, render the editor directly
  if (step === 3) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => {
                if (s.id < step) {
                  setDirection(-1);
                  setStep(s.id);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                s.id <= step ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                  s.id < step
                    ? "bg-primary border-primary text-black"
                    : s.id === step
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-surface-light border-border text-text-muted"
                )}
              >
                {s.id < step ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  s.id
                )}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    s.id <= step ? "text-text" : "text-text-muted"
                  )}
                >
                  {s.label}
                </p>
                <p className="text-[10px] text-text-dim hidden sm:block">{s.description}</p>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-16 sm:w-24 h-0.5 mx-2 rounded-full transition-colors duration-300",
                  s.id < step ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {step === 1 && (
            <TemplateSelector
              selected={template}
              onSelect={setTemplate}
            />
          )}
          {step === 2 && (
            <PaletteSelector
              selected={palette}
              onSelect={setPalette}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={step === 1}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Back
        </Button>

        <div className="text-sm text-text-muted">
          Step {step} of 3
        </div>

        <Button
          onClick={goNext}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          {step === 2 ? "Start Writing" : "Next"}
        </Button>
      </div>
    </div>
  );
}
