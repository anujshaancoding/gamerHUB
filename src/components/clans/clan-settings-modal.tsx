"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Settings,
  Globe,
  Lock,
  Mail,
  Check,
  Shield,
  Camera,
  ImageIcon,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Modal, Button, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { REGIONS } from "@/lib/constants/games";
import { optimizedUpload } from "@/lib/upload";
import type { Clan, ClanJoinType } from "@/types/database";

interface ClanSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clan: Clan;
  onUpdate: (updates: Partial<Clan>) => Promise<{ data?: any; error?: Error }>;
  onDelete?: () => Promise<{ success?: boolean; error?: Error }>;
  isLeader?: boolean;
}

const JOIN_TYPES: {
  value: ClanJoinType;
  label: string;
  description: string;
  icon: typeof Globe;
  color: string;
}[] = [
  {
    value: "open",
    label: "Open",
    description: "Anyone can join freely",
    icon: Globe,
    color: "text-success border-success/30 bg-success/5",
  },
  {
    value: "closed",
    label: "Closed",
    description: "Players request, officers approve",
    icon: Lock,
    color: "text-warning border-warning/30 bg-warning/5",
  },
  {
    value: "invite_only",
    label: "Invite Only",
    description: "Only invited players can join",
    icon: Mail,
    color: "text-accent border-accent/30 bg-accent/5",
  },
];

export function ClanSettingsModal({
  isOpen,
  onClose,
  clan,
  onUpdate,
  onDelete,
  isLeader = false,
}: ClanSettingsModalProps) {
  const currentJoinType = (clan.join_type as ClanJoinType) || (clan.settings as any)?.join_type || "closed";

  const [name, setName] = useState(clan.name);
  const [description, setDescription] = useState(clan.description || "");
  const [joinType, setJoinType] = useState<ClanJoinType>(currentJoinType);
  const [isRecruiting, setIsRecruiting] = useState(clan.is_recruiting);
  const [maxMembers, setMaxMembers] = useState(clan.max_members);
  const [region, setRegion] = useState(clan.region || "");
  const [minRank, setMinRank] = useState(clan.min_rank_requirement || "");
  const [avatarUrl, setAvatarUrl] = useState(clan.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(clan.banner_url || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const { publicUrl } = await optimizedUpload(file, "clan-avatar", clan.id, clan.avatar_url);
      setAvatarUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    }
    setUploadingAvatar(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError(null);
    try {
      const { publicUrl } = await optimizedUpload(file, "clan-banner", clan.id, clan.banner_url);
      setBannerUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload banner");
    }
    setUploadingBanner(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    const updates: Partial<Clan> = {};

    if (name !== clan.name) updates.name = name;
    if (description !== (clan.description || ""))
      updates.description = description || null;
    if (joinType !== currentJoinType) {
      // Store join_type in settings JSONB
      updates.settings = {
        ...((clan.settings as any) || {}),
        join_type: joinType,
        join_approval_required: joinType === "closed",
        allow_member_invites: joinType !== "invite_only",
      } as any;
    }
    if (isRecruiting !== clan.is_recruiting)
      updates.is_recruiting = isRecruiting;
    if (maxMembers !== clan.max_members) updates.max_members = maxMembers;
    if (region !== (clan.region || "")) updates.region = region || null;
    if (minRank !== (clan.min_rank_requirement || ""))
      updates.min_rank_requirement = minRank || null;
    if (avatarUrl !== (clan.avatar_url || ""))
      updates.avatar_url = avatarUrl || null;
    if (bannerUrl !== (clan.banner_url || ""))
      updates.banner_url = bannerUrl || null;

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    const result = await onUpdate(updates);
    if (result.error) {
      setError(result.error.message);
    } else {
      onClose();
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!onDelete || deleteConfirmText !== clan.tag) return;
    setDeleting(true);
    setError(null);
    const result = await onDelete();
    if (result.error) {
      setError(result.error.message);
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clan Settings"
      size="md"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Banner Upload */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">
            Clan Banner
          </label>
          <div
            className="relative h-32 bg-surface-light border border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => bannerInputRef.current?.click()}
          >
            {bannerUrl ? (
              <Image src={bannerUrl} alt="Clan banner" fill className="object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <ImageIcon className="h-6 w-6 mb-1" />
                <span className="text-xs">Click to upload banner</span>
              </div>
            )}
            {uploadingBanner && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">
            Clan Avatar
          </label>
          <div className="flex items-center gap-4">
            <div
              className="relative h-16 w-16 bg-surface-light border border-border rounded-full overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Clan avatar" fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted">
                  <Camera className="h-5 w-5" />
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
            <div className="text-xs text-text-muted">
              <p>Click to upload avatar (max 2MB)</p>
              <p>Auto-compressed to WebP, 400x400</p>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Name */}
        <Input
          label="Clan Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What is your clan about?"
        />

        {/* Join Type */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block">
            Who Can Join?
          </label>
          <div className="grid gap-2">
            {JOIN_TYPES.map((type) => {
              const Icon = type.icon;
              const selected = joinType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setJoinType(type.value)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm",
                    selected
                      ? type.color
                      : "border-border bg-surface hover:bg-surface-light"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      selected ? "" : "text-text-muted"
                    )}
                  />
                  <div className="flex-1">
                    <span className={cn("font-medium", selected ? "" : "text-text")}>
                      {type.label}
                    </span>
                    <span className={cn("ml-2", selected ? "opacity-70" : "text-text-muted")}>
                      - {type.description}
                    </span>
                  </div>
                  {selected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recruiting Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Recruiting</p>
            <p className="text-xs text-text-muted">
              Allow new members to request joining
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRecruiting(!isRecruiting)}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              isRecruiting ? "bg-success" : "bg-surface-light"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                isRecruiting ? "translate-x-5" : ""
              )}
            />
          </button>
        </div>

        {/* Max Members */}
        <div>
          <label className="text-sm font-medium text-text mb-1 block">
            Max Members: {maxMembers}
          </label>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={maxMembers}
            onChange={(e) => setMaxMembers(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>5</span>
            <span>100</span>
          </div>
        </div>

        {/* Region */}
        <div>
          <label className="text-sm font-medium text-text mb-1 block">
            Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">No region</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Min Rank */}
        <Input
          label="Minimum Rank Requirement"
          placeholder="e.g. Gold, Diamond, etc."
          value={minRank}
          onChange={(e) => setMinRank(e.target.value)}
        />

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={loading}
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>

        {/* Danger Zone - Only for leader */}
        {isLeader && onDelete && (
          <div className="mt-4 pt-4 border-t border-error/20">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-sm text-error hover:text-error/80 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete this clan
              </button>
            ) : (
              <div className="p-4 bg-error/5 border border-error/20 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-error">
                      Delete {clan.name}?
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      This will permanently delete the clan, remove all members, and delete all
                      associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">
                    Type <strong>{clan.tag}</strong> to confirm
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={clan.tag}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    isLoading={deleting}
                    disabled={deleteConfirmText !== clan.tag}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Delete Clan
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
