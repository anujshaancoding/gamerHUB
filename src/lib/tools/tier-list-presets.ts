export type TierItem = { id: string; label: string };

export interface TierPreset {
  id: string;
  label: string;
  items: TierItem[];
}

export const TIER_PRESETS: TierPreset[] = [
  {
    id: "val-agents",
    label: "Valorant agents",
    items: [
      "Jett", "Reyna", "Phoenix", "Raze", "Yoru", "Neon", "Iso", "Waylay",
      "Sova", "Skye", "KAY/O", "Breach", "Fade", "Gekko", "Tejo",
      "Killjoy", "Cypher", "Sage", "Chamber", "Deadlock", "Vyse",
      "Brimstone", "Omen", "Viper", "Astra", "Harbor", "Clove",
    ].map((n) => ({ id: n.toLowerCase().replace(/\W+/g, "-"), label: n })),
  },
  {
    id: "val-weapons",
    label: "Valorant weapons",
    items: [
      "Vandal", "Phantom", "Operator", "Sheriff", "Guardian", "Marshal",
      "Outlaw", "Bulldog", "Spectre", "Stinger", "Ghost", "Classic",
      "Judge", "Bucky", "Ares", "Odin", "Frenzy", "Shorty", "Knife",
    ].map((n) => ({ id: n.toLowerCase().replace(/\W+/g, "-"), label: n })),
  },
  {
    id: "val-maps",
    label: "Valorant maps",
    items: [
      "Ascent", "Bind", "Haven", "Split", "Icebox", "Breeze", "Fracture",
      "Pearl", "Lotus", "Sunset", "Abyss", "Corrode",
    ].map((n) => ({ id: n.toLowerCase().replace(/\W+/g, "-"), label: n })),
  },
  {
    id: "indian-pros-val",
    label: "Indian Valorant pros",
    items: [
      "Russ", "Jamaican", "ShadoWalkeR", "Lightningfast", "BENKAI", "Skip",
      "Bazzi", "Hellff", "EnvyG", "wizard", "tappu", "rite2ace", "haashi",
    ].map((n) => ({ id: n.toLowerCase().replace(/\W+/g, "-"), label: n })),
  },
];

export const DEFAULT_ROWS = [
  { id: "S", label: "S", color: "from-red-500/30 to-red-600/30 border-red-500/40" },
  { id: "A", label: "A", color: "from-orange-500/30 to-orange-600/30 border-orange-500/40" },
  { id: "B", label: "B", color: "from-yellow-500/25 to-yellow-600/25 border-yellow-500/40" },
  { id: "C", label: "C", color: "from-emerald-500/25 to-emerald-600/25 border-emerald-500/40" },
  { id: "D", label: "D", color: "from-sky-500/25 to-sky-600/25 border-sky-500/40" },
  { id: "F", label: "F", color: "from-slate-500/25 to-slate-600/25 border-slate-500/40" },
];
