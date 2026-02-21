"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, Input, Modal, Badge } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { SUPPORTED_GAMES } from "@/lib/constants/games";
import { getGameConfig } from "@/lib/game-configs";
import {
  useCreateUserGame,
  useUpdateUserGame,
  type UserGameWithGame,
} from "@/lib/hooks/useUserGames";

interface GameProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGame?: UserGameWithGame | null;
  onSaved?: () => void;
  preselectedGameSlug?: string;
  linkedGameSlugs?: string[];
}

interface FormData {
  game_username: string;
  rank: string;
  role: string;
  kd_ratio: string;
  win_rate: string;
  hours_played: string;
  matches_played: string;
  is_public: boolean;
}

const emptyForm: FormData = {
  game_username: "",
  rank: "",
  role: "",
  kd_ratio: "",
  win_rate: "",
  hours_played: "",
  matches_played: "",
  is_public: true,
};

export function GameProfileModal({
  isOpen,
  onClose,
  existingGame,
  onSaved,
  preselectedGameSlug,
  linkedGameSlugs = [],
}: GameProfileModalProps) {
  const isEditMode = !!existingGame;
  const { createGame, creating } = useCreateUserGame();
  const { updateGame, updating } = useUpdateUserGame();

  const [selectedGameSlug, setSelectedGameSlug] = useState("");
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [showStats, setShowStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when modal opens or existingGame changes
  useEffect(() => {
    if (!isOpen) return;

    if (existingGame) {
      setSelectedGameSlug(existingGame.game?.slug || "");
      const stats = existingGame.stats as Record<string, number> | null;
      setFormData({
        game_username: existingGame.game_username || "",
        rank: existingGame.rank || "",
        role: existingGame.role || "",
        kd_ratio: stats?.kd_ratio?.toString() || "",
        win_rate: stats?.win_rate?.toString() || "",
        hours_played: stats?.hours_played?.toString() || "",
        matches_played: stats?.matches_played?.toString() || "",
        is_public: existingGame.is_public ?? true,
      });
      setShowStats(!!(stats && Object.keys(stats).length > 0));
    } else {
      setSelectedGameSlug(preselectedGameSlug || "");
      setFormData(emptyForm);
      setShowStats(false);
    }
    setError(null);
  }, [isOpen, existingGame, preselectedGameSlug]);

  const gameConfig = selectedGameSlug ? getGameConfig(selectedGameSlug) : undefined;
  const supportedGame = SUPPORTED_GAMES.find((g) => g.slug === selectedGameSlug);
  const isOtherGame = selectedGameSlug === "other";

  // Get rank options from game config or SUPPORTED_GAMES
  const rankOptions = gameConfig?.ranks || [];
  const hasUnranked = gameConfig?.hasUnrankedOption;

  // Get agent/role options
  const hasAgents = gameConfig?.hasAgents && gameConfig.agents && gameConfig.agents.length > 0;
  const agentLabel = gameConfig?.agentLabel || "Role";
  const agentOptions = hasAgents ? gameConfig.agents! : [];
  const roleOptions = !hasAgents && supportedGame?.roles ? supportedGame.roles : [];

  const handleSelectGame = (slug: string) => {
    setSelectedGameSlug(slug);
    // Reset game-specific fields when switching games
    setFormData((prev) => ({ ...prev, rank: "", role: "" }));
  };

  const handleSave = async () => {
    setError(null);

    if (!selectedGameSlug) {
      setError("Please select a game");
      return;
    }

    // Build stats object
    const stats: Record<string, number> = {};
    if (formData.kd_ratio) stats.kd_ratio = parseFloat(formData.kd_ratio);
    if (formData.win_rate) stats.win_rate = parseInt(formData.win_rate);
    if (formData.hours_played) stats.hours_played = parseInt(formData.hours_played);
    if (formData.matches_played) stats.matches_played = parseInt(formData.matches_played);

    try {
      if (isEditMode && existingGame) {
        await updateGame({
          id: existingGame.id,
          game_username: formData.game_username || undefined,
          rank: formData.rank || undefined,
          role: formData.role || undefined,
          stats: Object.keys(stats).length > 0 ? stats : undefined,
          is_public: formData.is_public,
        });
      } else {
        await createGame({
          game_slug: selectedGameSlug,
          game_username: formData.game_username || undefined,
          rank: formData.rank || undefined,
          role: formData.role || undefined,
          stats: Object.keys(stats).length > 0 ? stats : undefined,
          is_public: formData.is_public,
        });
      }
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  // Filter out already linked games in create mode
  const availableGames = SUPPORTED_GAMES.filter(
    (g) => !linkedGameSlugs.includes(g.slug)
  );

  const showGameFields = !!selectedGameSlug;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit ${existingGame?.game?.name || "Game"}` : "Add Game"}
      description={
        isEditMode
          ? "Update your game profile details"
          : "Link a game to your profile and set your rank"
      }
      size="lg"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Game Selection (create mode only) */}
        {!isEditMode && !preselectedGameSlug && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select Game
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableGames.map((game) => (
                <button
                  key={game.slug}
                  type="button"
                  onClick={() => handleSelectGame(game.slug)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedGameSlug === game.slug
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-border-light"
                  }`}
                >
                  <div className="w-10 h-10 mx-auto mb-1.5 bg-surface-light rounded-lg flex items-center justify-center overflow-hidden">
                    {game.iconUrl && game.slug !== "other" ? (
                      <img
                        src={game.iconUrl}
                        alt={game.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<svg class="h-5 w-5 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 11V5a2 2 0 012-2h8a2 2 0 012 2v6"/><path d="M2 11h20v4a6 6 0 01-6 6H8a6 6 0 01-6-6v-4z"/></svg>';
                        }}
                      />
                    ) : (
                      <Gamepad2 className="h-5 w-5 text-text-muted" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-text">
                    {game.name}
                  </span>
                  {selectedGameSlug === game.slug && (
                    <div className="mt-1">
                      <Check className="h-3.5 w-3.5 text-primary mx-auto" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {availableGames.length === 0 && (
              <p className="text-sm text-text-muted text-center py-4">
                You&apos;ve already linked all available games.
              </p>
            )}
          </div>
        )}

        {/* Game-specific fields */}
        <AnimatePresence mode="wait">
          {showGameFields && (
            <motion.div
              key={selectedGameSlug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* IGN */}
              <Input
                label="In-Game Name"
                placeholder={`Your ${supportedGame?.name || "game"} username`}
                value={formData.game_username}
                onChange={(e) =>
                  setFormData({ ...formData, game_username: e.target.value })
                }
                maxLength={50}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rank */}
                {isOtherGame ? (
                  <Input
                    label="Rank"
                    placeholder="e.g., Diamond, Gold, etc."
                    value={formData.rank}
                    onChange={(e) =>
                      setFormData({ ...formData, rank: e.target.value })
                    }
                  />
                ) : rankOptions.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Rank
                    </label>
                    <Select
                      value={formData.rank}
                      onValueChange={(v) =>
                        setFormData({ ...formData, rank: v })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                      <SelectContent>
                        {hasUnranked && (
                          <SelectItem value="Unranked">Unranked</SelectItem>
                        )}
                        {rankOptions.map((r) => (
                          <SelectItem key={r.value} value={r.label}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {/* Agent/Character (for games with agents) */}
                {hasAgents && agentOptions.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Main {agentLabel}
                    </label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) =>
                        setFormData({ ...formData, role: v })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${agentLabel.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {agentOptions.map((a) => (
                          <SelectItem key={a.value} value={a.label}>
                            {a.label}
                            {a.role && (
                              <span className="text-text-muted ml-1">
                                ({a.role})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : roleOptions.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Main Role
                    </label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) =>
                        setFormData({ ...formData, role: v })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : isOtherGame ? (
                  <Input
                    label="Main Role"
                    placeholder="e.g., Support, Tank, DPS"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  />
                ) : null}
              </div>

              {/* Stats (collapsible) */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowStats(!showStats)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-light transition-colors"
                >
                  <span>Stats (Optional)</span>
                  {showStats ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3 p-4 pt-0">
                        <Input
                          label="K/D Ratio"
                          type="number"
                          placeholder="e.g., 1.5"
                          value={formData.kd_ratio}
                          onChange={(e) =>
                            setFormData({ ...formData, kd_ratio: e.target.value })
                          }
                          min={0}
                          max={99.99}
                          step={0.01}
                        />
                        <Input
                          label="Win Rate %"
                          type="number"
                          placeholder="e.g., 55"
                          value={formData.win_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, win_rate: e.target.value })
                          }
                          min={0}
                          max={100}
                          step={1}
                        />
                        <Input
                          label="Hours Played"
                          type="number"
                          placeholder="e.g., 500"
                          value={formData.hours_played}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hours_played: e.target.value,
                            })
                          }
                          min={0}
                          step={1}
                        />
                        <Input
                          label="Matches Played"
                          type="number"
                          placeholder="e.g., 1000"
                          value={formData.matches_played}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              matches_played: e.target.value,
                            })
                          }
                          min={0}
                          step={1}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Visibility toggle */}
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, is_public: !formData.is_public })
                }
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
              >
                {formData.is_public ? (
                  <Eye className="h-4 w-4 text-primary" />
                ) : (
                  <EyeOff className="h-4 w-4 text-text-muted" />
                )}
                <span>
                  {formData.is_public
                    ? "Visible on public profile"
                    : "Hidden from public profile"}
                </span>
              </button>

              {/* Self-reported info */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted">
                  Self-reported data will show as unverified on your profile.
                  When game API integration becomes available, you can verify
                  your stats.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={creating || updating}
            disabled={!selectedGameSlug}
          >
            {isEditMode ? "Save Changes" : "Add Game"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
