import Link from "next/link";
import {
  BadgeCheck,
  Languages,
  MapPin,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { tierColor } from "@/lib/features/tools/valorant-ranks";
import type { PassportGalleryItem } from "@/lib/features/passport-gallery";

export function PassportGalleryCard({
  passport,
  compact = false,
}: {
  passport: PassportGalleryItem;
  compact?: boolean;
}) {
  const accent = tierColor(passport.rank);
  const profileHref = `/profile/${passport.username}`;

  return (
    <Link
      href={profileHref}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-primary/60"
    >
      <div
        className="relative p-4"
        style={{
          background: `radial-gradient(80% 90% at 85% 0%, ${accent}30, transparent 70%)`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-dim">
              Valorant Passport
            </p>
            <h3 className="mt-1 truncate text-xl font-black uppercase italic text-text">
              {passport.name}
            </h3>
            <p className="truncate text-xs text-text-muted">
              @{passport.username}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Rank
            </p>
            <p className="text-sm font-black" style={{ color: accent }}>
              {passport.rank}
            </p>
          </div>
        </div>

        <div className={`mt-4 grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2"}`}>
          <GalleryStat icon={Trophy} label="Peak" value={passport.peakRank} color={accent} />
          <GalleryStat icon={Target} label="Agent" value={passport.agentName} color={accent} />
          {!compact && (
            <>
              <GalleryStat icon={BadgeCheck} label="Role" value={passport.role} color={accent} />
              <GalleryStat icon={MapPin} label="Region" value={passport.region} color={accent} />
              <GalleryStat icon={Languages} label="Language" value={passport.language} color={accent} />
              <GalleryStat icon={Zap} label="Style" value={passport.style} color={accent} />
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
            {passport.submitted ? "weekly feature" : "public"}
          </span>
          <span className="text-xs font-bold text-text-muted group-hover:text-text">
            View profile
          </span>
        </div>
      </div>
    </Link>
  );
}

function GalleryStat({
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
    <div className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
      </div>
      <p className="mt-1 truncate text-sm font-black text-text">{value}</p>
    </div>
  );
}
