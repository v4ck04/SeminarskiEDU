// The 2D explainer part of "How $10,000 Turns Into $1,000,000": one scene per "2d" beat of timing.json, on the film's global timeline
// (frames of "3d" beats render black; the 3D shots are cut in during assembly).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BEATS, TOTAL, beatAt, ctxOf, PALS, Bg, T } from "./two/kit";
import { SCENES, Chip, EndCard } from "./two/scenes";
import { loadFonts } from "./fonts";
loadFonts();

/** the end card holds for 8 s after the voice (room for the end screen) */
export const END_HOLD = 240;
export const TENK2D_FRAMES = TOTAL + END_HOLD;
export const Tenk2D: React.FC<{ at?: number[] }> = ({ at }) => {
  const k = useCurrentFrame(), gf = at ? at[Math.min(k, at.length - 1)] : k;
  if (gf >= TOTAL) return <AbsoluteFill style={{ overflow: "hidden" }}><EndCard f={gf - TOTAL} /></AbsoluteFill>;
  const b = beatAt(Math.min(gf, TOTAL - 1));
  if (b.mode !== "2d") return <AbsoluteFill style={{ background: "#000" }} />;
  const c = ctxOf(b, gf), scene = SCENES[b.id], pal = PALS[b.ch] ?? PALS.hook;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      {scene ? scene(c) : <><Bg p={pal} f={c.f} /><T x={960} y={500} size={54} w={1500} color={pal.ink} wt={800}>{b.id + "\n" + b.text}</T></>}
      {!b.title && b.ch !== "hook" && <Chip ch={b.ch} f={c.f} />}
    </AbsoluteFill>
  );
};
export { BEATS };
