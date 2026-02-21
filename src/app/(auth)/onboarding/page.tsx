"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  User,
  Globe,
  ChevronRight,
  ChevronLeft,
  Upload,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { Button, Input, LegacySelect as Select, Textarea, Avatar, SelectWithOther } from "@/components/ui";
import {
  Select as RadixSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { REGIONS, LANGUAGES, GAMING_STYLES, SUPPORTED_GAMES } from "@/lib/constants/games";
import { getGameConfig } from "@/lib/game-configs";
import { createClient } from "@/lib/supabase/client";
import { optimizedUpload, createPreview } from "@/lib/upload";
import { Logo } from "@/components/layout/logo";

const steps = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Gaming Preferences", icon: Gamepad2 },
  { id: 3, title: "Link Your Games", icon: Globe },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    gaming_style: "",
    preferred_language: "en",
    region: "",
    custom_region: "",
    custom_language: "",
    social_links: {
      discord: "",
      twitch: "",
      youtube: "",
    },
  });

  interface OnboardingGameData {
    slug: string;
    game_username: string;
    rank: string;
    role: string;
  }
  const [selectedGames, setSelectedGames] = useState<Record<string, OnboardingGameData>>({});
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(await createPreview(file));
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;

    try {
      const { publicUrl } = await optimizedUpload(avatarFile, "avatar", user.id);
      return publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step - save everything
    if (!user) {
      setError("You're not signed in. Please log in and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      const resolvedRegion = formData.region === "other" ? formData.custom_region : formData.region;
      const resolvedLanguage = formData.preferred_language === "other" ? formData.custom_language : formData.preferred_language;

      // Update profile
      const { error: profileError } = await updateProfile({
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        gaming_style: formData.gaming_style as "casual" | "competitive" | "pro",
        preferred_language: resolvedLanguage || "en",
        region: resolvedRegion || null,
        social_links: formData.social_links,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      });

      if (profileError) {
        console.error("Profile update error:", profileError);
        setError("Failed to save your profile. Please try again.");
        setLoading(false);
        return;
      }

      // Link selected games with rank/IGN/role data (don't block navigation on failure)
      for (const [gameSlug, gameData] of Object.entries(selectedGames)) {
        try {
          const { data: game } = await supabase
            .from("games")
            .select("id")
            .eq("slug", gameSlug)
            .single();

          if (game && (game as { id: string }).id) {
            await supabase.from("user_games").insert({
              user_id: user.id,
              game_id: (game as { id: string }).id,
              game_username: gameData.game_username || null,
              rank: gameData.rank || null,
              role: gameData.role || null,
              is_verified: false,
              is_public: true,
            } as never);
          }
        } catch (err) {
          console.error(`Failed to link game ${gameSlug}:`, err);
        }
      }

      router.replace("/community");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGame = (slug: string) => {
    setSelectedGames((prev) => {
      if (prev[slug]) {
        // Deselect: remove from record
        const { [slug]: removed, ...rest } = prev;
        if (expandedGame === slug) setExpandedGame(null);
        return rest;
      }
      // Select: add to record and expand
      setExpandedGame(slug);
      return { ...prev, [slug]: { slug, game_username: "", rank: "", role: "" } };
    });
  };

  const updateGameData = (slug: string, field: keyof OnboardingGameData, value: string) => {
    setSelectedGames((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [field]: value },
    }));
  };

  // Redirect if no user after auth loads
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Show loading state while auth is initializing or no user yet
  if (authLoading || !user) {
    return (
      <div className="w-full max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Logo showText={true} size="md" href={undefined} />
        </div>
        <h1 className="text-xl font-semibold text-text">Set Up Your Profile</h1>
        <p className="text-text-muted mt-1">Let&apos;s get you ready to game</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step.id
                  ? "bg-primary border-primary text-background"
                  : "border-border text-text-muted"
              }`}
            >
              {currentStep > step.id ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 transition-colors ${
                  currentStep > step.id ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-text">
                Tell us about yourself
              </h2>

              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <Avatar
                  src={avatarPreview}
                  alt="Profile"
                  size="xl"
                  fallback={formData.display_name || "?"}
                />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Upload className="h-4 w-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Avatar
                  </Button>
                  <p className="text-xs text-text-muted mt-1">
                    Recommended: 256x256 PNG or JPG
                  </p>
                </div>
              </div>

              <Input
                label="Display Name"
                placeholder="What should we call you?"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />

              <Textarea
                label="Bio"
                placeholder="Tell other gamers about yourself..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Discord"
                  placeholder="username#0000"
                  value={formData.social_links.discord}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: {
                        ...formData.social_links,
                        discord: e.target.value,
                      },
                    })
                  }
                />
                <Input
                  label="Twitch"
                  placeholder="twitch.tv/username"
                  value={formData.social_links.twitch}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_links: {
                        ...formData.social_links,
                        twitch: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-text">
                Your Gaming Preferences
              </h2>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  What&apos;s your gaming style?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {GAMING_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, gaming_style: style.value })
                      }
                      className={`p-4 rounded-lg border text-left transition-all ${
                        formData.gaming_style === style.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border-light"
                      }`}
                    >
                      <span className="font-medium text-text">{style.label}</span>
                      <p className="text-sm text-text-muted mt-1">
                        {style.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SelectWithOther
                  label="State / Region"
                  options={[
                    { value: "", label: "Select state" },
                    ...REGIONS.map((r) => ({ value: r.value, label: r.label })),
                  ]}
                  value={formData.region}
                  customValue={formData.custom_region}
                  onChange={(v) =>
                    setFormData({ ...formData, region: v, custom_region: "" })
                  }
                  onCustomChange={(v) =>
                    setFormData({ ...formData, custom_region: v })
                  }
                  customPlaceholder="Enter your region..."
                />
                <SelectWithOther
                  label="Language"
                  options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
                  value={formData.preferred_language}
                  customValue={formData.custom_language}
                  onChange={(v) =>
                    setFormData({ ...formData, preferred_language: v, custom_language: "" })
                  }
                  onCustomChange={(v) =>
                    setFormData({ ...formData, custom_language: v })
                  }
                  customPlaceholder="Enter your language..."
                />
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-text">
                Select Your Games
              </h2>
              <p className="text-text-muted text-sm">
                Choose the games you play. You can add more details later.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUPPORTED_GAMES.map((game) => {
                  const isSelected = !!selectedGames[game.slug];
                  const gameData = selectedGames[game.slug];
                  return (
                    <button
                      key={game.slug}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          // If already selected, toggle expand/collapse
                          setExpandedGame(expandedGame === game.slug ? null : game.slug);
                        } else {
                          toggleGame(game.slug);
                        }
                      }}
                      className={`relative p-4 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border-light"
                      }`}
                    >
                      {/* Remove button */}
                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-surface-light hover:bg-error/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGame(game.slug);
                          }}
                        >
                          <X className="h-3 w-3 text-text-muted hover:text-error" />
                        </div>
                      )}
                      <div className="w-12 h-12 mx-auto mb-2 bg-surface-light rounded-lg flex items-center justify-center overflow-hidden">
                        {game.iconUrl && game.slug !== "other" ? (
                          <img
                            src={game.iconUrl}
                            alt={game.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <Gamepad2 className="h-6 w-6 text-text-muted" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-text">
                        {game.name}
                      </span>
                      {isSelected && (
                        <div className="mt-1.5">
                          {gameData?.game_username || gameData?.rank ? (
                            <p className="text-[10px] text-primary truncate">
                              {gameData.game_username && `${gameData.game_username}`}
                              {gameData.game_username && gameData.rank && " · "}
                              {gameData.rank && gameData.rank}
                            </p>
                          ) : (
                            <Check className="h-4 w-4 text-primary mx-auto" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Expanded game form */}
              <AnimatePresence mode="wait">
                {expandedGame && selectedGames[expandedGame] && (
                  <motion.div
                    key={expandedGame}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                      <h4 className="text-sm font-semibold text-text mb-3">
                        Set up {SUPPORTED_GAMES.find((g) => g.slug === expandedGame)?.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="In-Game Name"
                          placeholder="Your username"
                          value={selectedGames[expandedGame]?.game_username || ""}
                          onChange={(e) =>
                            updateGameData(expandedGame, "game_username", e.target.value)
                          }
                        />
                        {(() => {
                          const config = getGameConfig(expandedGame);
                          const ranks = config?.ranks || [];
                          const isOther = expandedGame === "other";

                          if (isOther) {
                            return (
                              <Input
                                label="Rank"
                                placeholder="e.g., Diamond"
                                value={selectedGames[expandedGame]?.rank || ""}
                                onChange={(e) =>
                                  updateGameData(expandedGame, "rank", e.target.value)
                                }
                              />
                            );
                          }

                          if (ranks.length > 0) {
                            return (
                              <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                  Rank
                                </label>
                                <RadixSelect
                                  value={selectedGames[expandedGame]?.rank || ""}
                                  onValueChange={(v) => updateGameData(expandedGame, "rank", v)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select rank" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {config?.hasUnrankedOption && (
                                      <SelectItem value="Unranked">Unranked</SelectItem>
                                    )}
                                    {ranks.map((r) => (
                                      <SelectItem key={r.value} value={r.label}>
                                        {r.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </RadixSelect>
                              </div>
                            );
                          }

                          return null;
                        })()}
                        {(() => {
                          const config = getGameConfig(expandedGame);
                          const supportedGame = SUPPORTED_GAMES.find((g) => g.slug === expandedGame);
                          const isOther = expandedGame === "other";

                          if (config?.hasAgents && config.agents && config.agents.length > 0) {
                            return (
                              <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                  Main {config.agentLabel || "Role"}
                                </label>
                                <RadixSelect
                                  value={selectedGames[expandedGame]?.role || ""}
                                  onValueChange={(v) => updateGameData(expandedGame, "role", v)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={`Select ${(config.agentLabel || "role").toLowerCase()}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {config.agents.map((a) => (
                                      <SelectItem key={a.value} value={a.label}>
                                        {a.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </RadixSelect>
                              </div>
                            );
                          }

                          if (supportedGame?.roles && supportedGame.roles.length > 0) {
                            return (
                              <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                  Main Role
                                </label>
                                <RadixSelect
                                  value={selectedGames[expandedGame]?.role || ""}
                                  onValueChange={(v) => updateGameData(expandedGame, "role", v)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {supportedGame.roles.map((r) => (
                                      <SelectItem key={r} value={r}>
                                        {r}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </RadixSelect>
                              </div>
                            );
                          }

                          if (isOther) {
                            return (
                              <Input
                                label="Main Role"
                                placeholder="e.g., Support"
                                value={selectedGames[expandedGame]?.role || ""}
                                onChange={(e) =>
                                  updateGameData(expandedGame, "role", e.target.value)
                                }
                              />
                            );
                          }

                          return null;
                        })()}
                      </div>
                      <p className="text-xs text-text-dim mt-3">
                        You can add more details later from your profile settings.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            isLoading={loading}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            {currentStep === 3 ? "Complete Setup" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
