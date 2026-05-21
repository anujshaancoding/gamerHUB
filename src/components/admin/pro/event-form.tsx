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
type Status = "upcoming" | "live" | "completed" | "cancelled";

interface EventData {
  slug: string;
  game: Game;
  name: string;
  short_name: string;
  region: string;
  status: Status;
  starts_at: string;
  ends_at: string;
  venue: string;
  prize_pool: string;
  prize_currency: string;
  description: string;
  banner_url: string;
  official_url: string;
  stream_url: string;
  is_featured: boolean;
}

const empty: EventData = {
  slug: "",
  game: "valorant",
  name: "",
  short_name: "",
  region: "India",
  status: "upcoming",
  starts_at: "",
  ends_at: "",
  venue: "",
  prize_pool: "",
  prize_currency: "INR",
  description: "",
  banner_url: "",
  official_url: "",
  stream_url: "",
  is_featured: false,
};

// "2026-06-15T14:00:00+05:30" → "2026-06-15T14:00" for input[type=datetime-local]
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function EventForm({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const isEdit = !!eventId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<EventData>(empty);

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/admin/pro/events?id=${eventId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.event) {
          const e = d.event;
          setEvent({
            slug: e.slug || "",
            game: e.game,
            name: e.name || "",
            short_name: e.short_name || "",
            region: e.region || "India",
            status: e.status,
            starts_at: toLocalInput(e.starts_at),
            ends_at: toLocalInput(e.ends_at || ""),
            venue: e.venue || "",
            prize_pool: e.prize_pool != null ? String(e.prize_pool) : "",
            prize_currency: e.prize_currency || "INR",
            description: e.description || "",
            banner_url: e.banner_url || "",
            official_url: e.official_url || "",
            stream_url: e.stream_url || "",
            is_featured: !!e.is_featured,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async () => {
    if (!event.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!event.starts_at) {
      toast.error("Start date/time is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: event.slug || undefined,
        game: event.game,
        name: event.name.trim(),
        short_name: event.short_name.trim() || null,
        region: event.region.trim() || "India",
        status: event.status,
        starts_at: fromLocalInput(event.starts_at),
        ends_at: event.ends_at ? fromLocalInput(event.ends_at) : null,
        venue: event.venue.trim() || null,
        prize_pool: event.prize_pool ? Number(event.prize_pool) : null,
        prize_currency: event.prize_currency || "INR",
        description: event.description.trim() || null,
        banner_url: event.banner_url.trim() || null,
        official_url: event.official_url.trim() || null,
        stream_url: event.stream_url.trim() || null,
        is_featured: event.is_featured,
      };
      if (isEdit) {
        const res = await fetch("/api/admin/pro/events", {
          method: "PATCH",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ id: eventId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Event saved");
      } else {
        const res = await fetch("/api/admin/pro/events", {
          method: "POST",
          headers: csrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Event created");
      }
      router.push("/admin/pro?tab=events");
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
          {isEdit ? `Edit ${event.name || "Event"}` : "New Event"}
        </h2>
      </div>

      <section className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white/80">Tournament details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EField label="Game">
            <Select
              value={event.game}
              onValueChange={(v) => setEvent({ ...event, game: v as Game })}
              disabled={isEdit}
            >
              <SelectTrigger className="w-full bg-white/[0.03] border-white/10 text-sm text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valorant">Valorant</SelectItem>
              </SelectContent>
            </Select>
          </EField>
          <EField label="Status">
            <Select
              value={event.status}
              onValueChange={(v) => setEvent({ ...event, status: v as Status })}
            >
              <SelectTrigger className="w-full bg-white/[0.03] border-white/10 text-sm text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="live">Live now</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </EField>
          <EField label="Name" required>
            <EInput value={event.name} onChange={(v) => setEvent({ ...event, name: v })} placeholder="Valorant Champions Tour 2026 - Stage 2" />
          </EField>
          <EField label="Short name">
            <EInput value={event.short_name} onChange={(v) => setEvent({ ...event, short_name: v })} placeholder="BMPS S2" />
          </EField>
          <EField label="Slug (auto if empty)">
            <EInput value={event.slug} onChange={(v) => setEvent({ ...event, slug: v })} placeholder="bmps-2026-s2" />
          </EField>
          <EField label="Region">
            <EInput value={event.region} onChange={(v) => setEvent({ ...event, region: v })} placeholder="India" />
          </EField>
          <EField label="Starts at" required>
            <EInput type="datetime-local" value={event.starts_at} onChange={(v) => setEvent({ ...event, starts_at: v })} />
          </EField>
          <EField label="Ends at">
            <EInput type="datetime-local" value={event.ends_at} onChange={(v) => setEvent({ ...event, ends_at: v })} />
          </EField>
          <EField label="Venue">
            <EInput value={event.venue} onChange={(v) => setEvent({ ...event, venue: v })} placeholder="KDJW Stadium, Mumbai / Online" />
          </EField>
          <EField label="Prize pool">
            <EInput type="number" value={event.prize_pool} onChange={(v) => setEvent({ ...event, prize_pool: v })} placeholder="5000000" />
          </EField>
          <EField label="Currency">
            <EInput value={event.prize_currency} onChange={(v) => setEvent({ ...event, prize_currency: v })} placeholder="INR" />
          </EField>
        </div>

        <EField label="Description">
          <textarea
            value={event.description}
            onChange={(e) => setEvent({ ...event, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </EField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EField label="Banner URL">
            <EInput value={event.banner_url} onChange={(v) => setEvent({ ...event, banner_url: v })} placeholder="https://..." />
          </EField>
          <EField label="Official URL">
            <EInput value={event.official_url} onChange={(v) => setEvent({ ...event, official_url: v })} placeholder="https://..." />
          </EField>
          <EField label="Stream URL">
            <EInput value={event.stream_url} onChange={(v) => setEvent({ ...event, stream_url: v })} placeholder="https://youtube.com/..." />
          </EField>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={event.is_featured}
            onChange={(e) => setEvent({ ...event, is_featured: e.target.checked })}
            className="rounded border-white/20 bg-white/[0.03] text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-sm text-white/70">Featured</span>
        </label>
      </section>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
        <Link href="/admin/pro" className="px-4 py-2.5 text-sm text-white/50 hover:text-white/80">Cancel</Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create event"}
        </button>
      </div>
    </div>
  );
}

function EField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
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

function EInput({
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
