"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ENDORSEMENT_TYPES,
  type EndorsementType,
} from "@/types/verified-queue";

interface CommendationButtonProps {
  userId: string;
  gameId: string;
  sessionId?: string;
  onEndorse: (type: EndorsementType, note?: string) => Promise<void>;
  disabled?: boolean;
  variant?: "default" | "compact" | "icon";
}

export function CommendationButton({
  userId,
  gameId,
  sessionId,
  onEndorse,
  disabled = false,
  variant = "default",
}: CommendationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EndorsementType | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      await onEndorse(selectedType, note || undefined);
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setSelectedType(null);
        setNote("");
      }, 1500);
    } catch (error) {
      console.error("Failed to endorse:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "icon") {
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <EndorsementModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          note={note}
          setNote={setNote}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitted={submitted}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="gap-1.5"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Endorse
        </Button>
        <EndorsementModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          note={note}
          setNote={setNote}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitted={submitted}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="gap-2"
      >
        <ThumbsUp className="h-4 w-4" />
        Endorse Player
      </Button>
      <EndorsementModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        note={note}
        setNote={setNote}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitted={submitted}
      />
    </>
  );
}

interface EndorsementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: EndorsementType | null;
  setSelectedType: (type: EndorsementType | null) => void;
  note: string;
  setNote: (note: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitted: boolean;
}

function EndorsementModal({
  isOpen,
  onClose,
  selectedType,
  setSelectedType,
  note,
  setNote,
  onSubmit,
  isSubmitting,
  submitted,
}: EndorsementModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl p-6 z-50 shadow-xl"
          >
            {submitted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center py-8"
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">Endorsement Sent!</h3>
                <p className="text-sm text-muted-foreground">
                  Thank you for recognizing good behavior
                </p>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Endorse Player</h3>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Endorsement Types */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Object.entries(ENDORSEMENT_TYPES).map(([type, info]) => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type as EndorsementType)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        selectedType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{info.emoji}</span>
                        <span className="font-medium text-sm">{info.name}</span>
                      </div>
                      <p
                        className={`text-xs ${
                          selectedType === type
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {info.description}
                      </p>
                    </motion.button>
                  ))}
                </div>

                {/* Optional Note */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Add a note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Say something nice..."
                    rows={2}
                    maxLength={200}
                    className="w-full px-3 py-2 bg-muted rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {note.length}/200
                  </p>
                </div>

                {/* Submit */}
                <Button
                  className="w-full"
                  onClick={onSubmit}
                  disabled={!selectedType || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? "Sending..." : "Send Endorsement"}
                </Button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick endorsement buttons (inline, no modal)
interface QuickEndorsementProps {
  onEndorse: (type: EndorsementType) => Promise<void>;
  disabled?: boolean;
  showLabels?: boolean;
}

export function QuickEndorsement({
  onEndorse,
  disabled = false,
  showLabels = false,
}: QuickEndorsementProps) {
  const [endorsing, setEndorsing] = useState<EndorsementType | null>(null);
  const [endorsed, setEndorsed] = useState<EndorsementType | null>(null);

  const handleEndorse = async (type: EndorsementType) => {
    if (disabled || endorsing) return;

    setEndorsing(type);
    try {
      await onEndorse(type);
      setEndorsed(type);
    } catch (error) {
      console.error("Failed to endorse:", error);
    } finally {
      setEndorsing(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(ENDORSEMENT_TYPES).map(([type, info]) => {
        const isEndorsing = endorsing === type;
        const isEndorsed = endorsed === type;

        return (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleEndorse(type as EndorsementType)}
            disabled={disabled || !!endorsing || !!endorsed}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
              isEndorsed
                ? "bg-green-500/20 text-green-500"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={info.description}
          >
            {isEndorsing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isEndorsed ? (
              <Check className="h-3 w-3" />
            ) : (
              <span>{info.emoji}</span>
            )}
            {showLabels && <span>{info.name}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
