// The 2D explainer part of "4 Geniuses": one scene per "2d" beat of timing.json, on the film's global timeline
// (frames of "3d" beats render black; the 3D shots are cut in during assembly).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BEATS, TOTAL, beatAt, ctxOf, PALS, Bg, T } from "./two/kit";
import { SCENES as S1, Chip } from "./two/scenes";
import { SCENES2 } from "./two/scenes2";
const SCENES = { ...S1, ...SCENES2 };

export const GENIUS2D_FRAMES = TOTAL;
export const Genius2D: React.FC<{ at?: number[] }> = ({ at }) => {
  const k = useCurrentFrame(), gf = at ? at[Math.min(k, at.length - 1)] : k;
  const b = beatAt(gf);
  if (b.mode !== "2d") return <AbsoluteFill style={{ background: "#000" }} />;
  const c = ctxOf(b, gf), scene = SCENES[b.id], pal = PALS[b.ch] ?? PALS.hook;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      {scene ? scene(c) : <><Bg p={pal} f={c.f} /><T x={960} y={500} size={54} w={1500} color={pal.ink} wt={800}>{b.id + "\n" + b.text}</T></>}
      {!b.title && b.ch !== "hook" && b.id !== "r10" && <Chip ch={b.ch} f={c.f} />}
    </AbsoluteFill>
  );
};
export { BEATS };
