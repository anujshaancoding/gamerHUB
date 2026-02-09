"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Globe,
  Lock,
  Mail,
  ArrowLeft,
  Gamepad2,
  Check,
} from "lucide-react";
import { Card, Button, Input, Textarea, Badge } from "@/components/ui";
import { PremiumFeatureGate } from "@/components/premium/PremiumFeatureGate";
import { useClans } from "@/lib/hooks/useClans";
import { useGames } from "@/lib/hooks/useGames";
import { SUPPORTED_GAMES } from "@/lib/constants/games";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ClanJoinType } from "@/types/database";

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
    description: "Anyone can join your clan freely",
    icon: Globe,
    color: "text-success border-success/30 bg-success/5",
  },
  {
    value: "closed",
    label: "Closed",
    description: "Players request to join, your officers approve",
    icon: Lock,
    color: "text-warning border-warning/30 bg-warning/5",
  },
  {
    value: "invite_only",
    label: "Invite Only",
    description: "Only players you invite can join",
    icon: Mail,
    color: "text-accent border-accent/30 bg-accent/5",
  },
];

const REGION_OPTIONS = [
  "India",
  "SEA",
  "EU",
  "NA",
  "ME",
  "OCE",
  "SA",
  "AF",
];

export default function CreateClanPage() {
  const router = useRouter();
  const { createClan } = useClans();
  const { games } = useGames();

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGameSlug, setSelectedGameSlug] = useState("");
  const [customGameName, setCustomGameName] = useState("");
  const [region, setRegion] = useState("");
  const [joinType, setJoinType] = useState<ClanJoinType>("closed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out "Other" from SUPPORTED_GAMES for the main list
  const gameOptions = SUPPORTED_GAMES.filter((g) => g.slug !== "other");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim()) return;

    setLoading(true);
    setError(null);

    // Resolve game selection: match slug to database game ID, or send slug/custom name
    const matchedGame = selectedGameSlug && selectedGameSlug !== "other"
      ? games.find((g) => g.slug === selectedGameSlug)
      : null;

    const result = await createClan({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      description: description.trim() || undefined,
      primary_game_id: matchedGame?.id || undefined,
      primary_game_slug: !matchedGame && selectedGameSlug && selectedGameSlug !== "other"
        ? selectedGameSlug
        : undefined,
      custom_game_name: selectedGameSlug === "other" && customGameName.trim()
        ? customGameName.trim()
        : undefined,
      region: region || undefined,
      is_public: true,
      join_type: joinType,
    });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else if (result.data) {
      router.push(`/clans/${result.data.slug}`);
    }
  };

  const tagValid = /^[A-Za-z0-9]{2,6}$/.test(tag);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/clans"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clans
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          Create a Clan
        </h1>
        <p className="text-text-muted mt-1">
          Build your team and compete together
        </p>
      </div>

      {/* Premium Gate */}
      <PremiumFeatureGate featureName="Creating a Clan">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          {/* Name & Tag */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-text">Basic Info</h2>

            <Input
              label="Clan Name"
              placeholder="e.g. Shadow Warriors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
            />

            <div>
              <Input
                label="Clan Tag"
                placeholder="e.g. SW"
                value={tag}
                onChange={(e) =>
                  setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                }
                maxLength={6}
                required
              />
              <p className="text-xs text-text-muted mt-1">
                2-6 alphanumeric characters. Displayed as [{tag || "TAG"}]
              </p>
              {tag && !tagValid && (
                <p className="text-xs text-error mt-1">
                  Tag must be 2-6 alphanumeric characters
                </p>
              )}
            </div>

            <Textarea
              label="Description (optional)"
              placeholder="What is your clan about? What games do you play?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Card>

          {/* Game & Region */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-text">Game & Region</h2>

            <div>
              <label className="text-sm font-medium text-text mb-1 block">
                Primary Game
              </label>
              <select
                value={selectedGameSlug}
                onChange={(e) => {
                  setSelectedGameSlug(e.target.value);
                  if (e.target.value !== "other") setCustomGameName("");
                }}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a game (optional)</option>
                {gameOptions.map((game) => (
                  <option key={game.slug} value={game.slug}>
                    {game.name}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
              {selectedGameSlug === "other" && (
                <Input
                  placeholder="Enter game name"
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-1 block">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a region (optional)</option>
                {REGION_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Join Type */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-text">Who Can Join?</h2>
            <p className="text-sm text-text-muted">
              Choose how players can join your clan
            </p>

            <div className="grid gap-3">
              {JOIN_TYPES.map((type) => {
                const Icon = type.icon;
                const selected = joinType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setJoinType(type.value)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                      selected
                        ? type.color
                        : "border-border bg-surface hover:bg-surface-light"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 mt-0.5",
                        selected ? "" : "text-text-muted"
                      )}
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          selected ? "" : "text-text"
                        )}
                      >
                        {type.label}
                      </p>
                      <p
                        className={cn(
                          "text-sm mt-0.5",
                          selected ? "opacity-80" : "text-text-muted"
                        )}
                      >
                        {type.description}
                      </p>
                    </div>
                    {selected && (
                      <Check className="h-5 w-5 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              disabled={!name.trim() || !tagValid}
              leftIcon={<Shield className="h-4 w-4" />}
              className="flex-1"
            >
              Create Clan
            </Button>
          </div>
        </form>
      </PremiumFeatureGate>
    </div>
  );
}
