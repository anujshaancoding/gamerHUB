"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Flag,
  AlertTriangle,
  Bot,
  MessageSquareWarning,
  Skull,
  UserX,
  Shield,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ReportType } from "@/types/verification";

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  contextType?: "match" | "chat" | "lfg" | "profile" | "clan";
  contextId?: string;
}

type Step = "type" | "details" | "success";

const REPORT_TYPES: {
  type: ReportType;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    type: "bot",
    icon: Bot,
    label: "Bot / Fake Account",
    description: "This account appears to be automated or fake",
    color: "text-purple-500",
  },
  {
    type: "spam",
    icon: MessageSquareWarning,
    label: "Spam",
    description: "Sending repetitive or unwanted messages",
    color: "text-yellow-500",
  },
  {
    type: "toxic",
    icon: Skull,
    label: "Toxic Behavior",
    description: "Verbal abuse, negative attitude, or griefing",
    color: "text-orange-500",
  },
  {
    type: "harassment",
    icon: AlertTriangle,
    label: "Harassment",
    description: "Targeting, bullying, or threatening behavior",
    color: "text-red-500",
  },
  {
    type: "cheating",
    icon: Shield,
    label: "Cheating",
    description: "Using hacks, exploits, or unfair advantages",
    color: "text-blue-500",
  },
  {
    type: "impersonation",
    icon: UserX,
    label: "Impersonation",
    description: "Pretending to be someone else",
    color: "text-pink-500",
  },
  {
    type: "other",
    icon: Flag,
    label: "Other",
    description: "Other violations not listed above",
    color: "text-gray-500",
  },
];

export function ReportUserModal({
  isOpen,
  onClose,
  userId,
  username,
  contextType,
  contextId,
}: ReportUserModalProps) {
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectType = (type: ReportType) => {
    setSelectedType(type);
    setStep("details");
  };

  const handleAddEvidence = () => {
    if (newEvidenceUrl.trim() && evidenceUrls.length < 5) {
      setEvidenceUrls([...evidenceUrls, newEvidenceUrl.trim()]);
      setNewEvidenceUrl("");
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_user_id: userId,
          report_type: selectedType,
          description: description.trim() || undefined,
          evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
          context_type: contextType,
          context_id: contextId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep("type");
    setSelectedType(null);
    setDescription("");
    setEvidenceUrls([]);
    setNewEvidenceUrl("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-semibold">Report User</h2>
            </div>
            <button
              onClick={() => {
                resetModal();
                onClose();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {step === "type" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the reason for reporting <span className="font-medium text-foreground">@{username}</span>
                </p>

                <div className="grid gap-2">
                  {REPORT_TYPES.map((report) => (
                    <button
                      key={report.type}
                      onClick={() => handleSelectType(report.type)}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <report.icon className={`h-5 w-5 mt-0.5 ${report.color}`} />
                      <div>
                        <div className="font-medium">{report.label}</div>
                        <div className="text-sm text-muted-foreground">{report.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "details" && selectedType && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep("type")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Change report type
                </button>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const report = REPORT_TYPES.find((r) => r.type === selectedType);
                      const Icon = report?.icon || Flag;
                      return (
                        <>
                          <Icon className={`h-5 w-5 ${report?.color}`} />
                          <span className="font-medium">{report?.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional Details (Optional)
                  </label>
                  <Textarea
                    placeholder="Provide any additional context that might help us investigate..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {description.length}/1000
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Evidence URLs (Optional)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Add links to screenshots, clips, or other evidence (max 5)
                  </p>

                  {evidenceUrls.length > 0 && (
                    <div className="space-y-1">
                      {evidenceUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate text-muted-foreground">{url}</span>
                          <button
                            onClick={() => handleRemoveEvidence(index)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {evidenceUrls.length < 5 && (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newEvidenceUrl}
                        onChange={(e) => setNewEvidenceUrl(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-md"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddEvidence}
                        disabled={!newEvidenceUrl.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      resetModal();
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">Report Submitted</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Thank you for helping keep GamerHub safe. Our team will review your report.
                </p>
                <Button
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
