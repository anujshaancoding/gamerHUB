// ggLobby V2 — Valorant agent dataset.
// Art is served from the free, stable community CDN (media.valorant-api.com),
// keyed by Riot's canonical agent UUIDs — so pages look complete with zero
// manual uploads. Ability text is concise but accurate; expand freely.

export type AgentRole = "Duelist" | "Initiator" | "Controller" | "Sentinel";

export type AbilityKey = "C" | "Q" | "E" | "X";

export interface AgentAbility {
  key: AbilityKey;
  name: string;
  /** "Basic" | "Signature" | "Ultimate" */
  kind: "Basic" | "Signature" | "Ultimate";
  cost: string; // e.g. "200 creds", "Free", "7 points"
  description: string;
}

export interface Agent {
  slug: string;
  name: string;
  uuid: string;
  role: AgentRole;
  origin: string;
  /** One-line hook used on cards. */
  tagline: string;
  bio: string;
  difficulty: 1 | 2 | 3; // 1 = easy, 3 = hard
  abilities: AgentAbility[];
}

export const ROLE_META: Record<
  AgentRole,
  { color: string; blurb: string }
> = {
  Duelist: {
    color: "#ff4655",
    blurb: "Self-sufficient fraggers who create space and take fights first.",
  },
  Initiator: {
    color: "#2bd9fe",
    blurb: "Gather intel and disrupt defenders so the team can execute.",
  },
  Controller: {
    color: "#a98bff",
    blurb: "Carve up dangerous territory with smokes and zone control.",
  },
  Sentinel: {
    color: "#ffd166",
    blurb: "Lock down sites and flanks with defensive utility and traps.",
  },
};

export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: "Easy" | "Medium" | "Hard"; color: string; blurb: string }
> = {
  1: {
    label: "Easy",
    color: "#4ade80",
    blurb:
      "Forgiving kits with simple, self-contained abilities. The best place to learn the game without juggling complex utility.",
  },
  2: {
    label: "Medium",
    color: "#fbbf24",
    blurb:
      "A bit more to manage — timing, positioning, or team coordination matters, but still very playable while you learn.",
  },
  3: {
    label: "Hard",
    color: "#f87171",
    blurb:
      "High skill ceiling. These reward map knowledge, precise lineups, or advanced movement — come back to them once you're comfortable.",
  },
};

/**
 * Hand-picked first agents for a brand-new player — one per "what do I want
 * to do" intent, all difficulty 1. Order matters: Phoenix first.
 */
export const STARTER_PICKS: { slug: string; reason: string }[] = [
  {
    slug: "phoenix",
    reason:
      "The classic starter Duelist. He heals himself, flashes for free, and his kit teaches you how to take a fight solo — no teammates required.",
  },
  {
    slug: "brimstone",
    reason:
      "The simplest way to learn smokes. You place them on a map overlay instead of aiming throws, so you learn map control without the mechanical hurdle.",
  },
  {
    slug: "sage",
    reason:
      "The most forgiving Sentinel. A wall to block pushes, a slow to stall them, and heals for you and your team — mistakes are easy to recover from.",
  },
];

const CDN = "https://media.valorant-api.com/agents";

export function agentPortrait(uuid: string) {
  return `${CDN}/${uuid}/fullportrait.png`;
}
export function agentIcon(uuid: string) {
  return `${CDN}/${uuid}/displayicon.png`;
}
export function agentBackground(uuid: string) {
  return `${CDN}/${uuid}/background.png`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Resolve real ability display-icon URLs from valorant-api, keyed by our
 * C/Q/E/X. The API's slot order (Ability1/Ability2/Grenade/Ultimate) does
 * NOT line up with in-game keybinds, so we match by ability name instead.
 * Runs at build time (static pages); returns {} on any failure so the UI
 * falls back to the key letter.
 */
export async function fetchAbilityIcons(
  agent: Agent
): Promise<Partial<Record<AbilityKey, string>>> {
  try {
    const res = await fetch(
      `https://valorant-api.com/v1/agents/${agent.uuid}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return {};
    const json = (await res.json()) as {
      data?: {
        abilities?: { displayName?: string; displayIcon?: string | null }[];
      };
    };
    const apiAbilities = json.data?.abilities ?? [];

    const out: Partial<Record<AbilityKey, string>> = {};
    for (const ab of agent.abilities) {
      const match = apiAbilities.find(
        (a) => a.displayName && norm(a.displayName) === norm(ab.name)
      );
      if (match?.displayIcon) out[ab.key] = match.displayIcon;
    }
    return out;
  } catch {
    return {};
  }
}

export const AGENTS: Agent[] = [
  // ---------- Duelists ----------
  {
    slug: "jett",
    name: "Jett",
    uuid: "add6443a-41bd-e414-f6ad-e58d267f4e95",
    role: "Duelist",
    origin: "South Korea",
    tagline: "Hit-and-run agility that punishes hesitation.",
    bio: "Representing her home country of South Korea, Jett's agile and evasive fighting style lets her take risks no one else can. She runs circles around every skirmish, cutting enemies before they even know what hit them.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Cloudburst", kind: "Basic", cost: "200 creds", description: "Throw a quick-expanding cloud of smoke that briefly obscures vision. Can be curved by holding fire and moving the crosshair." },
      { key: "Q", name: "Updraft", kind: "Basic", cost: "150 creds", description: "Instantly propel Jett high into the air for off-angles and unexpected peeks." },
      { key: "E", name: "Tailwind", kind: "Signature", cost: "Free (recharge)", description: "Activate to prime a dash, then re-activate within 12s to quickly dash in the movement direction." },
      { key: "X", name: "Blade Storm", kind: "Ultimate", cost: "7 points", description: "Equip throwing knives that deal heavy damage and kill on a headshot. Resets on kill; right-click throws all at once." },
    ],
  },
  {
    slug: "raze",
    name: "Raze",
    uuid: "f94c3b30-42be-e959-889c-5aa313dba261",
    role: "Duelist",
    origin: "Brazil",
    tagline: "Explosive area denial and burst frags.",
    bio: "Raze explodes out of Brazil with her big personality and big guns. With her blunt-force-trauma playstyle, she excels at flushing entrenched enemies and clearing tight spaces.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Boom Bot", kind: "Basic", cost: "300 creds", description: "Deploy a bot that travels in a straight line, bouncing off walls, locking onto and chasing enemies it sees before exploding." },
      { key: "Q", name: "Blast Pack", kind: "Basic", cost: "200 creds", description: "Stick a charge that damages enemies and can be used to satchel-jump for fast repositioning." },
      { key: "E", name: "Paint Shells", kind: "Signature", cost: "Free (recharge)", description: "Throw a cluster grenade that deals damage and creates sub-munitions on impact." },
      { key: "X", name: "Showstopper", kind: "Ultimate", cost: "8 points", description: "Equip a rocket launcher that deals massive area damage." },
    ],
  },
  {
    slug: "phoenix",
    name: "Phoenix",
    uuid: "eb93336a-449b-9c1b-0a54-a891f7921d69",
    role: "Duelist",
    origin: "United Kingdom",
    tagline: "Self-sustaining entry who fights with fire.",
    bio: "Hailing from the UK, Phoenix's star power shines through in his fighting style, igniting the battlefield with flash and flair. Whether he's got backup or not, he'll rush into a fight on his own terms.",
    difficulty: 1,
    abilities: [
      { key: "C", name: "Blaze", kind: "Basic", cost: "200 creds", description: "Cast a wall of flame that blocks vision and damages enemies. Bend it by holding fire." },
      { key: "Q", name: "Curveball", kind: "Basic", cost: "250 creds", description: "Throw a curving flare that bursts into a bright flash, blinding enemies who see it." },
      { key: "E", name: "Hot Hands", kind: "Signature", cost: "Free (recharge)", description: "Throw a fireball that explodes, damaging enemies and healing Phoenix in the zone." },
      { key: "X", name: "Run It Back", kind: "Ultimate", cost: "6 points", description: "Mark your location; if you die or the timer ends, respawn at the marker with full health." },
    ],
  },
  {
    slug: "reyna",
    name: "Reyna",
    uuid: "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
    role: "Duelist",
    origin: "Mexico",
    tagline: "Snowballs hard off every kill.",
    bio: "Forged in the heart of Mexico, Reyna dominates single combat, popping off with each kill she scores. Her capability is only limited by her raw skill, making her sharply dependent on performance.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Leer", kind: "Basic", cost: "250 creds", description: "Cast an ethereal eye that nearsights all enemies who look at it." },
      { key: "Q", name: "Devour", kind: "Basic", cost: "Soul Orb", description: "Consume a nearby soul orb to rapidly heal beyond 100. Empowered by Empress." },
      { key: "E", name: "Dismiss", kind: "Signature", cost: "Soul Orb", description: "Consume a soul orb to become intangible and quickly dash away. Empowered by Empress." },
      { key: "X", name: "Empress", kind: "Ultimate", cost: "6 points", description: "Enter a frenzy of increased fire, equip, and reload speed; kills extend the duration." },
    ],
  },
  {
    slug: "neon",
    name: "Neon",
    uuid: "bb2a4828-46eb-8cd1-e765-15848195d751",
    role: "Duelist",
    origin: "Philippines",
    tagline: "Blistering speed that overwhelms angles.",
    bio: "Filipino agent Neon surges forward at shocking speeds, discharging bursts of bioelectric radiance as fast as her body generates it. She races ahead to catch enemies off guard.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Fast Lane", kind: "Basic", cost: "300 creds", description: "Fire two energy lines forward that form walls blocking vision and damaging enemies who pass through." },
      { key: "Q", name: "Relay Bolt", kind: "Basic", cost: "200 creds", description: "Throw an energy bolt that bounces once and concusses on each detonation." },
      { key: "E", name: "High Gear", kind: "Signature", cost: "Free (recharge)", description: "Channel her power for a fast sprint; activate again to slide (resets on kills)." },
      { key: "X", name: "Overdrive", kind: "Ultimate", cost: "7 points", description: "Unleash a fully accurate, lethal electric beam for a short duration; kills refresh it." },
    ],
  },
  {
    slug: "yoru",
    name: "Yoru",
    uuid: "7f94d92c-4234-0a36-9646-3a87eb8b5c89",
    role: "Duelist",
    origin: "Japan",
    tagline: "Deception and flank pressure.",
    bio: "Japanese native Yoru rips holes straight through reality to infiltrate enemy lines unseen. Using deception and aggression in equal measure, he gets the drop on enemies before they know where to look.",
    difficulty: 3,
    abilities: [
      { key: "C", name: "Fakeout", kind: "Basic", cost: "100 creds", description: "Deploy a decoy that mimics footsteps, then a clone that runs forward and flashes on death." },
      { key: "Q", name: "Blindside", kind: "Basic", cost: "250 creds", description: "Tear a flash from reality off a hard surface that blinds on line of sight." },
      { key: "E", name: "Gatecrash", kind: "Signature", cost: "Free (recharge)", description: "Send out a tether; activate to teleport to its location for surprise repositions." },
      { key: "X", name: "Dimensional Drift", kind: "Ultimate", cost: "7 points", description: "Mask into another dimension — unseen and unhearable — to reposition freely." },
    ],
  },
  {
    slug: "iso",
    name: "Iso",
    uuid: "0e38b510-41a8-5780-5e8f-568b2a4f2d6c",
    role: "Duelist",
    origin: "China",
    tagline: "Methodical 1v1 specialist.",
    bio: "Chinese assassin Iso flips a switch to enter a deadly state of flow, granting him a damage-absorbing shield off kills and the power to force isolated duels.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Contingency", kind: "Basic", cost: "250 creds", description: "Channel a wall of bulletproof prisms forward, pushing through to block enemy fire." },
      { key: "Q", name: "Undercut", kind: "Basic", cost: "200 creds", description: "Throw a molecular bolt that applies fragile to enemies it passes through." },
      { key: "E", name: "Double Tap", kind: "Signature", cost: "Free (recharge)", description: "Enter focus to gain an energy shield that absorbs one instance of damage on a kill." },
      { key: "X", name: "Kill Contract", kind: "Ultimate", cost: "7 points", description: "Pull an enemy into an arena for a guaranteed 1v1 — winner stays, loser is eliminated." },
    ],
  },

  // ---------- Initiators ----------
  {
    slug: "sova",
    name: "Sova",
    uuid: "320b2a48-4d9b-a075-30f1-1f93a9b638fa",
    role: "Initiator",
    origin: "Russia",
    tagline: "Relentless recon — nowhere to hide.",
    bio: "Born from the eternal winter of Russia's tundra, Sova tracks, finds, and eliminates enemies with ruthless efficiency and precision. His custom bow and incredible scouting abilities ensure that even if you run, you cannot hide.",
    difficulty: 3,
    abilities: [
      { key: "C", name: "Owl Drone", kind: "Basic", cost: "400 creds", description: "Deploy a pilotable drone that can fire a dart to reveal enemies it hits." },
      { key: "Q", name: "Shock Bolt", kind: "Basic", cost: "150 creds", description: "Fire an explosive bolt that emits a damaging pulse; can bounce off surfaces." },
      { key: "E", name: "Recon Bolt", kind: "Signature", cost: "Free (recharge)", description: "Fire a bolt that reveals enemies in line of sight; can bounce up to two times." },
      { key: "X", name: "Hunter's Fury", kind: "Ultimate", cost: "7 points", description: "Fire up to three deadly energy blasts that travel through walls across the whole map." },
    ],
  },
  {
    slug: "breach",
    name: "Breach",
    uuid: "5f8d3a7f-467b-97f3-062c-13acf203c006",
    role: "Initiator",
    origin: "Sweden",
    tagline: "Brute-force crowd control through walls.",
    bio: "Breach, the bionic Swede, fires powerful, targeted kinetic blasts to aggressively clear a path through enemy ground. The damage and disruption he inflicts ensures no fight is ever fair.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Aftershock", kind: "Basic", cost: "200 creds", description: "Fire a slow charge through a wall that detonates in three pulses of heavy damage." },
      { key: "Q", name: "Flashpoint", kind: "Basic", cost: "250 creds", description: "Fire a fast blinding charge through a wall that flashes everyone in line of sight." },
      { key: "E", name: "Fault Line", kind: "Signature", cost: "Free (recharge)", description: "Cast a quake that dazes and concusses all enemies in its zone and trail." },
      { key: "X", name: "Rolling Thunder", kind: "Ultimate", cost: "8 points", description: "Send a cascading quake through a large cone that dazes and knocks up enemies." },
    ],
  },
  {
    slug: "skye",
    name: "Skye",
    uuid: "6f2a04ca-43e0-be17-7f36-b3908627744d",
    role: "Initiator",
    origin: "Australia",
    tagline: "Heals the team and scouts with beasts.",
    bio: "Hailing from Australia, Skye and her band of beasts trail-blaze the way through hostile territory. With her creatures and healing power, she's both a strong scout and a supportive force.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Regrowth", kind: "Basic", cost: "200 creds", description: "Channel to heal allies in line of sight and range; cannot heal yourself." },
      { key: "Q", name: "Trailblazer", kind: "Basic", cost: "250 creds", description: "Pilot a Tasmanian tiger that can leap and concuss enemies in an area." },
      { key: "E", name: "Guiding Light", kind: "Signature", cost: "Free (recharge)", description: "Send a hawk you can steer; activate again to flash, revealing hit enemies." },
      { key: "X", name: "Seekers", kind: "Ultimate", cost: "7 points", description: "Send three seekers to track down the three nearest enemies and nearsight them." },
    ],
  },
  {
    slug: "kayo",
    name: "KAY/O",
    uuid: "601dbbe7-43ce-be57-2a40-4abd24953621",
    role: "Initiator",
    origin: "Unknown (Machine)",
    tagline: "Suppresses enemy abilities entirely.",
    bio: "KAY/O is a machine of war built for a single purpose: neutralizing radiants. His power to suppress enemy abilities cripples opponents' capacity to fight back, securing him and his allies the ultimate edge.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "FRAG/ment", kind: "Basic", cost: "200 creds", description: "Throw an explosive that sticks to the floor and detonates repeatedly, dealing heavy center damage." },
      { key: "Q", name: "FLASH/drive", kind: "Basic", cost: "250 creds", description: "Throw a flash grenade that detonates after a short fuse, blinding all in line of sight." },
      { key: "E", name: "ZERO/point", kind: "Signature", cost: "Free (recharge)", description: "Throw a suppression blade that sticks and suppresses the abilities of enemies in range." },
      { key: "X", name: "NULL/cmd", kind: "Ultimate", cost: "7 points", description: "Overload with energy that radiates suppression pulses; while active, KAY/O can be stabilized if downed." },
    ],
  },
  {
    slug: "fade",
    name: "Fade",
    uuid: "dade69b4-4f5a-8528-247b-219e5a1facd6",
    role: "Initiator",
    origin: "Turkey",
    tagline: "Hunts fear and drags out enemy locations.",
    bio: "Turkish bounty hunter Fade unleashes the power of raw nightmares to seize enemy secrets. Tethering and tracking targets, she reveals their deepest fears — then closes in for the kill.",
    difficulty: 3,
    abilities: [
      { key: "C", name: "Prowler", kind: "Basic", cost: "250 creds", description: "Send a creature that chases line of sight or terror trails, nearsighting enemies it catches." },
      { key: "Q", name: "Seize", kind: "Basic", cost: "200 creds", description: "Throw a globe of nightmare ink; detonate to tether and detain enemies in the zone." },
      { key: "E", name: "Haunt", kind: "Signature", cost: "Free (recharge)", description: "Throw a nightmare entity that reveals enemies in line of sight and leaves terror trails." },
      { key: "X", name: "Nightfall", kind: "Ultimate", cost: "7 points", description: "Send a wave of nightmare energy through walls that deafens, decays, and trails enemies." },
    ],
  },
  {
    slug: "gekko",
    name: "Gekko",
    uuid: "e370fa57-4757-3604-3648-499e1f642d3f",
    role: "Initiator",
    origin: "United States (Los Angeles)",
    tagline: "Reusable creature utility that snowballs rounds.",
    bio: "Los Angeles native Gekko leads a tight-knit crew of calamitous creatures. His buddies bound forward, scattering enemies — and after the dust settles, Gekko reclaims them for another run.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Mosh Pit", kind: "Basic", cost: "250 creds", description: "Throw Mosh like a grenade; it duplicates across an area then explodes after a delay." },
      { key: "Q", name: "Wingman", kind: "Basic", cost: "300 creds", description: "Send Wingman to seek enemies and concuss them, or plant/defuse the Spike." },
      { key: "E", name: "Dizzy", kind: "Signature", cost: "Free (recharge)", description: "Dizzy lunges forward and unleashes plasma blasts that blind enemies in line of sight." },
      { key: "X", name: "Thrash", kind: "Ultimate", cost: "7 points", description: "Pilot Thrash to lunge and detain enemies in a radius; reclaimable for another use." },
    ],
  },

  // ---------- Controllers ----------
  {
    slug: "brimstone",
    name: "Brimstone",
    uuid: "9f0d8ba9-4140-b941-57d3-a7ad57c6b417",
    role: "Controller",
    origin: "United States",
    tagline: "Pinpoint smokes and orbital firepower.",
    bio: "Joining from the USA, Brimstone's orbital arsenal ensures his squad always has the advantage. His ability to deliver utility precisely and safely make him the unmatched boots-on-the-ground commander.",
    difficulty: 1,
    abilities: [
      { key: "C", name: "Stim Beacon", kind: "Basic", cost: "200 creds", description: "Toss a beacon granting nearby allies RapidFire (faster fire, equip, reload, speed)." },
      { key: "Q", name: "Incendiary", kind: "Basic", cost: "250 creds", description: "Launch a grenade that deploys a damaging fire zone." },
      { key: "E", name: "Sky Smoke", kind: "Signature", cost: "100 creds each", description: "Use a tactical map to call in long-lasting smoke clouds anywhere in range." },
      { key: "X", name: "Orbital Strike", kind: "Ultimate", cost: "7 points", description: "Use the map to call a devastating, lingering orbital laser strike." },
    ],
  },
  {
    slug: "omen",
    name: "Omen",
    uuid: "8e253930-4c05-31dd-1b6c-968525494517",
    role: "Controller",
    origin: "Unknown",
    tagline: "A phantom that smokes and teleports.",
    bio: "Omen hunts in the shadows. He renders enemies blind, teleports across the field, then lets paranoia take hold as his foe scrambles to learn where he might strike next.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Shrouded Step", kind: "Basic", cost: "150 creds", description: "Teleport a short distance to a marked location after a brief delay." },
      { key: "Q", name: "Paranoia", kind: "Basic", cost: "250 creds", description: "Fire a shadow projectile that briefly reduces vision and severs hearing of enemies it touches." },
      { key: "E", name: "Dark Cover", kind: "Signature", cost: "100 creds each", description: "Cast a long-ranged shadow orb that bursts into a vision-blocking sphere; can be curved." },
      { key: "X", name: "From the Shadows", kind: "Ultimate", cost: "7 points", description: "Select anywhere on the map to teleport; appear first as a shade that can be cancelled if killed." },
    ],
  },
  {
    slug: "viper",
    name: "Viper",
    uuid: "707eab51-4836-f488-046a-cda6bf494859",
    role: "Controller",
    origin: "United States",
    tagline: "Toxic zoning and post-plant control.",
    bio: "The American chemist Viper deploys an array of poisonous chemical devices to control the battlefield and cripple the enemy's vision. If the toxins don't kill her prey, her mind games surely will.",
    difficulty: 3,
    abilities: [
      { key: "C", name: "Snake Bite", kind: "Basic", cost: "200 creds", description: "Fire a canister that shatters into a damaging acid pool, applying Vulnerable." },
      { key: "Q", name: "Poison Cloud", kind: "Basic", cost: "200 creds", description: "Throw a gas emitter you can reactivate to create a toxic, fuel-limited smoke." },
      { key: "E", name: "Toxic Screen", kind: "Signature", cost: "Free (fuel)", description: "Deploy a long line of gas emitters that form a tall toxic wall through terrain." },
      { key: "X", name: "Viper's Pit", kind: "Ultimate", cost: "7 points", description: "Emit a massive toxic cloud that heavily decays and nearsights enemies inside." },
    ],
  },
  {
    slug: "astra",
    name: "Astra",
    uuid: "41fb69c1-4189-7b37-f117-bcaf1e96f1bf",
    role: "Controller",
    origin: "Ghana",
    tagline: "Galactic, full-map strategic control.",
    bio: "Ghanaian agent Astra harnesses cosmic energies to shape the battlefield. With full command of her astral form and a grasp of the future, she's always two steps ahead.",
    difficulty: 3,
    abilities: [
      { key: "C", name: "Gravity Well", kind: "Basic", cost: "Star", description: "Activate a placed star to pull enemies toward its center, then detonate to make them Fragile." },
      { key: "Q", name: "Nova Pulse", kind: "Basic", cost: "Star", description: "Activate a star to detonate a charge that concusses all players in its area." },
      { key: "E", name: "Nebula / Dissipate", kind: "Signature", cost: "Star", description: "Turn a star into a smoke; dissipate returns it as a fake smoke then recharges." },
      { key: "X", name: "Cosmic Divide", kind: "Ultimate", cost: "7 points", description: "Channel a giant infinite wall that blocks bullets and heavily muffles sound." },
    ],
  },
  {
    slug: "harbor",
    name: "Harbor",
    uuid: "95b78ed7-4637-86d9-7e41-71ba8c293152",
    role: "Controller",
    origin: "India",
    tagline: "Water-bending shields and aggressive smokes.",
    bio: "Hailing from India's coast, Harbor storms the field wielding ancient technology with dominion over water. He unleashes cover and crushes opposition with unrelenting, life-giving force.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Cascade", kind: "Basic", cost: "150 creds", description: "Send a wave of water through terrain that passes through walls; players hit are slowed." },
      { key: "Q", name: "Cove", kind: "Basic", cost: "350 creds", description: "Throw a sphere of water that forms a bullet-blocking shield." },
      { key: "E", name: "High Tide", kind: "Signature", cost: "Free (recharge)", description: "Send a steerable wall of water along the ground that blocks vision and slows enemies." },
      { key: "X", name: "Reckoning", kind: "Ultimate", cost: "7 points", description: "Summon a geyser pool; enemies in the strike zones are concussed in sequence." },
    ],
  },
  {
    slug: "clove",
    name: "Clove",
    uuid: "1dbf2edd-4729-0984-3115-daa5eed44993",
    role: "Controller",
    origin: "Scotland",
    tagline: "Immortal trickster who smokes after death.",
    bio: "Scottish troublemaker Clove keeps the party going long after they're gone. Decked head to toe in immortality, they wreak havoc and bend the rules of life and death.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Pick-me-up", kind: "Basic", cost: "100 creds", description: "Absorb the life force of a recently killed enemy to gain haste and a temporary speed boost." },
      { key: "Q", name: "Meddle", kind: "Basic", cost: "200 creds", description: "Throw a fragment of immortal essence that decays the health of caught enemies." },
      { key: "E", name: "Ruse", kind: "Signature", cost: "Free (recharge)", description: "Use the map to cast two smoke clouds — castable even while dead." },
      { key: "X", name: "Not Dead Yet", kind: "Ultimate", cost: "7 points", description: "Resurrect after death; secure a kill or damage assist before the timer to stay alive." },
    ],
  },

  {
    slug: "miks",
    name: "Miks",
    uuid: "7c8a4701-4de6-9355-b254-e09bc2a34b72",
    role: "Controller",
    origin: "Croatia",
    tagline: "Sonic controller who sets the team's tempo.",
    bio: "Straight from Croatia, Miks takes the stage channeling pure sound energy. With his infectious passion and sonic powers, he rallies his squad to move as one as they set the tempo on the battlefield together.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "M-pulse", kind: "Basic", cost: "250 creds", description: "Equip M-pulse; alt-fire to toggle between Concuss and Healing outputs. Throw the device — on landing it emits sound waves that either concuss or heal players in the area." },
      { key: "Q", name: "Harmonize", kind: "Basic", cost: "200 creds", description: "Target an ally and fire to grant a Combat Stim and speed boost to both of you that refreshes on kills. Alt-fire grants the buff to yourself only." },
      { key: "E", name: "Waveform", kind: "Signature", cost: "100 creds each", description: "Equip a map targeter to set locations, then alt-fire to spawn long-lasting smokes at the selected spots; one smoke recharges mid-round." },
      { key: "X", name: "Bassquake", kind: "Ultimate", cost: "8 points", description: "Equip Bassquake; fire to build up and unleash Sonic Radiance forward, knocking back, deafening, and slowing players hit." },
    ],
  },

  // ---------- Sentinels ----------
  {
    slug: "killjoy",
    name: "Killjoy",
    uuid: "1e58de9c-4950-5125-93e9-a0aee9f98746",
    role: "Sentinel",
    origin: "Germany",
    tagline: "Gadget genius who locks down sites.",
    bio: "The genius of Germany, Killjoy secures the battlefield with her arsenal of inventions. If the damage from her gear doesn't stop her enemies, her robots' debuffs surely will.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Nanoswarm", kind: "Basic", cost: "200 creds", description: "Throw a covert grenade; activate to deploy a damaging swarm of nanobots." },
      { key: "Q", name: "Alarmbot", kind: "Basic", cost: "200 creds", description: "Deploy a bot that hunts enemies in range and applies Vulnerable on contact." },
      { key: "E", name: "Turret", kind: "Signature", cost: "Free (recall)", description: "Deploy a turret that fires at enemies in a 180° cone." },
      { key: "X", name: "Lockdown", kind: "Ultimate", cost: "8 points", description: "Deploy a device that, after a wind-up, detains all enemies caught in its large radius." },
    ],
  },
  {
    slug: "cypher",
    name: "Cypher",
    uuid: "117ed9e3-49f3-6512-3ccf-0cada7e3823b",
    role: "Sentinel",
    origin: "Morocco",
    tagline: "Information broker — the all-seeing trapper.",
    bio: "The Moroccan information broker Cypher is a one-man surveillance network keeping tabs on the enemy's every move. No secret is safe. No maneuver goes unseen. Cypher is always watching.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Trapwire", kind: "Basic", cost: "200 creds", description: "Place a stealthed tripwire that tethers and dazes enemies who don't destroy it in time." },
      { key: "Q", name: "Cyber Cage", kind: "Basic", cost: "100 creds", description: "Toss a remote cage that slows and blocks vision when activated." },
      { key: "E", name: "Spycam", kind: "Signature", cost: "Free (recall)", description: "Place a remote camera; reactivate to view and fire a tracking dart that reveals enemies." },
      { key: "X", name: "Neural Theft", kind: "Ultimate", cost: "7 points", description: "Extract intel from a dead enemy, revealing the location of all living enemies twice." },
    ],
  },
  {
    slug: "sage",
    name: "Sage",
    uuid: "569fdd95-4d10-43ab-ca70-79becc718b46",
    role: "Sentinel",
    origin: "China",
    tagline: "The team's healer and resurrector.",
    bio: "The bastion of China, Sage creates safety for herself and her team wherever she goes. Able to revive fallen friends and stave off aggressive pushes, she provides a calm center to a hize storm.",
    difficulty: 1,
    abilities: [
      { key: "C", name: "Barrier Orb", kind: "Basic", cost: "400 creds", description: "Conjure a large solid wall; reinforce it to increase durability." },
      { key: "Q", name: "Slow Orb", kind: "Basic", cost: "200 creds", description: "Cast a slowing field that makes anyone within it move slowly and noisily." },
      { key: "E", name: "Healing Orb", kind: "Signature", cost: "Free (recharge)", description: "Heal an ally or herself over a few seconds back to full health." },
      { key: "X", name: "Resurrection", kind: "Ultimate", cost: "8 points", description: "Target a fallen ally and revive them with full health." },
    ],
  },
  {
    slug: "chamber",
    name: "Chamber",
    uuid: "22697a3d-45bf-8dd7-4fec-84a9e28c69d7",
    role: "Sentinel",
    origin: "France",
    tagline: "Weapon artisan with deadly precision.",
    bio: "Well-dressed and well-armed, French weapons designer Chamber expels aggressors with deadly precision. He leverages his custom arsenal to hold the line and pick off enemies from afar.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "Trademark", kind: "Basic", cost: "200 creds", description: "Place a trap that scans for enemies; when triggered it destabilizes the terrain, creating a slowing field." },
      { key: "Q", name: "Headhunter", kind: "Basic", cost: "150 creds", description: "Equip a heavy-hitting pistol with deadly accuracy." },
      { key: "E", name: "Rendezvous", kind: "Signature", cost: "Free (recall)", description: "Place two teleport anchors; while near one, teleport quickly to the other." },
      { key: "X", name: "Tour De Force", kind: "Ultimate", cost: "7 points", description: "Summon a powerful sniper rifle that kills on any direct hit and creates a slow field." },
    ],
  },
  {
    slug: "deadlock",
    name: "Deadlock",
    uuid: "cc8b64c8-4b25-4ff9-6e7f-37b4da43d235",
    role: "Sentinel",
    origin: "Norway",
    tagline: "Nano-wire lockdown and area denial.",
    bio: "Norwegian operative Deadlock deploys an array of cutting-edge nanowire to secure the battlefield from even the most lethal assault. No one slips past the lines she draws.",
    difficulty: 2,
    abilities: [
      { key: "C", name: "GravNet", kind: "Basic", cost: "200 creds", description: "Throw a grenade that, on detonation, forces caught enemies to crouch and slow." },
      { key: "Q", name: "Sonic Sensor", kind: "Basic", cost: "200 creds", description: "Deploy a sensor that monitors for sound; triggering it concusses the area." },
      { key: "E", name: "Barrier Mesh", kind: "Signature", cost: "Free (recall)", description: "Throw a disc that generates barriers blocking movement (not bullets) around it." },
      { key: "X", name: "Annihilation", kind: "Ultimate", cost: "7 points", description: "Unleash a nanowire cocoon that captures the first enemy hit and pulls them along a path; freed only if the wire is destroyed." },
    ],
  },
  {
    slug: "vyse",
    name: "Vyse",
    uuid: "efba5359-4016-a1e5-7626-b1ae76895940",
    role: "Sentinel",
    origin: "Unknown",
    tagline: "Liquid-metal traps that ambush attackers.",
    bio: "Vyse turns the battlefield into her trap. Her sentient liquid metal lies in wait, ready to ensnare overconfident enemies and turn an aggressive push into a fatal mistake.",
    difficulty: 3,
    abilities: [
      { key: "C", name: "Shear", kind: "Basic", cost: "200 creds", description: "Place a wall buried in a surface; activate to raise an unbreakable wall enemies can pass once." },
      { key: "Q", name: "Arc Rose", kind: "Basic", cost: "200 creds", description: "Place a concealable rose; activate to blind enemies in front of it." },
      { key: "E", name: "Razorvine", kind: "Signature", cost: "Free (recharge)", description: "Throw metal that lies dormant; activate to deploy a damaging, slowing thicket." },
      { key: "X", name: "Steel Garden", kind: "Ultimate", cost: "8 points", description: "Trap all enemies in range, jamming their primary weapons for a short time." },
    ],
  },
];

export const AGENT_SLUGS = AGENTS.map((a) => a.slug);

export function getAgent(slug: string): Agent | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

/** Resolve an agent by slug or display name, ignoring case and punctuation. */
export function findAgent(value: string | null | undefined): Agent | undefined {
  if (!value) return undefined;
  const n = norm(value);
  return AGENTS.find((a) => norm(a.slug) === n || norm(a.name) === n);
}

export const ROLES: AgentRole[] = [
  "Duelist",
  "Initiator",
  "Controller",
  "Sentinel",
];
