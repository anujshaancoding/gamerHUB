"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Copy,
  Download,
  Languages,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AGENTS, ROLE_META, type AgentRole } from "@/lib/data/valorant-agents";
import { REGIONS, LANGUAGES, GAMING_STYLES } from "@/lib/constants/games";
import { VALORANT_TIERS, tierColor } from "@/lib/features/tools/valorant-ranks";
import { Button } from "@/components/ui";
import { useActionGate } from "@/components/shared/auth/auth-gate-provider";
import { trackCtaClick } from "@/lib/analytics/cta-click";
import { CTA_SOURCES } from "@/lib/analytics/sources";
import { useAuth } from "@/lib/hooks/useAuth";

const FEATURED_AGENTS = [
  "jett",
  "reyna",
  "sova",
  "omen",
  "killjoy",
  "sage",
  "raze",
  "neon",
  "phoenix",
  "viper",
];

const topRegions = [
  "maharashtra",
  "delhi",
  "karnataka",
  "telangana",
  "tamil-nadu",
  "uttar-pradesh",
  "west-bengal",
  "gujarat",
  "kerala",
  "punjab",
];

const topLanguages = ["en", "hi", "ta", "te", "mr", "bn", "kn", "ml", "gu", "pa"];

const waitlistFields = [
  "Rank range",
  "Main role",
  "Language",
  "Play time",
  "Mic comfort",
  "Playstyle",
];

const PASSPORT_DRAFT_KEY = "gglobby_valorant_passport_draft";

interface PassportDraft {
  name: string;
  rank: string;
  peakRank: string;
  agentSlug: string;
  role: AgentRole;
  region: string;
  language: string;
  style: string;
}

export function PassportClient() {
  const { user, refreshProfile } = useAuth();
  const { openAuthGate } = useActionGate();

  const agents = useMemo(
    () =>
      FEATURED_AGENTS.map((slug) => AGENTS.find((agent) => agent.slug === slug)).filter(
        Boolean
      ) as typeof AGENTS,
    []
  );

  const [name, setName] = useState("your_tag");
  const [rank, setRank] = useState("Gold 2");
  const [peakRank, setPeakRank] = useState("Diamond 1");
  const [agentSlug, setAgentSlug] = useState("jett");
  const [role, setRole] = useState<AgentRole>("Duelist");
  const [region, setRegion] = useState("maharashtra");
  const [language, setLanguage] = useState("hi");
  const [style, setStyle] = useState("competitive");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submittingFeature, setSubmittingFeature] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submittedFeature, setSubmittedFeature] = useState(false);

  const agent = AGENTS.find((item) => item.slug === agentSlug) ?? AGENTS[0];
  const accent = tierColor(rank);
  const roleAccent = ROLE_META[role]?.color ?? accent;
  const regionLabel = REGIONS.find((item) => item.value === region)?.label ?? "India";
  const languageLabel =
    LANGUAGES.find((item) => item.value === language)?.label ?? "English";
  const styleLabel =
    GAMING_STYLES.find((item) => item.value === style)?.label ?? "Competitive";

  const passportText = `${name || "My"} Valorant Passport\n${rank} - Peak ${peakRank}\n${agent.name} ${role} - ${regionLabel}\nCreate yours on ggLobby.`;

  const draft: PassportDraft = useMemo(
    () => ({
      name: name.trim() || "your_tag",
      rank,
      peakRank,
      agentSlug,
      role,
      region,
      language,
      style,
    }),
    [agentSlug, language, name, peakRank, rank, region, role, style],
  );

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(PASSPORT_DRAFT_KEY);
      if (!rawDraft) return;

      const parsed = JSON.parse(rawDraft) as Partial<PassportDraft>;
      if (typeof parsed.name === "string") setName(parsed.name.slice(0, 24));
      if (typeof parsed.rank === "string" && VALORANT_TIERS.includes(parsed.rank as never)) {
        setRank(parsed.rank);
      }
      if (
        typeof parsed.peakRank === "string" &&
        VALORANT_TIERS.includes(parsed.peakRank as never)
      ) {
        setPeakRank(parsed.peakRank);
      }
      if (typeof parsed.agentSlug === "string" && AGENTS.some((item) => item.slug === parsed.agentSlug)) {
        setAgentSlug(parsed.agentSlug);
      }
      if (
        typeof parsed.role === "string" &&
        ["Duelist", "Controller", "Initiator", "Sentinel"].includes(parsed.role)
      ) {
        setRole(parsed.role as AgentRole);
      }
      if (typeof parsed.region === "string" && REGIONS.some((item) => item.value === parsed.region)) {
        setRegion(parsed.region);
      }
      if (
        typeof parsed.language === "string" &&
        LANGUAGES.some((item) => item.value === parsed.language)
      ) {
        setLanguage(parsed.language);
      }
      if (
        typeof parsed.style === "string" &&
        GAMING_STYLES.some((item) => item.value === parsed.style)
      ) {
        setStyle(parsed.style);
      }
    } catch {
      /* ignore invalid draft */
    }
  }, []);

  useEffect(() => {
    setSaved(false);
    try {
      window.localStorage.setItem(PASSPORT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore storage failures */
    }
  }, [draft]);

  async function sharePassport() {
    trackCtaClick(CTA_SOURCES.passport_share);
    const url = typeof window !== "undefined" ? `${window.location.origin}/passport` : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Valorant Passport - ggLobby",
          text: passportText,
          url,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }

    try {
      await navigator.clipboard.writeText(`${passportText}\n${url}`);
      setCopied(true);
      toast.success("Passport preview copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function savePassport() {
    trackCtaClick(CTA_SOURCES.passport_save);

    try {
      window.localStorage.setItem(PASSPORT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore storage failures */
    }

    if (!user) {
      openAuthGate({
        reason:
          "Create a free profile to save your Valorant Passport and join Squad Finder early access",
        source: CTA_SOURCES.passport_save,
        redirectTo: "/passport",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save passport");
      }

      refreshProfile();
      setSaved(true);
      toast.success("Passport saved to your profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save passport");
    } finally {
      setSaving(false);
    }
  }

  async function downloadPassport() {
    trackCtaClick(CTA_SOURCES.passport_download);
    setDownloading(true);
    try {
      const blob = await renderPassportPng({
        name: draft.name,
        rank,
        peakRank,
        agentName: agent.name,
        role,
        region: regionLabel,
        language: languageLabel,
        style: styleLabel,
        accent,
        roleAccent,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `gglobby-valorant-passport-${draft.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "player"}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Passport PNG downloaded");
    } catch {
      toast.error("Failed to download Passport PNG");
    } finally {
      setDownloading(false);
    }
  }

  async function submitForFeature() {
    trackCtaClick(CTA_SOURCES.passport_feature_submit);

    if (!user) {
      openAuthGate({
        reason:
          "Create a free profile to submit your Valorant Passport for the weekly feature",
        source: CTA_SOURCES.passport_feature_submit,
        redirectTo: "/passport",
      });
      return;
    }

    setSubmittingFeature(true);
    try {
      const response = await fetch("/api/passport", { method: "PATCH" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit for weekly feature");
      }

      setSubmittedFeature(true);
      toast.success("Submitted for weekly feature");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit Passport");
    } finally {
      setSubmittingFeature(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            India launch identity
          </div>
          <h1 className="mt-5 text-4xl font-black uppercase leading-none tracking-tight text-text sm:text-6xl">
            Create your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Valorant Passport
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
            Show your rank, peak, main agent, role, state, language and grind in one
            share-ready identity. Build it free now; save it to your ggLobby profile
            when you want to get featured.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={savePassport}
              isLoading={saving}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              {saved ? "Passport saved" : "Save my passport"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={downloadPassport}
              isLoading={downloading}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download PNG
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={submitForFeature}
              isLoading={submittingFeature}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              {submittedFeature ? "Feature submitted" : "Submit for feature"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={sharePassport}
              leftIcon={copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            >
              {copied ? "Copied" : "Share preview"}
            </Button>
            <Link href="/passport/gallery">
              <Button size="lg" variant="ghost" leftIcon={<Users className="h-4 w-4" />}>
                View gallery
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Trophy, label: "Rank proof", value: "card-ready" },
              { icon: Camera, label: "Feature hook", value: "clutch wall soon" },
              { icon: Users, label: "Squad data", value: "for later LFG" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-surface p-4">
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-bold text-text">{item.label}</p>
                <p className="text-xs uppercase tracking-wider text-text-muted">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <PassportPreview
          name={name}
          rank={rank}
          peakRank={peakRank}
          agentName={agent.name}
          role={role}
          region={regionLabel}
          language={languageLabel}
          style={styleLabel}
          accent={accent}
          roleAccent={roleAccent}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-text">
                Build the preview
              </h2>
              <p className="text-xs text-text-muted">
                No signup needed until you save it.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Player name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 24))}
                className="w-full rounded-xl border border-border bg-surface-light px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                placeholder="your_tag"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Current rank" value={rank} onChange={setRank} options={VALORANT_TIERS} />
              <SelectField label="Peak rank" value={peakRank} onChange={setPeakRank} options={VALORANT_TIERS} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="State / region"
                value={region}
                onChange={setRegion}
                options={topRegions}
                labels={Object.fromEntries(REGIONS.map((item) => [item.value, item.label]))}
              />
              <SelectField
                label="Language"
                value={language}
                onChange={setLanguage}
                options={topLanguages}
                labels={Object.fromEntries(LANGUAGES.map((item) => [item.value, item.label]))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Main role"
                value={role}
                onChange={(value) => setRole(value as AgentRole)}
                options={["Duelist", "Controller", "Initiator", "Sentinel"]}
              />
              <SelectField
                label="Playstyle"
                value={style}
                onChange={setStyle}
                options={GAMING_STYLES.map((item) => item.value)}
                labels={Object.fromEntries(GAMING_STYLES.map((item) => [item.value, item.label]))}
              />
            </div>

            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Main agent
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {agents.map((item) => {
                  const active = item.slug === agentSlug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => {
                        setAgentSlug(item.slug);
                        setRole(item.role);
                      }}
                      className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface-light text-text-secondary hover:border-primary/40 hover:text-text"
                      }`}
                    >
                      <span className="block text-sm font-bold">{item.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">
                        {item.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-text">
                  Why this comes before LFG
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Squad Finder works only when enough verified Indian Valorant players
                  join. Passport collects the exact data needed for later matching
                  without showing an empty LFG marketplace today.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {waitlistFields.map((field) => (
                <div
                  key={field}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-light px-3 py-2 text-sm text-text-secondary"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {field}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="primary" onClick={savePassport} leftIcon={<ArrowRight className="h-4 w-4" />}>
                Join early access
              </Button>
              <Button
                variant="secondary"
                onClick={submitForFeature}
                isLoading={submittingFeature}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Submit for feature
              </Button>
              <Link href="/rank-card">
                <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                  Make rank card
                </Button>
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Rank Card",
                body: "Download a PNG for Instagram, WhatsApp and Discord.",
                href: "/rank-card",
              },
              {
                icon: Zap,
                title: "Aim Lab",
                body: "Play browser drills and share your score.",
                href: "/aim",
              },
              {
                icon: Trophy,
                title: "India Scene",
                body: "Vote for the next Indian player to go pro.",
                href: "/scene",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-bold text-text">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.body}</p>
              </Link>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-surface-light px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PassportPreview({
  name,
  rank,
  peakRank,
  agentName,
  role,
  region,
  language,
  style,
  accent,
  roleAccent,
}: {
  name: string;
  rank: string;
  peakRank: string;
  agentName: string;
  role: string;
  region: string;
  language: string;
  style: string;
  accent: string;
  roleAccent: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="absolute -inset-4 rounded-[2rem] opacity-25 blur-2xl"
        style={{ background: `linear-gradient(135deg, ${accent}, ${roleAccent})` }}
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-[#080b10] p-5 shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(70% 60% at 85% 5%, ${accent}44, transparent 70%), radial-gradient(60% 70% at 0% 100%, ${roleAccent}33, transparent 70%)`,
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-text-dim">
                ggLobby Valorant Passport
              </p>
              <h2 className="mt-2 break-words text-3xl font-black uppercase italic leading-none text-text">
                {name.trim() || "your_tag"}
              </h2>
            </div>
            <div
              className="rounded-2xl border px-3 py-2 text-center"
              style={{ borderColor: `${accent}66`, background: `${accent}18` }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Rank
              </p>
              <p className="text-sm font-black" style={{ color: accent }}>
                {rank}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <PassportStat icon={Trophy} label="Peak" value={peakRank} color={accent} />
            <PassportStat icon={Target} label="Agent" value={agentName} color={roleAccent} />
            <PassportStat icon={BadgeCheck} label="Role" value={role} color={roleAccent} />
            <PassportStat icon={MapPin} label="Region" value={region} color={accent} />
            <PassportStat icon={Languages} label="Language" value={language} color={roleAccent} />
            <PassportStat icon={Zap} label="Style" value={style} color={accent} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Squad Finder
                </p>
                <p className="mt-1 text-sm font-semibold text-text">
                  Early access data ready
                </p>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                waitlist
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-text-dim">
            <span>gglobby.in/passport</span>
            <span>India Valorant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PassportStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </p>
      </div>
      <p className="mt-1 truncate text-sm font-black text-text">{value}</p>
    </div>
  );
}

async function renderPassportPng({
  name,
  rank,
  peakRank,
  agentName,
  role,
  region,
  language,
  style,
  accent,
  roleAccent,
}: {
  name: string;
  rank: string;
  peakRank: string;
  agentName: string;
  role: string;
  region: string;
  language: string;
  style: string;
  accent: string;
  roleAccent: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, "#070910");
  gradient.addColorStop(0.55, "#10131f");
  gradient.addColorStop(1, "#050609");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1350);

  drawGlow(ctx, 870, 130, 430, accent);
  drawGlow(ctx, 150, 1180, 470, roleAccent);

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 3;
  roundRect(ctx, 70, 70, 940, 1210, 44);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  roundRect(ctx, 100, 100, 880, 1150, 34);
  ctx.fill();

  ctx.fillStyle = "#9aa3b2";
  ctx.font = "700 32px Arial";
  ctx.fillText("GGLOBBY VALORANT PASSPORT", 130, 170);

  ctx.fillStyle = "#f4f7fb";
  ctx.font = "900 92px Arial";
  wrapCanvasText(ctx, name.toUpperCase(), 130, 290, 800, 96, 2);

  ctx.fillStyle = accent;
  ctx.font = "900 82px Arial";
  ctx.fillText(rank.toUpperCase(), 130, 460);

  drawPill(ctx, 130, 515, 370, 82, `PEAK ${peakRank}`, accent);
  drawPill(ctx, 525, 515, 425, 82, `${agentName.toUpperCase()} / ${role.toUpperCase()}`, roleAccent);

  const stats = [
    ["REGION", region],
    ["LANGUAGE", language],
    ["PLAYSTYLE", style],
    ["SQUAD FINDER", "Early access ready"],
  ];

  stats.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 130 : 555;
    const y = 690 + Math.floor(index / 2) * 190;
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, x, y, 395, 140, 24);
    ctx.fill();
    ctx.fillStyle = "#8f98a8";
    ctx.font = "700 26px Arial";
    ctx.fillText(label, x + 28, y + 48);
    ctx.fillStyle = "#f4f7fb";
    ctx.font = "900 34px Arial";
    wrapCanvasText(ctx, value, x + 28, y + 92, 330, 38, 1);
  });

  ctx.fillStyle = accent;
  roundRect(ctx, 130, 1110, 820, 88, 22);
  ctx.fill();
  ctx.fillStyle = "#050609";
  ctx.font = "900 34px Arial";
  ctx.fillText("CREATE YOURS AT GGLOBBY.IN/PASSPORT", 170, 1166);

  ctx.fillStyle = "#8f98a8";
  ctx.font = "700 26px Arial";
  ctx.fillText("India Valorant - share your rank, agent, state and language", 130, 1235);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG render failed"));
    }, "image/png");
  });
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `${color}66`);
  glow.addColorStop(0.6, `${color}18`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1350);
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  color: string,
) {
  ctx.fillStyle = `${color}22`;
  roundRect(ctx, x, y, width, height, 24);
  ctx.fill();
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "900 27px Arial";
  wrapCanvasText(ctx, text, x + 28, y + 51, width - 56, 32, 1);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount += 1;
      if (lineCount >= maxLines) return;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }
}
