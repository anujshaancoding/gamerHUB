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
  Loader2
} from "lucide-react";
import { Button, Input, LegacySelect as Select, Textarea, Avatar } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { REGIONS, LANGUAGES, GAMING_STYLES, SUPPORTED_GAMES } from "@/lib/constants/games";
import { createClient } from "@/lib/supabase/client";

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
    social_links: {
      discord: "",
      twitch: "",
      youtube: "",
    },
  });

  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;

    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, avatarFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save everything
      if (!user) {
        console.error("User not authenticated");
        return;
      }
      setLoading(true);
      try {
        let avatarUrl = null;
        if (avatarFile) {
          avatarUrl = await uploadAvatar();
        }

        // Update profile
        await updateProfile({
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          gaming_style: formData.gaming_style as "casual" | "competitive" | "pro",
          preferred_language: formData.preferred_language,
          region: formData.region || null,
          social_links: formData.social_links,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        });

        // Link selected games
        if (user) {
          for (const gameSlug of selectedGames) {
            const { data: game } = await supabase
              .from("games")
              .select("id")
              .eq("slug", gameSlug)
              .single();

            if (game && (game as { id: string }).id) {
              await supabase.from("user_games").insert({
                user_id: user.id,
                game_id: (game as { id: string }).id,
              } as never);
            }
          }
        }

        router.push("/community");
      } catch (error) {
        console.error("Onboarding error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGame = (slug: string) => {
    setSelectedGames((prev) =>
      prev.includes(slug)
        ? prev.filter((g) => g !== slug)
        : [...prev, slug]
    );
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
        <div className="flex items-center justify-center gap-2 mb-4">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-glow-primary">GamerHub</span>
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
                <Select
                  label="Region"
                  options={REGIONS.map((r) => ({ value: r.value, label: r.label }))}
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  placeholder="Select your region"
                />
                <Select
                  label="Language"
                  options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
                  value={formData.preferred_language}
                  onChange={(e) =>
                    setFormData({ ...formData, preferred_language: e.target.value })
                  }
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
                {SUPPORTED_GAMES.map((game) => (
                  <button
                    key={game.slug}
                    type="button"
                    onClick={() => toggleGame(game.slug)}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      selectedGames.includes(game.slug)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-border-light"
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto mb-2 bg-surface-light rounded-lg flex items-center justify-center">
                      <Gamepad2 className="h-6 w-6 text-text-muted" />
                    </div>
                    <span className="text-sm font-medium text-text">
                      {game.name}
                    </span>
                    {selectedGames.includes(game.slug) && (
                      <div className="mt-2">
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
