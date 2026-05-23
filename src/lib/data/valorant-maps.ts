// ggLobby V2 — Valorant maps. Splash/minimap art from the stable community CDN
// keyed by Riot's canonical map UUIDs, so map pages look complete with no
// manual uploads. Lineups are dynamic (admin-managed) — see /api/lineups.

/** A single dated milestone in a map's history. */
export interface MapEvent {
  /** Short date label, e.g. "Apr 2020", "2023", "Jun 2024". */
  date: string;
  /** Headline of the milestone. */
  title: string;
  /** Optional one-line elaboration. */
  detail?: string;
}

/** Static lore + release history shown on each map page. Editorial, hand-written. */
export interface MapHistory {
  /** When the map was added to Valorant. */
  released: string;
  /** Real-world setting / inspiration. */
  setting: string;
  /** Dated milestones, oldest first. Rendered as a vertical timeline. */
  timeline: MapEvent[];
}

export interface ValorantMap {
  slug: string;
  name: string;
  uuid: string;
  /** Plant sites available on the map. */
  sites: string[];
  /** Short positioning blurb for SEO + the map header. */
  blurb: string;
  /** Currently in the competitive map pool. */
  inPool: boolean;
  /** Lore & release history. Optional — falls back gracefully if absent. */
  history?: MapHistory;
}

const CDN = "https://media.valorant-api.com/maps";

export function mapSplash(uuid: string) {
  return `${CDN}/${uuid}/splash.png`;
}
/** Top-down minimap used for callouts. */
export function mapMinimap(uuid: string) {
  return `${CDN}/${uuid}/displayicon.png`;
}
export function mapListIcon(uuid: string) {
  return `${CDN}/${uuid}/listviewicon.png`;
}

export const MAPS: ValorantMap[] = [
  {
    slug: "ascent",
    name: "Ascent",
    uuid: "7eaecc1b-4337-bbf6-6ab9-04b8f06b3319",
    sites: ["A", "B"],
    blurb:
      "An open playground of mid control and two exposed sites with destructible doors. The map where Viper, Sova and KAY/O lineups decide rounds.",
    inPool: true,
    history: {
      released: "June 2020 — Valorant launch",
      setting: "Venice, Italy (a recovered sunken city)",
      timeline: [
        {
          date: "Jun 2020",
          title: "Launched with Valorant",
          detail:
            "One of the four maps available at global launch. Open mid and two mechanical site doors.",
        },
        {
          date: "2020–2025",
          title: "A five-year fixture in the pool",
          detail:
            "Stayed in competitive rotation for over five years — the game's fundamentals benchmark — with only minor spawn and sightline tuning.",
        },
        {
          date: "Oct 2025",
          title: "Rotated out for the first time",
          detail:
            "Removed in patch 11.08, ending a record uninterrupted run in the competitive pool.",
        },
        {
          date: "Apr 2026",
          title: "Returned in V26 Act 3",
          detail:
            "Re-added to the competitive pool as Bind rotated out.",
        },
      ],
    },
  },
  {
    slug: "bind",
    name: "Bind",
    uuid: "2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba",
    sites: ["A", "B"],
    blurb:
      "No mid, two teleporters. Tight chokes reward Brimstone, Viper and Raze utility and aggressive fakes.",
    inPool: false,
    history: {
      released: "April 2020 — Closed Beta",
      setting: "Rabat, Morocco",
      timeline: [
        {
          date: "Apr 2020",
          title: "Closed Beta launch map",
          detail: "No middle lane and two one-way teleporters — its signature gimmick.",
        },
        {
          date: "Jun 2020",
          title: "Carried into global launch",
        },
        {
          date: "2023",
          title: "Rotated out of the competitive pool",
        },
        {
          date: "2024",
          title: "Reworked and returned",
          detail:
            "Audio and sightline tweaks around Hookah and Showers; re-added to active duty.",
        },
        {
          date: "Apr 2026",
          title: "Rotated out in V26 Act 3",
          detail:
            "Vaulted from competitive and Premier queues to make room for Ascent's return.",
        },
      ],
    },
  },
  {
    slug: "haven",
    name: "Haven",
    uuid: "2bee0dc9-4ffe-519b-1cbd-7fbe763a6047",
    sites: ["A", "B", "C"],
    blurb:
      "Three sites stretch defenses thin. Recon and post-plant lineups are king across A, B and C.",
    inPool: true,
    history: {
      released: "April 2020 — Closed Beta",
      setting: "A monastery in Bhutan",
      timeline: [
        {
          date: "Apr 2020",
          title: "Closed Beta launch map",
          detail: "Valorant's original three-site map — still the only A/B/C layout.",
        },
        {
          date: "Jun 2020",
          title: "Carried into global launch",
        },
        {
          date: "2022–2024",
          title: "Cycled through active duty",
          detail:
            "Rotated in and out of the competitive pool across episodes; a pro and community favourite.",
        },
      ],
    },
  },
  {
    slug: "split",
    name: "Split",
    uuid: "d960549e-485c-e861-8d71-aa9d1aed12a2",
    sites: ["A", "B"],
    blurb:
      "Vertical, choke-heavy and mid-dependent. Sentinels and smokes lock down ropes and vents.",
    inPool: true,
    history: {
      released: "April 2020 — Closed Beta",
      setting: "Tokyo, Japan",
      timeline: [
        {
          date: "Apr 2020",
          title: "Closed Beta launch map",
          detail: "Vertical, choke-heavy design built around ropes, vents and heaven angles.",
        },
        {
          date: "Jun 2020",
          title: "Carried into global launch",
        },
        {
          date: "Jan 2022",
          title: "Removed from the competitive pool",
          detail: "Widely seen as the most defender-sided map in the game.",
        },
        {
          date: "Sep 2022",
          title: "Reworked and returned",
          detail: "Widened mid spaces to ease attacker pressure; back in active duty.",
        },
      ],
    },
  },
  {
    slug: "lotus",
    name: "Lotus",
    uuid: "2fe4ed3a-450a-948b-6d6b-e89a78e680a9",
    sites: ["A", "B", "C"],
    blurb:
      "Three sites with rotating doors and a silent drop. Heavy on recon and area-denial lineups.",
    inPool: true,
    history: {
      released: "January 2023 — Episode 6 Act 1",
      setting: "The Western Ghats, India",
      timeline: [
        {
          date: "Jan 2023",
          title: "Launched in Episode 6 Act 1",
          detail: "The second three-site map and the first new map in over a year.",
        },
        {
          date: "Jan 2023",
          title: "New map mechanics",
          detail:
            "Rotating stone doors that gate site access, plus a destructible silent drop.",
        },
        {
          date: "2023–2024",
          title: "Settled into the competitive pool",
          detail: "Became a recon- and area-denial-heavy map at the top level.",
        },
      ],
    },
  },
  {
    slug: "sunset",
    name: "Sunset",
    uuid: "92584fbe-486a-b1b2-9faa-39b0f486b498",
    sites: ["A", "B"],
    blurb:
      "Compact LA map with a strong mid. Tight angles reward disciplined smokes and flashes.",
    inPool: false,
    history: {
      released: "August 2023 — Episode 7 Act 2",
      setting: "Los Angeles, USA",
      timeline: [
        {
          date: "Aug 2023",
          title: "Launched in Episode 7 Act 2",
          detail:
            "A deliberate back-to-fundamentals map after the gimmick-heavy Lotus.",
        },
        {
          date: "Aug 2023",
          title: "Added to the competitive pool",
          detail:
            "Strong contestable mid, no mechanical tricks; adopted quickly as a balanced map.",
        },
        {
          date: "2025",
          title: "Rotated out of active duty",
        },
      ],
    },
  },
  {
    slug: "abyss",
    name: "Abyss",
    uuid: "224b0a95-48b9-f703-1bd8-67aca101a61f",
    sites: ["A", "B"],
    blurb:
      "No map boundaries — fall off and you die. Spacing and movement utility are everything.",
    inPool: false,
    history: {
      released: "June 2024 — Episode 9 Act 1",
      setting: "An ancient fortress suspended over a void",
      timeline: [
        {
          date: "Jun 2024",
          title: "Launched in Episode 9 Act 1",
          detail: "The first Valorant map with no boundary walls.",
        },
        {
          date: "Jun 2024",
          title: "New death hazard",
          detail:
            "Step off an edge in the open areas and you fall to your death — spacing is lethal.",
        },
        {
          date: "2025",
          title: "Rotated out of the competitive pool",
        },
      ],
    },
  },
  {
    slug: "icebox",
    name: "Icebox",
    uuid: "e2ad5c54-4114-a870-9641-8ea21279579a",
    sites: ["A", "B"],
    blurb:
      "Verticality, ziplines and tight post-plants. Sova and Viper lineups define both sites.",
    inPool: false,
    history: {
      released: "October 2020 — Episode 1 Act 3",
      setting: "A frozen research site in the Arctic (Bennett Province)",
      timeline: [
        {
          date: "Oct 2020",
          title: "First post-launch map",
          detail: "Brought ziplines, heavy verticality and famously cramped post-plants.",
        },
        {
          date: "2022",
          title: "Site rework",
          detail: "B site opened up and the worst angles cleaned to ease attacking.",
        },
        {
          date: "2023–2024",
          title: "Rotated out of active duty",
          detail: "Still a lineup-heavy fan favourite outside the pool.",
        },
      ],
    },
  },
  {
    slug: "breeze",
    name: "Breeze",
    uuid: "2fb9a4fd-47b8-4e7d-a969-74b4046ebd53",
    sites: ["A", "B"],
    blurb:
      "Huge open spaces and long sightlines. Operators and wide smokes shape every round.",
    inPool: true,
    history: {
      released: "April 2021 — Episode 2 Act 3",
      setting: "A tropical island in the Caribbean",
      timeline: [
        {
          date: "Apr 2021",
          title: "Launched in Episode 2 Act 3",
          detail: "Enormous open spaces, long sightlines and the largest sites in the game.",
        },
        {
          date: "2023",
          title: "Rework",
          detail: "Tightened mid and added cover to curb the Operator's stranglehold.",
        },
        {
          date: "2024",
          title: "Rotated out of the competitive pool",
        },
        {
          date: "Apr 2026",
          title: "Returned to active duty",
          detail: "Back in the competitive pool for the V26 Act 3 rotation.",
        },
      ],
    },
  },
  {
    slug: "fracture",
    name: "Fracture",
    uuid: "b529448b-4d60-346e-e89e-00a4c527a405",
    sites: ["A", "B"],
    blurb:
      "H-shaped — attackers spawn on both sides. Defenders get pinched; flank-aware utility wins.",
    inPool: true,
    history: {
      released: "September 2021 — Episode 3 Act 2",
      setting: "A radianite research facility in the New Mexico desert",
      timeline: [
        {
          date: "Sep 2021",
          title: "Launched in Episode 3 Act 2",
          detail:
            "H-shaped layout — attackers spawn on both sides and pinch defenders.",
        },
        {
          date: "2022–2024",
          title: "Rotated in and out of the pool",
          detail: "A polarising layout that cycled through active duty.",
        },
        {
          date: "Apr 2026",
          title: "Back in the competitive pool",
          detail: "Reinstated for the V26 Act 3 rotation.",
        },
      ],
    },
  },
  {
    slug: "pearl",
    name: "Pearl",
    uuid: "fd267378-4d1d-484f-ff52-77821ed10dc2",
    sites: ["A", "B"],
    blurb:
      "Grounded, no abilities-defying verticality. Pure mid battle and disciplined executes.",
    inPool: true,
    history: {
      released: "June 2022 — Episode 5 Act 1",
      setting: "An underwater domed city beneath Lisbon, Portugal",
      timeline: [
        {
          date: "Jun 2022",
          title: "Launched in Episode 5 Act 1",
          detail: "The first map set on Valorant's alternate-Earth 'Omega' timeline.",
        },
        {
          date: "Jun 2022",
          title: "No-gimmick design",
          detail:
            "No teleporters or ropes — a grounded two-site layout with a decisive mid.",
        },
        {
          date: "2023–2024",
          title: "Rotated through the competitive pool",
        },
        {
          date: "Apr 2026",
          title: "Returned to active duty",
          detail: "Re-added to the competitive pool in the V26 Act 3 rotation.",
        },
      ],
    },
  },
];

export const MAP_SLUGS = MAPS.map((m) => m.slug);

export function getMap(slug: string): ValorantMap | undefined {
  return MAPS.find((m) => m.slug === slug);
}
