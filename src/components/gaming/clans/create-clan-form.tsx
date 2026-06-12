"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Globe, MapPin, Gamepad2 } from "lucide-react";
import { Card, Button, Input, Textarea, LegacySelect as Select, SelectWithOther } from "@/components/ui";
import { createClient } from "@/lib/db/client-browser";
import { useClans } from "@/lib/hooks/useClans";
import { REGIONS, LANGUAGES } from "@/lib/constants/games";
import type { Game } from "@/types/database";

export function CreateClanForm() {
  const router = useRouter();
  const { createClan } = useClans();
  const db = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    description: "",
    primary_game_id: "",
    region: "",
    language: "en",
    custom_region: "",
    custom_language: "",
    is_public: true,
  });

  useEffect(() => {
    const fetchGames = async () => {
      const { data } = await db
        .from("games")
        .select("*")
        .order("name");
      if (data) setGames(data);
    };
    fetchGames();
  }, [db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate tag
      if (!/^[A-Za-z0-9]{2,6}$/.test(formData.tag)) {
        throw new Error("Tag must be 2-6 alphanumeric characters");
      }

      const resolvedRegion = formData.region === "other" ? formData.custom_region : formData.region;
      const resolvedLanguage = formData.language === "other" ? formData.custom_language : formData.language;

      const result = await createClan({
        name: formData.name,
        tag: formData.tag.toUpperCase(),
        description: formData.description || undefined,
        primary_game_id: formData.primary_game_id || undefined,
        region: resolvedRegion || undefined,
        language: resolvedLanguage || "en",
        is_public: formData.is_public,
      });

      if (result.error) {
        throw result.error;
      }

      router.push(`/clans/${result.data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create clan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Create a Clan</h2>
            <p className="text-sm text-text-muted">
              Build your gaming community
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Name and Tag */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Clan Name"
              placeholder="Enter clan name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              maxLength={50}
            />
          </div>
          <div>
            <Input
              label="Clan Tag"
              placeholder="e.g., PRO"
              value={formData.tag}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tag: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                })
              }
              required
              maxLength={6}
              error={
                formData.tag && !/^[A-Z0-9]{2,6}$/.test(formData.tag)
                  ? "2-6 alphanumeric characters"
                  : undefined
              }
            />
          </div>
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Tell others about your clan..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />

        {/* Primary Game */}
        <Select
          label="Primary Game"
          value={formData.primary_game_id}
          onChange={(e) =>
            setFormData({ ...formData, primary_game_id: e.target.value })
          }
          options={[
            { value: "", label: "Select a game (optional)" },
            ...games.map((g) => ({ value: g.id, label: g.name })),
          ]}
        />

        {/* Region and Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectWithOther
            label="State / Region"
            options={[
              { value: "", label: "Select state (optional)" },
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
            value={formData.language}
            customValue={formData.custom_language}
            onChange={(v) =>
              setFormData({ ...formData, language: v, custom_language: "" })
            }
            onCustomChange={(v) =>
              setFormData({ ...formData, custom_language: v })
            }
            customPlaceholder="Enter your language..."
          />
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-3 p-4 bg-surface-light rounded-lg">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={(e) =>
              setFormData({ ...formData, is_public: e.target.checked })
            }
            className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
          />
          <label htmlFor="is_public" className="flex-1">
            <span className="text-text font-medium">Public Clan</span>
            <p className="text-sm text-text-muted">
              Public clans can be discovered and viewed by everyone
            </p>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={!formData.name || !formData.tag}
            className="flex-1"
          >
            Create Clan
          </Button>
        </div>
      </form>
    </Card>
  );
}
