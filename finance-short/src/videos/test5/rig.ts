// A 3D skeleton for a 2D-drawn character. Every frame the pose is solved in world space (pelvis, spine, head, two-bone
// IK for legs and arms, planted feet that never slide), then draw.ts projects the joints through the camera and draws
// the cartoon on top. The whole 5 s test is one timeline: walk in, crouch, pick up a coin, stand, get surprised,
// turn to camera, smile.
import * as THREE from "three";

export type V = THREE.Vector3;
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const ramp = (f: number, a: number, b: number) => glide((f - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// proportions (metres): a big round head on a bean body with thin limbs
export const BODY = { thigh: 0.42, shin: 0.41, upper: 0.33, fore: 0.3, hipW: 0.09, shoulderW: 0.19, spine: 0.42, neck: 0.2, headR: 0.25, torsoR: 0.21 };

export type Expr = { browUp: number; browTilt: number; mouthOpen: number; mouthCurve: number; eyeWide: number; blink: number };
export type Pose = {
  pelvis: V; chest: V; head: V; yaw: number; headYaw: number; headPitch: number; headRoll: number;
  hipL: V; hipR: V; kneeL: V; kneeR: V; footL: V; footR: V;
  shL: V; shR: V; elL: V; elR: V; handL: V; handR: V;
  expr: Expr; coin: V | null; coinInHand: boolean;
};

/** two-bone IK: from root to target with lengths a, b; the joint bends toward `pole` */
const ik = (root: V, target: V, a: number, b: number, pole: V): V => {
  const d = target.clone().sub(root);
  let L = d.length();
  L = Math.min(L, a + b - 1e-4);
  const dir = d.clone().normalize();
  const x = (a * a - b * b + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const side = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return root.clone().add(dir.multiplyScalar(x)).add(side.multiplyScalar(h));
};
const fwdOf = (yaw: number) => v(Math.sin(yaw), 0, Math.cos(yaw));
const leftOf = (yaw: number) => v(Math.cos(yaw), 0, -Math.sin(yaw));

// ---------------- the plan ----------------
export const TOTAL = 150;
const X0 = -1.6, Z0 = 0.55, WALK = 1.55;
const YAW_WALK = Math.PI / 2, YAW_END = 0.22;
/** feet steps along the walk (distance along x from X0) and their frames */
const STEPS: { foot: "L" | "R"; from: number; to: number; a: number; b: number }[] = [
  { foot: "L", from: 0, to: 0.45, a: 3, b: 13 },
  { foot: "R", from: 0, to: 0.92, a: 11, b: 21 },
  { foot: "L", from: 0.45, to: 1.38, a: 19, b: 29 },
  { foot: "R", from: 0.92, to: 1.62, a: 27, b: 37 },
  { foot: "L", from: 1.38, to: 1.48, a: 34, b: 40 },
];
const pelvisX = (f: number) => X0 + WALK * smooth(f / 40) * 0.98 + WALK * 0.02 * clamp01(f / 40);
/** where the hand finds the coin: in front of the right foot at the bottom of the crouch */
export const COIN_AT = (() => {
  const p = v(X0 + WALK + 0.05, 0, Z0);
  return p.add(fwdOf(YAW_WALK).multiplyScalar(0.34)).add(leftOf(YAW_WALK).multiplyScalar(-0.16)).setY(0.012);
})();

const footPos = (foot: "L" | "R", f: number, yaw: number, pelvis: V): V => {
  // walk phase: planted between steps, an arc during a step
  const lat = foot === "L" ? 1 : -1;
  if (f < 104) {
    let d = 0, lift = 0;
    for (const s of STEPS) {
      if (s.foot !== foot) continue;
      if (f >= s.b) d = s.to;
      else if (f >= s.a) { const u = (f - s.a) / (s.b - s.a); d = lerp(s.from, s.to, smooth(u)); lift = 0.09 * Math.sin(Math.PI * u); break; }
      else { d = s.from; break; }
    }
    const p = v(X0 + d, lift, Z0).add(leftOf(YAW_WALK).multiplyScalar(lat * BODY.hipW * 1.1));
    return p;
  }
  // the turn: each foot pivots to its place under the new heading, one after the other
  const end = v(pelvis.x, 0, pelvis.z).add(leftOf(yaw).multiplyScalar(lat * BODY.hipW * 1.15));
  const start = footPos(foot, 103, YAW_WALK, pelvis);
  const [a, b] = foot === "R" ? [104, 115] : [112, 123];
  const u = clamp01((f - a) / (b - a));
  const p = start.clone().lerp(end, smooth(u));
  p.y = 0.07 * Math.sin(Math.PI * u);
  return p;
};

// expression keys: each channel moves on its own schedule (brows lead, the mouth follows)
const EXPR_KEYS: Record<keyof Expr, [number, number][]> = {
  browUp: [[0, 0.1], [70, 0.15], [86, 0.15], [92, 1.0], [118, 0.9], [130, 0.35]],
  browTilt: [[0, 0], [72, 0.25], [84, 0.25], [92, -0.15], [126, 0.0]],
  mouthOpen: [[0, 0], [74, 0.12], [90, 0.12], [98, 0.85], [118, 0.75], [130, 0.15], [140, 0.25]],
  mouthCurve: [[0, 0.25], [74, 0.0], [98, -0.05], [122, 0.0], [134, 1.0]],
  eyeWide: [[0, 0], [94, 0], [94.01, 1], [126, 1], [126.01, 0]],
  blink: [[0, 0]],
};
const track = (keys: [number, number][], f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) {
    const [a, va] = keys[i - 1], [b, vb] = keys[i];
    return lerp(va, vb, glide((f - a) / Math.max(1e-3, b - a)));
  }
  return keys[keys.length - 1][1];
};
/** blinks: a natural one early, and the two that hide the eye-shape switches (94 and 126) */
const BLINKS = [22, 93, 125];
const blinkAt = (f: number) => {
  let b = 0;
  for (const s of BLINKS) { const k = f - s; if (k >= 0 && k < 4) b = Math.max(b, [0.6, 1, 1, 0.5][Math.floor(k)]); }
  return b;
};

export const poseAt = (f: number): Pose => {
  // heading
  const yaw = f < 104 ? YAW_WALK : lerp(YAW_WALK, YAW_END, ramp(f, 104, 128));
  const fw = fwdOf(yaw), lf = leftOf(yaw);
  // pelvis: walk bob, crouch, stand
  const crouch = f < 44 ? 0 : f < 62 ? ramp(f, 44, 60) : 1 - ramp(f, 62, 80);
  const x = pelvisX(Math.min(f, 40)) + 0.06 * crouch;
  const bob = f < 40 ? 0.025 * Math.abs(Math.sin((f / 8) * Math.PI)) * (1 - ramp(f, 34, 40)) : 0;
  const pelvis = v(x, 0.86 - 0.44 * crouch + bob, Z0);
  // spine lean forward in the crouch, a small bounce when the surprise lands
  const lean = 0.06 + 1.0 * crouch;
  const bounce = f >= 92 && f < 104 ? 0.025 * Math.sin(((f - 92) / 12) * Math.PI) : 0;
  const up = v(0, 1, 0).multiplyScalar(Math.cos(lean)).add(fw.clone().multiplyScalar(Math.sin(lean)));
  const chest = pelvis.clone().add(up.clone().multiplyScalar(BODY.spine)).add(v(0, bounce, 0));
  const head = chest.clone().add(up.clone().multiplyScalar(BODY.neck + BODY.headR * 0.55)).add(v(0, bounce * 1.6, 0));
  // legs
  const hipL = pelvis.clone().add(lf.clone().multiplyScalar(BODY.hipW));
  const hipR = pelvis.clone().add(lf.clone().multiplyScalar(-BODY.hipW));
  const footL = footPos("L", f, yaw, pelvis), footR = footPos("R", f, yaw, pelvis);
  const ankle = (p: V) => p.clone().setY(p.y + 0.06);
  const kneeL = ik(hipL, ankle(footL), BODY.thigh, BODY.shin, fw.clone().add(lf.clone().multiplyScalar(0.25)));
  const kneeR = ik(hipR, ankle(footR), BODY.thigh, BODY.shin, fw.clone().add(lf.clone().multiplyScalar(-0.25)));
  // arms
  const shL = chest.clone().add(lf.clone().multiplyScalar(BODY.shoulderW)).add(v(0, -0.04, 0));
  const shR = chest.clone().add(lf.clone().multiplyScalar(-BODY.shoulderW)).add(v(0, -0.04, 0));
  const swing = f < 40 ? Math.sin((f / 16) * Math.PI * 2) * 0.16 * (1 - ramp(f, 34, 40)) : 0;
  const rest = (sh: V, s: number, k: number) => sh.clone().add(v(0, -0.56, 0)).add(fw.clone().multiplyScalar(0.05 + s)).add(lf.clone().multiplyScalar(k * 0.06));
  let handL = rest(shL, -swing, 1);
  let handR = rest(shR, swing, -1);
  // right hand: down to the coin, up to the chest, then up beside the face
  const hold1 = chest.clone().add(fw.clone().multiplyScalar(0.36)).add(lf.clone().multiplyScalar(-0.06)).add(v(0, -0.02, 0));
  const hold2 = chest.clone().add(fw.clone().multiplyScalar(0.42)).add(lf.clone().multiplyScalar(-0.12)).add(v(0, 0.16, 0));
  if (f >= 46 && f < 62) handR = rest(shR, 0, -1).lerp(COIN_AT.clone().add(v(0, 0.03, 0)), ramp(f, 46, 60));
  else if (f >= 62 && f < 128) handR = COIN_AT.clone().add(v(0, 0.03, 0)).lerp(hold1, ramp(f, 62, 82));
  else if (f >= 128) handR = hold1.clone().lerp(hold2, ramp(f, 128, 142));
  // left hand rests on the knee in the crouch
  if (crouch > 0) handL = handL.clone().lerp(kneeL.clone().add(fw.clone().multiplyScalar(0.05)).add(v(0, 0.04, 0)), smooth(crouch * 1.3));
  const elL = ik(shL, handL, BODY.upper, BODY.fore, v(0, -0.4, 0).add(fw.clone().multiplyScalar(-1)).add(lf.clone().multiplyScalar(0.6)));
  const elR = ik(shR, handR, BODY.upper, BODY.fore, v(0, -0.4, 0).add(fw.clone().multiplyScalar(-1)).add(lf.clone().multiplyScalar(-0.6)));
  // head: looks at the coin while holding it, then at the camera
  const coinInHand = f >= 61;
  const coin = coinInHand ? handR.clone().add(v(0, 0.03, 0)) : COIN_AT.clone();
  const headYaw = f < 44 ? 0.15 : f < 82 ? -0.15 * ramp(f, 44, 60) : f < 104 ? -0.2 : lerp(-0.2, 0.0, ramp(f, 104, 120));
  const headPitch = f < 44 ? 0.0 : f < 80 ? 0.45 * crouch + 0.25 * (1 - crouch) * ramp(f, 62, 75) : f < 104 ? 0.25 - 0.3 * ramp(f, 86, 96) : lerp(-0.05, 0.02, ramp(f, 104, 130));
  const headRoll = f >= 128 ? 0.12 * ramp(f, 128, 140) : f >= 86 && f < 104 ? -0.06 : 0;
  const expr: Expr = {
    browUp: track(EXPR_KEYS.browUp, f), browTilt: track(EXPR_KEYS.browTilt, f), mouthOpen: track(EXPR_KEYS.mouthOpen, f),
    mouthCurve: track(EXPR_KEYS.mouthCurve, f), eyeWide: f >= 94 && f < 126 ? 1 : 0, blink: blinkAt(f),
  };
  return { pelvis, chest, head, yaw, headYaw, headPitch, headRoll, hipL, hipR, kneeL, kneeR, footL, footR, shL, shR, elL, elR, handL, handR, expr, coin, coinInHand };
};

// ---------------- camera ----------------
export type Cam = { pos: V; look: V };
const CAM_KEYS: [number, [number, number, number], [number, number, number]][] = [
  [0, [-1.0, 1.45, 4.3], [-1.2, 1.0, 0.4]],
  [38, [0.5, 1.4, 4.0], [0.05, 0.95, 0.4]],
  [48, [0.6, 1.05, 3.2], [0.15, 0.55, 0.55]],
  [64, [0.6, 1.0, 3.0], [0.15, 0.5, 0.55]],
  [82, [0.55, 1.3, 2.25], [0.12, 1.15, 0.55]],
  [110, [0.45, 1.33, 1.95], [0.05, 1.22, 0.55]],
  [150, [0.55, 1.4, 3.1], [0.0, 1.1, 0.5]],
];
export const camAt = (f: number): Cam => {
  let i = 0; while (i + 1 < CAM_KEYS.length && f >= CAM_KEYS[i + 1][0]) i++;
  const [a, pa, la] = CAM_KEYS[i], [b, pb, lb] = CAM_KEYS[Math.min(i + 1, CAM_KEYS.length - 1)];
  const t = b > a ? glide((f - a) / (b - a)) : 0;
  return { pos: v(...pa).lerp(v(...pb), t), look: v(...la).lerp(v(...lb), t) };
};
