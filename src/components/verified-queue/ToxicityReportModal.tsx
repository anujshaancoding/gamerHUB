"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  Upload,
  Loader2,
  Check,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  REPORT_SEVERITY,
  type ReportReason,
  type ReportPlayerRequest,
} from "@/types/verified-queue";

interface ToxicityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUsername: string;
  gameId: string;
  sessionId?: string;
  onSubmit: (report: ReportPlayerRequest) => Promise<void>;
}

export function ToxicityReportModal({
  isOpen,
  onClose,
  targetUserId,
  targetUsername,
  gameId,
  sessionId,
  onSubmit,
}: ToxicityReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError("Please select a reason for the report");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        user_id: targetUserId,
        game_id: gameId,
        session_id: sessionId,
        reason,
        description: description || undefined,
        evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (err) {
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReason(null);
    setDescription("");
    setEvidenceUrls([]);
    setSubmitted(false);
    setError(null);
  };

  const addEvidenceUrl = () => {
    const url = prompt("Enter evidence URL (screenshot, video link, etc.):");
    if (url && url.trim()) {
      setEvidenceUrls([...evidenceUrls, url.trim()]);
    }
  };

  const removeEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-xl p-6 z-50 shadow-xl max-h-[90vh] overflow-y-auto"
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
                <h3 className="text-lg font-semibold">Report Submitted</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Thank you for helping keep our community safe. We&apos;ll review
                  your report and take appropriate action.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Report Player</h3>
                      <p className="text-sm text-muted-foreground">
                        Reporting: {targetUsername}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Report Reasons */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Reason for Report *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(REPORT_SEVERITY).map(([key, info]) => {
                      const reportReason = key as ReportReason;
                      const isSelected = reason === reportReason;
                      const severityColors = {
                        1: "border-yellow-500/50 bg-yellow-500/10",
                        2: "border-orange-500/50 bg-orange-500/10",
                        3: "border-red-500/50 bg-red-500/10",
                        4: "border-red-700/50 bg-red-700/10",
                      };

                      return (
                        <motion.button
                          key={key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setReason(reportReason)}
                          className={`p-3 rounded-lg text-left border transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : `border-border hover:${severityColors[info.severity as 1 | 2 | 3 | 4]}`
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{info.name}</span>
                            <SeverityIndicator level={info.severity} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details about what happened..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 bg-muted rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {description.length}/500
                  </p>
                </div>

                {/* Evidence */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Evidence (optional)
                  </label>
                  <div className="space-y-2">
                    {evidenceUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <span className="text-xs text-muted-foreground flex-1 truncate">
                          {url}
                        </span>
                        <button
                          onClick={() => removeEvidenceUrl(idx)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {evidenceUrls.length < 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addEvidenceUrl}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Evidence URL
                      </Button>
                    )}
                  </div>
                </div>

                {/* Warning */}
                <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-xs text-yellow-500">
                    <strong>Note:</strong> False reports may result in penalties to
                    your own behavior score. Only submit reports for genuine violations.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-sm text-red-500">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!reason || isSubmitting}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Flag className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Severity indicator dots
function SeverityIndicator({ level }: { level: number }) {
  const colors = ["bg-yellow-500", "bg-orange-500", "bg-red-500", "bg-red-700"];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? colors[level - 1] : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

// Report button that triggers the modal
interface ReportButtonProps {
  targetUserId: string;
  targetUsername: string;
  gameId: string;
  sessionId?: string;
  onSubmit: (report: ReportPlayerRequest) => Promise<void>;
  variant?: "default" | "compact" | "icon";
}

export function ReportButton({
  targetUserId,
  targetUsername,
  gameId,
  sessionId,
  onSubmit,
  variant = "default",
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
        >
          <Flag className="h-4 w-4" />
        </Button>
        <ToxicityReportModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          targetUserId={targetUserId}
          targetUsername={targetUsername}
          gameId={gameId}
          sessionId={sessionId}
          onSubmit={onSubmit}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(true)}
          className="text-muted-foreground hover:text-red-500"
        >
          <Flag className="h-3.5 w-3.5 mr-1.5" />
          Report
        </Button>
        <ToxicityReportModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          targetUserId={targetUserId}
          targetUsername={targetUsername}
          gameId={gameId}
          sessionId={sessionId}
          onSubmit={onSubmit}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="text-red-500 border-red-500/30 hover:bg-red-500/10"
      >
        <Flag className="h-4 w-4 mr-2" />
        Report Player
      </Button>
      <ToxicityReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetUserId={targetUserId}
        targetUsername={targetUsername}
        gameId={gameId}
        sessionId={sessionId}
        onSubmit={onSubmit}
      />
    </>
  );
}
