"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Mic, Info, Map, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGames } from "@/lib/hooks/useGames";
import {
  useGameRoles,
  useMatchingPlayersCount,
  useCreateLFGPost,
} from "@/lib/hooks/useLFG";
import type { CreateLFGPostInput } from "@/types/lfg";
import { REGIONS, DURATION_OPTIONS } from "@/types/lfg";
import {
  getGameConfig,
  usesNumericRating,
  getTeamSizeForMode,
  type GameConfig,
} from "@/lib/game-configs";
import { toast } from "sonner";

interface CreateLFGModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateLFGModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateLFGModalProps) {
  const { games } = useGames();
  const { createPost, isCreating } = useCreateLFGPost();

  const [formData, setFormData] = useState<Partial<CreateLFGPostInput>>({
    max_players: 5,
    duration_type: "2hr",
    accept_unranked: true,
    voice_required: false,
  });

  const selectedGame = games.find((g) => g.id === formData.game_id);
  const gameConfig = selectedGame ? getGameConfig(selectedGame.slug) : undefined;
  const { roles } = useGameRoles(selectedGame?.slug || "");
  const { count: matchingCount, total: matchingTotal } =
    useMatchingPlayersCount({
      game: selectedGame?.slug || "",
      role: formData.looking_for_roles?.[0],
      minRating: formData.min_rating,
      maxRating: formData.max_rating,
      region: formData.region,
    });

  // Update team size when game mode changes
  useEffect(() => {
    if (gameConfig && formData.game_mode) {
      const modeTeamSize = getTeamSizeForMode(gameConfig, formData.game_mode);
      if (modeTeamSize !== formData.max_players) {
        setFormData((prev) => ({ ...prev, max_players: modeTeamSize }));
      }
    }
  }, [formData.game_mode, gameConfig]);

  // Reset game-specific fields when game changes
  useEffect(() => {
    if (selectedGame && gameConfig) {
      setFormData((prev) => ({
        ...prev,
        creator_rating: undefined,
        creator_rank: undefined,
        creator_agent: undefined,
        creator_role: undefined,
        min_rating: undefined,
        max_rating: undefined,
        min_rank: undefined,
        max_rank: undefined,
        game_mode: undefined,
        map_preference: undefined,
        perspective: undefined,
        looking_for_roles: [],
        max_players: gameConfig.defaultTeamSize,
      }));
    }
  }, [selectedGame?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.game_id || !formData.title) {
      toast.error("Please select a game and enter a title");
      return;
    }

    try {
      await createPost(formData as CreateLFGPostInput);
      toast.success("LFG post created!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create post"
      );
    }
  };

  const handleChange = <K extends keyof CreateLFGPostInput>(
    key: K,
    value: CreateLFGPostInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  const isNumericRating = gameConfig ? usesNumericRating(gameConfig) : false;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 z-10">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Find Teammates
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            {/* Game selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game *
              </label>
              <Select
                value={formData.game_id || ""}
                onValueChange={(v) => handleChange("game_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <Input
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={
                  gameConfig
                    ? `e.g., Looking for ${gameConfig.defaultTeamSize - 1} more for ${gameConfig.gameModes[0]?.label || "ranked"}`
                    : "e.g., Looking for teammates for ranked"
                }
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Tell others about your playstyle, goals, etc."
                rows={3}
              />
            </div>

            {/* Your role & rank/rating */}
            {selectedGame && gameConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Role
                  </label>
                  <Select
                    value={formData.creator_role || "none"}
                    onValueChange={(v) =>
                      handleChange("creator_role", v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select your role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating input for numeric rating games (CS2, Dota2) */}
                {isNumericRating ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your {gameConfig.ratingLabel || "Rating"}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={formData.creator_rating || ""}
                        onChange={(e) =>
                          handleChange(
                            "creator_rating",
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder={`e.g., ${
                          gameConfig.ratingRange
                            ? Math.round(
                                (gameConfig.ratingRange.min +
                                  gameConfig.ratingRange.max) /
                                  2
                              )
                            : "5000"
                        }`}
                        min={gameConfig.ratingRange?.min}
                        max={gameConfig.ratingRange?.max}
                        step={gameConfig.ratingRange?.step}
                        disabled={formData.creator_is_unranked}
                        className="flex-1"
                      />
                      {gameConfig.hasUnrankedOption && (
                        <label className="flex items-center gap-1.5 text-sm text-gray-400 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={formData.creator_is_unranked}
                            onChange={(e) =>
                              handleChange("creator_is_unranked", e.target.checked)
                            }
                            className="rounded border-gray-600"
                          />
                          Unranked
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Rank dropdown for tier-based games (Valorant, LoL, Apex, etc.) */
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Rank
                    </label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={formData.creator_rank || "none"}
                        onValueChange={(v) =>
                          handleChange("creator_rank", v === "none" ? "" : v)
                        }
                        disabled={formData.creator_is_unranked}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select your rank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select your rank</SelectItem>
                          {gameConfig.ranks?.map((rank) => (
                            <SelectItem key={rank.value} value={rank.value}>
                              {rank.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {gameConfig.hasUnrankedOption && (
                        <label className="flex items-center gap-1.5 text-sm text-gray-400 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={formData.creator_is_unranked}
                            onChange={(e) =>
                              handleChange("creator_is_unranked", e.target.checked)
                            }
                            className="rounded border-gray-600"
                          />
                          Unranked
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Agent/Legend/Character selection */}
            {gameConfig?.hasAgents && gameConfig.agents && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your {gameConfig.agentLabel || "Character"}
                </label>
                <Select
                  value={formData.creator_agent || "any"}
                  onValueChange={(v) =>
                    handleChange("creator_agent", v === "any" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${gameConfig.agentLabel || "Character"}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any / Flexible</SelectItem>
                    {gameConfig.agents.map((agent) => (
                      <SelectItem key={agent.value} value={agent.value}>
                        {agent.label}
                        {agent.role && (
                          <span className="text-gray-500 ml-1">
                            ({agent.role})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Looking for roles */}
            {selectedGame && roles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Looking For Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => {
                    const isSelected =
                      formData.looking_for_roles?.includes(role.name);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          const current = formData.looking_for_roles || [];
                          const updated = isSelected
                            ? current.filter((r) => r !== role.name)
                            : [...current, role.name];
                          handleChange("looking_for_roles", updated);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                          isSelected
                            ? "bg-primary/20 border-primary text-primary"
                            : "border-gray-700 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {role.display_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rank/Rating requirements */}
            {selectedGame && gameConfig && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {isNumericRating ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Min {gameConfig.ratingLabel || "Rating"}
                      </label>
                      <Input
                        type="number"
                        value={formData.min_rating || ""}
                        onChange={(e) =>
                          handleChange(
                            "min_rating",
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="Any"
                        min={gameConfig.ratingRange?.min}
                        max={gameConfig.ratingRange?.max}
                        step={gameConfig.ratingRange?.step}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max {gameConfig.ratingLabel || "Rating"}
                      </label>
                      <Input
                        type="number"
                        value={formData.max_rating || ""}
                        onChange={(e) =>
                          handleChange(
                            "max_rating",
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="Any"
                        min={gameConfig.ratingRange?.min}
                        max={gameConfig.ratingRange?.max}
                        step={gameConfig.ratingRange?.step}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Min Rank
                      </label>
                      <Select
                        value={formData.min_rank || "any"}
                        onValueChange={(v) =>
                          handleChange("min_rank", v === "any" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          {gameConfig.ranks?.map((rank) => (
                            <SelectItem key={rank.value} value={rank.value}>
                              {rank.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Rank
                      </label>
                      <Select
                        value={formData.max_rank || "any"}
                        onValueChange={(v) =>
                          handleChange("max_rank", v === "any" ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          {gameConfig.ranks?.map((rank) => (
                            <SelectItem key={rank.value} value={rank.value}>
                              {rank.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {gameConfig.hasUnrankedOption && (
                  <div className="col-span-2 sm:col-span-1 flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={formData.accept_unranked !== false}
                        onChange={(e) =>
                          handleChange("accept_unranked", e.target.checked)
                        }
                        className="rounded border-gray-600"
                      />
                      Accept Unranked
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Region & Team Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region
                </label>
                <Select
                  value={formData.region || "any"}
                  onValueChange={(v) =>
                    handleChange("region", v === "any" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Region</SelectItem>
                    {REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Size
                </label>
                <Select
                  value={String(formData.max_players || gameConfig?.defaultTeamSize || 5)}
                  onValueChange={(v) => handleChange("max_players", parseInt(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(gameConfig?.teamSizeOptions || [2, 3, 4, 5]).map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} Player{size > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Game mode */}
            {gameConfig && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Mode
                </label>
                <Select
                  value={formData.game_mode || "any"}
                  onValueChange={(v) =>
                    handleChange("game_mode", v === "any" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Mode</SelectItem>
                    {gameConfig.gameModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                        {mode.teamSize && (
                          <span className="text-gray-500 ml-1">
                            ({mode.teamSize}p)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Map & Perspective for BR games */}
            {gameConfig?.hasMaps && gameConfig.maps && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Map className="w-4 h-4 inline mr-1" />
                    Preferred Map
                  </label>
                  <Select
                    value={formData.map_preference || "any"}
                    onValueChange={(v) =>
                      handleChange("map_preference", v === "any" ? "" : v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any Map" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Map</SelectItem>
                      {gameConfig.maps.map((map) => (
                        <SelectItem key={map.value} value={map.value}>
                          {map.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {gameConfig.hasPerspective && gameConfig.perspectives && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Perspective
                    </label>
                    <Select
                      value={formData.perspective || "any"}
                      onValueChange={(v) =>
                        handleChange("perspective", v === "any" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any Perspective" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Perspective</SelectItem>
                        {gameConfig.perspectives.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Duration & Voice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Post Duration
                </label>
                <Select
                  value={formData.duration_type || "2hr"}
                  onValueChange={(v) =>
                    handleChange(
                      "duration_type",
                      v as CreateLFGPostInput["duration_type"]
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={formData.voice_required}
                    onChange={(e) =>
                      handleChange("voice_required", e.target.checked)
                    }
                    className="rounded border-gray-600"
                  />
                  <Mic className="w-4 h-4" />
                  Voice Chat Required
                </label>
              </div>
            </div>

            {/* Matching players indicator */}
            {selectedGame && (
              <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                <Info className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-gray-300">
                  <span className="text-primary font-semibold">
                    {matchingCount}
                  </span>{" "}
                  players online ({matchingTotal} total) match your criteria
                </span>
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-800">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                {isCreating ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
