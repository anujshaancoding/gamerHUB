"use client";

import { useState } from "react";
import { Trophy, Gift } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Button, SelectWithOther } from "@/components/ui";
import { useListings } from "@/lib/hooks/useListings";
import { cn } from "@/lib/utils";
import { SUPPORTED_GAMES } from "@/lib/constants/games";
import type { ListingType } from "@/types/listings";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GAME_OPTIONS = [
  { value: "", label: "Select a game (optional)" },
  ...SUPPORTED_GAMES.filter((g) => g.slug !== "other").map((g) => ({
    value: g.slug,
    label: g.name,
  })),
  { value: "other", label: "Other" },
];

export function CreateListingModal({ isOpen, onClose }: CreateListingModalProps) {
  const { createListing, isCreating } = useListings();

  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    listing_type: "tournament" as ListingType,
    title: "",
    description: "",
    game_slug: "",
    custom_game_name: "",
    organizer_name: "",
    organizer_url: "",
    starts_at: "",
    ends_at: "",
    rules: "",
    prize_description: "",
    external_link: "",
    tags: "",
  });

  const resetForm = () => {
    setFormData({
      listing_type: "tournament",
      title: "",
      description: "",
      game_slug: "",
      custom_game_name: "",
      organizer_name: "",
      organizer_url: "",
      starts_at: "",
      ends_at: "",
      rules: "",
      prize_description: "",
      external_link: "",
      tags: "",
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.description || !formData.starts_at) {
      setError("Title, description, and start date are required");
      return;
    }

    try {
      // Resolve game: send slug for known games, custom_game_name for "other"
      const gameSlug = formData.game_slug && formData.game_slug !== "other"
        ? formData.game_slug
        : undefined;
      const customGameName = formData.game_slug === "other"
        ? formData.custom_game_name
        : undefined;

      await createListing({
        title: formData.title,
        description: formData.description,
        listing_type: formData.listing_type,
        game_slug: gameSlug,
        custom_game_name: customGameName,
        organizer_name: formData.organizer_name || undefined,
        organizer_url: formData.organizer_url || undefined,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: formData.ends_at
          ? new Date(formData.ends_at).toISOString()
          : undefined,
        rules: formData.rules || undefined,
        prize_description: formData.prize_description || undefined,
        external_link: formData.external_link || undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
      });

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    }
  };

  const typeOptions: { type: ListingType; label: string; icon: typeof Trophy }[] = [
    { type: "tournament", label: "Tournament", icon: Trophy },
    { type: "giveaway", label: "Giveaway", icon: Gift },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Listing"
      description="Share a tournament or giveaway with the community"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3">
          {typeOptions.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setFormData({ ...formData, listing_type: type })
              }
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium",
                formData.listing_type === type
                  ? type === "tournament"
                    ? "border-purple-500 bg-purple-500/10 text-purple-500"
                    : "border-green-500 bg-green-500/10 text-green-500"
                  : "border-border bg-surface-light text-text-muted hover:border-border/80"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g., BGMI Tournament by Dynamo"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          maxLength={200}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Describe the tournament or giveaway..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          required
        />

        {/* Game & Organizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectWithOther
            label="Game (optional)"
            options={GAME_OPTIONS}
            value={formData.game_slug}
            customValue={formData.custom_game_name}
            onChange={(v) =>
              setFormData({ ...formData, game_slug: v, custom_game_name: "" })
            }
            onCustomChange={(v) =>
              setFormData({ ...formData, custom_game_name: v })
            }
            customPlaceholder="Enter game name..."
          />
          <Input
            label="Organizer Name"
            placeholder="e.g., Dynamo Gaming"
            value={formData.organizer_name}
            onChange={(e) =>
              setFormData({ ...formData, organizer_name: e.target.value })
            }
          />
        </div>

        {/* Organizer URL */}
        <Input
          label="Organizer URL (optional)"
          placeholder="https://youtube.com/..."
          value={formData.organizer_url}
          onChange={(e) =>
            setFormData({ ...formData, organizer_url: e.target.value })
          }
        />

        {/* Date/time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Starts At *
            </label>
            <input
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) =>
                setFormData({ ...formData, starts_at: e.target.value })
              }
              required
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Ends At (optional)
            </label>
            <input
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) =>
                setFormData({ ...formData, ends_at: e.target.value })
              }
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Rules */}
        <Textarea
          label="Rules & Regulations (optional)"
          placeholder="Enter rules, eligibility criteria, etc."
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          rows={4}
        />

        {/* Prize */}
        <Textarea
          label="Prize Description (optional)"
          placeholder="e.g., 1st place: $500, 2nd place: $250..."
          value={formData.prize_description}
          onChange={(e) =>
            setFormData({ ...formData, prize_description: e.target.value })
          }
          rows={2}
        />

        {/* External link */}
        <Input
          label="External Link (optional)"
          placeholder="Link to signup page or more details"
          value={formData.external_link}
          onChange={(e) =>
            setFormData({ ...formData, external_link: e.target.value })
          }
        />

        {/* Tags */}
        <Input
          label="Tags (optional)"
          placeholder="Comma separated, e.g., bgmi, mobile, esports"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isCreating}
            disabled={!formData.title || !formData.description || !formData.starts_at}
            className="flex-1"
          >
            Create Listing
          </Button>
        </div>
      </form>
    </Modal>
  );
}
