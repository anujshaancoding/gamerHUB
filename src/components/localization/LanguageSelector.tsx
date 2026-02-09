"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown, Loader2 } from "lucide-react";
import { useLocalePreferences } from "@/lib/hooks/useTranslation";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/types/localization";

interface LanguageSelectorProps {
  size?: "sm" | "md" | "lg";
  showFlag?: boolean;
  showNativeName?: boolean;
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export function LanguageSelector({
  size = "md",
  showFlag = true,
  showNativeName = false,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, updatePreferences, isUpdating } = useLocalePreferences();

  const currentLanguage = SUPPORTED_LANGUAGES[language];

  const handleSelect = async (lang: SupportedLanguage) => {
    setIsOpen(false);
    if (lang === language) return;

    await updatePreferences({ language: lang });
    onLanguageChange?.(lang);
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2",
    lg: "px-4 py-2.5 text-lg",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`flex items-center gap-2 rounded-lg border border-input bg-background hover:bg-muted transition-colors ${sizeClasses[size]}`}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {showFlag && <span>{currentLanguage.flag}</span>}
            <Globe className="h-4 w-4" />
          </>
        )}
        <span>
          {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg z-50"
            >
              <div className="p-1">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                  <button
                    key={code}
                    onClick={() => handleSelect(code as SupportedLanguage)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      language === code
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{lang.flag}</span>
                      <div className="text-left">
                        <div className="font-medium">{lang.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {lang.nativeName}
                        </div>
                      </div>
                    </div>
                    {language === code && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact language switcher for header/navbar
export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, updatePreferences, isUpdating } = useLocalePreferences();

  const currentLanguage = SUPPORTED_LANGUAGES[language];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition-colors"
        title={`Language: ${currentLanguage.name}`}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span className="text-lg">{currentLanguage.flag}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto p-1">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                  <button
                    key={code}
                    onClick={async () => {
                      setIsOpen(false);
                      if (code !== language) {
                        await updatePreferences({ language: code as SupportedLanguage });
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      language === code
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
