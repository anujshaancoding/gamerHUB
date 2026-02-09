"use client";

import { useState, useEffect } from "react";
import {
  Smile,
  Users,
  Crown,
  MessageCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Button, Textarea, Avatar } from "@/components/ui";
import { useMyEndorsement, useSubmitEndorsement } from "@/lib/hooks/useRatings";
import type { Profile, TraitKey } from "@/types/database";

interface EndorsementModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Profile;
  currentUserId: string;
  onSuccess?: () => void;
}

interface TraitConfig {
  key: TraitKey;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  glowColor: string;
}

const traitConfigs: TraitConfig[] = [
  {
    key: "friendly",
    label: "Friendly",
    icon: Smile,
    description: "Warm, welcoming, creates a positive atmosphere",
    color: "#00ff88",
    glowColor: "rgba(0, 255, 136, 0.3)",
  },
  {
    key: "team_player",
    label: "Team Player",
    icon: Users,
    description: "Supportive, cooperative, puts the team first",
    color: "#00d4ff",
    glowColor: "rgba(0, 212, 255, 0.3)",
  },
  {
    key: "leader",
    label: "Leader",
    icon: Crown,
    description: "Strategic caller, guides the team, coach-like",
    color: "#ff00ff",
    glowColor: "rgba(255, 0, 255, 0.3)",
  },
  {
    key: "communicative",
    label: "Communicative",
    icon: MessageCircle,
    description: "Clear callouts, listens, shares information",
    color: "#ffaa00",
    glowColor: "rgba(255, 170, 0, 0.3)",
  },
  {
    key: "reliable",
    label: "Reliable",
    icon: Clock,
    description: "Shows up on time, consistent, trustworthy",
    color: "#ff6b6b",
    glowColor: "rgba(255, 107, 107, 0.3)",
  },
];

export function RatingModal({
  isOpen,
  onClose,
  player,
  currentUserId,
  onSuccess,
}: EndorsementModalProps) {
  const { data: myEndorsementData } = useMyEndorsement(
    isOpen ? player.id : null
  );
  const submitEndorsement = useSubmitEndorsement();

  const [traits, setTraits] = useState<Record<TraitKey, boolean>>({
    friendly: false,
    team_player: false,
    leader: false,
    communicative: false,
    reliable: false,
  });
  const [positiveNote, setPositiveNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pre-fill with existing endorsement
  useEffect(() => {
    if (myEndorsementData?.endorsement) {
      const e = myEndorsementData.endorsement;
      setTraits({
        friendly: e.friendly,
        team_player: e.team_player,
        leader: e.leader,
        communicative: e.communicative,
        reliable: e.reliable,
      });
      setPositiveNote(e.positive_note || "");
    }
  }, [myEndorsementData?.endorsement]);

  const toggleTrait = (key: TraitKey) => {
    setTraits((prev) => ({ ...prev, [key]: !prev[key] }));
    setError(null);
  };

  const handleSubmit = async () => {
    const hasAnyTrait = Object.values(traits).some(Boolean);
    if (!hasAnyTrait) {
      setError("Select at least one trait to endorse");
      return;
    }

    try {
      await submitEndorsement.mutateAsync({
        endorsedId: player.id,
        friendly: traits.friendly,
        teamPlayer: traits.team_player,
        leader: traits.leader,
        communicative: traits.communicative,
        reliable: traits.reliable,
        positiveNote: positiveNote || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit endorsement"
      );
    }
  };

  const rateLimit = myEndorsementData?.rateLimit;
  const isRateLimited = rateLimit && !rateLimit.allowed;
  const isExistingEndorsement = !!myEndorsementData?.endorsement;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExistingEndorsement ? "Update Endorsement" : "Endorse Player"}
      size="md"
    >
      <div className="space-y-5">
        {/* Player Info */}
        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
          <Avatar
            src={player.avatar_url}
            alt={player.display_name || player.username}
            size="lg"
          />
          <div>
            <p className="font-semibold text-text">
              {player.display_name || player.username}
            </p>
            <p className="text-sm text-text-muted">@{player.username}</p>
          </div>
        </div>

        {/* Rate limit warning */}
        {isRateLimited && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{rateLimit.reason}</span>
          </div>
        )}

        {/* Rate limit info */}
        {rateLimit && !isRateLimited && (
          <div className="flex items-center justify-between text-xs text-text-muted px-1">
            <span>{rateLimit.daily_remaining} endorsements left today</span>
            <span>{rateLimit.weekly_remaining} left this week</span>
          </div>
        )}

        {/* Trait Selection */}
        <div className="space-y-2">
          <p className="text-sm text-text-secondary font-medium">
            What traits describe this player?
          </p>
          <div className="space-y-2">
            {traitConfigs.map((config, index) => {
              const isSelected = traits[config.key];
              return (
                <motion.button
                  key={config.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  type="button"
                  onClick={() => !isRateLimited && toggleTrait(config.key)}
                  disabled={!!isRateLimited}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                    border text-left
                    ${
                      isSelected
                        ? "border-opacity-60 bg-opacity-10"
                        : "border-border bg-surface hover:bg-surface-light"
                    }
                    ${isRateLimited ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  style={
                    isSelected
                      ? {
                          borderColor: config.color,
                          backgroundColor: `${config.color}10`,
                          boxShadow: `0 0 20px ${config.glowColor}, inset 0 0 20px ${config.glowColor}`,
                        }
                      : undefined
                  }
                >
                  <div
                    className={`p-2 rounded-lg transition-all ${
                      isSelected ? "scale-110" : ""
                    }`}
                    style={{
                      backgroundColor: isSelected
                        ? `${config.color}25`
                        : "var(--surface-light)",
                    }}
                  >
                    <config.icon
                      className="h-5 w-5 transition-colors"
                      style={{
                        color: isSelected ? config.color : "var(--text-muted)",
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-semibold text-sm transition-colors"
                      style={{
                        color: isSelected ? config.color : "var(--text)",
                      }}
                    >
                      {config.label}
                    </p>
                    <p className="text-xs text-text-muted">
                      {config.description}
                    </p>
                  </div>
                  {/* Endorsement indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}30` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Positive Note */}
        <Textarea
          label="Positive note (optional)"
          placeholder="Share a positive experience with this player..."
          value={positiveNote}
          onChange={(e) => setPositiveNote(e.target.value)}
          rows={2}
          disabled={!!isRateLimited}
        />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={submitEndorsement.isPending}
            disabled={
              !!isRateLimited || !Object.values(traits).some(Boolean)
            }
            className="flex-1"
          >
            {isExistingEndorsement ? "Update Endorsement" : "Endorse Player"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
