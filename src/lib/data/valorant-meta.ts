// ggLobby V2 — curated Valorant strategy meta.
//
// Three independent, hand-curated datasets (intentionally NOT derived from each
// other so each page can be worded for its own context):
//   • AGENT_BEST_MAPS  — the 3 strongest maps for each agent + why.
//   • AGENT_PLAYSTYLE  — how to play / extract the most value from each agent.
//   • MAP_BEST_COMPS   — the 3 strongest 5-stacks for each map + strategy.
//
// Slugs reference @/lib/data/valorant-agents (agent slug) and
// @/lib/data/valorant-maps (map slug). Keep entries in sync with those files.

export interface AgentMapPick {
  /** Map slug from valorant-maps. */
  map: string;
  /** One-line reason this map suits the agent. */
  reason: string;
}

export interface MapComp {
  /** Short identifying name for the composition. */
  name: string;
  /** Exactly 5 agent slugs, ordered by carry/priority. */
  agents: string[];
  /** The core game plan in 1–2 sentences. */
  strategy: string;
  /** How the comp plays the attack side. */
  attack: string;
  /** How the comp plays the defense side. */
  defense: string;
}

// ─── Agent → best 3 maps ────────────────────────────────────────────────────

export const AGENT_BEST_MAPS: Record<string, AgentMapPick[]> = {
  jett: [
    { map: "icebox", reason: "Verticality and Operator angles reward her dash and updraft peeks." },
    { map: "breeze", reason: "Long sightlines let her Op aggressively then dash to safety." },
    { map: "ascent", reason: "Open mid gives her space to take duels and bail with Tailwind." },
  ],
  raze: [
    { map: "bind", reason: "Tight chokes and corners make her nades and Boom Bot devastating." },
    { map: "split", reason: "Narrow chokes and vents are perfect for satchel plays and clears." },
    { map: "fracture", reason: "Cramped flank routes let her satchel into back-line picks." },
  ],
  phoenix: [
    { map: "split", reason: "Close-quarters chokes maximise his flashes and wall." },
    { map: "bind", reason: "Tight angles and short rotations suit his self-sufficient entries." },
    { map: "pearl", reason: "Disciplined mid duels favour his curveball-and-peek kit." },
  ],
  reyna: [
    { map: "bind", reason: "Duel-heavy chokes let her snowball off Devour and Dismiss." },
    { map: "pearl", reason: "Low-utility mid fights play into her raw aim and escapes." },
    { map: "sunset", reason: "Compact mid creates the repeated 1v1s she thrives on." },
  ],
  neon: [
    { map: "breeze", reason: "Huge distances let her sprint between sites and run-and-gun." },
    { map: "fracture", reason: "Double-sided spawns reward her speed for fast flanks." },
    { map: "abyss", reason: "Open spacing turns her slide and wall into constant tempo." },
  ],
  yoru: [
    { map: "bind", reason: "Teleporters and fakes amplify his clones and Gatecrash mind-games." },
    { map: "pearl", reason: "Long flanks let his teleport punish over-rotations." },
    { map: "split", reason: "Vertical flank paths make his Gatecrash unpredictable." },
  ],
  iso: [
    { map: "lotus", reason: "Multi-site rotations let his shield carry repeated entry duels." },
    { map: "sunset", reason: "Tight mid fights suit his isolated 1v1 kit." },
    { map: "pearl", reason: "Grounded gunfights reward his Double Tap shield trades." },
  ],
  sova: [
    { map: "ascent", reason: "Open layout makes Recon Bolt and drone info round-winning." },
    { map: "icebox", reason: "Signature dart and post-plant arrows define both sites." },
    { map: "abyss", reason: "Long lines of sight maximise Recon and Hunter's Fury value." },
  ],
  breach: [
    { map: "split", reason: "Stacked chokes let his through-wall stuns clear entire angles." },
    { map: "lotus", reason: "Doorways and tight sites are tailor-made for Fault Line." },
    { map: "fracture", reason: "Pinched defenders get destroyed by Flashpoint executes." },
  ],
  skye: [
    { map: "haven", reason: "Three sites reward her flash, dog and team heal flex." },
    { map: "ascent", reason: "Mid control fights are won with her flashes and bird info." },
    { map: "lotus", reason: "Rotational map values her recon and sustain across sites." },
  ],
  kayo: [
    { map: "bind", reason: "Suppression shuts down the heavy utility maps like Bind thrive on." },
    { map: "ascent", reason: "FRAG and FLASH break open the tight mid and site holds." },
    { map: "lotus", reason: "Knife suppression cripples sentinel-heavy multi-site defenses." },
  ],
  fade: [
    { map: "lotus", reason: "Prowler and Haunt sweep its many corners and rotations." },
    { map: "haven", reason: "Three sites make her area-wide reveals exceptionally strong." },
    { map: "split", reason: "Tight chokes trap defenders in Seize and terror trails." },
  ],
  gekko: [
    { map: "sunset", reason: "Reusable Wingman and Dizzy snowball its short rotations." },
    { map: "lotus", reason: "Reclaimable utility shines across the three sites." },
    { map: "ascent", reason: "Wingman plant/defuse plays swing its post-plant rounds." },
  ],
  brimstone: [
    { map: "bind", reason: "No mid means his stack of precise smokes locks down sites." },
    { map: "breeze", reason: "Stim and Sky Smoke cover its enormous open angles." },
    { map: "sunset", reason: "Tight executes love his instant smokes and Incendiary." },
  ],
  omen: [
    { map: "split", reason: "Repeatable smokes and teleport own its choke-heavy layout." },
    { map: "lotus", reason: "Flexible smokes and Shrouded Step cover three sites cheaply." },
    { map: "ascent", reason: "Mid one-ways and From the Shadows flanks dominate." },
  ],
  viper: [
    { map: "icebox", reason: "Toxic Screen and wall split both open sites every round." },
    { map: "breeze", reason: "Her wall is the only smoke long enough for its huge sites." },
    { map: "lotus", reason: "Screen through walls divides its triple-site defenses." },
  ],
  astra: [
    { map: "lotus", reason: "Global stars let her smoke and stun any of three sites." },
    { map: "split", reason: "Full-map control covers every choke and post-plant." },
    { map: "haven", reason: "Three sites are perfect for her remote, map-wide utility." },
  ],
  harbor: [
    { map: "breeze", reason: "Wide water walls cover its massive open executes." },
    { map: "ascent", reason: "High Tide and Cove smother its exposed sites." },
    { map: "sunset", reason: "Cascade and Cove shield aggressive mid takes." },
  ],
  clove: [
    { map: "sunset", reason: "Post-mortem smokes keep their solo-controller tempo alive." },
    { map: "pearl", reason: "Aggressive self-revive smokes suit its dueling mid." },
    { map: "lotus", reason: "Smoke-from-dead enables fast multi-site fakes." },
  ],
  killjoy: [
    { map: "ascent", reason: "Turret and Lockdown anchor its destructible-door sites." },
    { map: "icebox", reason: "Her gear locks the cramped, vertical post-plants." },
    { map: "split", reason: "Choke-heavy layout lets one player hold a whole site." },
  ],
  cypher: [
    { map: "bind", reason: "Trips on teleporters and chokes give total flank intel." },
    { map: "ascent", reason: "Cages and cam dominate mid and site information wars." },
    { map: "sunset", reason: "Tight rotations are sealed by his tripwires and cam." },
  ],
  sage: [
    { map: "icebox", reason: "Her wall buys whole sites on its long, open angles." },
    { map: "split", reason: "Wall and slows shut its narrow chokes and propels picks." },
    { map: "bind", reason: "Wall through chokes and Slow Orb stall fast pushes." },
  ],
  chamber: [
    { map: "breeze", reason: "Headhunter and Tour De Force punish its long sightlines." },
    { map: "pearl", reason: "Anchored Op holds with Rendezvous escapes fit its mid." },
    { map: "ascent", reason: "Trademark and teleport lock its open site angles." },
  ],
  deadlock: [
    { map: "sunset", reason: "GravNet and sensors deny its compact, push-prone chokes." },
    { map: "abyss", reason: "Barrier Mesh and Annihilation control its open spaces." },
    { map: "split", reason: "Sound sensors and walls shut down vertical chokes." },
  ],
  vyse: [
    { map: "pearl", reason: "Hidden traps ambush its predictable mid and site pushes." },
    { map: "sunset", reason: "Arc Rose and Razorvine stall its tight rotations." },
    { map: "lotus", reason: "Buried walls and thicket lock its many entry doors." },
  ],
  miks: [
    { map: "sunset", reason: "Tight, execute-heavy sites reward his precise targeted smokes and Stim tempo." },
    { map: "bind", reason: "No mid means committed hits — his stacked smokes and heal carry full executes." },
    { map: "lotus", reason: "A recharging smoke plus heal/concuss flex covers its three sites cheaply." },
  ],
};

export function bestMapsForAgent(slug: string): AgentMapPick[] {
  return AGENT_BEST_MAPS[slug] ?? [];
}

// ─── Agent → how to play ────────────────────────────────────────────────────

export interface AgentPlaystyle {
  /** One-paragraph read on the agent's actual job for the team. */
  summary: string;
  /** Concrete, actionable ways to extract the most value. */
  tips: string[];
}

export const AGENT_PLAYSTYLE: Record<string, AgentPlaystyle> = {
  // ---- Duelists ----
  jett: {
    summary:
      "Jett is your primary entry: take first contact, win the opening duel, and create the space the team converts. She carries no utility for teammates, so every death is expensive — play for picks, not trades.",
    tips: [
      "Bank a Tailwind dash before you peek — it's an escape tool, not an aggression tool.",
      "Use Cloudburst to one-way or block a re-peek as you enter, not to fight inside.",
      "With the Operator, peek–shoot–dash: take the shot, then dash to safety regardless of the result.",
      "Save Blade Storm for eco/anti-eco rounds or to clean up after winning the opener.",
    ],
  },
  raze: {
    summary:
      "Raze is an explosive entry duelist who clears tight spaces with utility before she ever fights, so the duels she does take are pre-won.",
    tips: [
      "Boom Bot into the site before entry to pull info and chip held angles.",
      "Blast Pack to satchel-jump onto off-angles or to disengage a lost fight instantly.",
      "Throw Paint Shells into known anchor/post-plant spots, not open air.",
      "Showstopper shines in tight chokes — only swap to it with a safe angle, it equips slowly.",
    ],
  },
  phoenix: {
    summary:
      "Phoenix is a self-sufficient entry: he flashes himself in, heals off his own fire, and can run it back, so he opens sites with no support behind him.",
    tips: [
      "Curveball around the corner to blind without exposing yourself, then swing it.",
      "Stand in Hot Hands or Blaze when low — the heal lets you re-enter the same round.",
      "Use Run It Back to take a free aggressive duel or gather info at zero risk.",
      "Wall off one entrance so you only have to clear a single angle on entry.",
    ],
  },
  reyna: {
    summary:
      "Reyna is a pure fragger that snowballs — no team utility, all about converting the first kill into the next. Win the duel or she's dead weight.",
    tips: [
      "Only commit to duels you're confident you win; her kit rewards picks, not trades.",
      "Devour after a kill to overheal; Dismiss to escape or be untradeable on a re-peek.",
      "Leer before a fight or retake to nearsight defenders holding the angle.",
      "Empress for eco/anti-eco and retakes — the fire rate and refresh make her a 1vX monster.",
    ],
  },
  neon: {
    summary:
      "Neon is a tempo duelist: her speed lets the team hit a site before the defense sets up. She lives on fast, repeated aggression.",
    tips: [
      "High Gear to relocate the attack to an undefended site faster than rotates answer.",
      "Slide-peek for a hard-to-hit, fully accurate first shot.",
      "Fast Lane to split a site or wall off a flank as you enter.",
      "Relay Bolt the entry point, then slide in right after the concuss lands.",
    ],
  },
  yoru: {
    summary:
      "Yoru is a deception and flank duelist — he manufactures fake pressure and gets behind defenders for picks the team converts.",
    tips: [
      "Use Fakeout footsteps and clone to bait defenders into showing or wasting utility.",
      "Gatecrash a tether deep, fake the other site, then teleport in behind them.",
      "Blindside off a wall around the exact corner you're about to swing.",
      "Dimensional Drift for free info, lurks, or to set up a flank teleport unseen.",
    ],
  },
  iso: {
    summary:
      "Iso is a methodical duelist built to win isolated 1v1s — his shield lets him trade up in straight gunfights.",
    tips: [
      "Get a kill to refresh Double Tap, then keep peeking while shielded — you can eat a free hit.",
      "Undercut a held angle before you peek it to make the enemy Fragile.",
      "Use Contingency to cross an open angle safely or to plant the spike behind it.",
      "Kill Contract a sentinel or anchor on a retake to remove them from the round 1v1.",
    ],
  },

  // ---- Initiators ----
  sova: {
    summary:
      "Sova is a recon initiator: find enemies so the team commits with information, and deny the post-plant from range.",
    tips: [
      "Learn Recon Bolt lineups per site; dart, then have the team swing the revealed angles immediately.",
      "Owl Drone to confirm a site is empty before a fast hit.",
      "Shock Bolt anchor and plant spots; use them to clear corners on retakes.",
      "Hunter's Fury is a post-plant and retake tool — fire on revealed or default-held positions.",
    ],
  },
  breach: {
    summary:
      "Breach forces the execute: his through-wall stuns and flashes break a site open so the team rushes in directly behind them.",
    tips: [
      "Stun and flash through the wall just before the team swings — never on cooldown.",
      "Chain Fault Line into Flashpoint so the site can't be held, synced with the entry.",
      "Aftershock common anchor and plant spots to dislodge campers.",
      "Rolling Thunder for executes and retakes — cast it as the team commits.",
    ],
  },
  skye: {
    summary:
      "Skye is a flex initiator: flashes, info, and the only initiator team heal. She enables entries and sustains the team between fights.",
    tips: [
      "Guiding Light flashes for the entry — recall it if it wasn't used.",
      "Send Trailblazer first to pull info and concuss an anchor before committing.",
      "Top everyone off with Regrowth before executes (you can't heal yourself).",
      "Seekers on retakes or to track a low/rotating enemy across the map.",
    ],
  },
  kayo: {
    summary:
      "KAY/O is a suppression initiator: he disables enemy abilities so utility-reliant defenses simply can't answer the hit.",
    tips: [
      "Throw the ZERO/point knife into the site right before the execute to suppress sentinels and controllers.",
      "FLASH/drive pop-flashes around corners for your own entry.",
      "FRAG/ment denies plant spots and stalls retakes — drop it on the spike.",
      "NULL/cmd for full executes and clutches; teammates can stabilize you while it's active.",
    ],
  },
  fade: {
    summary:
      "Fade is an aggressive recon initiator — she reveals and debuffs at once, so her info comes with a kill attached.",
    tips: [
      "Haunt the site, then immediately swing the revealed enemies with the team.",
      "Seize a choke or anchor spot to detain defenders during the execute.",
      "Send Prowler down terror trails from Haunt or Nightfall for a guaranteed catch.",
      "Nightfall for executes and retakes — it decays and deafens through walls.",
    ],
  },
  gekko: {
    summary:
      "Gekko is a reusable-utility initiator — his creatures snowball rounds because he reclaims and re-throws them.",
    tips: [
      "Wingman can plant or defuse — use it for safe post-plants and lurk defuses.",
      "Dizzy clears a site of held angles; reclaim her globe afterward.",
      "Mosh Pit denies plant and anchor spots, forcing defenders off them.",
      "Thrash to detain a cluster on a retake or to crack a stacked site, then reclaim it.",
    ],
  },

  // ---- Controllers ----
  brimstone: {
    summary:
      "Brimstone is a precise solo controller — his instant, no-travel-time smokes set up the cleanest executes in the game.",
    tips: [
      "Pre-learn smoke placements per site; they deploy instantly with no skill-shot to miss.",
      "Stim Beacon before a push for faster fire and reload on the whole entry.",
      "Incendiary denies plant spots on defense and clears anchor corners on attack.",
      "Orbital Strike to stall a retake, clear a plant, or zone a post-plant.",
    ],
  },
  omen: {
    summary:
      "Omen is a controller-fragger hybrid — repeatable smokes plus teleports let him take map control aggressively while still smoking.",
    tips: [
      "Smoke one angle and immediately swing another — you have the utility to also frag.",
      "Shrouded Step onto boxes or off-angles for surprise peeks.",
      "Paranoia to blind a choke for a free entry or to clear it on a retake.",
      "From the Shadows to flank, take a far site, or grab a free post-plant position.",
    ],
  },
  viper: {
    summary:
      "Viper is a zone-control controller — her wall and orb split sites every round and her ult owns post-plants. Strongest on big, open maps.",
    tips: [
      "Set Toxic Screen at round start to split a site in half for every execute.",
      "Snake Bite to clear plant/anchor spots and on retakes once the spike is down.",
      "Manage fuel — don't burn wall and orb at once; one-way the wall on defense.",
      "Viper's Pit for post-plants and retakes: stand in it and hold — you see, they don't.",
    ],
  },
  astra: {
    summary:
      "Astra is a global controller — she pre-places stars to smoke, pull, and stun anywhere, ideal on multi-site maps.",
    tips: [
      "Place stars before the round develops so you can react to any site call instantly.",
      "Gravity Well plus Nova Pulse on a choke completely breaks a hold for the entry.",
      "Keep one star for a defensive fake-smoke (Dissipate) to bait a push.",
      "Cosmic Divide for a free execute, retake, or to safely cross a long angle.",
    ],
  },
  harbor: {
    summary:
      "Harbor is an aggressive water controller — his shields and walls let the team push straight through angles instead of around them.",
    tips: [
      "High Tide along the ground covers the whole entry path, not just one smoke.",
      "Drop Cove on the plant for a bullet-shield post-plant or to body-block a retake.",
      "Cascade pushes through walls — use it to disengage or slow a held angle as you swing.",
      "Reckoning to clear a plant spot or stall a retake with sequenced concusses.",
    ],
  },
  clove: {
    summary:
      "Clove is an aggressive immortal controller — they smoke from the grave and self-revive, so they front-line without costing the team its smokes.",
    tips: [
      "Play forward: even if you die mid-execute you can still place Ruse smokes while dead.",
      "Pick-me-up after a kill or assist for haste — chain entries with it.",
      "Time Not Dead Yet to revive after the trade and rejoin the same fight.",
      "Because you can re-smoke dead, you can lurk and flank harder than any other controller.",
    ],
  },
  miks: {
    summary:
      "Miks is a sonic solo controller: precise targeted smokes plus a heal/concuss tool and a team Combat Stim let him both screen the site and buff the entry. Play him front-and-center, setting the tempo.",
    tips: [
      "Use the Waveform map targeter to pre-set both smokes for a site execute; one recharges mid-round, so you can re-smoke a re-hit.",
      "Harmonize the entry duelist (or yourself) right before contact — the Combat Stim refreshes on kills, so a winning entry snowballs.",
      "Toggle M-pulse to Heal to top the team between fights, or to Concuss a held angle / plant spot just before you swing it.",
      "Bassquake on executes and retakes — the knockback, slow, and deafen breaks an anchor's hold; fire it as the team commits.",
    ],
  },

  // ---- Sentinels ----
  killjoy: {
    summary:
      "Killjoy is a lockdown sentinel — her gear holds a site or flank alone so the team can stack elsewhere, with strong post-plant denial.",
    tips: [
      "Set Turret, Alarmbot, and Nanoswarm to cover the off-angle you aren't watching.",
      "Hold Nanoswarm for the post-plant — pop it on the spike to deny the defuse.",
      "Pick up and re-deploy utility when you rotate; don't leave it dead behind you.",
      "Lockdown on retakes and post-plants — protect it with molly/alarmbot so it survives.",
    ],
  },
  cypher: {
    summary:
      "Cypher is an info sentinel — he watches the whole map so the team always knows where the enemy is and the flank stays sealed.",
    tips: [
      "Trip the flank or off-angle every round — consistency beats fancy one-off spots.",
      "Use the cam actively to dart and reveal during executes, not just to watch passively.",
      "Cyber Cage to delay a push or block vision on a defuse.",
      "Neural Theft off a fresh kill on retakes to locate the remaining enemies.",
    ],
  },
  sage: {
    summary:
      "Sage is a defensive utility sentinel — her wall buys space and time, slows stall pushes, and her heal/res keep the team alive.",
    tips: [
      "Wall to deny a fast push, or on attack to take free space and boost angles.",
      "Slow Orb a choke or plant spot to stall a push or a defuse.",
      "Save Heal for the entry or duelist before a retake, not just yourself.",
      "Resurrect the player who can re-fight the round, and do it in a safe spot.",
    ],
  },
  chamber: {
    summary:
      "Chamber is an aggressive Operator sentinel — he holds long angles with the Op and escapes via teleport, picking from afar.",
    tips: [
      "Anchor a long angle with the Op next to a Rendezvous anchor so you peek and teleport back.",
      "Trademark covers your flank or back-site so you can play forward.",
      "Headhunter is a genuine eco weapon — play aggressive on save rounds.",
      "Tour De Force for picks, retakes, and ecos — one tap kills, with a slow field on hit.",
    ],
  },
  deadlock: {
    summary:
      "Deadlock is an anti-push sentinel — her kit denies entry through chokes and her ult removes a key player from the round.",
    tips: [
      "Barrier Mesh a choke or doorway to force the push down one slow path.",
      "Sonic Sensor watches a quiet flank — pair it with GravNet to lock a pusher in place.",
      "GravNet a clustered or planting enemy to set up an easy clean-up.",
      "Annihilation down a corridor on a retake or onto an anchor — they're gone unless the wire is shot.",
    ],
  },
  vyse: {
    summary:
      "Vyse is an ambush sentinel — her dormant traps punish aggressive, predictable pushes and stall executes.",
    tips: [
      "Pre-place Razorvine and Arc Rose on common push paths, then activate as they commit.",
      "Shear buys time at a choke and can only be passed once — use it to delay an execute.",
      "Arc Rose to blind a pushing group right as they enter, then swing them.",
      "Steel Garden on a retake or a stacked post-plant — it jams their primaries.",
    ],
  },
};

export function playstyleForAgent(slug: string): AgentPlaystyle | null {
  return AGENT_PLAYSTYLE[slug] ?? null;
}

// ─── Map → best 3 five-stacks ───────────────────────────────────────────────

export const MAP_BEST_COMPS: Record<string, MapComp[]> = {
  ascent: [
    {
      name: "Mid-Control Standard",
      agents: ["jett", "sova", "kayo", "omen", "killjoy"],
      strategy:
        "Win mid every round with Sova/KAY/O info and convert pressure into a fast hit on either exposed site.",
      attack:
        "Clear mid with Recon Bolt and a KAY/O knife, then default and swing A Main or B Main off the read.",
      defense:
        "Killjoy anchors B with full setup, Sova darts mid, Omen one-ways A Main while Jett holds for picks.",
    },
    {
      name: "Viper Mid Lock",
      agents: ["jett", "viper", "sova", "breach", "killjoy"],
      strategy:
        "Use Viper's mid wall as a recurring map split so executes hit a 4-stacked side with no rotates.",
      attack:
        "Wall mid, Breach + Sova clear the site, Jett dashes in first and Killjoy secures the post-plant.",
      defense:
        "Viper mid line stalls every push; Killjoy + Breach retake B while Sova arrows track flanks.",
    },
    {
      name: "Double-Flash Aggro",
      agents: ["raze", "skye", "kayo", "omen", "killjoy"],
      strategy:
        "Stack flashes and Raze nades to overwhelm a single site before defenders can rotate.",
      attack:
        "Skye + KAY/O flash A Main in pairs, Raze clears corners with Boom Bot, Omen smokes the cross.",
      defense:
        "Killjoy locks B, Skye flashes back picks, KAY/O knife suppresses the on-site sentinel utility.",
    },
  ],
  bind: [
    {
      name: "Standard Bind",
      agents: ["raze", "skye", "brimstone", "cypher", "viper"],
      strategy:
        "No mid means committed site hits — double controllers smoke a full execute while Cypher seals the far flank.",
      attack:
        "Brim + Viper smoke the site, Skye flashes, Raze entries with nades; teleporter fake forces rotations.",
      defense:
        "Cypher trips Hookah/Showers, Viper holds one site solo, Brim molly-stalls the opposite teleport.",
    },
    {
      name: "Fade Recon Hit",
      agents: ["raze", "fade", "brimstone", "viper", "cypher"],
      strategy:
        "Fade's Prowler + Haunt clear angles teleporter pushes can't see, enabling clean default executes.",
      attack:
        "Haunt the site, Seize the anchor, Brim/Viper smoke and Raze fragments the corner before the entry.",
      defense:
        "Cypher cam + trips, Fade Haunts the push, Viper one-ways the choke while Brim holds back.",
    },
    {
      name: "Double-Duelist Tempo",
      agents: ["raze", "yoru", "brimstone", "skye", "cypher"],
      strategy:
        "Yoru fakes and Raze speed create constant teleporter mind-games to catch defenders mid-rotate.",
      attack:
        "Yoru TP/clone fakes one site, the four-stack hits the other behind Brim smoke and Skye flash.",
      defense:
        "Cypher full-info setup, Yoru roams flank with Gatecrash, Raze + Skye stall the contested site.",
    },
  ],
  haven: [
    {
      name: "Triple-Site Flex",
      agents: ["jett", "skye", "sova", "omen", "killjoy"],
      strategy:
        "Three sites stretch defenses thin — Sova/Skye info finds the weak site and Omen smokes the fast hit.",
      attack:
        "Recon + bird find the open site, Omen smokes, Jett entries, Skye trails for the retake stall.",
      defense:
        "Killjoy anchors C, Sova arrows Garage/Mid, Omen flex-smokes whichever site gets pressured.",
    },
    {
      name: "Breach Execute",
      agents: ["raze", "breach", "skye", "omen", "cypher"],
      strategy:
        "Stacked stuns and flashes blow a single site open faster than Haven's long rotates can answer.",
      attack:
        "Breach Fault Line + Skye flash into A Long, Raze clears, Omen smokes the deep cross.",
      defense:
        "Cypher seals C flank, Breach aftershocks the mid push, Skye + Raze hold the contested site.",
    },
    {
      name: "Fade Control",
      agents: ["jett", "fade", "breach", "astra", "killjoy"],
      strategy:
        "Astra's global stars + Fade recon let a 5-stack threaten all three sites with full info.",
      attack:
        "Fade Haunt the site, Astra smokes remotely, Breach stuns, Jett dashes in first.",
      defense:
        "Killjoy C, Astra holds stars over Mid/A, Fade Prowler scouts, Breach stalls the retake.",
    },
  ],
  split: [
    {
      name: "Sentinel Lockdown",
      agents: ["raze", "skye", "omen", "cypher", "sage"],
      strategy:
        "Split's chokes favour defense — Sage wall + Cypher trips + Omen smokes make every push expensive.",
      attack:
        "Sage walls the choke, Omen smokes, Skye flashes and Raze nades the stacked corner.",
      defense:
        "Sage walls Mid/A Main, Cypher trips Vents, Omen one-ways, Raze double-nades the choke.",
    },
    {
      name: "Double-Initiator Push",
      agents: ["raze", "breach", "skye", "omen", "sage"],
      strategy:
        "Breach + Skye crash the tight chokes with stun-flash chains nothing on Split can hold.",
      attack:
        "Breach Fault Line through the choke, Skye flash, Raze entries, Omen smokes the off-angle.",
      defense:
        "Sage wall + Breach aftershock stall Mid, Skye flashes the retake, Omen smokes deep.",
    },
    {
      name: "Astra Triple-Smoke",
      agents: ["raze", "fade", "kayo", "astra", "sage"],
      strategy:
        "Astra's stars smoke every Split choke at once while KAY/O suppresses the sentinel anchor.",
      attack:
        "Astra triple-smokes the choke, KAY/O knifes the site, Fade reveals, Raze entries.",
      defense:
        "Sage wall, Astra pull/stun the push, Fade Prowler scouts flank, KAY/O knife for retakes.",
    },
  ],
  lotus: [
    {
      name: "Recon Lotus",
      agents: ["raze", "fade", "skye", "viper", "killjoy"],
      strategy:
        "Fade + Skye sweep Lotus's many corners while Viper splits a site through the doors.",
      attack:
        "Haunt + bird clear the site, Viper screens it in half, Raze entries, Killjoy locks post-plant.",
      defense:
        "Killjoy anchors C, Viper holds A solo, Fade Haunts pushes, Skye flashes the rotate.",
    },
    {
      name: "Astra Triple-Site",
      agents: ["raze", "sova", "breach", "astra", "killjoy"],
      strategy:
        "Astra + Sova give full-map info and remote smokes to hit whichever of three sites is thin.",
      attack:
        "Sova darts the site, Astra smokes remotely, Breach stuns the door, Raze entries.",
      defense:
        "Killjoy C, Astra stars over A/B, Sova arrows the rotate doors, Breach stalls retakes.",
    },
    {
      name: "Omen Tempo",
      agents: ["neon", "fade", "kayo", "omen", "sage"],
      strategy:
        "Neon speed + Omen smokes run fast door fakes and re-hits the silent-drop side.",
      attack:
        "Omen smokes, KAY/O flashes, Neon sprints first through the door, Fade reveals the anchor.",
      defense:
        "Sage walls C link, Omen one-ways, Fade Prowler scouts, KAY/O knife suppresses retake util.",
    },
  ],
  sunset: [
    {
      name: "Standard Sunset",
      agents: ["raze", "breach", "skye", "omen", "cypher"],
      strategy:
        "Win the strong mid with Breach/Skye, then convert tempo into a fast A or B hit.",
      attack:
        "Breach + Skye take mid, Omen smokes the site cross, Raze clears, Cypher watches flank.",
      defense:
        "Cypher trips Mid, Breach aftershocks the push, Omen one-ways, Raze + Skye hold A.",
    },
    {
      name: "Clove Aggro",
      agents: ["neon", "clove", "breach", "gekko", "cypher"],
      strategy:
        "Clove's post-death smokes keep Neon's fast mid tempo alive even on trades.",
      attack:
        "Clove smokes, Breach stuns, Neon sprints mid first, Gekko Wingman plants on the re-take.",
      defense:
        "Cypher Mid trips, Clove holds smokes even when traded, Gekko Dizzy stalls, Breach retakes.",
    },
    {
      name: "Double-Initiator",
      agents: ["raze", "gekko", "breach", "omen", "cypher"],
      strategy:
        "Gekko + Breach give reusable stun-flash info to overwhelm Sunset's short rotations.",
      attack:
        "Gekko Wingman + Breach Flashpoint into A, Omen smokes, Raze frags the corner.",
      defense:
        "Cypher flank lock, Breach + Gekko reusable stalls, Omen one-ways, Raze double-nades.",
    },
  ],
  abyss: [
    {
      name: "Mobility Control",
      agents: ["neon", "sova", "kayo", "omen", "killjoy"],
      strategy:
        "Spacing wins Abyss — Neon tempo + Sova/KAY/O info take fights with the map edge as a weapon.",
      attack:
        "Sova darts, KAY/O knifes, Neon sprints in first, Omen smokes the deadly cross-angle.",
      defense:
        "Killjoy anchors, Sova arrows the push, Omen one-ways, Neon wall + slide for picks.",
    },
    {
      name: "Clove Tempo",
      agents: ["neon", "clove", "breach", "deadlock", "gekko"],
      strategy:
        "Reusable + post-death utility keeps relentless tempo on a map that punishes lost duels.",
      attack:
        "Clove smokes, Breach stuns, Neon entries, Gekko Wingman plants, Deadlock walls the flank.",
      defense:
        "Deadlock GravNet + sensors, Clove holds dead smokes, Breach stalls, Gekko reclaims util.",
    },
    {
      name: "Recon Denial",
      agents: ["jett", "sova", "viper", "deadlock", "fade"],
      strategy:
        "Heavy info + Viper wall control space so duels happen on your terms near the edge.",
      attack:
        "Sova + Fade reveal, Viper walls the site in half, Jett dashes the cleared angle.",
      defense:
        "Deadlock denies the choke, Viper one-ways, Sova/Fade scout, Jett holds the Op angle.",
    },
  ],
  icebox: [
    {
      name: "Viper Icebox",
      agents: ["jett", "viper", "sova", "killjoy", "sage"],
      strategy:
        "The classic Icebox stack — Viper + Sage split sites in half and lock unkillable post-plants.",
      attack:
        "Viper wall + Sova dart open A, Sage walls the choke, Jett entries, Killjoy locks the plant.",
      defense:
        "Viper holds B screen, Killjoy + Sage anchor A, Sova arrows Mid, Jett roams for picks.",
    },
    {
      name: "Breach Variant",
      agents: ["jett", "viper", "breach", "killjoy", "sage"],
      strategy:
        "Swap recon for Breach's through-wall stuns to crack Icebox's tight, stacked post-plants.",
      attack:
        "Viper wall, Breach Fault Line the site, Jett dashes in, Sage walls the rotate, Killjoy plants.",
      defense:
        "Sage wall + Killjoy turret B, Viper screen A, Breach aftershocks the choke push.",
    },
    {
      name: "Harbor Split",
      agents: ["jett", "harbor", "sova", "killjoy", "kayo"],
      strategy:
        "Harbor's water walls give a second full smoke screen to overwhelm both Icebox sites.",
      attack:
        "Harbor High Tide + Sova dart, KAY/O knife the anchor, Jett entries, Killjoy locks plant.",
      defense:
        "Killjoy lockdown B, Harbor Cove A, Sova arrows Mid, KAY/O knife for fast retakes.",
    },
  ],
  breeze: [
    {
      name: "Viper Breeze",
      agents: ["jett", "viper", "sova", "kayo", "cypher"],
      strategy:
        "Viper's wall is the only smoke big enough for Breeze's sites; Sova info enables the wide hit.",
      attack:
        "Viper walls the site, Sova darts deep, KAY/O knifes, Jett Ops the long angle then dashes.",
      defense:
        "Viper one-way wall, Cypher trips A Cave, Sova arrows Mid, Jett/KAY/O hold long angles.",
    },
    {
      name: "Operator Heavy",
      agents: ["chamber", "viper", "sova", "kayo", "cypher"],
      strategy:
        "Two Operators (Chamber + a rifler) abuse the longest sightlines in the game behind Viper smoke.",
      attack:
        "Viper wall blocks the angle, Sova reveals, Chamber Ops the pinch, KAY/O knife for the entry.",
      defense:
        "Chamber + Cypher hold long with Op, Viper wall stalls, Sova arrows, KAY/O suppresses retakes.",
    },
    {
      name: "Harbor Wide Hit",
      agents: ["jett", "harbor", "sova", "killjoy", "gekko"],
      strategy:
        "Harbor's huge water walls + High Tide cover Breeze's enormous open executes in one go.",
      attack:
        "Harbor High Tide + Cove the site, Sova darts, Jett entries, Gekko Wingman plants.",
      defense:
        "Killjoy anchors A, Harbor Cascade stalls the wide push, Sova arrows Mid, Gekko reclaims util.",
    },
  ],
  fracture: [
    {
      name: "Flank Control",
      agents: ["neon", "breach", "fade", "brimstone", "cypher"],
      strategy:
        "Double spawn means flanks decide rounds — Cypher + Fade lock and reveal them while Brim smokes the hit.",
      attack:
        "Brim smokes, Breach + Fade clear the site, Neon entries fast, Cypher watches the back flank.",
      defense:
        "Cypher trips both flanks, Fade Haunts the push, Breach aftershocks, Brim molly-stalls.",
    },
    {
      name: "Double-Initiator",
      agents: ["raze", "breach", "fade", "brimstone", "killjoy"],
      strategy:
        "Breach + Fade chain stun-and-reveal so pinched defenders can't hold either entrance.",
      attack:
        "Fade Haunt + Breach Fault Line the site, Raze frags the corner, Brim smokes the cross.",
      defense:
        "Killjoy anchors, Fade Prowler scouts both flanks, Breach stalls, Brim holds back smokes.",
    },
    {
      name: "Aggro Fracture",
      agents: ["neon", "breach", "fade", "astra", "killjoy"],
      strategy:
        "Astra's global utility + Neon speed run fast dual-flank fakes the defense can't track.",
      attack:
        "Astra smokes remotely, Breach stuns, Neon sprints first, Fade reveals the anchor.",
      defense:
        "Killjoy lockdown, Astra stars over both halves, Fade scouts flanks, Breach retakes.",
    },
  ],
  pearl: [
    {
      name: "Standard Pearl",
      agents: ["neon", "fade", "astra", "killjoy", "kayo"],
      strategy:
        "Win the all-important mid with Fade/KAY/O info, then Astra-smoke a fast hit either way.",
      attack:
        "Fade Haunt + KAY/O knife take mid, Astra smokes the site, Neon sprints in first.",
      defense:
        "Killjoy anchors B, Astra holds Mid stars, Fade Prowler scouts, KAY/O knife for retakes.",
    },
    {
      name: "Double-Controller",
      agents: ["neon", "fade", "viper", "astra", "killjoy"],
      strategy:
        "Viper + Astra double-smoke lets a 5-stack execute without ever giving up mid control.",
      attack:
        "Viper wall + Astra smokes split the site, Fade reveals, Neon entries, Killjoy locks plant.",
      defense:
        "Viper Mid line + Astra stars stall every push; Killjoy B, Fade Prowler tracks the flank.",
    },
    {
      name: "Aggro Pearl",
      agents: ["phoenix", "kayo", "fade", "astra", "killjoy"],
      strategy:
        "Phoenix self-sustains the entry while KAY/O suppression breaks Pearl's sentinel-heavy holds.",
      attack:
        "Astra smokes, KAY/O + Phoenix flash the site, Phoenix entries solo, Fade clears deep.",
      defense:
        "Killjoy anchors, Astra Mid control, KAY/O knife suppresses, Phoenix flashes the retake.",
    },
  ],
};

export function bestCompsForMap(slug: string): MapComp[] {
  return MAP_BEST_COMPS[slug] ?? [];
}
