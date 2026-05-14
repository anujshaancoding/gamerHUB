// FOV math for FPS games. Most engines use Hor+ (Source / Unreal / Quake) and
// FOV is reported as horizontal. A few use vertical FOV (some console titles).
// 4:3 stretched is just a Hor+ value at 4:3 aspect.
//
// All conversions are exact (no fudge factors). Output is in degrees.

export type AspectMode = "16:9" | "16:10" | "21:9" | "32:9" | "4:3" | "5:4";

export const ASPECTS: Record<AspectMode, number> = {
  "16:9": 16 / 9,
  "16:10": 16 / 10,
  "21:9": 21 / 9,
  "32:9": 32 / 9,
  "4:3": 4 / 3,
  "5:4": 5 / 4,
};

export function hFovToVFov(hFovDeg: number, aspect: number): number {
  const h = (hFovDeg * Math.PI) / 180;
  const v = 2 * Math.atan(Math.tan(h / 2) / aspect);
  return (v * 180) / Math.PI;
}

export function vFovToHFov(vFovDeg: number, aspect: number): number {
  const v = (vFovDeg * Math.PI) / 180;
  const h = 2 * Math.atan(Math.tan(v / 2) * aspect);
  return (h * 180) / Math.PI;
}

// Convert a horizontal FOV between two aspect ratios while keeping the
// vertical FOV constant (Hor+). This is what every Source/Valorant-style
// game does when you change resolution.
export function rescaleHorFov(hFovDeg: number, fromAspect: number, toAspect: number): number {
  const v = hFovToVFov(hFovDeg, fromAspect);
  return vFovToHFov(v, toAspect);
}

export interface GameFovProfile {
  id: string;
  label: string;
  // What unit the in-game FOV slider uses.
  unit: "hfov" | "vfov" | "scale";
  // If unit === 'scale', this is the multiplier applied to a baseline FOV.
  // Baseline FOV (the value at slider = 1.0 in horizontal degrees at 16:9).
  scaleBaseline?: number;
  // Min / max slider clamp (display only).
  min: number;
  max: number;
  notes?: string;
}

export const GAMES: GameFovProfile[] = [
  { id: "valorant",  label: "Valorant (locked 103° HFOV @ 16:9)",    unit: "hfov", min: 103, max: 103, notes: "FOV is locked. Output is Hor+ scaled for non-16:9 monitors." },
  { id: "cs2",       label: "Counter-Strike 2",                       unit: "hfov", min: 90,  max: 90,  notes: "Effectively locked at 90° HFOV; viewmodel_fov is separate." },
  { id: "apex",      label: "Apex Legends",                           unit: "hfov", min: 70,  max: 110 },
  { id: "overwatch", label: "Overwatch 2",                            unit: "hfov", min: 80,  max: 103 },
  { id: "rainbow6",  label: "Rainbow Six Siege",                       unit: "vfov", min: 60,  max: 90, notes: "Slider is vertical FOV." },
  { id: "fortnite",  label: "Fortnite",                                unit: "hfov", min: 80,  max: 120 },
  { id: "cod",       label: "Call of Duty (MW/Warzone)",               unit: "vfov", min: 60,  max: 120, notes: "Slider is vertical FOV (Affected by ADS FOV setting separately)." },
  { id: "pubg",      label: "PUBG PC",                                 unit: "vfov", min: 60,  max: 103 },
  { id: "minecraft", label: "Minecraft",                               unit: "vfov", min: 30,  max: 110 },
  { id: "deadlock",  label: "Deadlock",                                unit: "hfov", min: 70,  max: 110 },
  { id: "marvel",    label: "Marvel Rivals",                           unit: "vfov", min: 60,  max: 120 },
];

// Convert an in-game FOV value from one game to another, optionally also
// adjusting the displayed aspect (Hor+ resizing).
export function convertGameFov(
  value: number,
  from: GameFovProfile,
  to: GameFovProfile,
  fromAspect: number,
  toAspect: number,
): number {
  // 1) Normalise input to horizontal FOV at fromAspect.
  let hFovFrom: number;
  if (from.unit === "hfov") {
    hFovFrom = value;
  } else if (from.unit === "vfov") {
    hFovFrom = vFovToHFov(value, fromAspect);
  } else {
    hFovFrom = (from.scaleBaseline ?? 90) * value;
  }

  // 2) Rescale to the target aspect (keep vertical FOV constant).
  const hFovTo = rescaleHorFov(hFovFrom, fromAspect, toAspect);

  // 3) Convert into the target game's unit.
  if (to.unit === "hfov") return hFovTo;
  if (to.unit === "vfov") return hFovToVFov(hFovTo, toAspect);
  return hFovTo / (to.scaleBaseline ?? 90);
}
