import {
  Crosshair,
  Target,
  Flame,
  Cpu,
  Users,
  Coffee,
  MessageSquare,
  Megaphone,
  Hash,
} from "lucide-react";

const MAP = {
  Crosshair,
  Target,
  Flame,
  Cpu,
  Users,
  Coffee,
  MessageSquare,
  Megaphone,
} as const;

const COLOUR_MAP: Record<string, string> = {
  red:     "bg-red-500/15 text-red-300 border-red-500/30",
  orange:  "bg-orange-500/15 text-orange-300 border-orange-500/30",
  purple:  "bg-purple-500/15 text-purple-300 border-purple-500/30",
  cyan:    "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  blue:    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  pink:    "bg-pink-500/15 text-pink-300 border-pink-500/30",
  default: "bg-surface-light text-text-secondary border-border",
};

export function ForumCategoryIcon({ name, color }: { name: string | null; color: string | null }) {
  const Icon = (name && (MAP as Record<string, typeof Hash>)[name]) || Hash;
  const cls = (color && COLOUR_MAP[color]) || COLOUR_MAP.default;
  return (
    <div className={`rounded-lg p-2 border flex-shrink-0 ${cls}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}
