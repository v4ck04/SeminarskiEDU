// "The Janitor Who Had $8 Million": Ronald Read, in the flat-characters-in-a-3D-toon-world style, with burned-in word-by-word captions.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, FLASHES, SHOTS, layersAt, dofAt } from "./story";
import CAPTIONS from "./captions.json";

export const READ_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean; msaa: number };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, msaa: 4, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("read kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit; f: number }> = ({ id, kit, f }) => {
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  // R3F writes the primitive's dispose={null} prop onto the object itself, so call the class method from the prototype
  useEffect(() => () => { const d = Object.getPrototypeOf(fx.ink)?.dispose; if (typeof d === "function") d.call(fx.ink); }, [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={on.msaa}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number; f: number }> = ({ id, kit, alpha, f }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} f={f} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** `at` (preview only): frame k of the composition shows story frame at[k] */
type Tok = { t: string; s: number; e: number; line: number };
const CHUNKS = CAPTIONS as Tok[][];
/** word-by-word captions: the chunk being spoken, the current word in brand yellow; a quick pop on each new chunk */
const Captions: React.FC<{ f: number }> = ({ f }) => {
  let k = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (f >= CHUNKS[i][0].s - 1) k = i;
  if (k < 0) return null;
  const ch = CHUNKS[k], next = CHUNKS[k + 1], end = Math.max(ch[ch.length - 1].e + 10, 0);
  if (f > end && !(next && f >= next[0].s - 1)) return null;
  const age = f - (ch[0].s - 1), sc = age < 4 ? 0.86 + 0.14 * (age / 4) + (age >= 2 ? 0.04 * (1 - (age - 2) / 2) : 0) : 1;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 1290, width: 960, textAlign: "center", transform: `scale(${sc})`, transformOrigin: "50% 50%",
        fontFamily: "Inter Display, Inter, sans-serif", fontWeight: 900, fontSize: 92, lineHeight: 1.08, letterSpacing: -1 }}>
        {ch.map((w, i) => {
          const on = f >= w.s - 1 && (f < w.e + 2 || i === ch.length - 1 || f < ch[i + 1].s - 1);
          return (
            <span key={i} style={{ color: on ? "#FFC94A" : "#ffffff", WebkitTextStroke: "16px #0b0b14", paintOrder: "stroke fill",
              textShadow: "0 7px 0 rgba(0,0,0,0.45)", marginRight: 22, display: "inline-block" }}>{w.t}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
/** the hook card for the first seconds (muted viewers) */
const Hook: React.FC<{ f: number }> = ({ f }) => {
  if (f > 128) return null;
  const a = Math.min(1, f / 3) * (f > 116 ? (128 - f) / 12 : 1), y = f < 6 ? 30 * (1 - f / 6) : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 230 + y, opacity: a, padding: "26px 38px", borderRadius: 30, background: "rgba(11,30,58,0.92)",
        border: "6px solid #2BD9A8", fontFamily: "Inter Display, Inter, sans-serif", fontWeight: 900, fontSize: 74, lineHeight: 1.05,
        color: "#ffffff", textAlign: "center", letterSpacing: -1, maxWidth: 900 }}>
        A JANITOR DIED WITH<br /><span style={{ color: "#FFC94A", fontSize: 104 }}>$8,000,000</span>
      </div>
    </AbsoluteFill>
  );
};

export const ReadShort: React.FC<{ at?: number[] }> = ({ at }) => {
  const k = useCurrentFrame(), f = at ? at[Math.min(k, at.length - 1)] : k;
  const kit = useKit();
  if (!kit) return null;
  let flash = 0;
  for (const [a, n] of FLASHES) if (f >= a && f < a + n) flash = Math.max(flash, [1, 0.75, 0.45, 0.2].slice(4 - n)[f - a] ?? 0);
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} f={f} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <Hook f={f} />
      <Captions f={f} />
    </AbsoluteFill>
  );
};
