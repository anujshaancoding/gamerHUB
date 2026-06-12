/**
 * Valorant agent + weapon UUID → display icon URLs (valorant-api.com).
 * These are referenced server-side; the client never fetches them directly.
 * Client requests `/api/tracker/asset/...` which proxies + caches them.
 */

export interface AssetMeta {
  id: string;
  name: string;
  uuid: string;
}

export const AGENTS: Record<string, AssetMeta> = {
  jett:       { id: "jett",       name: "Jett",       uuid: "add6443a-41bd-e414-f6ad-e58d267f4e95" },
  phoenix:    { id: "phoenix",    name: "Phoenix",    uuid: "eb93336a-449b-9c1b-0a54-a891f7921d69" },
  reyna:      { id: "reyna",      name: "Reyna",      uuid: "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc" },
  raze:       { id: "raze",       name: "Raze",       uuid: "f94c3b30-42be-e959-889c-5aa313dba261" },
  yoru:       { id: "yoru",       name: "Yoru",       uuid: "7f94d92c-4234-0a36-9646-3a87eb8b5c89" },
  neon:       { id: "neon",       name: "Neon",       uuid: "bb2a4828-46eb-8cd1-e765-15848195d751" },
  iso:        { id: "iso",        name: "Iso",        uuid: "0e38b510-41a8-5780-5e8f-568b2a4f2d6c" },
  brimstone:  { id: "brimstone",  name: "Brimstone",  uuid: "9f0d8ba9-4140-b941-57d3-a7ad57c6b417" },
  omen:       { id: "omen",       name: "Omen",       uuid: "8e253930-4c05-31dd-1b6c-968525494517" },
  viper:      { id: "viper",      name: "Viper",      uuid: "707eab51-4836-f488-046a-cda6bf494859" },
  astra:      { id: "astra",      name: "Astra",      uuid: "41fb69c1-4189-7b37-f117-bcaf1e96f1bf" },
  harbor:     { id: "harbor",     name: "Harbor",     uuid: "95b78ed7-4637-86d9-7e41-71ba8c293152" },
  clove:      { id: "clove",      name: "Clove",      uuid: "1dbf2edd-4729-0984-3115-daa5eed44993" },
  killjoy:    { id: "killjoy",    name: "Killjoy",    uuid: "1e58de9c-4950-5125-93e9-a0aee9f98746" },
  cypher:     { id: "cypher",     name: "Cypher",     uuid: "117ed9e3-49f3-6512-3ccf-0cada7e3823b" },
  sage:       { id: "sage",       name: "Sage",       uuid: "569fdd95-4d10-43ab-ca70-79becc718b46" },
  chamber:    { id: "chamber",    name: "Chamber",    uuid: "22697a3d-45bf-8dd7-4fec-84a9e28c69d7" },
  deadlock:   { id: "deadlock",   name: "Deadlock",   uuid: "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235" },
  vyse:       { id: "vyse",       name: "Vyse",       uuid: "efba5359-4016-a1e5-7626-b1ae76895940" },
  sova:       { id: "sova",       name: "Sova",       uuid: "ded3520f-4264-bfed-162d-b080e2abccf9" },
  breach:     { id: "breach",     name: "Breach",     uuid: "5f8d3a7f-467b-97f3-062c-13acf203c006" },
  skye:       { id: "skye",       name: "Skye",       uuid: "6f2a04ca-43e0-be17-7f36-b3908627744d" },
  kayo:       { id: "kayo",       name: "KAY/O",      uuid: "601dbbe7-43ce-be57-2a40-4abd24953621" },
  fade:       { id: "fade",       name: "Fade",       uuid: "dade69b4-4f5a-8528-247b-219e5a1facd6" },
  gekko:      { id: "gekko",      name: "Gekko",      uuid: "e370fa57-4757-3604-3648-499e1f642d3f" },
  tejo:       { id: "tejo",       name: "Tejo",       uuid: "b04eedfa-46f7-c45e-58c7-8eaae9ce7b18" },
  waylay:     { id: "waylay",     name: "Waylay",     uuid: "df1cb487-4902-002e-5c17-d28e83e78588" },
};

export const WEAPONS: Record<string, AssetMeta> = {
  vandal:    { id: "vandal",    name: "Vandal",    uuid: "9c82e19d-4575-0200-1a81-3eacf00cf872" },
  phantom:   { id: "phantom",   name: "Phantom",   uuid: "ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a" },
  operator:  { id: "operator",  name: "Operator",  uuid: "a03b24d3-4319-996d-0f8c-94bbfba1dfc7" },
  sheriff:   { id: "sheriff",   name: "Sheriff",   uuid: "e336c6b8-418d-9340-d77f-7a9e4cfe0702" },
  spectre:   { id: "spectre",   name: "Spectre",   uuid: "462080d1-4035-2937-7c09-27aa2a5c27a7" },
  marshal:   { id: "marshal",   name: "Marshal",   uuid: "c4883e50-4494-202c-3ec3-6b8a9284f00b" },
  outlaw:    { id: "outlaw",    name: "Outlaw",    uuid: "5cbf7c33-46e2-5c83-bf48-eea031d76cdb" },
  guardian:  { id: "guardian",  name: "Guardian",  uuid: "4ade7faa-4cf1-8376-95ef-39884480959b" },
  bulldog:   { id: "bulldog",   name: "Bulldog",   uuid: "ae3de142-4d85-2547-dd26-4e90bed35cf1" },
  stinger:   { id: "stinger",   name: "Stinger",   uuid: "f7e1b454-4ad4-1063-ec0a-159e56b58941" },
  ghost:     { id: "ghost",     name: "Ghost",     uuid: "1baa85b4-4c70-1284-64bb-6481dfc3bb4e" },
  classic:   { id: "classic",   name: "Classic",   uuid: "29a0cfab-485b-f5d5-779a-b59f85e204a8" },
  judge:     { id: "judge",     name: "Judge",     uuid: "ec845bf4-4f79-ddda-a3da-be2b9912b497" },
  bucky:     { id: "bucky",     name: "Bucky",     uuid: "910be174-449b-a412-1395-a76eeb7ccf2f" },
  ares:      { id: "ares",      name: "Ares",      uuid: "55d8a0f4-4274-ca67-fe2c-06ab45efdf58" },
  odin:      { id: "odin",      name: "Odin",      uuid: "63e6c2b6-4a8e-869c-3d4c-e38355226584" },
  shorty:    { id: "shorty",    name: "Shorty",    uuid: "42da8ccc-40d5-affc-beec-15aa47b42eda" },
  frenzy:    { id: "frenzy",    name: "Frenzy",    uuid: "44d4e95c-4157-0037-81b2-17841bf2e8e3" },
  knife:     { id: "knife",     name: "Knife",     uuid: "2f59173c-4bed-b6c3-2191-dea9b58be9c7" },
};

export type AgentId = keyof typeof AGENTS;
export type WeaponId = keyof typeof WEAPONS;

export function agentDisplayIconUrl(uuid: string): string {
  return `https://media.valorant-api.com/agents/${uuid}/displayicon.png`;
}

export function weaponDisplayIconUrl(uuid: string): string {
  return `https://media.valorant-api.com/weapons/${uuid}/displayicon.png`;
}

/** Public proxy URL the client uses for cached assets. */
export function proxyAssetUrl(kind: "agent" | "weapon", id: string): string {
  return `/api/tracker/asset/${kind}/${encodeURIComponent(id)}`;
}

/** Resolve a weapon by id or display name, ignoring case. */
export function findWeapon(value: string | null | undefined): AssetMeta | undefined {
  if (!value) return undefined;
  const n = value.trim().toLowerCase();
  return Object.values(WEAPONS).find((w) => w.id === n || w.name.toLowerCase() === n);
}

/** Display names of all guns (excludes the knife), for manual pickers. */
export function weaponNames(): string[] {
  return Object.values(WEAPONS)
    .filter((w) => w.id !== "knife")
    .map((w) => w.name);
}
