// ggLobby V2 — Tier list maker presets.
// Art is served from the stable community CDN (media.valorant-api.com), keyed
// by Riot's canonical UUIDs (verified against valorant-api.com) so every chip
// renders a real in-game image with zero manual uploads.

export type TierItem = {
  id: string;
  label: string;
  /** Optional artwork URL. Chips fall back to a text label when absent. */
  image?: string;
};

export interface TierPreset {
  id: string;
  label: string;
  items: TierItem[];
}

const AGENT_CDN = "https://media.valorant-api.com/agents";
const WEAPON_CDN = "https://media.valorant-api.com/weapons";
const MAP_CDN = "https://media.valorant-api.com/maps";

const agentIcon = (uuid: string) => `${AGENT_CDN}/${uuid}/displayicon.png`;
const ultimateIcon = (uuid: string) =>
  `${AGENT_CDN}/${uuid}/abilities/ultimate/displayicon.png`;
const weaponIcon = (uuid: string) => `${WEAPON_CDN}/${uuid}/displayicon.png`;
const mapIcon = (uuid: string) => `${MAP_CDN}/${uuid}/listviewicon.png`;

const slug = (n: string) => n.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "");

// --- Source data (name → canonical UUID) -----------------------------------

/** Every playable agent + their ultimate's display name. */
const AGENTS: { name: string; uuid: string; ult: string }[] = [
  // Duelists
  { name: "Jett", uuid: "add6443a-41bd-e414-f6ad-e58d267f4e95", ult: "Blade Storm" },
  { name: "Reyna", uuid: "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc", ult: "Empress" },
  { name: "Phoenix", uuid: "eb93336a-449b-9c1b-0a54-a891f7921d69", ult: "Run It Back" },
  { name: "Raze", uuid: "f94c3b30-42be-e959-889c-5aa313dba261", ult: "Showstopper" },
  { name: "Yoru", uuid: "7f94d92c-4234-0a36-9646-3a87eb8b5c89", ult: "Dimensional Drift" },
  { name: "Neon", uuid: "bb2a4828-46eb-8cd1-e765-15848195d751", ult: "Overdrive" },
  { name: "Iso", uuid: "0e38b510-41a8-5780-5e8f-568b2a4f2d6c", ult: "Kill Contract" },
  { name: "Waylay", uuid: "df1cb487-4902-002e-5c17-d28e83e78588", ult: "Convergent Paths" },
  { name: "Veto", uuid: "92eeef5d-43b5-1d4a-8d03-b3927a09034b", ult: "Evolution" },
  // Initiators
  { name: "Sova", uuid: "320b2a48-4d9b-a075-30f1-1f93a9b638fa", ult: "Hunter's Fury" },
  { name: "Skye", uuid: "6f2a04ca-43e0-be17-7f36-b3908627744d", ult: "Seekers" },
  { name: "KAY/O", uuid: "601dbbe7-43ce-be57-2a40-4abd24953621", ult: "NULL/cmd" },
  { name: "Breach", uuid: "5f8d3a7f-467b-97f3-062c-13acf203c006", ult: "Rolling Thunder" },
  { name: "Fade", uuid: "dade69b4-4f5a-8528-247b-219e5a1facd6", ult: "Nightfall" },
  { name: "Gekko", uuid: "e370fa57-4757-3604-3648-499e1f642d3f", ult: "Thrash" },
  { name: "Tejo", uuid: "b444168c-4e35-8076-db47-ef9bf368f384", ult: "Armageddon" },
  // Controllers
  { name: "Brimstone", uuid: "9f0d8ba9-4140-b941-57d3-a7ad57c6b417", ult: "Orbital Strike" },
  { name: "Omen", uuid: "8e253930-4c05-31dd-1b6c-968525494517", ult: "From the Shadows" },
  { name: "Viper", uuid: "707eab51-4836-f488-046a-cda6bf494859", ult: "Viper's Pit" },
  { name: "Astra", uuid: "41fb69c1-4189-7b37-f117-bcaf1e96f1bf", ult: "Cosmic Divide" },
  { name: "Harbor", uuid: "95b78ed7-4637-86d9-7e41-71ba8c293152", ult: "Reckoning" },
  { name: "Clove", uuid: "1dbf2edd-4729-0984-3115-daa5eed44993", ult: "Not Dead Yet" },
  { name: "Miks", uuid: "7c8a4701-4de6-9355-b254-e09bc2a34b72", ult: "Bassquake" },
  // Sentinels
  { name: "Killjoy", uuid: "1e58de9c-4950-5125-93e9-a0aee9f98746", ult: "Lockdown" },
  { name: "Cypher", uuid: "117ed9e3-49f3-6512-3ccf-0cada7e3823b", ult: "Neural Theft" },
  { name: "Sage", uuid: "569fdd95-4d10-43ab-ca70-79becc718b46", ult: "Resurrection" },
  { name: "Chamber", uuid: "22697a3d-45bf-8dd7-4fec-84a9e28c69d7", ult: "Tour De Force" },
  { name: "Deadlock", uuid: "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235", ult: "Annihilation" },
  { name: "Vyse", uuid: "efba5359-4016-a1e5-7626-b1ae76895940", ult: "Steel Garden" },
];

/** Every gun + the knife. */
const WEAPONS: { name: string; uuid: string }[] = [
  { name: "Vandal", uuid: "9c82e19d-4575-0200-1a81-3eacf00cf872" },
  { name: "Phantom", uuid: "ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a" },
  { name: "Operator", uuid: "a03b24d3-4319-996d-0f8c-94bbfba1dfc7" },
  { name: "Sheriff", uuid: "e336c6b8-418d-9340-d77f-7a9e4cfe0702" },
  { name: "Guardian", uuid: "4ade7faa-4cf1-8376-95ef-39884480959b" },
  { name: "Marshal", uuid: "c4883e50-4494-202c-3ec3-6b8a9284f00b" },
  { name: "Outlaw", uuid: "5f0aaf7a-4289-3998-d5ff-eb9a5cf7ef5c" },
  { name: "Bulldog", uuid: "ae3de142-4d85-2547-dd26-4e90bed35cf7" },
  { name: "Spectre", uuid: "462080d1-4035-2937-7c09-27aa2a5c27a7" },
  { name: "Stinger", uuid: "f7e1b454-4ad4-1063-ec0a-159e56b58941" },
  { name: "Ghost", uuid: "1baa85b4-4c70-1284-64bb-6481dfc3bb4e" },
  { name: "Classic", uuid: "29a0cfab-485b-f5d5-779a-b59f85e204a8" },
  { name: "Judge", uuid: "ec845bf4-4f79-ddda-a3da-0db3774b2794" },
  { name: "Bucky", uuid: "910be174-449b-c412-ab22-d0873436b21b" },
  { name: "Bandit", uuid: "410b2e0b-4ceb-1321-1727-20858f7f3477" },
  { name: "Ares", uuid: "55d8a0f4-4274-ca67-fe2c-06ab45efdf58" },
  { name: "Odin", uuid: "63e6c2b6-4a8e-869c-3d4c-e38355226584" },
  { name: "Frenzy", uuid: "44d4e95c-4157-0037-81b2-17841bf2e8e3" },
  { name: "Shorty", uuid: "42da8ccc-40d5-affc-beec-15aa47b42eda" },
  { name: "Knife", uuid: "2f59173c-4bed-b6c3-2191-dea9b58be9c7" },
];

/** Every map that has shipped. */
const MAPS: { name: string; uuid: string }[] = [
  { name: "Ascent", uuid: "7eaecc1b-4337-bbf6-6ab9-04b8f06b3319" },
  { name: "Bind", uuid: "2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba" },
  { name: "Haven", uuid: "2bee0dc9-4ffe-519b-1cbd-7fbe763a6047" },
  { name: "Split", uuid: "d960549e-485c-e861-8d71-aa9d1aed12a2" },
  { name: "Icebox", uuid: "e2ad5c54-4114-a870-9641-8ea21279579a" },
  { name: "Breeze", uuid: "2fb9a4fd-47b8-4e7d-a969-74b4046ebd53" },
  { name: "Fracture", uuid: "b529448b-4d60-346e-e89e-00a4c527a405" },
  { name: "Pearl", uuid: "fd267378-4d1d-484f-ff52-77821ed10dc2" },
  { name: "Lotus", uuid: "2fe4ed3a-450a-948b-6d6b-e89a78e680a9" },
  { name: "Sunset", uuid: "92584fbe-486a-b1b2-9faa-39b0f486b498" },
  { name: "Abyss", uuid: "224b0a95-48b9-f703-1bd8-67aca101a61f" },
  { name: "Corrode", uuid: "1c18ab1f-420d-0d8b-71d0-77ad3c439115" },
];

// --- Presets ---------------------------------------------------------------

export const TIER_PRESETS: TierPreset[] = [
  {
    id: "val-agents",
    label: "Valorant agents",
    items: AGENTS.map((a) => ({
      id: slug(a.name),
      label: a.name,
      image: agentIcon(a.uuid),
    })),
  },
  {
    id: "val-ultimates",
    label: "Valorant agent ultimates",
    items: AGENTS.map((a) => ({
      id: `ult-${slug(a.name)}`,
      label: `${a.name} — ${a.ult}`,
      image: ultimateIcon(a.uuid),
    })),
  },
  {
    id: "val-weapons",
    label: "Valorant weapons",
    items: WEAPONS.map((w) => ({
      id: slug(w.name),
      label: w.name,
      image: weaponIcon(w.uuid),
    })),
  },
  {
    id: "val-maps",
    label: "Valorant maps",
    items: MAPS.map((m) => ({
      id: slug(m.name),
      label: m.name,
      image: mapIcon(m.uuid),
    })),
  },
  {
    id: "indian-pros-val",
    label: "Indian Valorant pros",
    items: [
      "Russ", "Jamaican", "ShadoWalkeR", "Lightningfast", "BENKAI", "Skip",
      "Bazzi", "Hellff", "EnvyG", "wizard", "tappu", "rite2ace", "haashi",
    ].map((n) => ({ id: slug(n), label: n })),
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
