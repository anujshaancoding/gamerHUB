// ggLobby V2 — Valorant callout positions. Riot exposes per-map callout
// regions plus the multipliers that map in-game world coordinates onto the
// square `displayicon.png` minimap. We fetch this server-side (cached for a
// week) so map pages can overlay accurate callout labels with no manual data.

export interface MapCallout {
  /** Local region, e.g. "Market". */
  region: string;
  /** Super region, e.g. "Mid". */
  superRegion: string;
  /** Combined display label, e.g. "Mid Market" / "A Site". */
  label: string;
  /** Horizontal position on the minimap, 0..1 (fraction of width). */
  x: number;
  /** Vertical position on the minimap, 0..1 (fraction of height). */
  y: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

interface RawCallout {
  regionName?: string;
  superRegionName?: string;
  location?: { x: number; y: number };
}

/**
 * Fetch callout positions for a map by Riot UUID. Returns an empty array on
 * any failure so static generation never breaks if the API is unreachable.
 */
export async function getMapCallouts(uuid: string): Promise<MapCallout[]> {
  try {
    const res = await fetch(`https://valorant-api.com/v1/maps/${uuid}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      data?: {
        xMultiplier?: number;
        yMultiplier?: number;
        xScalarToAdd?: number;
        yScalarToAdd?: number;
        callouts?: RawCallout[] | null;
      };
    };

    const d = json?.data;
    if (
      !d ||
      !Array.isArray(d.callouts) ||
      typeof d.xMultiplier !== "number" ||
      typeof d.yMultiplier !== "number" ||
      typeof d.xScalarToAdd !== "number" ||
      typeof d.yScalarToAdd !== "number"
    ) {
      return [];
    }

    const { xMultiplier, yMultiplier, xScalarToAdd, yScalarToAdd } = d;

    return d.callouts
      .filter((c): c is Required<RawCallout> => !!c?.location)
      .map((c) => {
        // Riot's documented transform: game x/y are swapped relative to the
        // minimap image, producing a 0..1 fraction of the displayicon.
        const x = c.location.y * xMultiplier + xScalarToAdd;
        const y = c.location.x * yMultiplier + yScalarToAdd;
        const region = c.regionName?.trim() ?? "";
        const superRegion = c.superRegionName?.trim() ?? "";
        const label =
          [superRegion, region].filter(Boolean).join(" ").trim() || region;
        return { region, superRegion, label, x: clamp01(x), y: clamp01(y) };
      })
      .filter((c) => c.label.length > 0);
  } catch {
    return [];
  }
}
