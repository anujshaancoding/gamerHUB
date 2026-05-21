"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { csrfHeaders } from "@/lib/hooks/useCsrfToken";

type Game = "valorant";

interface TeamForm {
  slug: string;
  name: string;
  short_name: string;
  game: Game;
  region: string;
  founded_year: string;
  logo_url: string;
  is_active: boolean;
  socials: Record<string, string>;
}

const empty: TeamForm = {
  slug: "",
  name: "",
  short_name: "",
  game: "valorant",
  region: "India",
  founded_year: "",
  logo_url: "",
  is_active: true,
  socials: {},
};

export function TeamForm({ teamId }: { teamId?: string }) {
  const router = useRouter();
  const isEdit = !!teamId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<TeamForm>(empty);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/admin/pro/teams`)
      .then((r) => r.json())
      .then((d) => {
        const found = (d.teams || []).find((t: { id: string }) => t.id === teamId);
        if (found) {
          setTeam({
            slug: found.slug || "",
            name: found.name || "",
            short_name: found.short_name || "",
            game: found.game,
            region: found.region || "India",
            founded_year: found.founded_year != null ? String(found.founded_year) : "",
            logo_url: found.logo_url || "",
            is_active: found.is_active !== false,
            socials: found.socials || {},
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamId]);

  const handleSubmit = async () => {
    if (!team.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: team.slug || undefined,
        name: team.name.trim(),
        short_name: team.short_name.trim() || null,
        game: team.game,
        region: team.region.trim() || "India",
        founded_year: team.founded_year ? Number(team.founded_year) : null,
        logo_url: team.logo_url.trim() || null,
        is_active: team.is_active,
        socials: team.socials,
      };
      if (isEdit) {
        const res = await fetch("/api/admin/pro/teams", {
          method: "PATCH",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id: teamId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Team saved");
      } else {
        const res = await fetch("/api/admin/pro/teams", {
          method: "POST",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Team created");
      }
      router.push("/admin/pro");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/pro"
          className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Pro Hub
        </Link>
        <h2 className="text-lg font-semibold text-white mt-1">
          {isEdit ? `Edit ${team.name || "Team"}` : "New Team"}
        </h2>
      </div>

      <section className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white/80">Team details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Game">
            <Select
              value={team.game}
              onValueChange={(v) => setTeam({ ...team, game: v as Game })}
              disabled={isEdit}
            >
              <SelectTrigger className="w-full bg-white/[0.03] border-white/10 text-sm text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valorant">Valorant</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Name" required>
            <FormInput value={team.name} onChange={(v) => setTeam({ ...team, name: v })} placeholder="Global Esports" />
          </FormField>
          <FormField label="Short name">
            <FormInput value={team.short_name} onChange={(v) => setTeam({ ...team, short_name: v })} placeholder="GE" />
          </FormField>
          <FormField label="Slug (auto if empty)">
            <FormInput value={team.slug} onChange={(v) => setTeam({ ...team, slug: v })} placeholder="global-esports" />
          </FormField>
          <FormField label="Region">
            <FormInput value={team.region} onChange={(v) => setTeam({ ...team, region: v })} placeholder="India" />
          </FormField>
          <FormField label="Founded year">
            <FormInput value={team.founded_year} onChange={(v) => setTeam({ ...team, founded_year: v })} type="number" placeholder="2017" />
          </FormField>
          <FormField label="Logo URL">
            <FormInput value={team.logo_url} onChange={(v) => setTeam({ ...team, logo_url: v })} placeholder="https://..." />
          </FormField>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={team.is_active}
            onChange={(e) => setTeam({ ...team, is_active: e.target.checked })}
            className="rounded border-white/20 bg-white/[0.03] text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-sm text-white/70">Active</span>
        </label>
      </section>

      <section className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white/80">Socials</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["twitter", "instagram", "youtube", "website"] as const).map((k) => (
            <FormField key={k} label={k}>
              <FormInput
                value={team.socials[k] || ""}
                onChange={(v) => setTeam({ ...team, socials: { ...team.socials, [k]: v } })}
                placeholder={k === "twitter" || k === "instagram" ? "handle (no @)" : k === "website" ? "https://..." : "channel"}
              />
            </FormField>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
        <Link href="/admin/pro" className="px-4 py-2.5 text-sm text-white/50 hover:text-white/80">Cancel</Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create team"}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type || "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
    />
  );
}
