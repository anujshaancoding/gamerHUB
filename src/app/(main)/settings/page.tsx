"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Palette,
  LogOut,
  Save,
  Camera,
  Check,
  Loader2,
  AlertCircle,
  AtSign,
  Clock,
} from "lucide-react";
import { Button, Input, LegacySelect as Select, Textarea, Card, Avatar, SelectWithOther } from "@/components/ui";
import { ThemeSwitcher } from "@/components/settings";
import { useAuth } from "@/lib/hooks/useAuth";
import { REGIONS, LANGUAGES, GAMING_STYLES } from "@/lib/constants/games";
import {
  useNotificationPreferences,
  useUpdateSinglePreference,
  type NotificationType,
} from "@/lib/hooks/useNotifications";

type SettingsTab = "profile" | "notifications" | "privacy" | "appearance";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
const COOLDOWN_DAYS = 14;

// Notification items mapped to real backend types
const NOTIFICATION_ITEMS: { type: NotificationType; label: string; description: string }[] = [
  { type: "match_reminder", label: "Match reminders", description: "Get reminded before your scheduled matches" },
  { type: "tournament_start", label: "Tournament updates", description: "Get notified about tournaments you're in" },
  { type: "direct_message", label: "Messages", description: "Get notified about new messages" },
  { type: "friend_request", label: "Friend requests", description: "Get notified when someone sends a friend request" },
  { type: "clan_invite", label: "Clan invitations", description: "Get notified when you receive a clan invite" },
  { type: "forum_reply", label: "Community replies", description: "Get notified when someone replies to your posts" },
  { type: "achievement_earned", label: "Achievements", description: "Get notified when you earn a new achievement" },
  { type: "system_announcement", label: "System announcements", description: "Important platform announcements" },
];

// Privacy settings configuration
interface PrivacySettings {
  profile_visible: boolean;
  show_online_status: boolean;
  show_game_stats: boolean;
  show_achievements: boolean;
  show_activity: boolean;
}

const DEFAULT_PRIVACY: PrivacySettings = {
  profile_visible: true,
  show_online_status: true,
  show_game_stats: true,
  show_achievements: true,
  show_activity: true,
};

const PRIVACY_ITEMS: { key: keyof PrivacySettings; label: string; description: string }[] = [
  { key: "profile_visible", label: "Profile visibility", description: "Allow others to view your profile" },
  { key: "show_online_status", label: "Online status", description: "Show when you're online" },
  { key: "show_game_stats", label: "Game stats visibility", description: "Show your game stats publicly" },
  { key: "show_achievements", label: "Achievement visibility", description: "Show your achievements publicly" },
  { key: "show_activity", label: "Activity visibility", description: "Show your recent activity on your profile" },
];

// Reusable toggle switch component
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? "bg-primary" : "bg-surface-lighter"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function getCooldownDaysRemaining(usernameChangedAt: string | null): number {
  if (!usernameChangedAt) return 0;
  const changedDate = new Date(usernameChangedAt);
  const now = new Date();
  const diffMs = now.getTime() - changedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(COOLDOWN_DAYS - diffDays));
}

export default function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formInitialized = useRef(false);

  // Username editing state
  const [newUsername, setNewUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notification preferences from API
  const { data: notifData, isLoading: notifLoading } = useNotificationPreferences();
  const updatePreferenceMutation = useUpdateSinglePreference();

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacySuccess, setPrivacySuccess] = useState(false);
  const privacyInitialized = useRef(false);

  const isAutoGeneratedUsername = !profile?.username || profile.username.startsWith("user_");
  const hasManuallySetUsername = !isAutoGeneratedUsername && !!profile?.username_changed_at;
  const cooldownDaysLeft = hasManuallySetUsername ? getCooldownDaysRemaining(profile.username_changed_at ?? null) : 0;
  const canChangeUsername = isAutoGeneratedUsername || cooldownDaysLeft === 0;
  const usernameChanged = newUsername !== (profile?.username || "") && newUsername.length > 0;
  const usernameReady = usernameChanged && usernameStatus === "available" && canChangeUsername;

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (!USERNAME_REGEX.test(value)) {
      setUsernameStatus("invalid");
      setUsernameMessage("3-20 chars, starts with a letter, letters/numbers/underscores only");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    try {
      const res = await fetch(
        `/api/users/check-username?username=${encodeURIComponent(value)}&exclude=${profile?.id || ""}`
      );
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
      setUsernameMessage(data.message);
    } catch {
      setUsernameStatus("invalid");
      setUsernameMessage("Failed to check availability");
    }
  }, [profile?.id]);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setNewUsername(sanitized);

    if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);

    if (sanitized === profile?.username) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!sanitized || sanitized.length < 3) {
      setUsernameStatus(sanitized.length > 0 ? "invalid" : "idle");
      setUsernameMessage(sanitized.length > 0 ? "Username must be at least 3 characters" : "");
      return;
    }

    usernameCheckTimer.current = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 300);
  };

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    gaming_style: "",
    region: "",
    preferred_language: "en",
    custom_region: "",
    custom_language: "",
    discord: "",
    twitch: "",
    youtube: "",
  });

  // Sync form data only once when profile first becomes available
  useEffect(() => {
    if (profile && !formInitialized.current) {
      formInitialized.current = true;
      const isKnownRegion = REGIONS.some((r) => r.value === profile.region);
      const isKnownLang = LANGUAGES.some((l) => l.value === profile.preferred_language);

      setNewUsername(profile.username || "");
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        gaming_style: profile.gaming_style || "",
        region: isKnownRegion ? (profile.region || "") : (profile.region ? "other" : ""),
        preferred_language: isKnownLang ? (profile.preferred_language || "en") : (profile.preferred_language ? "other" : "en"),
        custom_region: isKnownRegion ? "" : (profile.region || ""),
        custom_language: isKnownLang ? "" : (profile.preferred_language || ""),
        discord: (profile.social_links as Record<string, string>)?.discord || "",
        twitch: (profile.social_links as Record<string, string>)?.twitch || "",
        youtube: (profile.social_links as Record<string, string>)?.youtube || "",
      });
    }
  }, [profile]);

  // Load privacy settings from profile
  useEffect(() => {
    if (profile && !privacyInitialized.current) {
      privacyInitialized.current = true;
      const saved = profile.privacy_settings as PrivacySettings | null;
      if (saved) {
        setPrivacySettings({ ...DEFAULT_PRIVACY, ...saved });
      }
    }
  }, [profile]);

  // Helper: check if a notification type is enabled from API data
  const isNotificationEnabled = (type: NotificationType): boolean => {
    if (!notifData?.preferences) return true; // Default to enabled
    const pref = notifData.preferences.find((p) => p.notification_type === type);
    return pref ? pref.is_enabled : true;
  };

  // Handle notification toggle
  const handleNotificationToggle = (type: NotificationType, enabled: boolean) => {
    updatePreferenceMutation.mutate({
      notificationType: type,
      is_enabled: enabled,
    });
  };

  // Handle privacy toggle
  const handlePrivacyToggle = async (key: keyof PrivacySettings, value: boolean) => {
    const updated = { ...privacySettings, [key]: value };
    setPrivacySettings(updated);
    setPrivacySaving(true);

    try {
      const { error } = await updateProfile({ privacy_settings: updated } as Record<string, unknown>);
      if (error) {
        // Revert on error
        setPrivacySettings(privacySettings);
        console.error("Privacy save error:", error);
      } else {
        setPrivacySuccess(true);
        setTimeout(() => setPrivacySuccess(false), 2000);
      }
    } catch (err) {
      setPrivacySettings(privacySettings);
      console.error("Privacy save error:", err);
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const resolvedRegion = formData.region === "other" ? formData.custom_region : formData.region;
      const resolvedLanguage = formData.preferred_language === "other" ? formData.custom_language : formData.preferred_language;

      // Build updates — include username change if applicable
      const updates: Record<string, unknown> = {
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        gaming_style: formData.gaming_style as "casual" | "competitive" | "pro" || null,
        region: resolvedRegion || null,
        preferred_language: resolvedLanguage || "en",
        social_links: {
          discord: formData.discord,
          twitch: formData.twitch,
          youtube: formData.youtube,
        },
      };

      if (usernameReady) {
        updates.username = newUsername;
        updates.username_changed_at = new Date().toISOString();
      }

      const { error } = await updateProfile(updates);

      if (error) {
        setError(error.message || "Failed to save profile");
        console.error("Save error:", error);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-text-muted mt-1">
          Manage your account preferences and profile
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-text hover:bg-surface-light"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
              <hr className="my-2 border-border" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <h2 className="text-lg font-semibold text-text mb-6">
                  Profile Settings
                </h2>

                {/* Avatar Section */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.display_name || profile?.username || "User"}
                    size="xl"
                  />
                  <div>
                    <Button variant="outline" size="sm" leftIcon={<Camera className="h-4 w-4" />}>
                      Change Avatar
                    </Button>
                    <p className="text-xs text-text-muted mt-2">
                      Recommended: 256x256 PNG or JPG
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-2 block">
                        Username
                      </label>
                      <Input
                        value={newUsername}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        disabled={!canChangeUsername}
                        leftIcon={<AtSign className="h-4 w-4" />}
                        rightIcon={
                          !canChangeUsername ? (
                            <Clock className="h-4 w-4 text-text-dim" />
                          ) : usernameStatus === "checking" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                          ) : usernameStatus === "available" && usernameChanged ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : usernameStatus === "taken" || usernameStatus === "invalid" ? (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          ) : null
                        }
                        maxLength={20}
                      />
                      {!canChangeUsername ? (
                        <p className="text-xs text-text-dim mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          You can change your username in {cooldownDaysLeft} day{cooldownDaysLeft !== 1 ? "s" : ""}
                        </p>
                      ) : usernameMessage && usernameChanged ? (
                        <p className={`text-xs mt-1 ${
                          usernameStatus === "available" ? "text-green-400" :
                          usernameStatus === "taken" || usernameStatus === "invalid" ? "text-red-400" :
                          "text-text-muted"
                        }`}>
                          {usernameMessage}
                        </p>
                      ) : isAutoGeneratedUsername ? (
                        <p className="text-xs text-warning mt-1">Please set a username for your account</p>
                      ) : (
                        <p className="text-xs text-text-dim mt-1">Can be changed every 14 days</p>
                      )}
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
                    placeholder="Tell other gamers about yourself..."
                    rows={3}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <SelectWithOther
                      label="State / Region"
                      options={[
                        { value: "", label: "Select state" },
                        ...REGIONS.map((r) => ({
                          value: r.value,
                          label: r.label,
                        })),
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
                      options={LANGUAGES.map((l) => ({
                        value: l.value,
                        label: l.label,
                      }))}
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

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-text mb-4">
                      Social Links
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Discord"
                        value={formData.discord}
                        onChange={(e) =>
                          setFormData({ ...formData, discord: e.target.value })
                        }
                        placeholder="username#0000"
                      />
                      <Input
                        label="Twitch"
                        value={formData.twitch}
                        onChange={(e) =>
                          setFormData({ ...formData, twitch: e.target.value })
                        }
                        placeholder="username"
                      />
                      <Input
                        label="YouTube"
                        value={formData.youtube}
                        onChange={(e) =>
                          setFormData({ ...formData, youtube: e.target.value })
                        }
                        placeholder="channel URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                  {success && (
                    <span className="text-sm text-success">
                      Settings saved successfully!
                    </span>
                  )}
                  {error && (
                    <span className="text-sm text-error">
                      {error}
                    </span>
                  )}
                  <Button
                    onClick={handleSave}
                    isLoading={loading}
                    leftIcon={<Save className="h-4 w-4" />}
                    className="ml-auto"
                  >
                    Save Changes
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <h2 className="text-lg font-semibold text-text mb-6">
                  Notification Preferences
                </h2>
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {NOTIFICATION_ITEMS.map((item) => (
                      <div
                        key={item.type}
                        className="flex items-center justify-between p-4 bg-surface-light rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-text">{item.label}</p>
                          <p className="text-sm text-text-muted">{item.description}</p>
                        </div>
                        <ToggleSwitch
                          checked={isNotificationEnabled(item.type)}
                          onChange={(enabled) => handleNotificationToggle(item.type, enabled)}
                          disabled={updatePreferenceMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-text">
                    Privacy Settings
                  </h2>
                  {privacySuccess && (
                    <span className="text-xs text-success flex items-center gap-1">
                      <Check className="h-3 w-3" /> Saved
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {PRIVACY_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-surface-light rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-text">{item.label}</p>
                        <p className="text-sm text-text-muted">{item.description}</p>
                      </div>
                      <ToggleSwitch
                        checked={privacySettings[item.key]}
                        onChange={(val) => handlePrivacyToggle(item.key, val)}
                        disabled={privacySaving}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <h2 className="text-lg font-semibold text-text mb-2">
                  Appearance Settings
                </h2>
                <p className="text-text-muted">
                  Customize the look and feel of GamerHub with different color themes
                </p>
              </Card>
              <ThemeSwitcher />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
