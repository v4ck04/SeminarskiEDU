// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
// Night film: "day" = interior night (cool moon key, deep shadows), "golden" = exterior night (rainy street).
// The shot's key direction (SUN_SHOT) imitates the motivating practical so the card shadows fall the right way.
export const LIGHTS: Record<"day" | "golden", LightPreset> = {
  day: {
    az: 150, el: 20,
    lit: [0.42, 0.48, 0.66], shade: [0.05, 0.06, 0.1], lift: [0.015, 0.02, 0.04], lambert: 0.6, sideK: 0.85, term: 0.5,
    charTint: [0.78, 0.84, 1.0], charShade: 0.72, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.7, 0.74, 0.92],
    blob: [0.6, 0.6, 0.7], actorShadow: true,
    top: "#05070f", hor: "#1c1a24", skyCurve: [0.0, 0.5, 0.6], fog: "#0c0f18", fogNear: 12, fogFar: 140, sunDisc: "#000000",
    sunCol: "#9fb4ff", sunI: 1.0, sky: "#1a2030", ground: "#0a0a10", hemiI: 0.1,
    bias: -0.0004, normalBias: 0.02,
  },
  golden: {
    az: 160, el: 30,
    lit: [0.3, 0.36, 0.52], shade: [0.04, 0.05, 0.09], lift: [0.015, 0.02, 0.05], lambert: 0.55, sideK: 0.85, term: 0.5,
    charTint: [0.75, 0.8, 1.0], charShade: 0.72, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.7, 0.74, 0.92],
    blob: [0.6, 0.6, 0.7], actorShadow: true,
    top: "#04060c", hor: "#2a2024", skyCurve: [0.05, 0.6, 1.0], fog: "#141420", fogNear: 20, fogFar: 230, sunDisc: "#000000",
    sunCol: "#9fb4ff", sunI: 1.0, sky: "#1a2030", ground: "#0a0a10", hemiI: 0.1,
    bias: -0.0006, normalBias: 0.03,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<"day" | "golden", WorldLook> = {
  day: {
    sky: { c: ["#2a2026", "#1a1820", "#0e1018", "#080a12", "#05070e"], e: [0, 3, 8, 16, 40] }, // city glow low on the horizon
    water: { near: "#0e1218", mid: "#121620", far: "#2a2228", crest: "#3a3a48", trough: "#06080c", glint: "#ffb060", shade: [0.5, 0.5, 0.6] },
    cloud: { lit: "#2a2a36", mid: "#1e1e28", shade: "#14141c" },
    bounce: [0, 0, 0],
    sat: 0.95,
  },
  golden: {
    sky: { c: ["#3a2628", "#221c24", "#10121c", "#090b14", "#05070e"], e: [0, 3, 8, 16, 40] },
    water: { near: "#0e1218", mid: "#121620", far: "#2a2228", crest: "#3a3a48", trough: "#06080c", glint: "#ffb060", shade: [0.5, 0.5, 0.6] },
    cloud: { lit: "#2a2a36", mid: "#1e1e28", shade: "#14141c" },
    bounce: [0, 0, 0],
    sat: 0.95,
  },
};
