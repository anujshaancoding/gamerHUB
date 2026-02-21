"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Camera,
  ImageIcon,
  Loader2,
  User,
  Gamepad2,
  Globe,
  Link as LinkIcon,
  Sparkles,
  Palette,
  Crown,
  Zap,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";
import { Button, Input, LegacySelect as Select, Textarea, Card, Avatar, Badge } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { REGIONS, LANGUAGES, GAMING_STYLES } from "@/lib/constants/games";
import { optimizedUpload, createPreview } from "@/lib/upload";
import { useMyGames, useDeleteUserGame, type UserGameWithGame } from "@/lib/hooks/useUserGames";
import { GameProfileModal } from "@/components/profile/game-profile-modal";
import Link from "next/link";

interface EditProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const formInitialized = useRef(false);

  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Game management state
  const { userGames, loading: gamesLoading, refetch: refetchGames } = useMyGames();
  const { deleteGame, deleting: gameDeleting } = useDeleteUserGame();
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<UserGameWithGame | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    gaming_style: "",
    region: "",
    preferred_language: "en",
    discord: "",
    twitch: "",
    youtube: "",
    twitter: "",
    steam: "",
  });

  useEffect(() => {
    params.then((p) => setUsername(p.username));
  }, [params]);

  // Sync form data only once when profile first becomes available
  useEffect(() => {
    if (profile && !formInitialized.current) {
      formInitialized.current = true;
      const socialLinks = profile.social_links as Record<string, string> | null;
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        gaming_style: profile.gaming_style || "",
        region: profile.region || "",
        preferred_language: profile.preferred_language || "en",
        discord: socialLinks?.discord || "",
        twitch: socialLinks?.twitch || "",
        youtube: socialLinks?.youtube || "",
        twitter: socialLinks?.twitter || "",
        steam: socialLinks?.steam || "",
      });
    }
  }, [profile]);

  // Check if user is authorized to edit this profile
  useEffect(() => {
    if (username && profile && profile.username !== username) {
      router.push(`/profile/${username}`);
    }
  }, [username, profile, router]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError(null);
    setAvatarUploading(true);

    try {
      setAvatarPreview(await createPreview(file));

      const { publicUrl } = await optimizedUpload(
        file,
        "avatar",
        user.id,
        profile?.avatar_url,
      );

      await updateProfile({ avatar_url: publicUrl });
      setAvatarPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError(null);
    setBannerUploading(true);

    try {
      setBannerPreview(await createPreview(file));

      const { publicUrl } = await optimizedUpload(
        file,
        "banner",
        user.id,
        profile?.banner_url,
      );

      await updateProfile({ banner_url: publicUrl });
      setBannerPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload banner");
      setBannerPreview(null);
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const { error: updateError } = await updateProfile({
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        gaming_style: (formData.gaming_style as "casual" | "competitive" | "pro") || null,
        region: formData.region || null,
        preferred_language: formData.preferred_language,
        social_links: {
          discord: formData.discord,
          twitch: formData.twitch,
          youtube: formData.youtube,
          twitter: formData.twitter,
          steam: formData.steam,
        },
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        // Use full navigation to bypass Next.js Router Cache
        // so the server component re-fetches the updated profile data
        window.location.href = `/profile/${username}`;
      }, 1500);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile || !user) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center py-12 gaming-card-border">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-text-muted">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/profile/${username}`}>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Edit Profile
            </h1>
            <p className="text-text-muted">
              Customize your gamer identity
            </p>
          </div>
        </div>

        <Card className="overflow-hidden gaming-card-border">
          {/* Banner Section - Full width at top */}
          <div className="relative -m-6 mb-6">
            <div className="relative h-48 md:h-56 bg-gradient-to-r from-primary/20 via-surface to-accent/20 holographic">
              {(bannerPreview || profile.banner_url) && (
                <img
                  src={bannerPreview || profile.banner_url || ""}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

              {/* Animated border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary animate-gradient-xy" />

              {/* Banner upload overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                onClick={() => bannerInputRef.current?.click()}
              >
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  className="hidden"
                />
                {bannerUploading ? (
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="font-medium">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="p-4 rounded-full bg-white/20 backdrop-blur">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <span className="font-semibold">Change Cover Photo</span>
                    <span className="text-sm opacity-75">1920x480 recommended</span>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar positioned over banner */}
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <Avatar
                  src={avatarPreview || profile.avatar_url}
                  alt={profile.display_name || profile.username}
                  size="4xl"
                  frameStyle="epic"
                  className="ring-4 ring-surface"
                />

                {/* Avatar upload overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  {avatarUploading ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center text-white">
                      <Camera className="h-8 w-8" />
                      <span className="text-xs mt-1">Change</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Spacer for avatar */}
          <div className="h-12" />

          {/* Avatar and Banner change buttons */}
          <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              leftIcon={avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              className="hover:border-primary hover:text-primary"
            >
              {avatarUploading ? "Uploading..." : "Change Avatar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerUploading}
              leftIcon={bannerUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              className="hover:border-accent hover:text-accent"
            >
              {bannerUploading ? "Uploading..." : "Change Banner"}
            </Button>
            <span className="flex items-center text-xs text-text-muted ml-auto">
              Auto-compressed to WebP • Avatar: max 2MB • Banner: max 5MB
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-8">
            {/* Personal Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text">Personal Information</h3>
              </div>
              <div className="space-y-4 pl-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">
                      Username
                    </label>
                    <Input value={profile.username} disabled className="bg-surface-light/50 border-border" />
                    <p className="text-xs text-text-dim mt-1">
                      Username cannot be changed
                    </p>
                  </div>
                  <Input
                    label="Display Name"
                    value={formData.display_name}
                    onChange={(e) =>
                      setFormData({ ...formData, display_name: e.target.value })
                    }
                    placeholder="Your display name"
                  />
                </div>

                <Textarea
                  label="Bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell other gamers about yourself... What games do you play? What's your playstyle?"
                  rows={4}
                />
              </div>
            </motion.div>

            {/* Gaming Preferences Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pt-6 border-t border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <Gamepad2 className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-text">Gaming Preferences</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                <Select
                  label="Gaming Style"
                  options={[
                    { value: "", label: "Select style" },
                    ...GAMING_STYLES.map((s) => ({
                      value: s.value,
                      label: s.label,
                    })),
                  ]}
                  value={formData.gaming_style}
                  onChange={(e) =>
                    setFormData({ ...formData, gaming_style: e.target.value })
                  }
                />
                <Select
                  label="Region"
                  options={[
                    { value: "", label: "Select region" },
                    ...REGIONS.map((r) => ({
                      value: r.value,
                      label: r.label,
                    })),
                  ]}
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                />
                <Select
                  label="Language"
                  options={LANGUAGES.map((l) => ({
                    value: l.value,
                    label: l.label,
                  }))}
                  value={formData.preferred_language}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_language: e.target.value,
                    })
                  }
                />
              </div>
            </motion.div>

            {/* My Games Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="pt-6 border-t border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-text">My Games</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingGame(null);
                    setGameModalOpen(true);
                  }}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="hover:border-primary hover:text-primary"
                >
                  Add Game
                </Button>
              </div>
              <div className="space-y-3 pl-2">
                {gamesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : userGames.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-surface-light rounded-lg flex items-center justify-center border border-border">
                      <Gamepad2 className="h-6 w-6 text-text-muted" />
                    </div>
                    <p className="text-text-muted text-sm">No games added yet</p>
                    <p className="text-text-dim text-xs mt-1">
                      Add your first game to showcase your skills!
                    </p>
                  </div>
                ) : (
                  userGames.map((ug) => (
                    <div
                      key={ug.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface-light border border-border hover:border-border-light transition-colors"
                    >
                      {/* Game icon */}
                      <div className="w-10 h-10 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                        {ug.game?.icon_url ? (
                          <img
                            src={ug.game.icon_url}
                            alt={ug.game?.name || "Game"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <Gamepad2 className="h-5 w-5 text-text-muted" />
                        )}
                      </div>

                      {/* Game info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-text text-sm">
                            {ug.game?.name || "Unknown Game"}
                          </span>
                          {ug.rank && (
                            <Badge variant="primary" className="text-xs">
                              {ug.rank}
                            </Badge>
                          )}
                          {ug.role && (
                            <Badge variant="secondary" className="text-xs">
                              {ug.role}
                            </Badge>
                          )}
                          {ug.is_verified ? (
                            <Badge variant="success" className="text-xs gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (ug.rank || ug.game_username) ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              Self-Reported
                            </Badge>
                          ) : null}
                        </div>
                        {ug.game_username && (
                          <p className="text-xs text-text-muted mt-0.5 truncate">
                            IGN: {ug.game_username}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingGame(ug);
                            setGameModalOpen(true);
                          }}
                          className="h-8 w-8 hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (deletingGameId === ug.id) {
                              // Confirmed delete
                              await deleteGame(ug.id);
                              setDeletingGameId(null);
                            } else {
                              // First click — ask for confirmation
                              setDeletingGameId(ug.id);
                              setTimeout(() => setDeletingGameId(null), 3000);
                            }
                          }}
                          disabled={gameDeleting}
                          className={`h-8 w-8 ${
                            deletingGameId === ug.id
                              ? "text-error bg-error/10"
                              : "hover:text-error"
                          }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {deletingGameId === ug.id && (
                          <span className="text-xs text-error animate-pulse">
                            Click again
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Game Profile Modal */}
            <GameProfileModal
              isOpen={gameModalOpen}
              onClose={() => {
                setGameModalOpen(false);
                setEditingGame(null);
              }}
              existingGame={editingGame}
              onSaved={() => {
                setGameModalOpen(false);
                setEditingGame(null);
                refetchGames();
              }}
              linkedGameSlugs={userGames
                .map((ug) => ug.game?.slug)
                .filter((s): s is string => !!s)}
            />

            {/* Social Links Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-6 border-t border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent/20">
                  <LinkIcon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-text">Social & Gaming Links</h3>
              </div>
              <p className="text-sm text-text-muted mb-4 pl-2">
                Connect your gaming profiles to let others find you
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                <div className="relative">
                  <Input
                    label="Discord"
                    value={formData.discord}
                    onChange={(e) =>
                      setFormData({ ...formData, discord: e.target.value })
                    }
                    placeholder="username#0000"
                  />
                  <div className="absolute right-3 top-9 w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="#5865F2">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    label="Twitch"
                    value={formData.twitch}
                    onChange={(e) =>
                      setFormData({ ...formData, twitch: e.target.value })
                    }
                    placeholder="username"
                  />
                  <div className="absolute right-3 top-9 w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="#9146FF">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    label="YouTube"
                    value={formData.youtube}
                    onChange={(e) =>
                      setFormData({ ...formData, youtube: e.target.value })
                    }
                    placeholder="Channel URL"
                  />
                  <div className="absolute right-3 top-9 w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="#FF0000">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                      <path fill="#fff" d="M9.545 15.568V8.432L15.818 12z"/>
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    label="Twitter / X"
                    value={formData.twitter}
                    onChange={(e) =>
                      setFormData({ ...formData, twitter: e.target.value })
                    }
                    placeholder="username"
                  />
                  <div className="absolute right-3 top-9 w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-text-secondary">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                </div>
                <div className="relative md:col-span-2">
                  <Input
                    label="Steam Profile"
                    value={formData.steam}
                    onChange={(e) =>
                      setFormData({ ...formData, steam: e.target.value })
                    }
                    placeholder="https://steamcommunity.com/id/yourusername"
                  />
                  <div className="absolute right-3 top-9 w-5 h-5">
                    <svg viewBox="0 0 24 24" fill="#66c0f4">
                      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Location Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-6 border-t border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Globe className="h-5 w-5 text-warning" />
                </div>
                <h3 className="text-lg font-bold text-text">Location & Timezone</h3>
              </div>
              <p className="text-sm text-text-muted pl-2">
                Your region and language help us connect you with nearby players for better ping and communication.
              </p>
            </motion.div>
          </div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between mt-8 pt-6 border-t border-border"
          >
            <div>
              {success && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-sm text-success font-medium"
                >
                  <Zap className="h-4 w-4" />
                  Profile updated! Redirecting...
                </motion.span>
              )}
              {error && (
                <span className="text-sm text-error">
                  {error}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Link href={`/profile/${username}`}>
                <Button variant="ghost" className="hover:bg-error/10 hover:text-error">
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleSave}
                isLoading={loading}
                leftIcon={<Save className="h-4 w-4" />}
                className="shadow-lg shadow-primary/25 hover:shadow-primary/50"
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
