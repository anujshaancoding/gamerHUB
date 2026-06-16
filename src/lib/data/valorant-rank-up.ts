// Rank Up — Valorant rank-by-rank game-sense guides.
//
// Static, hand-authored editorial (same pattern as valorant-maps.ts /
// valorant-patches.ts — no DB, no CMS for the pilot). Each tier answers the
// same 4 framework questions so the section reads as one coherent ladder and
// one shared template renders every tier.
//
// Pilot ships iron / bronze / silver. Gold → Immortal appear as locked cards
// on the hub and are added here when published. Rank accent colors come from
// the shared RANK_THEMES source of truth (lib/features/carousel/rank-themes.ts).

import { RANK_THEMES, type RankTier } from "@/lib/features/carousel/rank-themes";

// Iron's brand accent (#5B5B5B) is intentionally dark and fails WCAG AA as
// small text/tag/border on our dark card surfaces (~2.3:1). For FOREGROUND use
// we substitute a lighter steel (~5.9:1) — the brand token in RANK_THEMES is
// left untouched, so emblems/carousel themes keep the canonical color.
const ACCENT_TEXT_OVERRIDE: Partial<Record<RankTier, string>> = {
  iron: "#9AA0A6",
};

/** Contrast-safe accent for text, tags and borders on dark surfaces. */
export function rankAccent(group: RankTier): string {
  return ACCENT_TEXT_OVERRIDE[group] ?? RANK_THEMES[group].accent;
}

/** The seven cross-cutting fundamentals threaded through every tier. */
export type RankUpPillar =
  | "crosshair placement"
  | "utility usage"
  | "economy"
  | "comms"
  | "minimap discipline"
  | "post-plant"
  | "mental/tilt";

export interface RankUpHabit {
  /** Short, recognisable name — the reader should go "that's me". */
  title: string;
  /** What it looks like + why it caps you at this rank. */
  detail: string;
}

export interface RankUpUnlock {
  title: string;
  /** Primary cross-cutting pillar this unlock builds. */
  pillar: RankUpPillar;
  /** The concrete shift, second-person. */
  theShift: string;
}

export interface RankUpDrill {
  name: string;
  /** Where/how to run it (Range / Deathmatch / Custom / VOD / live). */
  mode?: string;
  /** Reps or time box, e.g. "15 min before ranked". */
  repsOrTime?: string;
  how: string;
}

export interface RankUpFaq {
  q: string;
  a: string;
}

export interface RankUpPillarCard {
  pillar: RankUpPillar;
  label: string;
  body: string;
}

export interface RankUpRelated {
  label: string;
  href: string;
}

export interface RankUpTier {
  slug: "iron" | "bronze" | "silver";
  /** Color-family key for the shared rank accent. */
  group: RankTier;
  rank: string; // "Iron"
  nextRank: string; // "Bronze"
  /** One-line "what you'll get" — hub card + meta seed. */
  promise: string;
  /** One-sentence problem hook for the ladder card. */
  hook: string;
  /** Lead deck on the guide page (2–3 sentences). */
  deck: string;
  /** Skim layer — the unlocks in one breath. */
  tldr: string[];
  /** Framework Q1 — flowing prose, one entry per paragraph. */
  howThisRankThinks: string[];
  habits: RankUpHabit[];
  unlocks: RankUpUnlock[];
  drills: RankUpDrill[];
  /** Cross-cutting pillar mini-cards (3 per tier). */
  pillars: RankUpPillarCard[];
  faq: RankUpFaq[];
  related: RankUpRelated[];
  /** Attribution + research trail (no verbatim republishing). */
  sources: string[];
  updatedAt: string;
  // ── SEO ──
  title: string;
  description: string;
  keywords: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// The full ladder (drives the hub grid). `live: false` tiers render as locked
// "coming soon" cards until their guide is authored and added to RANK_UP_TIERS.
// ─────────────────────────────────────────────────────────────────────────────

export interface LadderEntry {
  slug: string;
  group: RankTier;
  rank: string;
  nextRank: string;
  hook: string;
  live: boolean;
}

export const RANK_UP_LADDER: LadderEntry[] = [
  { slug: "iron", group: "iron", rank: "Iron", nextRank: "Bronze", hook: "You're making decisions in the wrong order — survive first, learn the game second.", live: true },
  { slug: "bronze", group: "bronze", rank: "Bronze", nextRank: "Silver", hook: "You know the rules. A cluster of normal-feeling habits is the real ceiling.", live: true },
  { slug: "silver", group: "silver", rank: "Silver", nextRank: "Gold", hook: "It's not your aim. It's rotations, minimap and post-plant discipline.", live: true },
  { slug: "gold", group: "gold", rank: "Gold", nextRank: "Platinum", hook: "Turning solid fundamentals into round-winning, repeatable structure.", live: false },
  { slug: "platinum", group: "platinum", rank: "Platinum", nextRank: "Diamond", hook: "Playing the map, not the duel — timings, defaults and trade discipline.", live: false },
  { slug: "diamond", group: "diamond", rank: "Diamond", nextRank: "Ascendant", hook: "Reading the enemy's plan and punishing it before it lands.", live: false },
  { slug: "ascendant", group: "ascendant", rank: "Ascendant", nextRank: "Immortal", hook: "Mid-round adaptation and flawless economy as a five-stack.", live: false },
  { slug: "immortal", group: "immortal", rank: "Immortal", nextRank: "Radiant", hook: "The 1% margins — anti-strat, role mastery and mental endurance.", live: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pilot tier content (Iron / Bronze / Silver)
// ─────────────────────────────────────────────────────────────────────────────

const IRON: RankUpTier = {
  slug: "iron",
  group: "iron",
  rank: "Iron",
  nextRank: "Bronze",
  promise: "Escape Iron in a couple of weeks by fixing what actually loses your duels — not your aim.",
  hook: "You're making decisions in the wrong order — survive first, learn the game second.",
  deck: "Iron is the starting line, not a verdict on your skill. It means you haven't yet learned how Valorant's gunplay and game logic differ from every other shooter you've played. Most Iron players escape within two to three weeks once they understand what actually matters — this guide skips the generic advice and names exactly what's holding you back.",
  tldr: [
    "Keep your crosshair at head height every step you take.",
    "Stop shooting while moving — stop fully, let the crosshair settle, then fire.",
    "Use one ability per round with a clear purpose.",
    "Call out enemy positions in text chat if you can't use voice.",
  ],
  howThisRankThinks: [
    "The mental model in Iron is simple and honest: survive first, figure out the game second. Iron players are still learning that Valorant is not a run-and-gun game. The default is to sprint toward the bomb site, spray until something dies, and rely on raw reaction speed to win duels. When it doesn't work — and it usually doesn't — the temptation is to blame teammates or lag.",
    "There's also a strong misconception that aim is everything. Iron players will spend time in the range tuning their crosshair color but walk around maps looking at the floor, never recognising that where their crosshair lives between fights matters far more than what it looks like.",
    "The rounds feel chaotic because they are: nobody has utility discipline, positions are random, and nobody calls out enemy locations. That chaos masks what is actually a very learnable problem set.",
  ],
  habits: [
    { title: "Crosshair permanently below head level", detail: "Between positions — walking corridors, climbing stairs, rounding corners — the crosshair sits at the chest, waist or floor. When an enemy appears, the mouse has to travel up before the shot fires. At this speed, that travel is the entire duel lost." },
    { title: "Spraying a full magazine at everything", detail: "The Vandal and Phantom have tight first-bullet accuracy when you tap or burst. Iron players hold M1 from the moment they hear footsteps, dumping the entire spread pattern into the wall beside the enemy's head." },
    { title: "Running and shooting at the same time", detail: "Movement adds an error penalty that sends bullets anywhere but where the crosshair points. Iron players run toward enemies and spray — combining two accuracy penalties into one guaranteed miss." },
    { title: "Using abilities on instinct, or not at all", detail: "Flashes thrown at the floor, smokes deployed after walking onto site, Sage walls built without a plan — or, more commonly, carrying all four charges into the final round without ever using them." },
    { title: "Walking into site alone", detail: "Five players spread across the map, each going 1v5 on a different site. The round resolves in thirty seconds. Clustering for entry is the least-practised fundamental in Iron." },
    { title: "Tilting after two bad rounds", detail: "The mental game collapses fast. Two back-to-back losses trigger a shift toward aggression or apathy — both of which compound the original mistakes." },
  ],
  unlocks: [
    { title: "Keep your crosshair at head height every step you take", pillar: "crosshair placement", theShift: "This isn't about reaction speed — it's about reducing how far your mouse has to travel when an enemy appears. If your crosshair is already at head level on the corner they swing from, you need a smaller correction to land the shot, sometimes none at all. Do it consciously for five games and notice how many duels you win before you even realise you've shot." },
    { title: "Stop shooting while moving — full stop", pillar: "crosshair placement", theShift: "Counter-strafing is a Bronze-to-Silver topic. At Iron the fix is simpler: stop moving before you fire. Tap the opposite direction to cancel momentum, let the crosshair settle for a moment, then shoot. Radiant coach Woohoojin's gunfight-hygiene content traces nearly every lower-rank duel loss to this exact issue — shooting before the player has stopped moving." },
    { title: "Use one ability per round with a clear purpose", pillar: "utility usage", theShift: "You don't need complex lineups. You need one ability decision per round that helps your team — a Sage slow on the entry choke, a Reyna flash before a corner, a Killjoy turret on the flank. Choose one, use it with a plan, and build that habit before worrying about the rest of your kit." },
    { title: "Call out enemy positions in text chat if you can't use voice", pillar: "comms", theShift: "Iron lobbies share almost no information. Kill one player and type \"A main, one down\" and you've given your team more than 90% of Iron lobbies get in an entire round. This single habit wins rounds with zero mechanical improvement." },
  ],
  drills: [
    { name: "Crosshair Placement Drill", mode: "Deathmatch", repsOrTime: "15 min before ranked", how: "Before every engagement, say to yourself \"head level\" and force your crosshair to head height on every wall, doorframe and corner you pass. Don't try to win — build the positioning reflex, then load into ranked." },
    { name: "Stop-and-Shoot Drill", mode: "Deathmatch", repsOrTime: "1 full match", how: "Commit to never shooting while your feet are moving. Counter-strafe, stop completely, then fire. Track the rule, not the kill count. This breaks the run-and-gun default faster than anything else at this rank." },
    { name: "Spray Pattern Learning", mode: "The Range", repsOrTime: "10 min", how: "Spray a full Vandal magazine at the wall at medium range to learn the pattern, then practise tapping with a half-second pause. The goal isn't spray mastery — it's understanding that bursting beats spraying past about five meters." },
    { name: "One-Ability-Per-Round Rule", mode: "Live ranked", repsOrTime: "every game", how: "Before you lock your agent, read their kit and pick ONE ability you'll commit to using each round with real intent. After ten games it's automatic." },
    { name: "Two-Minute Replay Habit", mode: "VOD review", repsOrTime: "2 min/game", how: "Watch your last death after each game and ask only: was my crosshair at head level when I peeked? Was I moving when I shot? One question, two minutes — that's enough." },
  ],
  pillars: [
    { pillar: "crosshair placement", label: "Crosshair placement", body: "Where your crosshair sits between fights matters more than your sensitivity or its color. Pre-aim head height on every corner before you see anyone." },
    { pillar: "utility usage", label: "Utility usage", body: "One deliberate ability per round beats four charges you carry to the end screen unused. Pick a purpose before you press the key." },
    { pillar: "mental/tilt", label: "Mental & tilt", body: "Iron is the most smurf-heavy rank — those players aren't your skill ceiling. Two hard losses in a row? Log off, come back tomorrow. Consistency climbs; volume tilts." },
  ],
  faq: [
    { q: "Why am I hardstuck in Iron in Valorant?", a: "Almost always crosshair placement and shooting while moving — not raw aim. Iron players lose duels before they fire because the crosshair starts below head height and the feet are still moving. Fix those two and the rank moves." },
    { q: "How long does it take to get out of Iron?", a: "Most players climb out within two to three weeks of consistent play once they hold head-height crosshair placement, stop-and-shoot, and make one deliberate utility and comms call per round." },
    { q: "Is Iron full of smurfs?", a: "Iron sees more smurfs than any other rank — higher-ranked players on new accounts. They aren't a reflection of your ceiling, and the ranked system corrects for those outlier games as long as you play consistently." },
  ],
  related: [
    { label: "Next: Bronze — escape Bronze and climb to Silver", href: "/rank-up/bronze" },
    { label: "Best agents for your rank", href: "/agents/rank-guide" },
    { label: "Maps & Lineups", href: "/maps" },
  ],
  sources: [
    "Community consensus from r/VALORANT and r/AgentAcademy lower-rank improvement threads",
    "Woohoojin — gunfight hygiene and crosshair-placement coaching content",
    "Valorant coaching/improvement YouTube guides and their comment discussions",
  ],
  updatedAt: "2026-06-16",
  title: "Iron to Bronze in Valorant — Game Sense & Climb Guide (2026) | ggLobby",
  description: "Stuck in Valorant Iron? Here's exactly how Iron players think, the habits keeping you there, and the 4 unlocks — with drills — to climb to Bronze.",
  keywords: [
    "how to rank up from iron valorant",
    "valorant iron rank tips",
    "iron to bronze valorant",
    "why am i hardstuck iron valorant",
    "valorant iron mistakes",
    "valorant beginner ranked guide",
  ],
};

const BRONZE: RankUpTier = {
  slug: "bronze",
  group: "bronze",
  rank: "Bronze",
  nextRank: "Silver",
  promise: "Break the normal-feeling habits — crouch-spray, out-of-sync buys, no agent identity — that cap Bronze.",
  hook: "You know the rules. A cluster of normal-feeling habits is the real ceiling.",
  deck: "Escaping Bronze is one of the most common sticking points in Valorant. You understand round structure, map layouts, when to buy and when to save — the rules aren't the problem. The problem is a cluster of habits that feel normal because everyone around you does them too. Fix them and Silver is a matter of weeks, not months.",
  tldr: [
    "Delete the crouch-spray — tap or burst standing at range.",
    "Learn one two-agent main rotation, not five.",
    "Call the economy every buy phase so the team buys in sync.",
    "Tap at medium range; let the crosshair resettle between shots.",
    "Give callouts with verbs, not just nouns.",
  ],
  howThisRankThinks: [
    "Bronze players have graduated from pure survival mode. The instinct to use abilities is there; the awareness that coordination matters is there. The problem is inconsistency — they play well for three or four rounds, then make one decision that collapses an economy or throws a won round.",
    "The mental model is: \"I know what I'm supposed to do — I just need to execute better.\" That's partly right. The deeper issue is that Bronze players haven't built repeatable habits. Their good rounds happen to them; they don't construct them.",
    "There's a specific mechanical overreliance here: the crouch-spray. Players crouch because they know it reduces spread, but it also turns them into a stationary, readable target. It's the single most common mechanical tell of a Bronze player in a lobby.",
    "Comms are still rough. Bronze players talk during fights instead of before them, giving information too late to act on, or call enemies without context (\"they're in B\" with three possible B locations does nothing).",
  ],
  habits: [
    { title: "Crouch-spraying every mid-range duel", detail: "Crouching while holding M1 is the defining Bronze mechanic. It feels like spray control — it isn't. The spread benefit is minor at distances where you should be tapping anyway, and the mobility cost is severe. Enemies read the crouch animation and headshot through it." },
    { title: "Buying out of sync with the team", detail: "The economy problem in Bronze is a coordination failure, not individual ignorance. Two players full-buy while three save, leaving mismatched firepower for everyone and destroying economic structure across rounds." },
    { title: "No fixed agent identity", detail: "Bronze players rotate between three to five agents and never build deep familiarity with any. Ability timing, lineup muscle memory and kit instincts require repetition on one character — rotating away prevents it accumulating." },
    { title: "Crosshair placement drifts low under pressure", detail: "The head-level habit from Iron degrades when mechanical pressure rises. The crosshair is at head height in the corridor but drops to chest at the moment of the peek. Under stress the instinct is to aim for body mass." },
    { title: "Standing still to spray at long range", detail: "At ranges where the rifle should be tapped or burst, Bronze players spray and wonder why the bullets scatter. The weapon dictates the shooting approach and the range dictates the weapon behaviour — spraying a Vandal at mid-range guarantees the second and third bullets miss." },
    { title: "Comms that inform but don't coordinate", detail: "\"He's on A\" does nothing. \"One coming A main, heading our way\" plus a response — \"I'll flash\" — wins rounds. Bronze players call positions; they don't call coordinated responses." },
  ],
  unlocks: [
    { title: "Delete the crouch-spray — replace it with tap-fire", pillar: "crosshair placement", theShift: "Stop crouching in every duel except close-range spray situations inside five meters. At medium and long range, stop, stay standing, and tap or burst. It feels wrong because crouching feels controlled — it isn't. Run one full Deathmatch with zero crouching and the accuracy gain is measurable within that session." },
    { title: "Learn one two-agent main rotation, not five", pillar: "utility usage", theShift: "Pick a primary and a backup in a different role. Play the primary every ranked game for two weeks and track your ability usage each round. The familiarity built over twenty games on one agent is worth more than fifty games spread across a roster — community consensus points to this as the fastest Bronze-to-Silver accelerator." },
    { title: "Call the economy every buy phase", pillar: "economy", theShift: "Before you buy, say or type \"I have X — full buy or save?\" and check the team's credits. You're not dictating the economy, you're synchronising it. One player asking the question breaks the pattern of uncoordinated buys — this is where Bronze teams start playing like Silver teams with no mechanical change at all." },
    { title: "Commit to tapping at medium range with rifles", pillar: "crosshair placement", theShift: "Past five or six meters, switch to a tap or controlled burst. Turn on the \"Shooting Error\" display in the range to see in real time how spread behaves when you tap versus spray — one session with it permanently changes how you understand the mechanic." },
    { title: "Give callouts with verbs, not just nouns", pillar: "comms", theShift: "\"A main\" is a location. \"A main pushing, I need a flash\" tells the team what to do. \"B planted, I'm on default, watch mid\" tells them two things at once. Move your callouts from position-labels to action-requests — this separates Bronze from Silver as much as any mechanical skill." },
  ],
  drills: [
    { name: "No-Crouch Deathmatch", mode: "Deathmatch", repsOrTime: "15 min warm-up", how: "Strict rule: zero crouching in any duel that isn't a point-blank corridor. Every time you instinctively crouch, acknowledge it. By the fifth session you'll notice how many opponents you're reading because they crouch." },
    { name: "Practice Range Tap Drill", mode: "The Range", repsOrTime: "10 min", how: "Targets at 20–30 m. One bullet, wait for the crosshair to resettle, next bullet. Build up to three-round bursts with a deliberate pause. This is gunfight hygiene as Woohoojin describes it — matching firing behaviour to range." },
    { name: "Agent Mastery Log", mode: "Notes", repsOrTime: "ongoing", how: "After each game log three things: which abilities you used, which you didn't, and one round you could have used one differently. After ten games on one agent, patterns emerge — this replaces switching agents when you slump." },
    { name: "Economy Audit", mode: "VOD review", repsOrTime: "5 min post-game", how: "Filter the replay for buy phases and count rounds where the team had mismatched equipment from uncoordinated buying — often three to five per game in Bronze. Making the number visible creates the motivation to call economy next session." },
    { name: "Callout Vocabulary Session", mode: "Custom / practice", repsOrTime: "30 min per map, once", how: "Walk each of your main maps and name every major position out loud using community callout names. This eliminates the Bronze problem of knowing where enemies are but lacking the language to say it fast enough to matter." },
  ],
  pillars: [
    { pillar: "economy", label: "Economy", body: "Mismatched buys lose rounds no aim can save. One player asking \"save or buy?\" each phase syncs the whole team's firepower." },
    { pillar: "crosshair placement", label: "Crosshair placement", body: "The head-height habit decays under pressure. Hold it at the peek, not just in the corridor — and stand still to shoot past five meters." },
    { pillar: "comms", label: "Comms", body: "Callouts with verbs (\"A main pushing, need a flash\") beat callouts with nouns (\"A main\"). Say the action, not just the location." },
  ],
  faq: [
    { q: "Why can't I climb out of Bronze in Valorant?", a: "Usually a cluster of habits that feel normal: crouch-spraying, buying out of sync with teammates, no fixed agent, and callouts that name positions without requesting a response. None are about aim — fix the habits and Silver follows." },
    { q: "Is crouch-spraying bad in Valorant?", a: "At medium and long range, yes. Crouching barely helps spread at those distances and removes your mobility, making you a readable, stationary target. Stand still and tap or burst instead; save crouch-spray for point-blank fights." },
    { q: "Should I switch agents when I'm on a losing streak?", a: "No. Switching removes your one advantage — familiarity — and adds a learning tax at the worst moment. Stay on your main for the session and evaluate the agent after you've watched the replay. It usually wasn't the agent." },
  ],
  related: [
    { label: "Previous: Iron — escape Iron and climb to Bronze", href: "/rank-up/iron" },
    { label: "Next: Silver — the game-sense habits that get you to Gold", href: "/rank-up/silver" },
    { label: "Best agents for your rank", href: "/agents/rank-guide" },
  ],
  sources: [
    "Community consensus from r/VALORANT and r/AgentAcademy Bronze-climb threads",
    "Woohoojin — \"gunfight hygiene\" framing (weapon and range dictate shooting behaviour)",
    "Valorant coaching YouTube content and comment discussions on economy and agent mastery",
  ],
  updatedAt: "2026-06-16",
  title: "Bronze to Silver in Valorant — Game Sense & Climb Guide (2026) | ggLobby",
  description: "Bronze players know the rules but keep the same bad habits. Here's the real Bronze mentality, what's holding you back, and the 5 unlocks — with drills — to reach Silver.",
  keywords: [
    "how to rank up from bronze valorant",
    "valorant bronze rank tips",
    "bronze to silver valorant",
    "why am i hardstuck bronze valorant",
    "valorant crouch spray",
    "valorant economy guide low rank",
  ],
};

const SILVER: RankUpTier = {
  slug: "silver",
  group: "silver",
  rank: "Silver",
  nextRank: "Gold",
  promise: "Close the game-sense gap — rotations, minimap, post-plant and tilt — that keeps Silver oscillating.",
  hook: "It's not your aim. It's rotations, minimap and post-plant discipline.",
  deck: "Silver is Valorant's most frustrating rank. You have the fundamentals, you understand the economy, you can land headshots in Deathmatch — but the rank oscillates between Silver 1 and Silver 3 on a loop that feels random. It isn't random. Silver's problem set is almost entirely game sense, not mechanics, and this guide addresses those gaps directly.",
  tldr: [
    "Build a minimap rhythm — glance it every ~10 seconds.",
    "Never rotate without a confirmed reason.",
    "Learn one post-plant position per site on every map you play.",
    "Use your utility at the spike plant or before — not after.",
    "Call before you shoot, not while you shoot.",
  ],
  howThisRankThinks: [
    "The Silver mental model is: \"I do the right thing most of the time — my teammates are the variable.\" There's a grain of truth there, but the framing is the problem. It treats game sense as something that only matters when your team cooperates. In reality, game sense is the skill that lets you carry inside a chaotic team — covering the flank a teammate missed, rotating at the right time without a call, knowing when a retake is mathematically unlikely.",
    "Silver players carry one bad habit they mistake for a good one: making reads without information. They decide early that the enemies are on A, walk past B, and die to a B-short lurk. The read was plausible — it just wasn't based on any collected information. This confident decision-making without verified intel separates Silver from Gold more than any aim gap.",
    "There's also a tilt pattern unique to this rank. Lose two rounds and a Silver player often makes an aggressive personal outplay in round three — a solo push, a risky angle, an eco force. When it fails, the mindset fractures. The community calls this \"hero mode\": confidence mistimed, the right play in the wrong context.",
  ],
  habits: [
    { title: "Rotating without information", detail: "The single most common Silver death is the mid-rotation kill — leaving A for B without knowing A was actually cleared, walking into a lurk or a mid crossfire. Every rotation should be triggered by confirmed information, not a hunch." },
    { title: "Not checking the minimap", detail: "Silver players glance the minimap occasionally, not every ten seconds as a live model of the round. The minimap tells you which flank is open, which teammate is missing coverage, and whether the spike has been down long enough to hold rather than rush a retake." },
    { title: "Post-plant positions that make the defuse easy", detail: "After planting, Silver players often hold from where they planted or move to the nearest cover without thinking about the angles a defuser must cross. The position should cover the spike and crossfire with the furthest teammate — not just any safe spot." },
    { title: "Utility that goes unused late in the round", detail: "Carrying abilities into the final fifteen seconds, then panicking them or losing them entirely. Utility is bought per round and depreciates to zero unused — an unused smoke holding B is a credit advantage you simply handed back." },
    { title: "Calling enemies mid-gunfight", detail: "Silver players call out positions while shooting, so the voice line fires as they die — too late to act on. The callout should happen the moment the enemy is spotted. Gold players call first, shoot second." },
    { title: "Reaching for complex agents to fix a slump", detail: "Struggling Silver players try Astra, Chamber or off-meta picks hoping novelty unlocks them. The opposite is true: Silver rewards simple, role-disciplined agents. A well-played Brimstone beats a poorly-played Astra every round." },
  ],
  unlocks: [
    { title: "Build a minimap rhythm — check it every ten seconds", pillar: "minimap discipline", theShift: "Set a mental timer. Every ten seconds, glance the minimap and answer three questions: where are my teammates, which area has no coverage, and where am I relative to the spike? This habit produces game sense that looks like telepathy from the outside but is just reading available information consistently." },
    { title: "Never rotate without a confirmed reason", pillar: "minimap discipline", theShift: "Before you leave a site you need one of three things: a confirmed kill there, a teammate's \"it's clear\" call, or a call that the other site is being hit. A feeling, a quiet site, or a timer running down is not enough. This single rule deletes the mid-rotation death — the tactical unlock coaching content (including the oft-cited Silver-to-Platinum case attributed to Woohoojin) points to most." },
    { title: "Learn one post-plant position per site on every map you play", pillar: "post-plant", theShift: "For each map in your pool, memorise one post-plant spot per site that (a) sees the spike, (b) forces the defuser across an angle your utility controls, and (c) is reachable without a dangerous rotation. Practise it in customs, then execute the practised position instead of improvising." },
    { title: "Use your utility at the plant or before — not after", pillar: "post-plant", theShift: "If the spike is going down and you still have a smoke or flash, deploy it now — smoke the likely retake path, flash the corner the rotator peeks first. At the plant, utility's job flips from creating space to denying the retake. Players who do this build what looks like a post-plant instinct; it's just using utility before it expires." },
    { title: "Call before you shoot, not while you shoot", pillar: "comms", theShift: "Slow the call reflex down. The moment you spot an enemy: call the position, give the action (\"rotating B\", \"holding default\"), then engage. Given at contact, your teammates have two to three seconds to act; given while you're dead, they have nothing. This accounts for a measurable round-win gap between Silver and Gold." },
  ],
  drills: [
    { name: "Minimap Rhythm Training", mode: "Unrated → ranked", repsOrTime: "5 games", how: "Play an unrated where your only goal is to check the minimap every ten seconds and whisper what you see. Ignore the outcome. After five games the rhythm migrates into ranked without conscious thought." },
    { name: "The Three-Question VOD Protocol", mode: "VOD review", repsOrTime: "one win + one loss/game", how: "Watch one round you won and one you lost. For each, answer only: did I have confirmed info before I rotated? did I use all my utility before round end? did I call before or after I engaged? Log the answers — patterns surface within five sessions." },
    { name: "Post-Plant Walk-Through", mode: "Custom game", repsOrTime: "20 min", how: "On your two most-played maps, plant at each common spot, walk to your chosen post-plant position and test: can you see the spike, what angle does the defuser cross, can you hold it from safety? Repeat for A and B." },
    { name: "Utility Countdown Habit", mode: "Live play", repsOrTime: "ongoing", how: "In a post-plant setup, tell yourself \"smoke/flash goes at fifteen seconds remaining.\" Tracking the burn window instead of hoarding utility until panic raises your post-plant hold rate significantly." },
    { name: "Callout Timing Drill", mode: "Deathmatch", repsOrTime: "1 session", how: "Say the enemy's position out loud the instant you see them — \"top mid, one\" — then shoot. Externalising the call before the gunfight reprograms the call-first reflex into muscle memory for ranked." },
  ],
  pillars: [
    { pillar: "minimap discipline", label: "Minimap discipline", body: "Glance the minimap every ~10 seconds. It's a live model of the round — open flanks, missing teammates, plant timing. Most \"game sense\" is just reading it consistently." },
    { pillar: "post-plant", label: "Post-plant", body: "Plant, then take a position that covers the spike and crossfires the defuse — not just the nearest cover. Memorise one per site per map." },
    { pillar: "mental/tilt", label: "Mental & tilt", body: "Two rounds down isn't a cue for a hero solo push. Tighten structure, call the eco, set up a clean full-buy. Shorter, higher-focus sessions beat autopilot volume." },
  ],
  faq: [
    { q: "Why am I hardstuck in Silver in Valorant?", a: "The Silver oscillation is a consistency and game-sense problem, not a skill ceiling. The recurring culprit is rotating on instinct rather than confirmed information. Record and review your minimap usage and rotation triggers — that's where most Silver climbs unlock." },
    { q: "Is Silver about aim or game sense?", a: "Game sense. Most Silver players already have enough aim — the rank is decided by rotation timing, minimap discipline, post-plant positioning, comms timing and tilt control. Fix those and the rank moves even if your aim stays the same." },
    { q: "Should I play complex agents like Astra or Chamber in Silver?", a: "Usually no. Silver rewards simple, role-disciplined play. A well-played Brimstone controller beats a poorly-played Astra every round. Master a simple agent's function before reaching for a higher skill ceiling." },
  ],
  related: [
    { label: "Previous: Bronze — stop the mistakes and climb to Silver", href: "/rank-up/bronze" },
    { label: "Tier List — what's strong right now", href: "/tier-list" },
    { label: "Patch & Meta", href: "/patch" },
  ],
  sources: [
    "Community consensus from r/VALORANT and r/AgentAcademy hardstuck-Silver threads",
    "Dotesports coverage of player coaching cases (Silver-to-Platinum), attributed to Woohoojin's coaching content",
    "Valorant improvement community VOD-review frameworks (review one win, one loss, one close game)",
  ],
  updatedAt: "2026-06-16",
  title: "Silver to Gold in Valorant — Game Sense & Climb Guide (2026) | ggLobby",
  description: "Hardstuck Silver? It's not your aim — it's rotations, minimap and economy discipline. The 5 game-sense habits separating Silver from Gold, with drills.",
  keywords: [
    "how to rank up from silver valorant",
    "valorant silver rank tips",
    "silver to gold valorant",
    "valorant silver hardstuck",
    "valorant game sense guide",
    "valorant silver mistakes",
  ],
};

export const RANK_UP_TIERS: RankUpTier[] = [IRON, BRONZE, SILVER];

export function getTier(slug: string): RankUpTier | undefined {
  return RANK_UP_TIERS.find((t) => t.slug === slug);
}

export function getAllTierSlugs(): string[] {
  return RANK_UP_TIERS.map((t) => t.slug);
}
