"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Loader2, Languages, Check } from "lucide-react";
import { useTranslation, useLocalePreferences } from "@/lib/hooks/useTranslation";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/types/localization";

interface TranslatedMessageProps {
  text: string;
  sourceLanguage?: SupportedLanguage;
  showOriginal?: boolean;
  autoTranslate?: boolean;
  context?: "chat" | "post" | "guide" | "general";
  className?: string;
}

export function TranslatedMessage({
  text,
  sourceLanguage,
  showOriginal = true,
  autoTranslate = false,
  context = "general",
  className = "",
}: TranslatedMessageProps) {
  const { translate, isTranslating, userLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const [showTranslation, setShowTranslation] = useState(autoTranslate);

  // Detect if translation is needed
  const needsTranslation = sourceLanguage && sourceLanguage !== userLanguage;

  useEffect(() => {
    if (autoTranslate && needsTranslation && !translatedText) {
      handleTranslate();
    }
  }, [autoTranslate, needsTranslation]);

  const handleTranslate = async () => {
    if (translatedText) {
      setShowTranslation(!showTranslation);
      return;
    }

    try {
      const result = await translate(text, userLanguage, context);
      setTranslatedText(result);
      setIsTranslated(true);
      setShowTranslation(true);
    } catch (error) {
      console.error("Translation failed:", error);
    }
  };

  // If no translation needed, just show the text
  if (!needsTranslation) {
    return <span className={className}>{text}</span>;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {showTranslation && translatedText ? (
          <motion.div
            key="translated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p>{translatedText}</p>
            {showOriginal && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Original ({SUPPORTED_LANGUAGES[sourceLanguage].name}): {text}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.p
            key="original"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={handleTranslate}
        disabled={isTranslating}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
      >
        {isTranslating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Globe className="h-3 w-3" />
        )}
        {showTranslation && translatedText
          ? "Show original"
          : `Translate to ${SUPPORTED_LANGUAGES[userLanguage].name}`}
      </button>
    </div>
  );
}

// Inline translation toggle for messages
interface InlineTranslateToggleProps {
  text: string;
  sourceLanguage?: SupportedLanguage;
  onTranslate?: (translatedText: string) => void;
}

export function InlineTranslateToggle({
  text,
  sourceLanguage,
  onTranslate,
}: InlineTranslateToggleProps) {
  const { translate, isTranslating, userLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const needsTranslation = sourceLanguage && sourceLanguage !== userLanguage;

  if (!needsTranslation) return null;

  const handleTranslate = async (targetLang: SupportedLanguage) => {
    setIsOpen(false);
    const result = await translate(text, targetLang);
    onTranslate?.(result);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="p-1 rounded hover:bg-muted transition-colors"
        title="Translate message"
      >
        {isTranslating ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Languages className="h-4 w-4 text-muted-foreground" />
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
              className="absolute right-0 bottom-full mb-2 w-48 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden"
            >
              <div className="p-1 text-xs text-muted-foreground px-3 py-2 border-b border-border">
                Translate to:
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {Object.entries(SUPPORTED_LANGUAGES)
                  .filter(([code]) => code !== sourceLanguage)
                  .slice(0, 8)
                  .map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleTranslate(code as SupportedLanguage)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-muted transition-colors ${
                        code === userLanguage ? "bg-primary/10" : ""
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.name}</span>
                      {code === userLanguage && (
                        <Check className="h-3 w-3 text-primary" />
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

// Auto-translate wrapper for chat messages
interface AutoTranslateWrapperProps {
  children: React.ReactNode;
  text: string;
  sourceLanguage?: SupportedLanguage;
  enabled?: boolean;
}

export function AutoTranslateWrapper({
  children,
  text,
  sourceLanguage,
  enabled = true,
}: AutoTranslateWrapperProps) {
  const { userLanguage } = useLocalePreferences();
  const { translate, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  const needsTranslation =
    enabled && sourceLanguage && sourceLanguage !== userLanguage;

  useEffect(() => {
    if (needsTranslation && !translatedText) {
      translate(text, userLanguage, "chat").then(setTranslatedText);
    }
  }, [needsTranslation, text, userLanguage]);

  if (!needsTranslation || !translatedText) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-1">
      <div>{translatedText}</div>
      <div className="text-xs text-muted-foreground opacity-70">
        <span className="italic">Original: </span>
        {text}
      </div>
    </div>
  );
}

// Language indicator badge
interface LanguageBadgeProps {
  language: SupportedLanguage;
  size?: "sm" | "md";
}

export function LanguageBadge({ language, size = "sm" }: LanguageBadgeProps) {
  const langInfo = SUPPORTED_LANGUAGES[language];

  if (!langInfo) return null;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-muted ${sizeClasses[size]}`}
      title={langInfo.name}
    >
      <span>{langInfo.flag}</span>
      <span className="uppercase font-medium">{language}</span>
    </span>
  );
}
