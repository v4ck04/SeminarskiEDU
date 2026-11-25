// "Body Number 2": 2D characters with real shadows in 3D sets, from the user's shot-by-shot doc. No captions; the title card is an overlay.
// No captions (by request). The soundtrack (public/body2/mix.wav) is part of the composition: one render gives the finished file.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { useFontsReady } from "./fonts";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { AOPass } from "./ao";
import { Kit } from "./build";
import { TOTAL, FLASHES, SHOTS, DARK, BLACK, FISHEYE, TITLE, ENDCARD, layersAt, dofAt } from "./story";

export const BODY2_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ao: boolean; ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean; msaa: number };
const toggles = (): PostToggles => ({ ao: true, ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, msaa: 4, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

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

/** Ambient occlusion (the "real 3D" contact darkening: corners, under desks, round feet, where props meet the floor).
 *  Runs first, on the linear HDR scene, so ink lines, DOF and grade sit on top of it. Radius in metres. */
const makeAO = (cam: THREE.PerspectiveCamera) => {
  const ip = getInputProps() as { aoMode?: number; aoCfg?: { radius?: number; intensity?: number; bias?: number } };
  return new AOPass(cam, { radius: 1.0, intensity: 2.2, bias: 0.05, ...(ip.aoCfg ?? {}), debug: ip.aoMode ?? 0 });
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("body2 kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit; f: number }> = ({ id, kit, f }) => {
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ao: makeAO(camera as THREE.PerspectiveCamera),
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
      {on.ao ? <primitive object={fx.ao} dispose={null} /> : null}
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

/** the extruded gold title rising from below, then the end card */
const Title: React.FC<{ f: number }> = ({ f }) => {
  const k = Math.min(1, (f - TITLE.a) / 24), e = 1 - (1 - k) ** 3, end = Math.min(1, Math.max(0, (f - ENDCARD.a) / 12));
  const layers = Array.from({ length: 10 }, (_, i) => `0 ${i + 1}px 0 ${i < 5 ? "#a06a1a" : "#6a4410"}`).join(", ");
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 300 }}>
      <div style={{ fontFamily: "'Inter Display', Inter, sans-serif", fontWeight: 900, fontSize: 104, lineHeight: 1.0, textAlign: "center", maxWidth: 940, letterSpacing: "0.01em",
        color: "#ffd86a", textShadow: `${layers}, 0 18px 28px rgba(0,0,0,0.55), 0 0 40px rgba(255,200,90,0.35)`, transform: `translateY(${(1 - e) * 260}px) scale(${0.85 + 0.15 * e})`, opacity: k }}>
        TOMORROW,<br />YOU COULD BE<br />ANYONE.
      </div>
      <div style={{ position: "absolute", bottom: 360, fontFamily: "'Inter Display', Inter, sans-serif", fontWeight: 800, fontSize: 54, color: "#ffffff", background: "rgba(20,16,22,0.78)", padding: "16px 34px", borderRadius: 40, opacity: end, transform: `scale(${0.9 + 0.1 * end})` }}>Follow for part 2 →</div>
    </AbsoluteFill>
  );
};

/** `at` (preview only): frame k of the composition shows story frame at[k] */
export const Body2Short: React.FC<{ at?: number[] }> = ({ at }) => {
  const k = useCurrentFrame(), f = at ? at[Math.min(k, at.length - 1)] : k;
  const kit = useKit(), fonts = useFontsReady();
  if (!kit || !fonts) return null;
  let flash = 0;
  for (const [a, n] of FLASHES) if (f >= a && f < a + n) flash = Math.max(flash, [1, 0.75, 0.45, 0.2].slice(4 - n)[f - a] ?? 0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} f={f} />)}
      {f >= DARK.a && f < DARK.b && <AbsoluteFill style={{ background: "radial-gradient(ellipse 34% 26% at 53% 60%, rgba(10,8,14,0) 0%, rgba(10,8,14,0.55) 55%, rgba(6,5,9,0.93) 100%)" }} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {f >= FISHEYE.a && f < FISHEYE.b && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(6,8,10,0.75) 38%, #000 44%)" }} />}
      {f >= TITLE.a && <Title f={f} />}
      {f >= BLACK.a && f < BLACK.b && <AbsoluteFill style={{ background: "#000", opacity: Math.min(1, (f - BLACK.a + 1) / 3) }} />}
      {!at && (getInputProps() as { mute?: boolean }).mute !== true && <Audio src={staticFile("body2/mix.wav")} />}
    </AbsoluteFill>
  );
};
